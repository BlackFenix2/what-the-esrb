import type {
  GameData,
  GameSuggestion,
  IGDBGame,
  TriviaRoundData,
} from "@/types/igdb";

const IGDB_API_URL = "https://api.igdb.com/v4";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

// ESRB organization = 1 in IGDB
const ESRB_ORGANIZATION = 1;

// ESRB rating number → label mapping
const ESRB_RATING_LABELS: Record<number, string> = {
  6: "RP",
  7: "EC",
  8: "E",
  9: "E10+",
  10: "T",
  11: "M",
  12: "AO",
};

const ESRB_RATING_NAMES_BY_LABEL: Record<string, string> = {
  RP: "Rating Pending",
  EC: "Early Childhood",
  E: "Everyone",
  "E10+": "Everyone 10+",
  T: "Teen",
  M: "Mature 17+",
  AO: "Adults Only 18+",
};

function buildCoverUrl(imageId: string): string {
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- Token caching (module-level, server-side only) ---
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET environment variables",
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(`${TWITCH_TOKEN_URL}?${params}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to get Twitch access token: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = data.access_token;
  // Subtract 60s buffer before expiry
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;

  return cachedToken;
}

async function igdbFetch<T>(endpoint: string, body: string): Promise<T> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) {
    throw new Error("Missing TWITCH_CLIENT_ID environment variable");
  }

  const token = await getAccessToken();

  const response = await fetch(`${IGDB_API_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`IGDB API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch a random game that has an ESRB rating with content descriptions.
 * Uses a random offset into the pool of qualifying games.
 */
export async function getRandomGame(): Promise<GameData | null> {
  // First, count how many games match our criteria
  const countResult = await igdbFetch<
    { count: number } | Array<{ count: number }>
  >(
    "games/count",
    `where age_ratings.organization = ${ESRB_ORGANIZATION} & age_ratings.rating_content_descriptions != null & cover != null & rating_count > 5;`,
  );

  const total = Array.isArray(countResult)
    ? (countResult[0]?.count ?? 0)
    : (countResult.count ?? 0);
  if (total === 0) return null;

  // Pick a random offset within the pool
  const offset = Math.floor(Math.random() * Math.min(total, 500));

  const games = await igdbFetch<IGDBGame[]>(
    "games",
    `fields name, cover.image_id, age_ratings.organization, age_ratings.rating_category.rating, age_ratings.synopsis, age_ratings.rating_content_descriptions.description, age_ratings.category, age_ratings.rating, age_ratings.content_descriptions.description;
where age_ratings.organization = ${ESRB_ORGANIZATION} & age_ratings.rating_content_descriptions != null & cover != null & rating_count > 5;
offset ${offset};
limit 1;`,
  );

  const game = games[0];
  if (!game) return null;

  return parseGame(game);
}

/**
 * Fetch a random game that has an ESRB rating summary (content description text)
 * and content descriptors.
 */
async function getRandomChoices(
  correctName: string,
  choiceCount: number,
): Promise<string[]> {
  const targetDistractors = Math.max(0, choiceCount - 1);

  const countResult = await igdbFetch<
    { count: number } | Array<{ count: number }>
  >(
    "games/count",
    "where game_type = (0,8,9) & version_parent = null & rating_count > 5 & name != null;",
  );

  const total = Array.isArray(countResult)
    ? (countResult[0]?.count ?? 0)
    : (countResult.count ?? 0);

  const distractors = new Set<string>();
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (distractors.size >= targetDistractors || total === 0) break;

    const batchSize = Math.min(
      100,
      Math.max(30, (targetDistractors - distractors.size) * 6),
    );
    const maxOffset = Math.max(total - batchSize, 0);
    const offset = Math.floor(Math.random() * (maxOffset + 1));

    const games = await igdbFetch<IGDBGame[]>(
      "games",
      `fields name;
where game_type = (0,8,9) & version_parent = null & rating_count > 5 & name != null;
offset ${offset};
limit ${batchSize};`,
    );

    for (const game of games) {
      const name = game.name?.trim();
      if (!name) continue;
      if (name.toLowerCase() === correctName.toLowerCase()) continue;
      distractors.add(name);
      if (distractors.size >= targetDistractors) break;
    }
  }

  return shuffleArray([
    correctName,
    ...Array.from(distractors).slice(0, targetDistractors),
  ]);
}

export async function getRandomTriviaRound(
  choiceCount = 6,
): Promise<TriviaRoundData | null> {
  const game = await getRandomGame();
  if (!game) return null;

  const choices = await getRandomChoices(game.name, choiceCount);
  if (choices.length < 2) return null;

  return { game, choices };
}

/**
 * Search for game title suggestions matching a query string.
 */
export async function searchGames(query: string): Promise<GameSuggestion[]> {
  if (!query.trim()) return [];

  const games = await igdbFetch<IGDBGame[]>(
    "games",
    `fields name;
search "${query.replace(/"/g, "")}";
where game_type = (0,8,9) & version_parent = null;
limit 10;`,
  );

  return games.map((g) => ({ id: g.id, name: g.name }));
}

function parseGame(game: IGDBGame): GameData {
  const esrbRating = game.age_ratings?.find(
    (r) =>
      r.organization === ESRB_ORGANIZATION || r.category === ESRB_ORGANIZATION,
  );

  const ratingCategory = esrbRating?.rating_category;
  let esrbLabel = "E";

  if (ratingCategory && typeof ratingCategory === "object") {
    const normalized = ratingCategory.rating.replace(/\s+/g, "").toUpperCase();
    esrbLabel = normalized === "E10" ? "E10+" : normalized;
  } else {
    const legacyRating =
      (typeof ratingCategory === "number" ? ratingCategory : undefined) ??
      esrbRating?.rating ??
      8;
    esrbLabel = ESRB_RATING_LABELS[legacyRating] ?? "E";
  }

  const esrbName = ESRB_RATING_NAMES_BY_LABEL[esrbLabel] ?? "Everyone";

  const contentDescriptors =
    esrbRating?.rating_content_descriptions
      ?.map((d) => d.description)
      .filter(Boolean) ??
    esrbRating?.content_descriptions
      ?.map((d) => d.description)
      .filter(Boolean) ??
    [];

  return {
    id: game.id,
    name: game.name,
    coverUrl: game.cover ? buildCoverUrl(game.cover.image_id) : null,
    esrbRating: esrbLabel,
    esrbRatingLabel: esrbName,
    synopsis: esrbRating?.synopsis ?? null,
    contentDescriptors,
  };
}

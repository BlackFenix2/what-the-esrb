import type { GameData, GameSuggestion, IGDBGame } from "@/types/igdb";

const IGDB_API_URL = "https://api.igdb.com/v4";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

// ESRB rating category = 1 in IGDB
const ESRB_CATEGORY = 1;

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

const ESRB_RATING_NAMES: Record<number, string> = {
  6: "Rating Pending",
  7: "Early Childhood",
  8: "Everyone",
  9: "Everyone 10+",
  10: "Teen",
  11: "Mature 17+",
  12: "Adults Only 18+",
};

function buildCoverUrl(imageId: string): string {
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
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
      "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET environment variables"
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
  const countResult = await igdbFetch<Array<{ count: number }>>(
    "games/count",
    `where age_ratings.category = ${ESRB_CATEGORY} & age_ratings.content_descriptions != null & cover != null & rating_count > 5;`
  );

  const total = countResult[0]?.count ?? 0;
  if (total === 0) return null;

  // Pick a random offset within the pool
  const offset = Math.floor(Math.random() * Math.min(total, 500));

  const games = await igdbFetch<IGDBGame[]>(
    "games",
    `fields name, cover.image_id, age_ratings.category, age_ratings.rating, age_ratings.synopsis, age_ratings.content_descriptions.category, age_ratings.content_descriptions.description;
where age_ratings.category = ${ESRB_CATEGORY} & age_ratings.content_descriptions != null & cover != null & rating_count > 5;
offset ${offset};
limit 1;`
  );

  const game = games[0];
  if (!game) return null;

  return parseGame(game);
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
where category = (0,8,9) & version_parent = null;
limit 10;`
  );

  return games.map((g) => ({ id: g.id, name: g.name }));
}

function parseGame(game: IGDBGame): GameData {
  const esrbRating = game.age_ratings?.find(
    (r) => r.category === ESRB_CATEGORY
  );

  const ratingNumber = esrbRating?.rating ?? 8;
  const esrbLabel = ESRB_RATING_LABELS[ratingNumber] ?? "E";
  const esrbName = ESRB_RATING_NAMES[ratingNumber] ?? "Everyone";

  const contentDescriptors =
    esrbRating?.content_descriptions?.map((d) => d.description).filter(Boolean) ?? [];

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

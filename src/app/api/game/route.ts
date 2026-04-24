import { getRandomTriviaRound } from "@/lib/igdb";

export async function GET() {
  try {
    const game = await getRandomTriviaRound(6);

    if (!game) {
      return Response.json(
        { error: "No games found. Check IGDB API credentials." },
        { status: 404 },
      );
    }

    return Response.json(game);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch game";
    return Response.json({ error: message }, { status: 500 });
  }
}

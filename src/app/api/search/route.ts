import { searchGames } from "@/lib/igdb";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  if (!query.trim()) {
    return Response.json([]);
  }

  try {
    const suggestions = await searchGames(query);
    return Response.json(suggestions);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

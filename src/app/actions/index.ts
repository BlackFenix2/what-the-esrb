"use server";

import { getRandomGame, searchGames } from "@/lib/igdb";
import type { GameData, GameSuggestion } from "@/types/igdb";

export async function fetchGameAction(): Promise<GameData | null> {
  return getRandomGame();
}

export async function searchGamesAction(
  query: string
): Promise<GameSuggestion[]> {
  if (!query.trim()) return [];
  return searchGames(query);
}

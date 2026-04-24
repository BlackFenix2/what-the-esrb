"use server";

import { getRandomTriviaRound, searchGames } from "@/lib/igdb";
import type { GameSuggestion, TriviaRoundData } from "@/types/igdb";

export async function fetchGameAction(): Promise<TriviaRoundData | null> {
  return getRandomTriviaRound(6);
}

export async function searchGamesAction(
  query: string,
): Promise<GameSuggestion[]> {
  if (!query.trim()) return [];
  return searchGames(query);
}

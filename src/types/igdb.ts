export interface IGDBContentDescription {
  id: number;
  category: number;
  description: string;
}

export interface IGDBAgeRating {
  id: number;
  category: number; // 1 = ESRB
  rating: number;
  synopsis?: string;
  content_descriptions?: IGDBContentDescription[];
}

export interface IGDBCover {
  id: number;
  image_id: string;
}

export interface IGDBGame {
  id: number;
  name: string;
  cover?: IGDBCover;
  age_ratings?: IGDBAgeRating[];
}

export interface GameData {
  id: number;
  name: string;
  coverUrl: string | null;
  esrbRating: string;
  esrbRatingLabel: string;
  synopsis: string | null;
  contentDescriptors: string[];
}

export interface GameSuggestion {
  id: number;
  name: string;
}

export type GuessResult = "correct" | "incorrect" | "skipped";

export interface GameResult {
  game: GameData;
  result: GuessResult;
  guess: string | null;
}

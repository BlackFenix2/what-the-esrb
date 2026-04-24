export interface IGDBContentDescription {
  id: number;
  category: number;
  description: string;
}

export interface IGDBRatingContentDescription {
  id: number;
  description: string;
}

export interface IGDBAgeRatingCategory {
  id: number;
  rating: string;
}

export interface IGDBAgeRating {
  id: number;
  organization?: number; // 1 = ESRB
  rating_category?: number | IGDBAgeRatingCategory;
  // Deprecated fields kept for compatibility during IGDB migration
  category?: number;
  rating?: number;
  synopsis?: string;
  rating_content_descriptions?: IGDBRatingContentDescription[];
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

export interface TriviaRoundData {
  game: GameData;
  choices: string[];
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

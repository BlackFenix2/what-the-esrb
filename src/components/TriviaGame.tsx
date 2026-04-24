"use client";

import { use, useRef, useState, startTransition } from "react";
import type { GameData, GameSuggestion, GameResult } from "@/types/igdb";
import { fetchGameAction, searchGamesAction } from "@/app/actions";
import EsrbBadge from "./EsrbBadge";
import Image from "next/image";

type GamePhase = "guessing" | "revealed";

interface Props {
  initialGamePromise: Promise<GameData | null>;
}

export default function TriviaGame({ initialGamePromise }: Props) {
  const [gamePromise, setGamePromise] =
    useState<Promise<GameData | null>>(initialGamePromise);

  // use() suspends until the promise resolves; Suspense in the parent shows fallback
  const game = use(gamePromise);

  const [phase, setPhase] = useState<GamePhase>("guessing");
  const [guess, setGuess] = useState("");
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isPending, setIsPending] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  function nextGame() {
    setIsPending(true);
    setPhase("guessing");
    setGuess("");
    setSuggestions([]);
    setResult(null);
    startTransition(() => {
      setGamePromise(fetchGameAction());
      setIsPending(false);
    });
  }

  async function fetchSuggestions(query: string) {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const results = await searchGamesAction(query);
    setSuggestions(results);
  }

  function handleInputChange(value: string) {
    setGuess(value);
    setShowSuggestions(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchSuggestions(value), 300);
  }

  function selectSuggestion(name: string) {
    setGuess(name);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function handleBlur(e: React.FocusEvent) {
    if (suggestionsRef.current?.contains(e.relatedTarget as Node)) return;
    setShowSuggestions(false);
  }

  function submitGuess(guessedName: string) {
    if (!game) return;

    const isCorrect =
      guessedName.trim().toLowerCase() === game.name.toLowerCase();

    const gameResult: GameResult = {
      game,
      result: isCorrect ? "correct" : "incorrect",
      guess: guessedName.trim() || null,
    };

    setResult(gameResult);
    setHistory((prev) => [...prev, gameResult]);
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    setPhase("revealed");
    setSuggestions([]);
  }

  function skipGame() {
    if (!game) return;
    const gameResult: GameResult = {
      game,
      result: "skipped",
      guess: null,
    };
    setResult(gameResult);
    setHistory((prev) => [...prev, gameResult]);
    setScore((prev) => ({ ...prev, total: prev.total + 1 }));
    setPhase("revealed");
    setSuggestions([]);
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-2xl font-bold text-red-400">No Game Found</h2>
        <p className="text-gray-400 max-w-md">
          Could not find a game with ESRB data. Check your API credentials.
        </p>
        <button
          onClick={nextGame}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      {/* Score */}
      <div className="flex justify-between items-center text-sm text-gray-400">
        <span>
          Score:{" "}
          <span className="text-white font-bold">
            {score.correct}/{score.total}
          </span>
        </span>
        {score.total > 0 && (
          <span>
            {Math.round((score.correct / score.total) * 100)}% correct
          </span>
        )}
      </div>

      {/* Game Card */}
      <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <EsrbBadge rating={game.esrbRating} label={game.esrbRatingLabel} />
          <div>
            <h2 className="text-lg font-bold text-white">
              Guess the Game Title
            </h2>
            <p className="text-sm text-gray-400">
              Based on the ESRB content description below
            </p>
          </div>
        </div>

        {/* ESRB Content Descriptors */}
        <div className="mb-4">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">
            Content Descriptors
          </h3>
          {game.contentDescriptors.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {game.contentDescriptors.map((desc) => (
                <span
                  key={desc}
                  className="px-3 py-1 bg-gray-700 text-gray-200 text-sm rounded-full border border-gray-600"
                >
                  {desc}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic text-sm">
              No content descriptors available
            </p>
          )}
        </div>

        {/* Synopsis */}
        {game.synopsis && (
          <div className="mb-4">
            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">
              Rating Summary
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {game.synopsis}
            </p>
          </div>
        )}

        {/* Answer Section */}
        {phase === "guessing" && (
          <div className="mt-6">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={handleBlur}
                onFocus={() => guess.length >= 2 && setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && guess.trim()) {
                    submitGuess(guess);
                  } else if (e.key === "Escape") {
                    setShowSuggestions(false);
                  }
                }}
                placeholder="Type the game title…"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                autoComplete="off"
              />

              {showSuggestions && suggestions.length > 0 && (
                <ul
                  ref={suggestionsRef}
                  className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl overflow-hidden"
                >
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-gray-200 hover:bg-gray-600 transition-colors text-sm"
                        onMouseDown={() => selectSuggestion(s.name)}
                      >
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-3 mt-3">
              <button
                onClick={() => submitGuess(guess)}
                disabled={!guess.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors"
              >
                Submit Guess
              </button>
              <button
                onClick={skipGame}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Revealed Answer */}
        {phase === "revealed" && result && (
          <div className="mt-6 space-y-4">
            {/* Result Banner */}
            <div
              className={`px-4 py-3 rounded-lg font-semibold text-center text-lg ${
                result.result === "correct"
                  ? "bg-green-800 text-green-100 border border-green-600"
                  : result.result === "incorrect"
                    ? "bg-red-900 text-red-100 border border-red-700"
                    : "bg-gray-700 text-gray-300 border border-gray-600"
              }`}
            >
              {result.result === "correct" && "🎉 Correct!"}
              {result.result === "incorrect" && (
                <>
                  ❌ Incorrect
                  {result.guess && (
                    <span className="block text-sm font-normal mt-1 opacity-80">
                      You guessed: &ldquo;{result.guess}&rdquo;
                    </span>
                  )}
                </>
              )}
              {result.result === "skipped" && "⏭️ Skipped"}
            </div>

            {/* Game Details */}
            <div className="flex gap-4 items-start">
              {game.coverUrl && (
                <div className="flex-shrink-0">
                  <Image
                    src={game.coverUrl}
                    alt={`Cover art for ${game.name}`}
                    width={90}
                    height={120}
                    className="rounded-lg border border-gray-600 shadow-md"
                  />
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                  The answer was
                </p>
                <h3 className="text-2xl font-bold text-white">{game.name}</h3>
              </div>
            </div>

            <button
              onClick={nextGame}
              disabled={isPending}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
            >
              {isPending ? "Loading…" : "Next Game →"}
            </button>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Previous Games
          </h3>
          <ul className="space-y-2">
            {[...history].reverse().map((h, i) => (
              <li
                key={`${h.game.id}-${i}`}
                className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5 border border-gray-700 text-sm"
              >
                <span className="text-gray-200 font-medium">{h.game.name}</span>
                <span
                  className={
                    h.result === "correct"
                      ? "text-green-400"
                      : h.result === "incorrect"
                        ? "text-red-400"
                        : "text-gray-500"
                  }
                >
                  {h.result === "correct"
                    ? "✓ Correct"
                    : h.result === "incorrect"
                      ? "✗ Wrong"
                      : "Skipped"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

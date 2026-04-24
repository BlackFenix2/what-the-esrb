"use client";

import { use, useState } from "react";
import type { GameResult, TriviaRoundData } from "@/types/igdb";
import { fetchGameAction } from "@/app/actions";
import EsrbBadge from "./EsrbBadge";
import Image from "next/image";

type GamePhase = "guessing" | "revealed" | "finished";
const TOTAL_ROUNDS = 10;

interface Props {
  initialGamePromise: Promise<TriviaRoundData | null>;
}

export default function TriviaGame({ initialGamePromise }: Props) {
  const [roundPromise, setRoundPromise] =
    useState<Promise<TriviaRoundData | null>>(initialGamePromise);

  // use() suspends until the promise resolves; Suspense in the parent shows fallback
  const round = use(roundPromise);
  const game = round?.game ?? null;
  const choices = round?.choices ?? [];

  const [phase, setPhase] = useState<GamePhase>("guessing");
  const [result, setResult] = useState<GameResult | null>(null);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [currentRound, setCurrentRound] = useState(1);
  const [isPending, setIsPending] = useState(false);

  function loadRound(): void {
    const nextRoundPromise = fetchGameAction().finally(() => {
      setIsPending(false);
    });
    setRoundPromise(nextRoundPromise);
  }

  function goToNextRound() {
    if (currentRound >= TOTAL_ROUNDS) {
      setPhase("finished");
      return;
    }

    setIsPending(true);
    setPhase("guessing");
    setResult(null);
    setCurrentRound((prev) => prev + 1);
    loadRound();
  }

  function restartGame() {
    setIsPending(true);
    setPhase("guessing");
    setResult(null);
    setHistory([]);
    setScore({ correct: 0, total: 0 });
    setCurrentRound(1);
    loadRound();
  }

  function submitChoice(choice: string) {
    if (!game) return;

    const isCorrect = choice.trim().toLowerCase() === game.name.toLowerCase();

    const gameResult: GameResult = {
      game,
      result: isCorrect ? "correct" : "incorrect",
      guess: choice,
    };

    setResult(gameResult);
    setHistory((prev) => [...prev, gameResult]);
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    setPhase("revealed");
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
          onClick={restartGame}
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
        <span>
          Round <span className="text-white font-bold">{currentRound}</span>/
          {TOTAL_ROUNDS}
        </span>
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
              Choose 1 of 6 titles based on the ESRB descriptors below
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

        {/* Answer Section */}
        {phase === "guessing" && (
          <div className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => submitChoice(choice)}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 text-left font-medium rounded-lg border border-gray-600 transition-colors"
                >
                  {choice}
                </button>
              ))}
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
                      You chose: &ldquo;{result.guess}&rdquo;
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Game Details */}
            <div className="flex gap-4 items-start">
              {game.coverUrl && (
                <div className="shrink-0">
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
              onClick={goToNextRound}
              disabled={isPending}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
            >
              {isPending
                ? "Loading…"
                : currentRound >= TOTAL_ROUNDS
                  ? "View Final Score"
                  : "Next Round →"}
            </button>
          </div>
        )}

        {phase === "finished" && (
          <div className="mt-6 space-y-4">
            <div className="px-4 py-4 rounded-lg text-center bg-blue-900/30 border border-blue-700">
              <h3 className="text-xl font-bold text-white">Game Complete</h3>
              <p className="text-gray-300 mt-1">
                Final score: {score.correct}/{TOTAL_ROUNDS} (
                {Math.round((score.correct / TOTAL_ROUNDS) * 100)}%)
              </p>
            </div>
            <button
              onClick={restartGame}
              disabled={isPending}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
            >
              {isPending ? "Loading…" : "Play Again"}
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

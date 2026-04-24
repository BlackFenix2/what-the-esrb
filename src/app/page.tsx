import { Suspense } from "react";
import TriviaGame from "@/components/TriviaGame";
import { fetchGameAction } from "@/app/actions";

// Disable static prerendering — game data comes from IGDB at request time
export const dynamic = "force-dynamic";

function GameLoadingFallback() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 w-full max-w-2xl mx-auto">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-lg">Loading a game…</p>
    </div>
  );
}

export default function Home() {
  const initialGamePromise = fetchGameAction();

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              What the ESRB?
            </h1>
            <p className="text-sm text-gray-400">
              Guess the game from its ESRB description
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-8">
        <Suspense fallback={<GameLoadingFallback />}>
          <TriviaGame initialGamePromise={initialGamePromise} />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-4 text-center text-xs text-gray-600">
        Game data provided by{" "}
        <a
          href="https://www.igdb.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-400"
        >
          IGDB
        </a>
        {" · "}
        ESRB ratings © Entertainment Software Rating Board
      </footer>
    </div>
  );
}

# What the ESRB?

A web-based trivia game built with Next.js and the IGDB API where you guess the video game title based on its ESRB content description.

## How to Play

1. The game shows you an **ESRB rating** (E, T, M, etc.) and a list of **content descriptors** (e.g. "Blood and Gore", "Strong Language") drawn from a real game's ESRB rating.
2. Type your best guess for the game title. The input provides autocomplete suggestions from IGDB.
3. Submit your guess and see if you're right — the game cover and full title are revealed.
4. Keep track of your score across multiple rounds.

## Setup

### Prerequisites

- Node.js 18+
- A [Twitch Developer](https://dev.twitch.tv/console/apps) account (free) to access the IGDB API

### Getting IGDB API Credentials

1. Log in to the [Twitch Developer Console](https://dev.twitch.tv/console/apps).
2. Click **Register Your Application**.
3. Set the **OAuth Redirect URL** to `http://localhost:3000`.
4. Copy your **Client ID** and generate a **Client Secret**.

### Local Development

```bash
# Install dependencies
npm install

# Copy the example env file and fill in your credentials
cp .env.local.example .env.local
# Edit .env.local and add your TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [IGDB API](https://www.igdb.com/api) via Twitch authentication

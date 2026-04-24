import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "What the ESRB? – Guess the Game",
  description:
    "A trivia game where you guess the video game title based on its ESRB content description.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-900 text-white">
        {children}
      </body>
    </html>
  );
}

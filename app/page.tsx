"use client";

import { GameContainer } from "../components/GameContainer";
import { GameProvider } from "../lib/gameState";

/**
 * Main page component for the Digits Packing Puzzle game
 *
 * This puzzle is about placing digit pieces (0-9) onto a board.
 * Each piece is made of segments that must align with the board's segments.
 * The board has 49 segments (edges in a 5x4 grid).
 */
export default function Home() {
  return (
    <main className="app-main">
      <div className="app-header">
        <h1>Digits Packing Puzzle</h1>
      </div>
      <GameProvider>
        <GameContainer />
      </GameProvider>
    </main>
  );
}

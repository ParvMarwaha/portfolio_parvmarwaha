import type { Metadata } from "next";
import BreakGame from "@/components/game/BreakGame";

export const metadata: Metadata = { title: "Off hours" };

// The game fills the whole screen, so this page has no footer: the top bar is the way out.
export default function PlayPage() {
  return (
    <main>
      <h1 className="sr-only">Break the grid</h1>
      <BreakGame />
    </main>
  );
}

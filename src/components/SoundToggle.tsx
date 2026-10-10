"use client";

import { useEffect } from "react";
import { followTheme, resumeOnFirstGesture, toggleAmbient, useAmbient } from "@/utils/ambient";

/** Four little bars that dance while the music plays and lie flat when it is off. */
function Bars({ on }: { on: boolean }) {
  return (
    <span className="flex h-[1.125rem] items-center gap-[0.1875rem]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[0.1875rem] origin-center rounded-full bg-ink motion-reduce:!animate-none"
          style={{
            height: "100%",
            transform: on ? undefined : "scaleY(0.18)",
            animation: on ? `sound-bar ${0.9 + i * 0.17}s ease-in-out ${i * -0.2}s infinite alternate` : undefined,
            transition: "transform 0.4s ease",
          }}
        />
      ))}
    </span>
  );
}

/** Wires the music to the page once (colours, hidden tabs, "on" remembered from last time). Renders nothing. */
export function SoundBrain() {
  useEffect(() => {
    const offTheme = followTheme();
    const offGesture = resumeOnFirstGesture();
    return () => {
      offTheme();
      offGesture();
    };
  }, []);
  return null;
}

/** The music button in the top bar. Off until pressed. */
export default function SoundToggle() {
  const on = useAmbient();
  return (
    <button
      type="button"
      onClick={toggleAmbient}
      aria-pressed={on}
      aria-label={on ? "Turn the music off" : "Turn the music on"}
      data-cursor-label={on ? "Music off" : "Music on"}
      className="hidden h-9 w-9 place-items-center rounded-full bg-paper ring-1 ring-ink/10 transition-shadow hover:ring-ink/40 sm:grid md:bg-paper/85 md:backdrop-blur-md"
    >
      <Bars on={on} />
    </button>
  );
}

/** The same switch for the phone menu, where the top bar has no room for it. */
export function SoundRow() {
  const on = useAmbient();
  return (
    <button
      type="button"
      onClick={toggleAmbient}
      aria-pressed={on}
      className="flex w-fit items-center gap-3 rounded-full px-4 py-2.5 ring-1 ring-paper/40"
    >
      <span className="flex h-[1.125rem] items-center gap-[0.1875rem]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-[0.1875rem] rounded-full bg-paper"
            style={{
              height: "100%",
              transform: on ? undefined : "scaleY(0.18)",
              animation: on ? `sound-bar ${0.9 + i * 0.17}s ease-in-out ${i * -0.2}s infinite alternate` : undefined,
              transition: "transform 0.4s ease",
            }}
          />
        ))}
      </span>
      <span className="text-[0.9375rem] font-medium tracking-normal">Music {on ? "on" : "off"}</span>
    </button>
  );
}

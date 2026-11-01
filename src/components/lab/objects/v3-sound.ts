import { sfx } from "@/utils/ambient";

/**
 * The sounds of V3: vinyl and paper, on the shared effects bus. Every one of them waits for sound to be on and unlocked,
 * is short, and is rate limited, so a fast drag or a held arrow key never turns into a buzz.
 */
const pan = (p: number) => Math.max(-1, Math.min(1, p));
let lastHover = 0;
let lastStick = 0;
let lastNudge = 0;
const gate = (last: number, gap: number) => performance.now() - last >= gap;

export const lidSound = {
  /** A very soft lift of the corner. */
  hover(p: number, step: number) {
    if (!sfx.ready() || !gate(lastHover, 120)) return;
    lastHover = performance.now();
    sfx.burst("highpass", 5200, 0.04, 0.05, 0, pan(p));
    sfx.blip("sine", sfx.tone(6 + (step % 4), 4), sfx.tone(6 + (step % 4), 4), 0.08, 0.03, 0.004, pan(p));
  },

  /** The sticker comes off the lid: a rising, high-passed rip of noise. */
  peel(p: number) {
    if (!sfx.ready()) return;
    sfx.burst("highpass", 1100, 0.3, 0.2, 0, pan(p), 7000);
    sfx.burst("bandpass", 2200, 0.22, 0.08, 0.02, pan(p), 4200);
  },

  /** It is pressed back down: a soft thump, the paper, a couple of crackles and a note from the key. `k` scales the level. */
  stick(p: number, k = 1) {
    if (!sfx.ready() || !gate(lastStick, 70)) return;
    lastStick = performance.now();
    sfx.blip("sine", 175, 55, 0.15, 0.5 * k, 0, pan(p));
    sfx.burst("bandpass", 2400, 0.05, 0.22 * k, 0, pan(p));
    sfx.burst("highpass", 5400, 0.035, 0.1 * k, 0.035, pan(p));
    sfx.burst("highpass", 4300, 0.03, 0.07 * k, 0.075, pan(p));
    sfx.blip("sine", sfx.tone(2, 2), sfx.tone(2, 2), 0.2, 0.06 * k, 0.01, pan(p));
  },

  /** A tick for each arrow-key nudge. */
  nudge(p: number, step: number) {
    if (!sfx.ready() || !gate(lastNudge, 60)) return;
    lastNudge = performance.now();
    sfx.blip("triangle", sfx.tone(5 + (step % 5), 4), sfx.tone(5 + (step % 5), 4), 0.06, 0.05, 0, pan(p));
  },

  /** Reset: everything flies home. */
  whoosh() {
    if (!sfx.ready()) return;
    sfx.burst("bandpass", 500, 0.55, 0.22, 0, 0, 3600);
    sfx.burst("highpass", 3000, 0.4, 0.06, 0.1, 0, 7000);
  },
};

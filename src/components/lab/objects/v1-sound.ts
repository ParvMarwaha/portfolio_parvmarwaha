import { sfx } from "@/utils/ambient";

// Short synthesised sounds for the vending machine, on the shared effects bus. Everything is a no-op until
// the site's sound is on and unlocked, and each sound is rate-limited so button mashing never turns into noise.
const last: Record<string, number> = {};
const gate = (name: string, gap: number) => {
  if (!sfx.ready()) return false;
  const now = performance.now();
  if (now - (last[name] ?? -1e9) < gap) return false;
  last[name] = now;
  return true;
};

export const vendSound = {
  /** A keypad beep. `step` climbs the music's scale, so typing a code walks upward. */
  key(step: number) {
    if (!gate("key", 40)) return;
    const f = sfx.tone(step, 4);
    sfx.blip("square", f, f, 0.08, 0.07, 0, 0, 3200);
    sfx.blip("sine", f * 2, f * 2, 0.06, 0.05);
    sfx.burst("highpass", 3200, 0.012, 0.1);
  },
  /** The machine accepts the selection: a two-note ding. */
  ok() {
    if (!gate("ok", 200)) return;
    sfx.blip("triangle", sfx.tone(7, 4), sfx.tone(7, 4), 0.14, 0.16);
    sfx.blip("triangle", sfx.tone(10, 4), sfx.tone(10, 4), 0.3, 0.16, 0.09);
  },
  /** The coil motor: filtered noise, a low tone that rises then falls, and a ratchet of ticks. */
  motor() {
    if (!gate("motor", 400)) return;
    sfx.burst("bandpass", 380, 1.15, 0.15, 0, 0, 950);
    sfx.blip("sawtooth", 62, 120, 0.55, 0.14, 0, 0, 380);
    sfx.blip("sawtooth", 120, 58, 0.6, 0.14, 0.55, 0, 380);
    for (let k = 0; k < 9; k++) sfx.burst("bandpass", 2400, 0.02, 0.09, 0.05 + k * 0.12);
  },
  /** The pack lands. `power` is 0 to 1 (a soft bounce is quieter than the first hit). */
  thunk(power: number) {
    if (!gate("thunk", 80)) return;
    const p = Math.max(0.2, Math.min(1, power));
    sfx.blip("sine", 150, 42, 0.22, 0.8 * p);
    sfx.burst("lowpass", 1100, 0.14, 0.55 * p);
    sfx.burst("bandpass", 2200, 0.04, 0.2 * p);
  },
  /** The pack is waiting in the tray. */
  ding() {
    if (!gate("ding", 300)) return;
    sfx.blip("triangle", sfx.tone(9, 4), sfx.tone(9, 4), 0.35, 0.14, 0.12);
  },
  /** A coin dropped into the HIRE ME slot. */
  clink() {
    if (!gate("clink", 250)) return;
    sfx.blip("triangle", 2637, 2637, 0.4, 0.2);
    sfx.blip("sine", 3951, 3951, 0.3, 0.12, 0.055);
    sfx.burst("highpass", 6000, 0.03, 0.15);
    sfx.blip("triangle", 1800, 1450, 0.2, 0.1, 0.2);
    sfx.burst("bandpass", 3000, 0.03, 0.12, 0.22);
  },
  /** Sold out, or not allowed. */
  buzz() {
    if (!gate("buzz", 300)) return;
    sfx.blip("square", 120, 100, 0.2, 0.1, 0, 0, 520);
    sfx.blip("square", 120, 100, 0.2, 0.1, 0.26, 0, 520);
  },
  /** The shelves are refilled. */
  restock() {
    if (!gate("restock", 500)) return;
    [0, 3, 5, 7].forEach((s, i) => sfx.blip("triangle", sfx.tone(s + 3, 4), sfx.tone(s + 3, 4), 0.22, 0.15, i * 0.07));
    sfx.blip("sine", 120, 55, 0.2, 0.5, 0.32);
    sfx.burst("lowpass", 900, 0.12, 0.4, 0.32);
  },
  /** A pack is taken from the tray. */
  take() {
    if (!gate("take", 200)) return;
    sfx.burst("bandpass", 1500, 0.12, 0.2, 0, 0, 3200);
    sfx.blip("triangle", sfx.tone(5, 4), sfx.tone(10, 4), 0.18, 0.15);
  },
};

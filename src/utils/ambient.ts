import { useSyncExternalStore } from "react";

/**
 * The site's music, made live in the browser (Web Audio), so there is no audio file to load or license.
 * A slow pad moves through four chords in A minor and a few soft plucks wander over it through an echo.
 * The interface sounds (hover tick, click tock) and the game's effects are synthesised the same way, on their own bus.
 * It is never started without a click; changing the site's colours moves it to a new key.
 */

const KEY = "pm-sound";
// Chord tones in semitones above the key note (A minor: Am, F, C, G).
const CHORDS = [
  [0, 3, 7, 12],
  [-4, 0, 3, 8],
  [3, 7, 10, 15],
  [-2, 2, 5, 10],
];
const PLUCKS = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22];
// Keys the colours can pick from, as semitones away from A.
const KEYS = [0, 2, 3, 5, 7, -2, -5];
const BEAT = 0.5;
const BEATS_PER_CHORD = 16;
const BASE_HZ = 110;
// Master level: the music sits quietly under the page.
const VOLUME = 0.4;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicOut: GainNode | null = null;
let sfxOut: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let bus: AudioNode | null = null;
let timer = 0;
let playing = false;
let nextBeat = 0;
let beat = 0;
let pluck = 4;
let key = 0;
let pendingKey = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const hz = (semi: number) => BASE_HZ * Math.pow(2, (semi + key) / 12);

function build(): AudioContext {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const c = new AC();
  master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);

  // Music and effects have their own level under the one master, so the clicks are never lost under the pad.
  musicOut = c.createGain();
  musicOut.gain.value = VOLUME;
  musicOut.connect(master);
  sfxOut = c.createGain();
  sfxOut.gain.value = 1;
  sfxOut.connect(master);
  noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

  // One shared echo and a soft low-pass keep everything warm and spacious.
  const tone = c.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 2400;
  tone.connect(musicOut);
  const delay = c.createDelay(1);
  delay.delayTime.value = BEAT * 0.75;
  const feedback = c.createGain();
  feedback.gain.value = 0.42;
  const wet = c.createGain();
  wet.gain.value = 0.5;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(tone);
  const dry = c.createGain();
  dry.connect(tone);
  dry.connect(delay);
  bus = dry;
  return c;
}

function pad(when: number, chord: number[]) {
  if (!ctx || !bus) return;
  const length = BEATS_PER_CHORD * BEAT;
  chord.forEach((semi, i) => {
    for (const [type, detune] of [["sine", -4], ["triangle", 5]] as const) {
      const o = ctx!.createOscillator();
      o.type = type;
      o.frequency.value = hz(semi);
      o.detune.value = detune;
      const g = ctx!.createGain();
      const peak = (type === "sine" ? 0.05 : 0.018) / (1 + i * 0.25);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(peak, when + 2.6);
      g.gain.setValueAtTime(peak, when + length - 0.4);
      g.gain.linearRampToValueAtTime(0, when + length + 3);
      o.connect(g);
      g.connect(bus!);
      o.start(when);
      o.stop(when + length + 3.2);
    }
  });
}

function note(when: number, semi: number) {
  if (!ctx || !bus) return;
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.value = hz(semi) * 2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.09, when + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, when + 1.6);
  o.connect(g);
  g.connect(bus);
  o.start(when);
  o.stop(when + 1.7);
}

function schedule() {
  if (!ctx) return;
  while (nextBeat < ctx.currentTime + 0.8) {
    if (beat % BEATS_PER_CHORD === 0) {
      key = pendingKey;
      pad(nextBeat, CHORDS[(beat / BEATS_PER_CHORD) % CHORDS.length]);
    }
    // Not every beat: a pluck now and then, stepping a little way up or down the scale.
    if (beat % 2 === 0 ? Math.random() < 0.55 : Math.random() < 0.2) {
      pluck = Math.min(PLUCKS.length - 1, Math.max(0, pluck + Math.round((Math.random() - 0.5) * 4)));
      note(nextBeat + (Math.random() < 0.3 ? BEAT / 2 : 0), PLUCKS[pluck]);
    }
    beat++;
    nextBeat += BEAT;
  }
}

const fade = (to: number, seconds: number) => {
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
  master.gain.linearRampToValueAtTime(to, ctx.currentTime + seconds);
};

// ---- effects ---------------------------------------------------------------------------------------------
// Everything below is a short synthesised sound on the effects bus. `pan` is -1 (left) to 1 (right).

const ready = () => !!ctx && !!sfxOut && !!noiseBuf && playing && ctx.state === "running";

function out(pan = 0): AudioNode {
  if (!ctx || !sfxOut || !ctx.createStereoPanner || pan === 0) return sfxOut!;
  const p = ctx.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  p.connect(sfxOut);
  return p;
}

/** A pitched blip: `from` slides to `to` Hz over `dur`, with a quick attack and an exponential fade. */
function blip(type: OscillatorType, from: number, to: number, dur: number, level: number, when = 0, pan = 0, lowpass = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  if (to !== from) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(level, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
  o.connect(g);
  let tail: AudioNode = g;
  if (lowpass) {
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = lowpass;
    g.connect(f);
    tail = f;
  }
  tail.connect(out(pan));
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** A burst of filtered noise: a click, a crack, a whoosh or a boom depending on the filter. */
function burst(kind: BiquadFilterType, freq: number, dur: number, level: number, when = 0, pan = 0, sweepTo = 0) {
  if (!ctx || !noiseBuf) return;
  const t = ctx.currentTime + when;
  const n = ctx.createBufferSource();
  n.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = kind;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = kind === "bandpass" ? 1.4 : 0.7;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(level, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
  n.connect(f);
  f.connect(g);
  g.connect(out(pan));
  n.start(t, Math.random() * 0.5);
  n.stop(t + dur + 0.02);
}

// Notes the effects can play, in semitones above the key (a minor pentatonic ladder), so they sit with the music.
const LADDER = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27, 29, 31];
const tone = (step: number, octave = 2) => hz(LADDER[Math.max(0, Math.min(LADDER.length - 1, step))]) * octave;

/** Interface sounds: a crisp tick when the pointer lands on something pressable, a round tock when it is pressed. */
export function uiSound(kind: "hover" | "click") {
  if (!ready()) return;
  if (kind === "hover") {
    const step = Math.floor(Math.random() * 6);
    burst("bandpass", 4200, 0.03, 0.22);
    blip("sine", tone(step + 5, 2), tone(step + 5, 2), 0.09, 0.16);
  } else {
    burst("highpass", 1800, 0.035, 0.3);
    blip("sine", 920, 260, 0.11, 0.42);
    blip("triangle", tone(7, 2), tone(7, 2), 0.16, 0.12, 0.012);
  }
}

export type GameSound =
  | "launch"
  | "paddle"
  | "wall"
  | "brick"
  | "tough"
  | "boom"
  | "gold"
  | "power"
  | "life"
  | "laser"
  | "lose"
  | "clear"
  | "won"
  | "over";

/** Sounds for the game. `n` is the combo for bricks (the notes climb with it) and `pan` is where on the board it happened. */
export function gameSound(kind: GameSound, pan = 0, n = 0) {
  if (!ready()) return;
  const p = pan * 0.7;
  switch (kind) {
    case "launch":
      burst("bandpass", 500, 0.28, 0.18, 0, 0, 3600);
      blip("sine", tone(0, 2), tone(5, 2), 0.25, 0.2);
      break;
    case "paddle":
      blip("sine", 190, 70, 0.12, 0.55, 0, p);
      burst("lowpass", 1400, 0.05, 0.3, 0, p);
      break;
    case "wall":
      blip("triangle", 640 + Math.random() * 60, 420, 0.05, 0.16, 0, p);
      break;
    case "brick": {
      // The streak climbs the scale, one note per brick.
      const step = Math.min(n, LADDER.length - 1);
      blip("triangle", tone(step, 4), tone(step, 4), 0.34, 0.3, 0, p);
      blip("sine", tone(step, 8), tone(step, 8), 0.18, 0.1, 0, p);
      burst("bandpass", 2600, 0.05, 0.28, 0, p);
      break;
    }
    case "tough":
      blip("square", 240, 150, 0.09, 0.14, 0, p, 1800);
      burst("bandpass", 1200, 0.06, 0.3, 0, p);
      break;
    case "boom":
      burst("lowpass", 1800, 0.55, 0.9, 0, p, 80);
      blip("sine", 150, 38, 0.5, 0.7, 0, p);
      break;
    case "gold":
      [0, 5, 9, 12].forEach((s, i) => blip("triangle", tone(s, 4), tone(s, 4), 0.4, 0.24, i * 0.07, p));
      break;
    case "power":
      [0, 2, 5].forEach((s, i) => blip("sine", tone(s + 3, 4), tone(s + 3, 4), 0.2, 0.28, i * 0.06, p));
      break;
    case "life":
      [5, 9, 12, 16].forEach((s, i) => blip("triangle", tone(s, 4), tone(s, 4), 0.3, 0.26, i * 0.09));
      break;
    case "laser":
      blip("square", 1500, 300, 0.12, 0.1, 0, p, 3000);
      break;
    case "lose":
      blip("sawtooth", 420, 55, 0.7, 0.28, 0, 0, 900);
      blip("sine", 110, 40, 0.6, 0.5);
      burst("lowpass", 700, 0.4, 0.4, 0, 0, 100);
      break;
    case "clear":
      [0, 3, 5, 7, 10, 12].forEach((s, i) => blip("triangle", tone(s, 4), tone(s, 4), 0.5, 0.24, i * 0.08));
      break;
    case "won":
      [0, 5, 7, 12, 10, 15, 17, 19, 24].forEach((s, i) => blip("triangle", tone(s, 4), tone(s, 4), 0.7, 0.24, i * 0.1));
      blip("sine", tone(0, 1), tone(0, 1), 1.6, 0.4, 0.2);
      break;
    case "over":
      [7, 5, 3, 0].forEach((s, i) => blip("triangle", tone(s, 2), tone(s, 2), 0.7, 0.26, i * 0.22, 0, 1400));
      break;
  }
}

/**
 * Building blocks for sounds that belong to one component (a machine on the home page, say). They all play on the
 * effects bus and do nothing until the audio is running, so call them freely.
 *  - ready(): true when sound is on and unlocked.
 *  - blip(type, fromHz, toHz, seconds, level, delay, pan, lowpassHz): a pitched note that can slide.
 *  - burst(filter, hz, seconds, level, delay, pan, sweepToHz): filtered noise (click, crack, whoosh, boom, crackle).
 *  - tone(step, octave): a frequency on the music's scale (step 0 is the key note), for notes that sit with the music.
 */
export const sfx = { ready, blip, burst, tone };

/** Turn the music down while the game is on so the effects carry (1 = the normal level). */
export function duckMusic(amount: number) {
  if (!ctx || !musicOut) return;
  musicOut.gain.cancelScheduledValues(ctx.currentTime);
  musicOut.gain.linearRampToValueAtTime(VOLUME * amount, ctx.currentTime + 0.6);
}

/** `auto`: only start if the browser lets a page make sound unprompted; otherwise quietly give up and say so. */
export async function startAmbient(auto = false): Promise<boolean> {
  if (playing) return true;
  try {
    if (!ctx) ctx = build();
    if (auto && ctx.state !== "running") {
      void ctx.close();
      ctx = null;
      master = musicOut = sfxOut = noiseBuf = null;
      bus = null;
      return false;
    }
    playing = true;
    emit();
    await ctx.resume();
    if (!playing) return true;
    nextBeat = ctx.currentTime + 0.1;
    beat = 0;
    window.clearInterval(timer);
    timer = window.setInterval(schedule, 250);
    schedule();
    fade(1, 2.5);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    return true;
  } catch {
    playing = false;
    emit();
    return false;
  }
}

export function stopAmbient() {
  if (!playing) return;
  playing = false;
  emit();
  try {
    localStorage.setItem(KEY, "0");
  } catch {}
  fade(0, 0.7);
  window.setTimeout(() => {
    if (playing || !ctx) return;
    window.clearInterval(timer);
    // Drop whatever was queued so a later start begins cleanly.
    void ctx.close();
    ctx = null;
    master = musicOut = sfxOut = noiseBuf = null;
    bus = null;
  }, 1200);
}

export const toggleAmbient = () => (playing ? stopAmbient() : void startAmbient());

/**
 * The music is on by default. Browsers only allow sound after a tap or key press, so it tries to start straight
 * away and, if that is blocked, starts on the first one. Someone who switched it off stays off.
 */
export function startOnLoad() {
  let wanted = true;
  try {
    wanted = localStorage.getItem(KEY) !== "0";
  } catch {}
  if (!wanted) return () => {};
  const off = () => {
    window.removeEventListener("click", go);
    window.removeEventListener("touchend", go);
    window.removeEventListener("keydown", go);
  };
  const go = (e: Event) => {
    // The sound button has its own say.
    if ((e.target as HTMLElement | null)?.closest?.("[data-sound-toggle]")) return;
    off();
    // The press that woke the audio gets its tap too.
    void startAmbient().then((ok) => ok && e.type === "click" && uiSound("click"));
  };
  let cancelled = false;
  void startAmbient(true).then((started) => {
    if (started || cancelled) return;
    window.addEventListener("click", go);
    window.addEventListener("touchend", go);
    window.addEventListener("keydown", go);
  });
  return () => {
    cancelled = true;
    off();
  };
}

/** The music follows the colours: every new palette picks a new key, taken up at the next chord. */
export function followTheme() {
  const onTheme = () => {
    const c = getComputedStyle(document.documentElement).getPropertyValue("--cobalt").trim();
    let h = 0;
    for (let i = 0; i < c.length; i++) h = (h * 31 + c.charCodeAt(i)) >>> 0;
    pendingKey = KEYS[h % KEYS.length];
  };
  window.addEventListener("pm:theme", onTheme);

  // Interface sounds, for anything you can press. Only mice get the hover blip; every pointer gets the tap.
  const INTERACTIVE = 'a[href],button,[role="button"],summary,label[for]';
  const pressable = (el: EventTarget | null) => {
    const hit = (el as HTMLElement | null)?.closest?.<HTMLElement>(INTERACTIVE) ?? null;
    return hit && !hit.matches(":disabled,[aria-disabled='true']") ? hit : null;
  };
  let lastHover = 0;
  const onOver = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || document.body.dataset.panning) return;
    const el = pressable(e.target);
    if (!el || el === pressable(e.relatedTarget)) return;
    const now = performance.now();
    if (now - lastHover < 70) return;
    lastHover = now;
    uiSound("hover");
  };
  const onDown = (e: PointerEvent) => {
    if (e.button === 0 && pressable(e.target)) uiSound("click");
  };
  document.addEventListener("pointerover", onOver);
  document.addEventListener("pointerdown", onDown, true);
  // A tab nobody is looking at should be quiet.
  const onVisible = () => {
    if (!ctx || !playing) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.removeEventListener("pm:theme", onTheme);
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerdown", onDown, true);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export const useAmbient = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => playing,
    () => false
  );

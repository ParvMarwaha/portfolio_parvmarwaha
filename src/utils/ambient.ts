import { useSyncExternalStore } from "react";

/**
 * The site's music, made live in the browser (Web Audio), so there is no audio file to load or license.
 * A slow pad moves through four chords in A minor and a few soft plucks wander over it through an echo.
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

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
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

  // One shared echo and a soft low-pass keep everything warm and spacious.
  const tone = c.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 2400;
  tone.connect(master);
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

export async function startAmbient() {
  if (playing) return;
  playing = true;
  emit();
  try {
    if (!ctx) ctx = build();
    await ctx.resume();
    if (!playing) return;
    nextBeat = ctx.currentTime + 0.1;
    beat = 0;
    window.clearInterval(timer);
    timer = window.setInterval(schedule, 250);
    schedule();
    fade(0.8, 2);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  } catch {
    playing = false;
    emit();
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
    master = null;
    bus = null;
  }, 1200);
}

export const toggleAmbient = () => (playing ? stopAmbient() : void startAmbient());

/** Called once at the start: if the visitor had it on last time, it comes back on their first tap or key press. */
export function resumeOnFirstGesture() {
  let wanted = false;
  try {
    wanted = localStorage.getItem(KEY) === "1";
  } catch {}
  if (!wanted) return () => {};
  const go = () => {
    off();
    void startAmbient();
  };
  const off = () => {
    window.removeEventListener("pointerdown", go);
    window.removeEventListener("keydown", go);
  };
  window.addEventListener("pointerdown", go);
  window.addEventListener("keydown", go);
  return off;
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
  // A tab nobody is looking at should be quiet.
  const onVisible = () => {
    if (!ctx || !playing) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.removeEventListener("pm:theme", onTheme);
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

"use client";

import { useEffect } from "react";
import { isCoarse } from "@/utils/device";

/**
 * The tab icon is Kern, the little design buddy from the cover: its face on a cobalt badge, in the site's current
 * colours. It looks around, blinks, and changes expression every few seconds (happy, surprised, a wink, sleepy).
 * The static icon (src/app/icon.svg) is what shows first and what anything that cannot animate keeps. It stands
 * still for visitors who prefer reduced motion.
 */
export default function FaviconAnimator() {
  useEffect(() => {
    // Phones have no tab strip to show it in, so do not spend a timer and a PNG encode on it.
    if (isCoarse()) return;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
      return { bg: v("--cobalt", "#2D3BFF"), body: v("--butter", "#FFD84D"), ink: v("--ink", "#0E0F1A"), cheek: v("--vermilion", "#FF4D1F") };
    };
    let pal = read();
    const onTheme = () => (pal = read());
    window.addEventListener("pm:theme", onTheme);

    // The faces it cycles through, a few seconds each.
    const FACES = ["open", "happy", "open", "wow", "open", "wink", "open", "sleepy"] as const;
    const squircle = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const paint = (t: number) => {
      const face = reduced ? "open" : FACES[Math.floor(t / 2.6) % FACES.length];
      const blink = !reduced && face === "open" && t % 3.1 < 0.16;
      // where it is looking: a slow wander
      const lx = reduced ? 0 : Math.sin(t * 0.9) * 2.4;
      const ly = reduced ? 0 : Math.cos(t * 0.7) * 1.4;
      const bob = reduced ? 0 : Math.sin(t * 2.2) * 0.8;

      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = pal.bg;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();

      // body
      ctx.fillStyle = pal.body;
      squircle(10, 11 + bob, 44, 42, 15);
      ctx.fill();

      // eyes
      const eye = (cx: number, closed: boolean, arc: boolean) => {
        const cy = 29 + bob;
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 3.4;
        ctx.lineCap = "round";
        if (closed) {
          ctx.beginPath();
          ctx.moveTo(cx - 5, cy + 1);
          ctx.lineTo(cx + 5, cy + 1);
          ctx.stroke();
          return;
        }
        if (arc) {
          ctx.beginPath();
          ctx.arc(cx, cy + 3, 5, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
          return;
        }
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(cx, cy, 6.2, face === "wow" ? 7.6 : 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pal.ink;
        ctx.beginPath();
        ctx.arc(cx + lx, cy + 0.8 + ly, 3.6, 0, Math.PI * 2);
        ctx.fill();
      };
      eye(23, blink || face === "sleepy", face === "happy");
      eye(41, blink || face === "sleepy" || face === "wink", face === "happy");

      // cheeks
      ctx.fillStyle = pal.cheek;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(16, 39 + bob, 3.6, 0, Math.PI * 2);
      ctx.arc(48, 39 + bob, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // mouth
      const my = 42 + bob;
      ctx.strokeStyle = pal.ink;
      ctx.fillStyle = pal.ink;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      if (face === "wow") {
        ctx.ellipse(32, my + 1, 3.6, 4.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (face === "happy") {
        ctx.moveTo(25, my - 1);
        ctx.quadraticCurveTo(32, my + 9, 39, my - 1);
        ctx.closePath();
        ctx.fillStyle = pal.cheek;
        ctx.fill();
        ctx.stroke();
      } else if (face === "sleepy") {
        ctx.moveTo(28, my + 1);
        ctx.lineTo(36, my + 1);
        ctx.stroke();
      } else {
        ctx.moveTo(26, my - 1);
        ctx.quadraticCurveTo(32, my + 5, 38, my - 1);
        ctx.stroke();
      }

      const url = canvas.toDataURL("image/png");
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((l) => {
        l.type = "image/png";
        l.removeAttribute("sizes");
        l.href = url;
      });
    };

    const start = performance.now();
    paint(0);
    const id = reduced ? 0 : window.setInterval(() => paint((performance.now() - start) / 1000), 130);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("pm:theme", onTheme);
    };
  }, []);

  return null;
}

"use client";

import { useMedia } from "@/utils/device";
import Canvas from "./Canvas";
import MobileLab from "./MobileLab";

/**
 * Picks the Lab for the device: the pannable canvas for a mouse, one scrolling column for a finger. Nothing is
 * rendered until we know which, so a phone never spins the canvas up just to throw it away.
 */
export default function LabEntry() {
  const column = useMedia("(max-width: 767px), (pointer: coarse)", null);
  if (column === null) return null;
  return column ? <MobileLab /> : <Canvas />;
}

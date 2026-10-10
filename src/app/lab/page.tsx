import type { Metadata } from "next";
import Canvas from "@/components/canvas/Canvas";

export const metadata: Metadata = {
  title: "Lab",
  description: "Experiments, tests and half-ideas that are not projects.",
};

// The playful corner of the site: experiments laid out as a design file you can pan, zoom and throw things around in.
export default function LabPage() {
  return <Canvas />;
}

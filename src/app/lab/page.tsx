import type { Metadata } from "next";
import LabEntry from "@/components/canvas/LabEntry";

export const metadata: Metadata = {
  title: "Lab",
  description: "Experiments, tests and half-ideas that are not projects.",
};

// The playful corner of the site: experiments laid out as a design file you can pan, zoom and throw things around in
// (on a phone, the same experiments in one scrolling column).
export default function LabPage() {
  return <LabEntry />;
}

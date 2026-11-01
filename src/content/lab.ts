// The Lab (/lab): experiments, tests and half-ideas that are not projects. Each one is a frame on the canvas.
//
// To add one, append an entry here. Give it an `image` (a path in /public or a URL) for a picture frame, and an
// optional `href` if clicking it should open a page. Entries with neither need a live demo registered in
// src/components/canvas/experiments.tsx under the same `id` (the generative ones are in generative.tsx).
// Frames fill the canvas slots in order (eight slots, then rows below).
export interface Experiment {
  id: string;
  title: string;
  /** A word or two: "Type", "Colour", "Game" */
  kind: string;
  note: string;
  href?: string;
  image?: string;
}

export const experiments: Experiment[] = [
  { id: "weight", title: "Weight", kind: "Type", note: "A variable font whose weight follows your cursor." },
  { id: "synapse", title: "Synapse", kind: "Neural", note: "A network of neurons that fire in cascades. Move your cursor over it to stimulate them." },
  { id: "palette", title: "Palette", kind: "Colour", note: "The site's random colour generator. Shuffle, then try one on the whole site." },
  { id: "attractor", title: "Attractor", kind: "Maths", note: "A Clifford attractor: tens of thousands of points a frame tracing one equation, slowly morphing." },
  { id: "turing", title: "Turing", kind: "Chemistry", note: "Reaction-diffusion: two imaginary chemicals growing coral and labyrinth patterns. Move over it to add more." },
  { id: "brainwave", title: "Brainwave", kind: "EEG", note: "An invented EEG readout, six channels with the odd spike. Move over it to stimulate them." },
  { id: "field", title: "Field", kind: "Flow", note: "Particles riding a noise field. Your cursor pushes them away." },
  { id: "orbit", title: "Orbit", kind: "3D", note: "A neural globe that turns by itself. Move over it to tilt it." },
  // Old home page covers, kept as toys: each opens on its own page.
  { id: "vending", title: "Vending machine", kind: "Toy", note: "My work as vending machine stock. Pick a pack, or key in its code, and it drops into the tray.", href: "/lab/vending" },
  { id: "claw", title: "Claw machine", kind: "Toy", note: "An arcade claw machine where the prizes are projects. Aim, drop, and open whatever you catch.", href: "/lab/claw" },
  { id: "stickers", title: "Sticker lid", kind: "Toy", note: "A laptop lid covered in stickers. Every one of them peels off and sticks back down anywhere.", href: "/lab/stickers" },
];

/** The Lab's experiments that open on a page of their own, looked up by id. */
export const labObject = (id: string) => {
  const e = experiments.find((x) => x.id === id);
  if (!e) throw new Error(`No lab experiment "${id}"`);
  return e;
};

export const lab = {
  title: "Lab",
  tagline: "things I'm trying out.",
  note: "Not projects. Just experiments.",
};

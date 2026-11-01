"use client";

import { useEntered } from "@/components/home/hero/shared";
import VendingMachine from "./v1-machine";
import { VEND_CSS } from "./v1-style";

/**
 * A vending machine stocked with my work (it was the V1 home cover, now a Lab object). It scales itself to fit the box
 * it is given; the machine, the packs and the sounds are in v1-machine.tsx, v1-parts.tsx and v1-sound.ts.
 */
export default function VendingObject() {
  const entered = useEntered();
  return (
    <div className="relative h-full w-full" data-entered={entered}>
      <style dangerouslySetInnerHTML={{ __html: VEND_CSS }} />
      <VendingMachine />
    </div>
  );
}

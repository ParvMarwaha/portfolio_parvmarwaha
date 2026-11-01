import type { Metadata } from "next";
import { labObject } from "@/content/lab";
import LabObjectPage from "@/components/lab/LabObjectPage";
import ClawObject from "@/components/lab/objects/ClawObject";

const item = labObject("claw");

export const metadata: Metadata = { title: `${item.title} · Lab`, description: item.note };

export default function ClawPage() {
  return (
    <LabObjectPage item={item}>
      <ClawObject />
    </LabObjectPage>
  );
}

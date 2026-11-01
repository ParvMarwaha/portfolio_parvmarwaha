import type { Metadata } from "next";
import { labObject } from "@/content/lab";
import LabObjectPage from "@/components/lab/LabObjectPage";
import VendingObject from "@/components/lab/objects/VendingObject";

const item = labObject("vending");

export const metadata: Metadata = { title: `${item.title} · Lab`, description: item.note };

export default function VendingPage() {
  return (
    <LabObjectPage item={item}>
      <VendingObject />
    </LabObjectPage>
  );
}

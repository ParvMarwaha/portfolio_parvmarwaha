import type { Metadata } from "next";
import { labObject } from "@/content/lab";
import LabObjectPage from "@/components/lab/LabObjectPage";
import StickerObject from "@/components/lab/objects/StickerObject";

const item = labObject("stickers");

export const metadata: Metadata = { title: `${item.title} · Lab`, description: item.note };

export default function StickersPage() {
  return (
    <LabObjectPage item={item}>
      <StickerObject />
    </LabObjectPage>
  );
}

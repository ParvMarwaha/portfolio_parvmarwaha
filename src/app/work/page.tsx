import type { Metadata } from "next";
import WorkIndex from "@/components/WorkIndex";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Index" };

export default function WorkPage() {
  return (
    <>
      <main className="min-h-screen px-4 pb-20 pt-28 md:px-6 md:pb-28 md:pt-36">
        <div className="mx-auto max-w-[max(85rem,1360px)]">
        <WorkIndex />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

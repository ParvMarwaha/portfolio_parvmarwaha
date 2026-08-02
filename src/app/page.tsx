import Hero from "@/components/Hero";
import Philosophy from "@/components/Philosophy";
import SelectedWorks from "@/components/SelectedWorks";
import Process from "@/components/Process";
import Studio from "@/components/Studio";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Hero />
      <Philosophy />
      <SelectedWorks />
      <Process />
      <Studio />
      <Footer />
    </main>
  );
}

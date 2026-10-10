import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";

import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import Preloader from "@/components/Preloader";
import TopBar from "@/components/TopBar";
import Confetti from "@/components/Confetti";
import { site } from "@/content/site";
import { THEME_KEY, VAR_MAP, themeCss } from "@/content/themes";
import PageTransition from "@/components/PageTransition";
import FaviconAnimator from "@/components/FaviconAnimator";

// Variable font: the weight axis runs 100 to 900, which the cover headline plays with.
const grotesk = localFont({
  src: "../../public/fonts/OverusedGrotesk-VF.woff2",
  variable: "--font-grotesk",
  weight: "100 900",
  display: "swap",
});

// Used for one emphasised word at a time, never for body copy.
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: site.title, template: `%s — ${site.name}` },
  description: site.description,
  openGraph: { title: site.title, description: site.description, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#2D3BFF",
};

// Runs before first paint so returning visitors never see the intro curtain flash.
const introScript = `try{if(sessionStorage.getItem('pm-intro')==='1')document.documentElement.dataset.intro='done'}catch(e){}try{var t=JSON.parse(localStorage.getItem('${THEME_KEY}')||'null');if(t&&t.vars){var m=${JSON.stringify(VAR_MAP)},r=document.documentElement;for(var k in m)if(t.vars[k])r.style.setProperty(m[k],t.vars[k]);if(t.fx==='xray')r.dataset.fx='xray'}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${grotesk.variable} ${instrument.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body className="min-h-full flex flex-col overflow-x-clip font-sans bg-paper text-ink tracking-tight" suppressHydrationWarning>
        <SmoothScroll>
          <Preloader />
          <CustomCursor />
          <TopBar />
          <PageTransition />
          <FaviconAnimator />
          <Confetti />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}

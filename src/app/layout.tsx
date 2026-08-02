import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import Navigation from "@/components/Navigation";
import Preloader from "@/components/Preloader";

const overusedGrotesk = localFont({
  src: "../../public/fonts/OverusedGrotesk-VF.woff2",
  variable: "--font-inter", // keeping the same variable name to avoid touching globals.css
  display: "swap",
});

export const metadata: Metadata = {
  title: "Digital Experience Designer",
  description: "Crafting immersive worlds through interaction, motion and storytelling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${overusedGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-ivory text-charcoal selection:bg-charcoal selection:text-ivory tracking-tight" suppressHydrationWarning>
        <SmoothScroll>
          <Preloader />
          <CustomCursor />
          <Navigation />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}

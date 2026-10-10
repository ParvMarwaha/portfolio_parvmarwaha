"use client";

import { useState } from "react";
import RemoteImage from "@/components/ui/RemoteImage";

/**
 * Vimeo video behind a poster. The player only loads when you press play (lighter page), and there is
 * always a plain link to the video on Vimeo's own page in case the player is blocked on a network.
 */
export default function VideoEmbed({ id, poster, title, fallbackHref }: { id: string; poster: string; title: string; fallbackHref: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden bg-deep">
        {playing ? (
          <iframe
            src={`https://player.vimeo.com/video/${id}?badge=0&autopause=0&autoplay=1`}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 block h-full w-full"
            aria-label={`Play video: ${title}`}
            data-cursor-label="Play"
          >
            <RemoteImage src={poster} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            <span className="absolute inset-0 bg-ink/25 transition-colors group-hover:bg-ink/10" />
            <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-vermilion text-white shadow-[0_20px_40px_-12px_rgba(14,15,26,0.6)] transition-transform duration-300 group-hover:scale-110 md:h-24 md:w-24">
              <svg width="26" height="26" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
                <path d="M3 1.5v11l9-5.5-9-5.5Z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <p className="label mt-3 text-mute">
        Video not loading?{" "}
        <a href={fallbackHref} target="_blank" rel="noopener noreferrer" className="border-b border-ink/40 text-ink transition-colors hover:border-vermilion hover:text-vermilion">
          Watch it on Vimeo ↗
        </a>
      </p>
    </div>
  );
}

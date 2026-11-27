"use client";

import { useState } from "react";
import { CirclePlay } from "lucide-react";
import type { Video } from "@/types";
import { TVCard } from "@/components/tv/TVCard";
import { thumbnailUrl } from "@/data/videos";

export function VideoThumb({ video }: { video: Video }) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl(video.id)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2b332d] to-[#171a18]" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/15">
        <CirclePlay size={56} strokeWidth={1.5} className="text-white/90 drop-shadow-lg" aria-hidden />
      </div>
    </>
  );
}

export function VideoCard({ video, className, autoFocus, focusKey }: { video: Video; className?: string; autoFocus?: boolean; focusKey?: string }) {
  return (
    <TVCard
      href={`/videos/${video.id}`}
      focusKey={focusKey ?? `video-${video.id}`}
      autoFocus={autoFocus}
      className={className}
      title={video.title}
      meta={[video.channel, video.category].filter(Boolean).join(" · ")}
      media={<VideoThumb video={video} />}
    />
  );
}

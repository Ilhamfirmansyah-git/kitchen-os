"use client";

import { use } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { getVideo, VIDEOS } from "@/data/videos";
import { getRecipe } from "@/data/recipes";
import { YouTubePlayer } from "@/components/video/YouTubePlayer";
import { VideoCard } from "@/components/video/VideoCard";
import { TVButton } from "@/components/tv/TVButton";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { useTVNavigation } from "@/components/tv/TVNavigationProvider";
import { useOnline } from "@/hooks/useOnline";

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const video = getVideo(id);
  const { goBack } = useTVNavigation();
  const online = useOnline();
  if (!video) notFound();
  const recipe = video.recipeSlug ? getRecipe(video.recipeSlug) : undefined;
  const related = [...VIDEOS.filter((v) => v.id !== id && v.category === video.category), ...VIDEOS.filter((v) => v.id !== id && v.category !== video.category)].slice(0, 4);

  return (
    <div className="grid min-h-screen grid-cols-[minmax(0,1fr)_28rem] gap-10 px-12 py-8">
      <div className="min-w-0">
        <FocusGroup id="video-top" className="mb-5 flex items-center gap-5">
          <TVButton icon={ArrowLeft} onSelect={goBack} focusKey="video-back">
            Back
          </TVButton>
          <h1 className="min-w-0 truncate font-display text-[2.25rem] font-bold">{video.title}</h1>
        </FocusGroup>
        <div className="overflow-hidden rounded-[1.25rem] border border-[var(--border)]">
          {online ? (
            <YouTubePlayer videoId={video.id} title={video.title} />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-[var(--surface)] p-12 text-center text-[1.5rem] text-[var(--text-secondary)]">
              You&apos;re offline. Connect to the internet to watch videos — recipes and timers still work.
            </div>
          )}
        </div>
        <div className="mt-6 flex items-start justify-between gap-8">
          <div>
            {video.channel && <div className="text-[1.25rem] font-semibold text-[var(--primary)]">{video.channel}</div>}
            <p className="mt-1 text-[1.5rem] text-[var(--text-secondary)]">{video.description}</p>
            <p className="mt-2 text-[1rem] text-[var(--text-secondary)]">Video hosted by YouTube. Content belongs to its creator.</p>
          </div>
          {recipe && (
            <TVButton icon={BookOpen} href={`/recipes/${recipe.slug}`} focusKey="video-recipe" size="lg">
              Open recipe
            </TVButton>
          )}
        </div>
      </div>
      <aside>
        <h2 className="mb-5 font-display text-[1.75rem] font-bold">Related</h2>
        <FocusGroup id="video-related" restore className="flex flex-col gap-6">
          {related.map((v) => (
            <VideoCard key={v.id} video={v} focusKey={`rel-${v.id}`} />
          ))}
        </FocusGroup>
      </aside>
    </div>
  );
}

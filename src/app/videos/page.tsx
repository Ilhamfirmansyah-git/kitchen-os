"use client";

import { useMemo, useState } from "react";
import { Play, Search, Video as VideoIcon, X } from "lucide-react";
import { EmptyState, Page, PageHeader, Section } from "@/components/layout/Page";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { TVButton } from "@/components/tv/TVButton";
import { TVInput } from "@/components/tv/TVControls";
import { VideoCard, VideoThumb } from "@/components/video/VideoCard";
import { VIDEOS, VIDEO_CATEGORIES } from "@/data/videos";
import { useOnline } from "@/hooks/useOnline";
import type { VideoCategory } from "@/types";

export default function VideosPage() {
  const online = useOnline();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<VideoCategory | "all">("all");
  const featured = VIDEOS.filter((v) => v.featured);
  const hero = featured[0];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VIDEOS.filter(
      (v) =>
        (category === "all" || v.category === category) &&
        (!q || [v.title, v.channel, v.description, v.category].join(" ").toLowerCase().includes(q)),
    );
  }, [query, category]);

  const filtering = !!query.trim() || category !== "all";

  return (
    <Page>
      <PageHeader title="Videos" subtitle={online ? "Cooking tutorials from YouTube." : "You're offline — videos need an internet connection."} />

      {!filtering && hero && (
        <section className="relative mb-12 grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)]">
          <div className="relative aspect-video">
            <VideoThumb video={hero} />
          </div>
          <div className="flex flex-col justify-center p-12">
            <div className="text-[1.25rem] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">Featured</div>
            <h2 className="mt-3 font-display text-[2.75rem] font-extrabold leading-tight">{hero.title}</h2>
            <p className="mt-3 text-[1.375rem] text-[var(--text-secondary)]">{hero.description}</p>
            <div className="mt-8">
              <TVButton variant="primary" size="lg" icon={Play} href={`/videos/${hero.id}`} autoFocus focusKey="videos-hero">
                Watch now
              </TVButton>
            </div>
          </div>
        </section>
      )}

      <FocusGroup id="videos-search" className="flex gap-4">
        <div className="relative flex-1">
          <Search size={28} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" aria-hidden />
          <TVInput label="Search videos" placeholder="Search videos…" value={query} onChange={setQuery} focusKey="videos-search" className="pl-16" />
        </div>
        {query && (
          <TVButton icon={X} onSelect={() => setQuery("")} focusKey="videos-clear">
            Clear
          </TVButton>
        )}
      </FocusGroup>
      <FocusGroup id="videos-cats" restore className="shelf mt-6">
        {(["all", ...VIDEO_CATEGORIES] as const).map((c) => (
          <TVButton
            key={c}
            variant={category === c ? "primary" : "secondary"}
            active={category === c}
            onSelect={() => setCategory(c)}
            focusKey={`vcat-${c}`}
            groupDefault={category === c}
          >
            {c === "all" ? "All" : c}
          </TVButton>
        ))}
      </FocusGroup>

      {filtering ? (
        <Section title={`${results.length} videos`} className="mt-8">
          {results.length ? (
            <div className="grid grid-cols-4 gap-x-8 gap-y-10">
              {results.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<VideoIcon size={56} aria-hidden />} title="No videos found" body="Try a different search or category." />
          )}
        </Section>
      ) : (
        <>
          <Section title="Featured" className="mt-8">
            <FocusGroup id="videos-featured" restore className="shelf">
              {featured.map((v) => (
                <VideoCard key={v.id} video={v} className="w-[26rem]" focusKey={`feat-${v.id}`} />
              ))}
            </FocusGroup>
          </Section>
          {VIDEO_CATEGORIES.map((c) => {
            const list = VIDEOS.filter((v) => v.category === c);
            if (!list.length) return null;
            return (
              <Section key={c} title={c}>
                <FocusGroup id={`videos-row-${c}`} restore className="shelf">
                  {list.map((v) => (
                    <VideoCard key={v.id} video={v} className="w-[26rem]" focusKey={`row-${c}-${v.id}`} />
                  ))}
                </FocusGroup>
              </Section>
            );
          })}
        </>
      )}
    </Page>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, FastForward, Maximize, Pause, Play, Rewind, Volume1, Volume2, VolumeX } from "lucide-react";
import { TVButton } from "@/components/tv/TVButton";
import { FocusGroup } from "@/components/tv/FocusGroup";
import { useBackHandler, useMediaKeys } from "@/components/tv/TVNavigationProvider";
import { formatDuration } from "@/lib/timers/timers";

/* Minimal typing for the YouTube IFrame Player API. */
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  setVolume(v: number): void;
  getVolume(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  destroy(): void;
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => {
      apiPromise = null;
      reject(new Error("script"));
    };
    document.head.appendChild(s);
    window.setTimeout(() => {
      if (!window.YT?.Player) {
        apiPromise = null;
        reject(new Error("timeout"));
      }
    }, 12_000);
  });
  return apiPromise;
}

const ERROR_TEXT: Record<number, string> = {
  2: "This video link is invalid.",
  5: "This TV browser can't play this video.",
  100: "This video was removed or made private.",
  101: "The owner doesn't allow this video to be played inside other apps.",
  150: "The owner doesn't allow this video to be played inside other apps.",
};

interface Props {
  videoId: string;
  title: string;
}

export function YouTubePlayer({ videoId, title }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let disposed = false;
    // Reset per video. Done in a microtask to keep effects free of sync setState chains.
    queueMicrotask(() => {
      if (disposed) return;
      setReady(false);
      setError(null);
      setPlaying(false);
    });
    loadYouTubeApi()
      .then((YT) => {
        if (disposed || !hostRef.current) return;
        const target = document.createElement("div");
        hostRef.current.replaceChildren(target);
        playerRef.current = new YT.Player(target, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (disposed) return;
              const iframe = hostRef.current?.querySelector("iframe");
              if (iframe) {
                iframe.tabIndex = -1; // never let the iframe swallow remote keys
                iframe.setAttribute("title", title);
              }
              setReady(true);
              playerRef.current?.setVolume(80);
              playerRef.current?.playVideo();
            },
            onStateChange: (e: { data: number }) => {
              if (disposed) return;
              setPlaying(e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.BUFFERING);
            },
            onError: (e: { data: number }) => {
              if (disposed) return;
              setError(ERROR_TEXT[e.data] ?? "This video can't be played right now.");
            },
          },
        });
      })
      .catch(() => {
        if (!disposed) setError("Couldn't load the YouTube player. Check the internet connection.");
      });
    return () => {
      disposed = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId, title]);

  // Poll progress while ready.
  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        setTime({ current: p.getCurrentTime() || 0, duration: p.getDuration() || 0 });
      } catch {
        /* player not ready */
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [ready]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p || !ready) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  }, [playing, ready]);

  const seek = (delta: number) => {
    const p = playerRef.current;
    if (!p || !ready) return;
    const t = Math.max(0, Math.min((p.getDuration() || 0) - 1, (p.getCurrentTime() || 0) + delta));
    p.seekTo(t, true);
    setTime((s) => ({ ...s, current: t }));
  };

  const changeVolume = (delta: number) => {
    const p = playerRef.current;
    if (!p) return;
    const v = Math.max(0, Math.min(100, volume + delta));
    p.setVolume(v);
    if (v > 0 && muted) {
      p.unMute();
      setMuted(false);
    }
    setVolume(v);
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) p.unMute();
    else p.mute();
    setMuted(!muted);
  };

  const fullscreenSupported = typeof document !== "undefined" && !!document.documentElement.requestFullscreen;
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void wrapRef.current?.requestFullscreen?.().catch(() => {});
  };

  useMediaKeys((a) => {
    if (a === "playPause") toggle();
    else if (a === "play" && !playing) toggle();
    else if (a === "pause" && playing) toggle();
  });
  useBackHandler(() => void document.exitFullscreen().catch(() => {}), fullscreen);

  const pct = time.duration ? (time.current / time.duration) * 100 : 0;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div ref={wrapRef} className="flex flex-col bg-black data-[fs=true]:h-screen" data-fs={fullscreen}>
      <div className="relative flex-1 overflow-hidden bg-black" style={fullscreen ? undefined : { aspectRatio: "16 / 9" }}>
        <div ref={hostRef} className="pointer-events-none absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" aria-hidden={!!error} />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center" role="status">
            <span className="h-14 w-14 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin-slow" aria-hidden />
            <span className="sr-only">Loading video</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[var(--surface)] p-12 text-center">
            <div className="font-display text-[2.25rem] font-bold">Video unavailable</div>
            <p className="max-w-[44rem] text-[1.5rem] text-[var(--text-secondary)]">{error}</p>
            <TVButton icon={ExternalLink} href={watchUrl} focusKey="video-open-yt" autoFocus>
              Open on YouTube
            </TVButton>
          </div>
        )}
      </div>

      {!error && (
        <div className="bg-[var(--surface)] px-6 py-4">
          <div className="flex items-center gap-4 text-[1.125rem] tabular-nums text-[var(--text-secondary)]">
            <span>{formatDuration(time.current * 1000)}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/12" aria-hidden>
              <div className="h-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
            </div>
            <span>{time.duration ? formatDuration(time.duration * 1000) : "--:--"}</span>
          </div>
          <FocusGroup id="video-controls" className="mt-4 flex items-center gap-3">
            <TVButton variant="primary" size="lg" icon={playing ? Pause : Play} onSelect={toggle} disabled={!ready} autoFocus focusKey="video-play">
              {playing ? "Pause" : "Play"}
            </TVButton>
            <TVButton size="lg" icon={Rewind} onSelect={() => seek(-10)} disabled={!ready} focusKey="video-back10">
              10 s
            </TVButton>
            <TVButton size="lg" icon={FastForward} onSelect={() => seek(10)} disabled={!ready} focusKey="video-fwd10">
              10 s
            </TVButton>
            <div className="mx-2 h-10 w-px bg-[var(--border)]" />
            <TVButton size="lg" iconOnly icon={Volume1} ariaLabel="Volume down" onSelect={() => changeVolume(-10)} disabled={!ready} focusKey="video-vol-down" />
            <span className="w-16 text-center text-[1.25rem] tabular-nums" aria-live="polite">
              {muted ? "Muted" : volume}
            </span>
            <TVButton size="lg" iconOnly icon={Volume2} ariaLabel="Volume up" onSelect={() => changeVolume(10)} disabled={!ready} focusKey="video-vol-up" />
            <TVButton size="lg" iconOnly icon={muted ? Volume2 : VolumeX} ariaLabel={muted ? "Unmute" : "Mute"} onSelect={toggleMute} disabled={!ready} focusKey="video-mute" />
            <div className="flex-1" />
            {fullscreenSupported && (
              <TVButton size="lg" icon={Maximize} onSelect={toggleFullscreen} focusKey="video-fs">
                {fullscreen ? "Exit full screen" : "Full screen"}
              </TVButton>
            )}
          </FocusGroup>
        </div>
      )}
    </div>
  );
}

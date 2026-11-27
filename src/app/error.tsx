"use client";

import { useEffect } from "react";
import { Page } from "@/components/layout/Page";
import { TVButton } from "@/components/tv/TVButton";

/** Route-level error boundary: the sidebar and timers keep working. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Page className="flex min-h-[80vh] flex-col items-start justify-center">
      <div className="text-[1.375rem] font-semibold uppercase tracking-[0.14em] text-[var(--danger)]">Something went wrong</div>
      <h1 className="mt-3 font-display text-[3.5rem] font-extrabold">This screen couldn&apos;t load.</h1>
      <p className="mt-3 max-w-[60rem] text-[1.5rem] text-[var(--text-secondary)]">
        Your timers, favorites and cooking progress are safe. Try again, or go back to Home.
      </p>
      <div className="mt-8 flex gap-4">
        <TVButton variant="primary" size="lg" onSelect={reset} autoFocus focusKey="err-retry">
          Try again
        </TVButton>
        <TVButton size="lg" href="/" focusKey="err-home">
          Home
        </TVButton>
      </div>
    </Page>
  );
}

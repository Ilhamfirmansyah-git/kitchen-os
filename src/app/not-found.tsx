import { Page } from "@/components/layout/Page";
import { TVButton } from "@/components/tv/TVButton";

export default function NotFound() {
  return (
    <Page className="flex min-h-[80vh] flex-col items-start justify-center">
      <div className="text-[1.375rem] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">Not found</div>
      <h1 className="mt-3 font-display text-[3.5rem] font-extrabold">This page isn&apos;t on the menu.</h1>
      <p className="mt-3 text-[1.5rem] text-[var(--text-secondary)]">The recipe or video may have been moved.</p>
      <div className="mt-8">
        <TVButton variant="primary" size="lg" href="/" autoFocus focusKey="nf-home">
          Go Home
        </TVButton>
      </div>
    </Page>
  );
}

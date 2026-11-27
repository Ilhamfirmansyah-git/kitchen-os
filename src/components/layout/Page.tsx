import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Standard screen frame: TV-safe padding and consistent vertical rhythm. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-14 pb-20 pt-12", className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-10 flex items-end justify-between gap-8">
      <div className="min-w-0">
        <h1 className="font-display text-[3.5rem] font-extrabold leading-[1.05] tracking-tight">{title}</h1>
        {subtitle && <p className="mt-3 text-[1.5rem] text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-4">{actions}</div>}
    </header>
  );
}

export function Section({ title, children, className, aside }: { title: string; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <section className={cn(className?.includes("mt-") ? undefined : "mt-14", className)}>
      <div className="mb-6 flex items-baseline justify-between gap-6">
        <h2 className="font-display text-[2.125rem] font-bold tracking-tight">{title}</h2>
        {aside && <div className="text-[1.25rem] text-[var(--text-secondary)]">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-[var(--border)] px-10 py-16 text-center">
      <div className="mb-5 text-[var(--text-secondary)]">{icon}</div>
      <div className="font-display text-[2rem] font-bold">{title}</div>
      {body && <p className="mt-3 max-w-[48rem] text-[1.375rem] text-[var(--text-secondary)]">{body}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

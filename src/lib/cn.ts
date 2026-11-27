export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function uid(prefix = "id"): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rnd}`;
}

/** Current epoch ms, for use inside event handlers (keeps render functions pure). */
export const timestamp = (): number => Date.now();

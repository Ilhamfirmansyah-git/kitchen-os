/**
 * Normalises key events from Android TV remotes, TV browsers and keyboards.
 * Different TV browsers report D-pad keys differently, so we check `key`,
 * `code` and the legacy `keyCode`.
 */

export type RemoteAction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "select"
  | "back"
  | "playPause"
  | "play"
  | "pause"
  | "tab"
  | "tabBack";

const KEY_MAP: Record<string, RemoteAction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Up: "up",
  Down: "down",
  Left: "left",
  Right: "right",
  Enter: "select",
  NumpadEnter: "select",
  Accept: "select",
  Escape: "back",
  Esc: "back",
  GoBack: "back",
  BrowserBack: "back",
  Backspace: "back",
  MediaPlayPause: "playPause",
  MediaPlay: "play",
  MediaPause: "pause",
};

const KEYCODE_MAP: Record<number, RemoteAction> = {
  37: "left",
  38: "up",
  39: "right",
  40: "down",
  19: "up", // Android KEYCODE_DPAD_UP (some WebViews)
  20: "down",
  21: "left",
  22: "right",
  13: "select",
  23: "select", // KEYCODE_DPAD_CENTER
  66: "select",
  27: "back",
  4: "back", // KEYCODE_BACK
  461: "back", // webOS
  10009: "back", // Tizen
  8: "back",
  179: "playPause",
  85: "playPause", // KEYCODE_MEDIA_PLAY_PAUSE
  415: "play",
  126: "play", // KEYCODE_MEDIA_PLAY
  127: "pause", // KEYCODE_MEDIA_PAUSE
};

export function toRemoteAction(e: KeyboardEvent): RemoteAction | null {
  if (e.key === "Tab") return e.shiftKey ? "tabBack" : "tab";
  if (e.code === "NumpadEnter") return "select";
  const byKey = KEY_MAP[e.key];
  if (byKey) return byKey;
  if (e.key === " " || e.key === "Spacebar") return null; // handled natively / per screen
  const byCode = KEYCODE_MAP[e.keyCode];
  return byCode ?? null;
}

export function isEditable(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) {
    const t = el.type;
    return !["button", "submit", "checkbox", "radio", "range", "reset", "color", "file"].includes(t);
  }
  return (el as HTMLElement).isContentEditable === true;
}

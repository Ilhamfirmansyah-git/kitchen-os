/**
 * Synthesised alarm and UI sounds via the Web Audio API (no audio files, works
 * offline). Browsers only allow audio after a user gesture; the first remote
 * key press unlocks the AudioContext.
 */

type Ctx = AudioContext;
let ctx: Ctx | null = null;
let alarmTimer: number | null = null;

function getCtx(): Ctx | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  return ctx;
}

export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume().catch(() => {});
}

function beep(freq: number, start: number, duration: number, volume: number) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const t0 = c.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Repeating three-tone chime until stopAlarm() is called. */
export function startAlarm(volume: number) {
  if (alarmTimer != null) return;
  unlockAudio();
  const v = Math.min(1, Math.max(0, volume)) * 0.5;
  const pattern = () => {
    beep(880, 0, 0.18, v);
    beep(1175, 0.22, 0.18, v);
    beep(1568, 0.44, 0.32, v);
  };
  pattern();
  alarmTimer = window.setInterval(pattern, 1400);
}

export function stopAlarm() {
  if (alarmTimer != null) {
    window.clearInterval(alarmTimer);
    alarmTimer = null;
  }
}

export function isAlarmPlaying() {
  return alarmTimer != null;
}

/** Short, quiet confirmation tick for UI actions. */
export function playClick(volume: number) {
  beep(660, 0, 0.06, Math.min(1, Math.max(0, volume)) * 0.12);
}

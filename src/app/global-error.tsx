"use client";

/** Last-resort boundary when the root layout itself fails. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#171A18", color: "#F5F5F0", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", height: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 48 }}>Kitchen OS needs a restart</h1>
          <button autoFocus onClick={reset} style={{ fontSize: 28, padding: "16px 32px", borderRadius: 14, border: 0, background: "#A6C6A0", color: "#16201a" }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}

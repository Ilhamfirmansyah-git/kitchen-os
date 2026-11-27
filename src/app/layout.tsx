import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./globals.css";
import { TVNavigationProvider } from "@/components/tv/TVNavigationProvider";
import { TimerProvider } from "@/contexts/TimerContext";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Kitchen OS",
  description: "Your Personal Smart Kitchen Assistant — built for Android TV and a D-pad remote.",
  applicationName: "Kitchen OS",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171A18",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <TVNavigationProvider>
          <TimerProvider>
            <AppShell>{children}</AppShell>
          </TimerProvider>
        </TVNavigationProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Kitchen OS — Your kitchen companion",
  description: "A calm, TV-first cooking companion for your kitchen.",
  applicationName: "Kitchen OS",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Kitchen OS" }
};
export const viewport: Viewport = { themeColor: "#171A18", width: "device-width", initialScale: 1, maximumScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
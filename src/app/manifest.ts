import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kitchen OS",
    short_name: "Kitchen OS",
    description: "Your Personal Smart Kitchen Assistant.",
    start_url: "/",
    display: "fullscreen",
    orientation: "landscape",
    background_color: "#171A18",
    theme_color: "#171A18",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

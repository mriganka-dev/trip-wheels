import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trip Wheels",
    short_name: "Trip Wheels",
    description:
      "Verified bike and car rentals directly from local owners in Northeast India.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F2E8",
    theme_color: "#1F5C4D",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}


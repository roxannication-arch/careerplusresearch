import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CareerPlus Research Generator",
    short_name: "CareerPlus",
    description: "Premium research generator for consultant-grade career market reports.",
    start_url: "/",
    display: "standalone",
    background_color: "#080c1b",
    theme_color: "#131f3a",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

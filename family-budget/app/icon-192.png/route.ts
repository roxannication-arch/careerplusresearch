import { ImageResponse } from "next/og";

import { createPwaIconElement } from "@/lib/pwa-icon";

export async function GET() {
  return new ImageResponse(createPwaIconElement(192), {
    width: 192,
    height: 192,
  });
}

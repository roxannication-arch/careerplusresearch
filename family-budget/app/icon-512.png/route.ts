import { ImageResponse } from "next/og";

import { createPwaIconElement } from "@/lib/pwa-icon";

export async function GET() {
  return new ImageResponse(createPwaIconElement(512), {
    width: 512,
    height: 512,
  });
}

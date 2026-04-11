import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 24% 18%, #3f4cb8 0%, rgba(63,76,184,0.2) 30%, transparent 42%), linear-gradient(145deg, #0a0e1f 0%, #14213f 45%, #342b7a 100%)",
        }}
      >
        <div
          style={{
            width: "82%",
            height: "82%",
            borderRadius: "30%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "4px solid #efd79a",
            boxShadow:
              "0 0 0 3px rgba(255,255,255,0.08), inset 0 0 24px rgba(239,215,154,0.22), 0 10px 24px rgba(7,10,25,0.55)",
            background:
              "radial-gradient(circle at 30% 24%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 30%), linear-gradient(160deg, #0f172a 0%, #1e293b 55%, #312e81 100%)",
            color: "#f8e8b9",
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textShadow: "0 4px 10px rgba(0,0,0,0.45)",
          }}
        >
          CP
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
            "radial-gradient(circle at 24% 18%, #3949ab 0%, rgba(57,73,171,0.2) 30%, transparent 42%), linear-gradient(145deg, #080c1b 0%, #131f3a 45%, #2a2468 100%)",
        }}
      >
        <div
          style={{
            width: "84%",
            height: "84%",
            borderRadius: "30%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            border: "10px solid #efd79a",
            boxShadow:
              "0 0 0 6px rgba(255,255,255,0.08), inset 0 0 80px rgba(239,215,154,0.22), 0 22px 60px rgba(7,10,25,0.55)",
            background:
              "radial-gradient(circle at 30% 24%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 30%), linear-gradient(160deg, #0f172a 0%, #1e293b 55%, #312e81 100%)",
          }}
        >
          <div
            style={{
              fontSize: 198,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#f8e8b9",
              lineHeight: 1,
              textShadow: "0 8px 20px rgba(0,0,0,0.45)",
            }}
          >
            CP
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 38,
              fontWeight: 600,
              letterSpacing: "0.24em",
              color: "#dbe6ff",
              opacity: 0.92,
            }}
          >
            RESEARCH
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

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
          background: "linear-gradient(160deg, #04060f 0%, #090f20 48%, #110b26 100%)",
        }}
      >
        <div
          style={{
            width: "86%",
            height: "86%",
            borderRadius: "32%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            boxShadow:
              "inset 0 0 0 2px rgba(255,255,255,0.12), inset 0 0 32px rgba(255,255,255,0.06), 0 18px 30px rgba(0,0,0,0.55)",
            background: "linear-gradient(150deg, #171c34 0%, #0f1326 45%, #1a1138 100%)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "112%",
              height: "112%",
              borderRadius: "34%",
              background:
                "radial-gradient(circle at 20% 16%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 35%), radial-gradient(circle at 78% 86%, rgba(99,102,241,0.38) 0%, rgba(99,102,241,0) 45%)",
            }}
          />
          <div
            style={{
              width: "58%",
              height: "58%",
              borderRadius: "24%",
              background:
                "linear-gradient(145deg, #f8d782 0%, #f4bb48 44%, #a86d10 100%)",
              transform: "rotate(45deg)",
              boxShadow:
                "0 10px 20px rgba(0,0,0,0.38), inset 0 0 0 1px rgba(255,255,255,0.34), inset 10px -12px 18px rgba(120,72,0,0.26)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "30%",
              height: "30%",
              borderRadius: "38%",
              background: "rgba(255,255,255,0.3)",
              filter: "blur(6px)",
              top: "20%",
              left: "24%",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

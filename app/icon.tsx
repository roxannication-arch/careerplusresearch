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
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 20% 12%, rgba(56, 189, 248, 0.28) 0%, rgba(56, 189, 248, 0) 34%), radial-gradient(circle at 88% 8%, rgba(244, 114, 182, 0.3) 0%, rgba(244, 114, 182, 0) 36%), linear-gradient(150deg, #080d1f 0%, #101a37 44%, #1c1f55 100%)",
        }}
      >
        <div
          style={{
            width: "84%",
            height: "84%",
            borderRadius: "30%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "10px solid #f5d084",
            boxShadow:
              "0 0 0 6px rgba(255,255,255,0.08), inset 0 0 84px rgba(245, 208, 132, 0.2), 0 26px 62px rgba(3, 7, 20, 0.62)",
            background:
              "radial-gradient(circle at 28% 22%, rgba(255, 255, 255, 0.23) 0%, rgba(255, 255, 255, 0) 33%), linear-gradient(160deg, #0b132a 0%, #111e3d 52%, #222f6c 100%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 320,
              height: 320,
              borderRadius: "50%",
              border: "7px solid rgba(255, 221, 150, 0.7)",
              borderLeftColor: "rgba(255, 221, 150, 0.12)",
              borderBottomColor: "rgba(255, 221, 150, 0.12)",
              transform: "rotate(-18deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 258,
              height: 258,
              borderRadius: "50%",
              border: "6px solid rgba(129, 212, 250, 0.52)",
              borderRightColor: "rgba(129, 212, 250, 0.08)",
              borderTopColor: "rgba(129, 212, 250, 0.08)",
              transform: "rotate(24deg)",
            }}
          />
          <div
            style={{
              width: 176,
              height: 176,
              borderRadius: "28%",
              transform: "rotate(45deg)",
              border: "4px solid rgba(255, 227, 160, 0.9)",
              background:
                "linear-gradient(150deg, rgba(255, 241, 198, 0.96) 0%, rgba(250, 204, 120, 0.96) 34%, rgba(129, 212, 250, 0.86) 68%, rgba(196, 181, 253, 0.88) 100%)",
              boxShadow:
                "0 20px 40px rgba(3, 8, 24, 0.46), inset 0 0 28px rgba(255, 255, 255, 0.36)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 62,
              height: 62,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(186,230,253,0.88) 58%, rgba(186,230,253,0) 100%)",
              top: 124,
              left: 130,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.92)",
              top: 104,
              right: 130,
              boxShadow: "0 0 14px rgba(255, 255, 255, 0.84)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.84)",
              bottom: 126,
              left: 150,
              boxShadow: "0 0 10px rgba(255, 255, 255, 0.74)",
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

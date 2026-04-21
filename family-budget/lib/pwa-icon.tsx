import { CSSProperties, ReactElement } from "react";

export function createPwaIconElement(size: number): ReactElement {
  const outerShadow = Math.max(6, Math.round(size * 0.035));
  const fontSize = Math.round(size * 0.46);
  const coinSize = Math.round(size * 0.74);

  const wrapperStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(145deg, rgb(248, 250, 252) 0%, rgb(226, 232, 240) 100%)",
    borderRadius: "22%",
  };

  const coinStyle: CSSProperties = {
    width: coinSize,
    height: coinSize,
    borderRadius: "9999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(160deg, rgb(20, 184, 166) 0%, rgb(37, 99, 235) 100%)",
    color: "rgb(255, 255, 255)",
    fontSize,
    fontWeight: 700,
    fontFamily: "Manrope, Arial, sans-serif",
    boxShadow: `0 ${outerShadow}px ${Math.round(size * 0.08)}px rgba(30, 41, 59, 0.2)`,
  };

  return (
    <div style={wrapperStyle}>
      <div style={coinStyle}>$</div>
    </div>
  );
}

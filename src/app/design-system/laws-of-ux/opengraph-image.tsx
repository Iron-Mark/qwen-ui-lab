import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = "qwen-ui-lab Laws of UX route preview";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, rgb(17, 24, 39) 0%, rgb(67, 56, 202) 45%, rgb(6, 182, 212) 100%)",
          color: "white",
          padding: "56px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.95 }}>qwen-ui-lab / laws-of-ux</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.06 }}>
            Apply UX laws with less guesswork
          </div>
          <div style={{ fontSize: 28, opacity: 0.9 }}>
            Browse principles, inspect patterns, copy implementation snippets
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.9 }}>
          {"Open collection -> Compare patterns -> Export code"}
        </div>
      </div>
    ),
    size,
  );
}

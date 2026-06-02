import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = "qwen-ui-lab UILaws route preview";

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
            "linear-gradient(135deg, rgb(24, 24, 27) 0%, rgb(190, 24, 93) 45%, rgb(249, 115, 22) 100%)",
          color: "white",
          padding: "56px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.95 }}>qwen-ui-lab / uilaws</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.06 }}>
            Build clearer interfaces faster
          </div>
          <div style={{ fontSize: 28, opacity: 0.9 }}>
            Explore UILaws-driven components with copy and export in one flow
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.9 }}>
          {"Filter UILaws -> Preview UI -> Ship ready snippets"}
        </div>
      </div>
    ),
    size,
  );
}

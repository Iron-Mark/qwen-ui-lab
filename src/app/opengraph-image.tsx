import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = "qwen-ui-lab screenshot-to-component workflow";

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
            "linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(37, 99, 235) 45%, rgb(16, 185, 129) 100%)",
          color: "white",
          padding: "56px",
          fontFamily: "Inter, sans-serif",
        }}
      >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 28, opacity: 0.95 }}>qwen-ui-lab</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                padding: "10px 14px",
                borderRadius: "9999px",
                background: "rgba(255,255,255,0.15)",
              }}
            >
              Growth lane
            </div>
          </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05 }}>
              Ship UI concepts in minutes
            </div>
            <div style={{ fontSize: 28, opacity: 0.9 }}>
              Turn screenshots into React + Tailwind starters with AI
            </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.9 }}>
            {"Upload -> Analyze -> Scaffold -> Export"}
        </div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = "qwen-ui-lab design system snippets and UX laws";

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
            "linear-gradient(135deg, rgb(24, 24, 27) 0%, rgb(76, 29, 149) 50%, rgb(14, 165, 233) 100%)",
          color: "white",
          padding: "56px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 28, opacity: 0.95 }}>qwen-ui-lab / design-system</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              padding: "10px 14px",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.15)",
            }}
          >
            Reusable snippets
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.06 }}>
            Design faster with proven patterns
          </div>
          <div style={{ fontSize: 28, opacity: 0.9 }}>
            Atomic catalog + UX references + export-ready code
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.9 }}>
          {"Filter -> Preview -> Copy -> Ship consistent UI"}
        </div>
      </div>
    ),
    size,
  );
}

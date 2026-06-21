type SocialPreviewImageProps = {
  eyebrow: string;
  badge?: string;
  title: string;
  description: string;
  workflow: string;
  background: string;
};

export const socialPreviewImageSize = {
  width: 1200,
  height: 630,
};

export const socialPreviewImageContentType = "image/png";

export function SocialPreviewImage({
  eyebrow,
  badge,
  title,
  description,
  workflow,
  background,
}: SocialPreviewImageProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background,
        color: "white",
        padding: "56px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 28, opacity: 0.95 }}>{eyebrow}</div>
        {badge ? (
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              padding: "10px 14px",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.15)",
            }}
          >
            {badge}
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.06 }}>{title}</div>
        <div style={{ fontSize: 28, opacity: 0.9 }}>{description}</div>
      </div>
      <div style={{ fontSize: 24, opacity: 0.9 }}>{workflow}</div>
    </div>
  );
}

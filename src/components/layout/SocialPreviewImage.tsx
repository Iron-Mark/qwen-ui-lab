type SocialPreviewImageProps = {
  eyebrow: string;
  badge?: string;
  title: string;
  description: string;
  workflow: string;
  background: string;
  accent?: string;
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
  accent = "#8b5cf6",
}: SocialPreviewImageProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        justifyContent: "space-between",
        background,
        color: "white",
        padding: "56px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(circle at 76% 30%, rgba(196,181,253,0.24), transparent 30%), radial-gradient(circle at 24% 82%, rgba(34,211,238,0.16), transparent 24%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 94,
          display: "flex",
          width: 330,
          height: 330,
          transform: "rotate(-8deg)",
          borderRadius: 52,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.16)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 124,
          top: 142,
          display: "flex",
          width: 238,
          height: 238,
          alignItems: "center",
          justifyContent: "center",
          transform: "rotate(30deg)",
          background: "linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 48%, #5b21b6 100%)",
          clipPath: "polygon(50% 4%, 91% 27%, 91% 73%, 50% 96%, 9% 73%, 9% 27%)",
          filter: "drop-shadow(0 24px 36px rgba(0,0,0,0.42))",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 154,
            height: 154,
            alignItems: "center",
            justifyContent: "center",
            transform: "rotate(-30deg)",
            color: "#ede9fe",
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: -2,
            background: "linear-gradient(135deg, #171333 0%, #050315 100%)",
            clipPath: "polygon(50% 7%, 88% 29%, 88% 71%, 50% 93%, 12% 71%, 12% 29%)",
            border: "1px solid rgba(255,255,255,0.24)",
          }}
        >
          QUI
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 66,
          bottom: 72,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: 365,
          padding: 22,
          borderRadius: 26,
          background: "rgba(15,23,42,0.54)",
          border: "1px solid rgba(255,255,255,0.16)",
        }}
      >
        {["Upload screenshot", "Map UI regions", "Export starter package"].map(
          (item, index) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 21,
                color: "rgba(255,255,255,0.86)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  background: index === 1 ? accent : "rgba(255,255,255,0.12)",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                {index + 1}
              </div>
              {item}
            </div>
          ),
        )}
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              width: 42,
              height: 42,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              background: "linear-gradient(135deg, #c4b5fd 0%, #7c3aed 100%)",
              color: "#f5f3ff",
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            Q
          </div>
          <div style={{ fontSize: 28, opacity: 0.95 }}>{eyebrow}</div>
        </div>
        {badge ? (
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              padding: "10px 14px",
              borderRadius: "9999px",
              color: "#f5f3ff",
              background: "rgba(139,92,246,0.28)",
              border: "1px solid rgba(196,181,253,0.44)",
            }}
          >
            {badge}
          </div>
        ) : null}
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          width: 700,
        }}
      >
        <div style={{ fontSize: 66, fontWeight: 850, lineHeight: 1.02 }}>{title}</div>
        <div style={{ fontSize: 28, lineHeight: 1.3, opacity: 0.9 }}>{description}</div>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "fit-content",
          maxWidth: 650,
          fontSize: 23,
          opacity: 0.92,
          padding: "14px 18px",
          borderRadius: 18,
          background: "rgba(255,255,255,0.09)",
          border: "1px solid rgba(255,255,255,0.14)",
        }}
      >
        {workflow}
      </div>
    </div>
  );
}

import {
  SocialPreviewImage,
  socialPreviewImageSize,
} from "@/components/layout/SocialPreviewImage";

type DesignSystemRoutePreviewImageProps = {
  routeLabel: string;
  title: string;
  description: string;
  workflow: string;
  background: string;
  accent?: string;
};

export const designSystemRoutePreviewImageSize = socialPreviewImageSize;

export function DesignSystemRoutePreviewImage({
  routeLabel,
  title,
  description,
  workflow,
  background,
  accent,
}: DesignSystemRoutePreviewImageProps) {
  return (
    <SocialPreviewImage
      eyebrow={`qwen-ui-lab / ${routeLabel}`}
      title={title}
      description={description}
      workflow={workflow}
      background={background}
      accent={accent}
    />
  );
}

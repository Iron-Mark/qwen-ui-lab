import { ImageResponse } from "next/og";
import {
  SocialPreviewImage,
  socialPreviewImageContentType,
  socialPreviewImageSize,
} from "@/components/layout/SocialPreviewImage";
import {
  designSystemRouteSocialPreviewImageAlt,
  getDesignSystemRouteSocialPreviewImage,
} from "@/features/design-system/lib/design-system-route";

export const size = socialPreviewImageSize;

export const contentType = socialPreviewImageContentType;
export const alt = designSystemRouteSocialPreviewImageAlt;

export default function OpenGraphImage() {
  const previewImage = getDesignSystemRouteSocialPreviewImage();

  return new ImageResponse(
    <SocialPreviewImage {...previewImage} />,
    size,
  );
}

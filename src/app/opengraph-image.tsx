import { ImageResponse } from "next/og";
import {
  SocialPreviewImage,
  socialPreviewImageContentType,
  socialPreviewImageSize,
} from "@/components/layout/SocialPreviewImage";
import {
  getHomeRouteSocialPreviewImage,
  homeRouteSocialPreviewImageAlt,
} from "@/features/home/lib/home-route";

export const size = socialPreviewImageSize;

export const contentType = socialPreviewImageContentType;
export const alt = homeRouteSocialPreviewImageAlt;

export default function OpenGraphImage() {
  const previewImage = getHomeRouteSocialPreviewImage();

  return new ImageResponse(
    <SocialPreviewImage {...previewImage} />,
    size,
  );
}

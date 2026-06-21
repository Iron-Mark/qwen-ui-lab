import { ImageResponse } from "next/og";
import { socialPreviewImageContentType } from "@/components/layout/SocialPreviewImage";
import {
  DesignSystemRoutePreviewImage,
  designSystemRoutePreviewImageSize,
} from "@/features/design-system/components/DesignSystemRoutePreviewImage";
import {
  getDesignSystemDomainRouteSocialPreviewImage,
  getDesignSystemDomainRouteSocialPreviewImageAlt,
} from "@/features/design-system/lib/design-system-route";

export const size = designSystemRoutePreviewImageSize;

export const contentType = socialPreviewImageContentType;
export const alt = getDesignSystemDomainRouteSocialPreviewImageAlt("uilaws");

export default function OpenGraphImage() {
  const previewImage = getDesignSystemDomainRouteSocialPreviewImage("uilaws");

  return new ImageResponse(
    <DesignSystemRoutePreviewImage {...previewImage} />,
    size,
  );
}

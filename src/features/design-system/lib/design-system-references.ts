import { LAWS_OF_UX_SITE } from "@/lib/laws-of-ux";
import type { CatalogDomain } from "../data/catalog-types";
import { UILAWS_SITE } from "../data/uilaws";

export const EXTERNAL_REF_LINK_CLASS =
  "cursor-pointer text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export type CatalogReference = {
  href?: string;
  label: string;
};

export function sourceLabelFromUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}

export function getCatalogReferences(
  domainFilter: CatalogDomain | "all",
  productCatalogLabel: string,
): CatalogReference[] {
  const productCatalog = { label: productCatalogLabel };
  const uiLaws = {
    href: UILAWS_SITE,
    label: sourceLabelFromUrl(UILAWS_SITE),
  };
  const lawsOfUx = {
    href: LAWS_OF_UX_SITE,
    label: sourceLabelFromUrl(LAWS_OF_UX_SITE),
  };

  if (domainFilter === "product") return [productCatalog];
  if (domainFilter === "uilaws") return [uiLaws];
  if (domainFilter === "laws-of-ux") return [lawsOfUx];
  return [productCatalog, uiLaws, lawsOfUx];
}

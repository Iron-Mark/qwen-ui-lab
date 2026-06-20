import type { ReactNode } from "react";
import type { LawOfUxId } from "./lawsOfUx";
import type { UiLawId } from "./uilaws";

export type AtomicLevel = "atom" | "molecule" | "organism";

export type CatalogDomain = "product" | "uilaws" | "laws-of-ux";

export interface CatalogPropDoc {
  name: string;
  type: string;
  description: string;
}

export interface CatalogVariant {
  id: string;
  label: string;
  preview: ReactNode;
  code?: string;
}

export interface AtomicCatalogEntry {
  id: string;
  level: AtomicLevel;
  domain: CatalogDomain;
  name: string;
  description: string;
  usage: string;
  sourcePath: string;
  props?: CatalogPropDoc[];
  variants?: CatalogVariant[];
  preview: ReactNode;
  code: string;
  exportFilename?: string;
  principles?: UiLawId[];
  lawId?: LawOfUxId;
}

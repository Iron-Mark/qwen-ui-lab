import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function UILawsRedirectPage() {
  redirect("/design-system?domain=uilaws");
}

import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function LawsOfUxRedirectPage() {
  redirect("/design-system?domain=laws-of-ux");
}

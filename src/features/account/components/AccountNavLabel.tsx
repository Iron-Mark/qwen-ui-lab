"use client";

import { useAccountIdentity } from "./useAccountIdentity";

interface AccountNavLabelProps {
  guestLabel: string;
  className?: string;
}

export function AccountNavLabel({ guestLabel, className }: AccountNavLabelProps) {
  const { savedByLabel, signedIn } = useAccountIdentity();

  return (
    <span className={className}>
      {signedIn ? savedByLabel : guestLabel}
    </span>
  );
}

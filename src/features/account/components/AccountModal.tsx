"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { AccountProfilePanel } from "./AccountProfilePanel";

const ACCOUNT_MODAL_PARAM = "account";
const ACCOUNT_MODAL_VALUE = "1";

function buildAccountModalHref(
  pathname: string | null,
  searchParams: URLSearchParams,
  open: boolean,
) {
  const params = new URLSearchParams(searchParams);

  if (open) {
    params.set(ACCOUNT_MODAL_PARAM, ACCOUNT_MODAL_VALUE);
  } else {
    params.delete(ACCOUNT_MODAL_PARAM);
  }

  const query = params.toString();
  return `${pathname || "/"}${query ? `?${query}` : ""}`;
}

export function AccountModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialFocusRef = useRef<HTMLDivElement>(null);
  const open = searchParams.get(ACCOUNT_MODAL_PARAM) === ACCOUNT_MODAL_VALUE;

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen === open) return;
    router.replace(
      buildAccountModalHref(
        pathname,
        new URLSearchParams(searchParams.toString()),
        nextOpen,
      ),
      { scroll: false },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-testid="account-modal"
        initialFocus={initialFocusRef}
        className="account-modal-surface flex max-h-[min(92dvh,54rem)] w-[min(calc(100vw-1rem),48rem)] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 shadow-2xl sm:max-h-[min(88dvh,52rem)] sm:max-w-3xl"
      >
        <div
          ref={initialFocusRef}
          tabIndex={-1}
          className="account-modal-surface themed-scrollbar min-h-0 overflow-y-auto px-4 py-6 outline-none sm:px-6 sm:py-7"
        >
          <AccountProfilePanel className="mx-0 max-w-none space-y-5 sm:space-y-6" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ACCOUNT_MODAL_PARAM, ACCOUNT_MODAL_VALUE, buildAccountModalHref };

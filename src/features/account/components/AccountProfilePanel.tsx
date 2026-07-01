"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "./AuthProvider";
import { interpolate } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/providers/Toast";
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  LogOut,
  Mail,
  Monitor,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type AccountProfilePanelProps = {
  className?: string;
};

export function AccountProfilePanel({ className }: AccountProfilePanelProps) {
  const { dict } = useLocale();
  const t = dict.account;
  const { auth, guestLabel, savedByLabel, signedIn, setDisplayName, sendMagicLinkStub, confirmMagicLink, signOut } =
    useAuth();
  const { toast } = useToast();
  const [displayNameInput, setDisplayNameInput] = useState(
    () => auth.displayName ?? "",
  );
  const [emailInput, setEmailInput] = useState(() => auth.email ?? "");
  const [emailError, setEmailError] = useState("");

  function handleSaveDisplayName() {
    const next = setDisplayName(displayNameInput);
    if (next.mode === "named" && next.displayName) {
      toast(interpolate(t.toastDisplayNameSaved, { name: next.displayName }), "success");
    } else {
      toast(t.toastSignedOut, "default");
    }
  }

  function handleMagicLinkRequest(event: React.FormEvent) {
    event.preventDefault();
    const result = sendMagicLinkStub(emailInput);
    if (!result.ok) {
      setEmailError(t.errorInvalidEmail);
      toast(t.errorInvalidEmail, "error");
      return;
    }
    setEmailError("");
    toast(t.toastMagicLinkStub, "default");
  }

  function handleConfirmMagicLink() {
    const next = confirmMagicLink();
    if (next.mode === "named" && next.displayName) {
      setDisplayNameInput(next.displayName);
      toast(interpolate(t.toastMagicLinkConfirmed, { name: next.displayName }), "success");
    }
  }

  function handleSignOut() {
    signOut();
    setDisplayNameInput("");
    setEmailInput("");
    setEmailError("");
    toast(t.toastSignedOut, "default");
  }

  const pendingMagicLink = auth.mode === "magic-link-pending";
  const visibleName = savedByLabel || guestLabel;
  const modeLabel = signedIn ? t.modeNamed : t.modeGuest;
  const showSavedName = signedIn && visibleName !== modeLabel;
  const profileInitials =
    visibleName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "G";

  return (
    <div className={cn("mx-auto max-w-2xl space-y-4", className)}>
      <header className="flex items-start gap-4 border-b border-border/70 pb-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UserRound className="size-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <DialogTitle className="font-display text-3xl font-semibold tracking-tight text-foreground">
            {t.title}
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {t.subtitle}
          </DialogDescription>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4" data-testid="account-profile-preview">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-sm">
              {profileInitials}
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-lg font-semibold text-foreground"
                data-testid={showSavedName ? "account-saved-by-label" : undefined}
              >
                {visibleName}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t.profilePreviewDesc}
              </p>
            </div>
          </div>

          <div
            className="inline-flex min-h-8 w-fit max-w-full items-center gap-2 rounded-full border border-border/70 bg-background px-2.5 text-xs font-medium text-muted-foreground"
            data-testid="account-status-card"
          >
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            <span data-testid="account-mode-badge">{modeLabel}</span>
          </div>
        </div>

        <form
          className="space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveDisplayName();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="account-display-name">{t.displayNameLabel}</Label>
            <Input
              id="account-display-name"
              data-testid="account-display-name-input"
              value={displayNameInput}
              onChange={(event) => setDisplayNameInput(event.target.value)}
              placeholder={t.displayNamePlaceholder}
              maxLength={64}
              autoComplete="nickname"
              className="min-h-12 rounded-xl px-3 text-base sm:text-sm"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              {t.displayNameDesc}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              data-testid="account-save-display-name"
              className="min-h-11 px-4"
            >
              {t.saveDisplayName}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            {signedIn ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleSignOut}
                className="min-h-11 px-4"
              >
                <LogOut className="size-4" aria-hidden="true" />
                {t.signOut}
              </Button>
            ) : null}
          </div>
        </form>

        <div className="grid gap-3 border-t border-border/70 bg-muted/20 p-5 text-sm sm:grid-cols-2">
          <div className="flex gap-3">
            <Monitor className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">{t.storedInTitle}</p>
              <p className="mt-1 text-muted-foreground">{t.storedInBody}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">{t.notAccountTitle}</p>
              <p className="mt-1 text-muted-foreground">{t.notAccountBody}</p>
            </div>
          </div>
        </div>
      </section>

      <details
        className="group rounded-2xl border border-border/70 bg-card shadow-sm"
        open={pendingMagicLink || undefined}
      >
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 outline-none transition hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">
                {t.magicLinkTitle}
              </span>
              <span className="block text-sm leading-5 text-muted-foreground">
                {t.magicLinkDesc}
              </span>
            </span>
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground transition group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="border-t border-border/70 px-5 py-5">
          <form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" onSubmit={handleMagicLinkRequest}>
            <div className="space-y-2">
              <Label htmlFor="account-email">{t.emailLabel}</Label>
              <Input
                id="account-email"
                data-testid="account-email-input"
                type="email"
                value={emailInput}
                onChange={(event) => {
                  setEmailInput(event.target.value);
                  if (emailError) setEmailError("");
                }}
                placeholder={t.emailPlaceholder}
                autoComplete="email"
                aria-invalid={emailError ? "true" : undefined}
                aria-describedby={emailError ? "account-email-error" : undefined}
                className="min-h-12 rounded-xl px-3 text-base sm:text-sm"
              />
              {emailError ? (
                <p
                  id="account-email-error"
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {emailError}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              variant="outline"
              data-testid="account-magic-link-send"
              className="min-h-12 px-4"
            >
              {t.sendMagicLink}
            </Button>
          </form>
          {pendingMagicLink && auth.email ? (
            <div
              className="mt-4 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm"
              data-testid="account-magic-link-pending"
            >
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <Clock3 className="size-4 text-primary" aria-hidden="true" />
                {t.magicLinkPendingTitle}
              </p>
              <p className="mt-1 leading-5 text-muted-foreground">
                {interpolate(t.magicLinkPendingBody, { email: auth.email })}
              </p>
              <Button
                type="button"
                className="mt-3 min-h-11 px-4"
                data-testid="account-magic-link-confirm"
                onClick={handleConfirmMagicLink}
              >
                {t.confirmMagicLink}
              </Button>
            </div>
          ) : null}
        </div>
      </details>
    </div>
  );
}

"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "./AuthProvider";
import { interpolate } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import { useToast } from "@/components/providers/Toast";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  CircleCheck,
  Clock3,
  HardDrive,
  Info,
  LogOut,
  Mail,
  Monitor,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

export function AccountPageClient() {
  const { dict } = useLocale();
  const t = dict.account;
  const { auth, guestLabel, savedByLabel, signedIn, setDisplayName, sendMagicLinkStub, confirmMagicLink, signOut } =
    useAuth();
  const { toast } = useToast();
  const [displayNameInput, setDisplayNameInput] = useState(
    () => auth.displayName ?? "",
  );
  const [emailInput, setEmailInput] = useState(() => auth.email ?? "");

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
      toast(t.errorInvalidEmail, "error");
      return;
    }
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
    toast(t.toastSignedOut, "default");
  }

  const pendingMagicLink = auth.mode === "magic-link-pending";
  const visibleName = savedByLabel || guestLabel;
  const profileInitials =
    visibleName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "G";

  return (
    <PageContainer className="py-8 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-6 border-b border-border/70 pb-7 sm:pb-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div className="min-w-0 space-y-3">
              <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground shadow-sm">
                <UserRound className="size-3.5 text-primary" aria-hidden="true" />
                {t.eyebrow}
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {t.title}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {t.subtitle}
                </p>
              </div>
            </div>

            <aside
              data-testid="account-status-card"
              className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CircleCheck className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {t.statusTitle}
                  </p>
                  <div className="mt-1 flex min-w-0 items-center gap-2">
                    <Badge
                      variant={signedIn ? "secondary" : "outline"}
                      data-testid="account-mode-badge"
                      className="min-h-6 px-2.5"
                    >
                      {signedIn ? t.modeNamed : t.modeGuest}
                    </Badge>
                    <span
                      className="min-w-0 truncate text-sm font-medium text-foreground"
                      data-testid="account-saved-by-label"
                    >
                      {visibleName}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-5 text-muted-foreground">
                {t.statusDesc}
              </p>
            </aside>
          </div>

          <div className="grid gap-3 sm:grid-cols-3" aria-label={t.localFactsTitle}>
            <div className="flex min-h-20 gap-3 rounded-2xl border border-border/70 bg-card/55 p-4">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {t.currentLabelTitle}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {interpolate(t.savedScaffoldsAs, { name: visibleName })}
                </p>
              </div>
            </div>
            <div className="flex min-h-20 gap-3 rounded-2xl border border-border/70 bg-card/55 p-4">
              <HardDrive className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {t.storedInTitle}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.storedInBody}
                </p>
              </div>
            </div>
            <div className="flex min-h-20 gap-3 rounded-2xl border border-border/70 bg-card/55 p-4">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {t.notAccountTitle}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.notAccountBody}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 p-5 sm:p-6">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t.eyebrow}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  {t.displayNameTitle}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {t.displayNameDesc}
                </p>
              </div>
            </div>

            <form
              className="space-y-4"
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
                <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {t.statusDesc}
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
          </div>

          <aside className="border-t border-border/70 bg-muted/20 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t.currentLabelTitle}
            </p>
            <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
                  {profileInitials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">
                    {visibleName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {signedIn ? t.modeNamed : t.modeGuest}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 text-xs text-muted-foreground">
                <Monitor className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                {t.storedInBody}
              </div>
            </div>
          </aside>
        </section>

        <details
          className="group rounded-2xl border border-border/70 bg-card/70 shadow-sm"
          open={pendingMagicLink || undefined}
        >
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 outline-none transition hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden sm:px-6">
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Mail className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {t.magicLinkTitle}
                  </span>
                  <Badge variant="outline">{signedIn ? t.modeNamed : t.modeGuest}</Badge>
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
          <div className="border-t border-border/70 px-5 py-5 sm:px-6">
            <form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" onSubmit={handleMagicLinkRequest}>
              <div className="space-y-2">
                <Label htmlFor="account-email">{t.emailLabel}</Label>
                <Input
                  id="account-email"
                  data-testid="account-email-input"
                  type="email"
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  placeholder={t.emailPlaceholder}
                  autoComplete="email"
                  className="min-h-12 rounded-xl px-3 text-base sm:text-sm"
                />
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
    </PageContainer>
  );
}

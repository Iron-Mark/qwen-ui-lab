"use client";

import Link from "next/link";
import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "./AuthProvider";
import { interpolate, localizedHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale.client";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/providers/Toast";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  Mail,
  Monitor,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export function AccountPageClient() {
  const { locale, dict } = useLocale();
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

  return (
    <PageContainer className="py-8 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div className="min-w-0 space-y-3">
            <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <UserRound className="size-3.5 text-primary" aria-hidden="true" />
              {t.eyebrow}
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.title}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {t.subtitle}
              </p>
            </div>
          </div>

          <aside
            data-testid="account-status-card"
            className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t.statusTitle}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant={signedIn ? "secondary" : "outline"}
                data-testid="account-mode-badge"
                className="min-h-6 px-2.5"
              >
                {signedIn ? t.modeNamed : t.modeGuest}
              </Badge>
              <span
                className="min-w-0 text-sm text-muted-foreground"
                data-testid="account-saved-by-label"
              >
                {interpolate(t.savedScaffoldsAs, {
                  name: savedByLabel || guestLabel,
                })}
              </span>
            </div>
            <p className="mt-3 text-sm leading-5 text-muted-foreground">
              {t.statusDesc}
            </p>
          </aside>
        </header>

        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_22rem]">
            <div className="min-w-0 p-5 sm:p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <UserRound className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {t.displayNameTitle}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {t.displayNameDesc}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
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
                    className="min-h-11"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    data-testid="account-save-display-name"
                    onClick={handleSaveDisplayName}
                  >
                    {t.saveDisplayName}
                  </Button>
                  {signedIn ? (
                    <Button type="button" variant="outline" onClick={handleSignOut}>
                      {t.signOut}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <aside className="border-t border-border/70 bg-muted/25 p-5 sm:p-6 lg:border-l lg:border-t-0">
              <p className="text-sm font-semibold text-foreground">{t.localFactsTitle}</p>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {t.currentLabelTitle}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {savedByLabel || guestLabel}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Monitor className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {t.storedInTitle}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t.storedInBody}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {t.notAccountTitle}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t.notAccountBody}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <details className="group rounded-2xl border border-border/70 bg-card/70 shadow-sm">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 outline-none transition hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden sm:px-6">
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
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
          <div className="border-t border-border/70 px-5 py-5 sm:px-6">
            <form className="max-w-xl space-y-4" onSubmit={handleMagicLinkRequest}>
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
                  className="min-h-11"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                data-testid="account-magic-link-send"
              >
                {t.sendMagicLink}
              </Button>
            </form>
            {pendingMagicLink && auth.email ? (
              <div
                className="mt-4 max-w-xl rounded-xl border border-primary/25 bg-primary/10 p-4 text-sm"
                data-testid="account-magic-link-pending"
              >
                <p className="font-semibold text-foreground">{t.magicLinkPendingTitle}</p>
                <p className="mt-1 leading-5 text-muted-foreground">
                  {interpolate(t.magicLinkPendingBody, { email: auth.email })}
                </p>
                <Button
                  type="button"
                  className="mt-3"
                  data-testid="account-magic-link-confirm"
                  onClick={handleConfirmMagicLink}
                >
                  {t.confirmMagicLink}
                </Button>
              </div>
            ) : null}
          </div>
        </details>

        <div className="flex flex-wrap gap-3">
          <Link
            href={localizedHref("/", locale)}
            className={cn(buttonVariants({ variant: "outline" }), "min-h-10 gap-2")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t.backToDemo}
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

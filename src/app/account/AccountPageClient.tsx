"use client";

import Link from "next/link";
import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { interpolate, localizedHref, useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/providers/Toast";

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
    <PageContainer className="py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase text-muted-foreground">
            {t.eyebrow}
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>

        <Card data-testid="account-status-card">
          <CardHeader>
            <CardTitle className="text-lg">{t.statusTitle}</CardTitle>
            <CardDescription>{t.statusDesc}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Badge
              variant={signedIn ? "secondary" : "outline"}
              data-testid="account-mode-badge"
            >
              {signedIn ? t.modeNamed : t.modeGuest}
            </Badge>
            <span className="text-sm text-muted-foreground" data-testid="account-saved-by-label">
              {interpolate(t.savedScaffoldsAs, { name: savedByLabel || guestLabel })}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.displayNameTitle}</CardTitle>
            <CardDescription>{t.displayNameDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.magicLinkTitle}</CardTitle>
            <CardDescription>{t.magicLinkDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleMagicLinkRequest}>
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
                />
              </div>
              <Button type="submit" variant="outline" data-testid="account-magic-link-send">
                {t.sendMagicLink}
              </Button>
            </form>
            {pendingMagicLink && auth.email ? (
              <div
                className="mt-4 rounded-lg border border-border/70 bg-muted/30 p-4 text-sm"
                data-testid="account-magic-link-pending"
              >
                <p className="font-medium">{t.magicLinkPendingTitle}</p>
                <p className="mt-1 text-muted-foreground">
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
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Link href={localizedHref("/", locale)} className={cn(buttonVariants({ variant: "outline" }))}>
            {t.backToDemo}
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

import { expect, test } from "@playwright/test";
import {
  AUTH_SESSION_KEY,
  resetE2ESessionStorage,
} from "./helpers/e2e-ui";

test.beforeEach(async ({ page }) => {
  await resetE2ESessionStorage(page);
});

test("/account redirects to the account modal in guest mode", async ({ page }) => {
  await page.goto("/account");

  await expect(page).toHaveURL((url) => {
    return url.pathname === "/" && url.searchParams.get("account") === "1";
  });
  await expect(page.getByTestId("account-modal")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Profile",
      level: 2,
    }),
  ).toBeVisible();
  await expect(
    page.getByTestId("account-modal").getByText("This browser tab only").first(),
  ).toBeVisible();
  await expect(page.getByText("Private to this browser")).toBeVisible();
  await expect(page.getByText(/local account \(demo stub\)/i)).toHaveCount(0);
  await expect(page.getByText(/optional email demo/i)).toHaveCount(0);
  await expect(page.getByTestId("account-mode-badge")).toHaveText(/local only/i);
  await expect(page.getByTestId("account-status-card")).toHaveText(/local only/i);
  await expect(page.getByTestId("account-saved-by-label")).toHaveCount(0);
  await expect(page.getByTestId("account-profile-preview")).not.toContainText(
    /Guest\s+Guest/i,
  );
  await expect(page.getByTestId("header-account-link")).toContainText(/guest/i);
});

test("header account control opens and closes the modal on the current page", async ({ page }) => {
  await page.goto("/design-system?selected=shadcn-button");

  await page.getByTestId("header-account-link").click();

  await expect(page).toHaveURL((url) => {
    return (
      url.pathname === "/design-system" &&
      url.searchParams.get("selected") === "shadcn-button" &&
      url.searchParams.get("account") === "1"
    );
  });
  await expect(page.getByTestId("account-modal")).toBeVisible();
  await expect(page.getByTestId("header-account-link")).toHaveAttribute(
    "aria-expanded",
    "true",
  );

  await page.getByRole("button", { name: "Close" }).click();

  await expect(page).toHaveURL((url) => {
    return (
      url.pathname === "/design-system" &&
      url.searchParams.get("selected") === "shadcn-button" &&
      !url.searchParams.has("account")
    );
  });
  await expect(page.getByTestId("account-modal")).toHaveCount(0);
  await expect(page.getByTestId("header-account-link")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("display name persists in sessionStorage and header", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByTestId("account-modal")).toBeVisible();

  await page.getByTestId("account-display-name-input").fill("Alex");
  await page.getByTestId("account-save-display-name").click();

  await expect(page.getByTestId("account-mode-badge")).toHaveText(/saved name/i);
  await expect(page.getByTestId("header-account-link")).toContainText("Alex");
  await expect
    .poll(() =>
      page.evaluate((key) => sessionStorage.getItem(key), AUTH_SESSION_KEY),
    )
    .toContain("Alex");
});

test("contact label signs in locally after confirm", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByTestId("account-modal")).toBeVisible();

  await page.getByText("Contact label", { exact: true }).click();
  await page.getByTestId("account-email-input").fill("demo.stub@example.com");
  await page.getByTestId("account-magic-link-send").click();

  await expect(page.getByTestId("account-magic-link-pending")).toBeVisible();
  await expect(page.getByTestId("account-magic-link-pending")).toContainText(
    "demo.stub@example.com",
  );

  await page.getByTestId("account-magic-link-confirm").click();

  await expect(page.getByTestId("account-mode-badge")).toHaveText(/saved name/i);
  await expect(page.getByTestId("header-account-link")).toContainText("demo.stub");
});

test("clear local profile returns to guest mode", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByTestId("account-modal")).toBeVisible();

  await page.getByTestId("account-display-name-input").fill("Temp User");
  await page.getByTestId("account-save-display-name").click();
  await expect(page.getByTestId("header-account-link")).toContainText("Temp User");

  await page.getByRole("button", { name: /clear profile/i }).click();

  await expect(page.getByTestId("account-mode-badge")).toHaveText(/local only/i);
  await expect(page.getByTestId("header-account-link")).toContainText(/guest/i);
  await expect
    .poll(() =>
      page.evaluate((key) => sessionStorage.getItem(key), AUTH_SESSION_KEY),
    )
    .toBeNull();
});

import { expect, test } from "@playwright/test";
import {
  AUTH_SESSION_KEY,
  resetE2ESessionStorage,
  waitForSonnerToaster,
} from "./helpers/e2e-ui";

test.beforeEach(async ({ page }) => {
  await resetE2ESessionStorage(page);
});

test("/account loads guest mode by default", async ({ page }) => {
  await page.goto("/account");

  await expect(page.getByRole("heading", { name: /local account/i })).toBeVisible();
  await expect(page.getByTestId("account-mode-badge")).toHaveText(/guest/i);
  await expect(page.getByTestId("account-saved-by-label")).toContainText(/guest/i);
  await expect(page.getByTestId("header-account-link")).toContainText(/guest/i);
});

test("display name persists in sessionStorage and header", async ({ page }) => {
  await page.goto("/account");
  await waitForSonnerToaster(page);

  await page.getByTestId("account-display-name-input").fill("Meetup Alex");
  await page.getByTestId("account-save-display-name").click();

  await expect(page.getByTestId("account-mode-badge")).toHaveText(/signed in/i);
  await expect(page.getByTestId("header-account-link")).toContainText("Meetup Alex");
  await expect
    .poll(() =>
      page.evaluate((key) => sessionStorage.getItem(key), AUTH_SESSION_KEY),
    )
    .toContain("Meetup Alex");
});

test("magic-link demo stub signs in locally after confirm", async ({ page }) => {
  await page.goto("/account");
  await waitForSonnerToaster(page);

  await page.getByTestId("account-email-input").fill("demo.stub@example.com");
  await page.getByTestId("account-magic-link-send").click();

  await expect(page.getByTestId("account-magic-link-pending")).toBeVisible();
  await expect(page.getByTestId("account-magic-link-pending")).toContainText(
    "demo.stub@example.com",
  );

  await page.getByTestId("account-magic-link-confirm").click();

  await expect(page.getByTestId("account-mode-badge")).toHaveText(/signed in/i);
  await expect(page.getByTestId("header-account-link")).toContainText("demo.stub");
});

test("sign out returns to guest mode", async ({ page }) => {
  await page.goto("/account");
  await waitForSonnerToaster(page);

  await page.getByTestId("account-display-name-input").fill("Temp User");
  await page.getByTestId("account-save-display-name").click();
  await expect(page.getByTestId("header-account-link")).toContainText("Temp User");

  await page.getByRole("button", { name: /sign out/i }).click();

  await expect(page.getByTestId("account-mode-badge")).toHaveText(/guest/i);
  await expect(page.getByTestId("header-account-link")).toContainText(/guest/i);
  await expect
    .poll(() =>
      page.evaluate((key) => sessionStorage.getItem(key), AUTH_SESSION_KEY),
    )
    .toBeNull();
});

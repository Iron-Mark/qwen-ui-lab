import { expect, test } from "@playwright/test";
import { resetE2ESessionStorage } from "./helpers/e2e-ui";

test("dashboard example is framed as loadable example output", async ({ page }) => {
  await resetE2ESessionStorage(page);
  await page.goto("/");

  await expect(page.getByText("Live product snapshot")).toHaveCount(0);
  await expect
    .poll(
      async () => {
        await page.mouse.wheel(0, 700);
        await page.waitForTimeout(100);
        return page.getByRole("heading", { name: "Dashboard sample" }).count();
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0);

  const section = page.getByTestId("example-output-section");
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole("heading", { name: "Dashboard sample" })).toBeVisible();
  await expect(section.getByText("Example output")).toBeVisible();
  await expect(section.getByRole("link", { name: /load this sample/i })).toHaveAttribute(
    "href",
    "/demo#upload-flow",
  );
  await expect(
    section.getByRole("link", { name: /pick a different sample/i }),
  ).toHaveAttribute("href", "#upload-flow");
  await expect(section.getByRole("link", { name: /choose another/i })).toHaveCount(0);
  await expect(page.getByTestId("desktop-example-output-preview")).toBeVisible();
  await expect(page.getByText("Dashboard UI support")).toHaveCount(0);
  await expect(
    page.getByText(/Generated results appear in the upload flow/i),
  ).toHaveCount(0);
});

test("dashboard example keeps the heavy preview collapsed on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await resetE2ESessionStorage(page);
  await page.goto("/");

  await expect
    .poll(
      async () => {
        await page.mouse.wheel(0, 700);
        await page.waitForTimeout(100);
        return page.getByTestId("mobile-example-output-preview").count();
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0);

  const mobilePreview = page.getByTestId("mobile-example-output-preview");
  await mobilePreview.scrollIntoViewIfNeeded();
  await expect(mobilePreview).toBeVisible();
  await expect(mobilePreview.locator("summary")).toContainText(
    "Preview static dashboard",
  );
  await expect(page.getByTestId("desktop-example-output-preview")).toBeHidden();
  await expect
    .poll(() => mobilePreview.evaluate((node) => node.hasAttribute("open")))
    .toBe(false);
});

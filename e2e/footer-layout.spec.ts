import { expect, test } from "@playwright/test";
import {
  resetE2ESessionStorage,
  waitForDesignSystemPreview,
} from "./helpers/e2e-ui";

test("footer presents brand, creator links, and responsive columns", async ({ page }) => {
  await page.setViewportSize({ width: 693, height: 958 });
  await resetE2ESessionStorage(page);
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible();

  await expect(footer.locator('a[href="/"] img').first()).toBeVisible();
  await expect(footer.getByText("React + Tailwind package")).toBeVisible();
  await expect(page.getByTestId("production-readiness-panel")).toBeHidden();

  const githubIconLink = footer.locator('a[aria-label="GitHub"]');
  await expect(githubIconLink).toHaveAttribute("href", "https://github.com/Iron-Mark");

  const socialIconLinks = footer.locator("a[aria-label='GitHub'], a[aria-label='LinkedIn'], a[aria-label='Website']");
  await expect(socialIconLinks).toHaveCount(3);
  await expect(socialIconLinks.nth(0)).toHaveAttribute("aria-label", "GitHub");
  await expect(socialIconLinks.nth(1)).toHaveAttribute("aria-label", "LinkedIn");
  await expect(socialIconLinks.nth(2)).toHaveAttribute("aria-label", "Website");

  const linkedInIconLink = footer.locator('a[aria-label="LinkedIn"]');
  await expect(linkedInIconLink).toHaveAttribute(
    "href",
    "https://ph.linkedin.com/in/mark-siazon",
  );

  const websiteIconLink = footer.locator('a[aria-label="Website"]');
  await expect(websiteIconLink).toHaveAttribute("href", "https://marksiazon.dev");

  await footer.getByRole("link", { name: "Workflow" }).hover();
  await expect(
    page.getByText("Return to your workspace and continue building from the uploaded screenshots."),
  ).toBeVisible();

  await githubIconLink.focus();
  await expect(page.getByText("Open Mark's GitHub profile.")).toBeVisible();
  await linkedInIconLink.focus();
  await expect(page.getByText("Open Mark's LinkedIn profile.")).toBeVisible();

  await expect(footer.getByRole("navigation", { name: "Product" })).toBeVisible();
  await expect(footer.getByRole("navigation", { name: "Resources" })).toBeVisible();
  await expect(footer.getByRole("navigation", { name: "Creator links" })).toHaveCount(
    0,
  );
  await expect(footer.getByTestId("developer-readiness-trigger")).toHaveCount(0);

  const portfolioCta = footer.getByTestId("footer-portfolio-cta");
  await expect(portfolioCta).toBeVisible();
  await expect(portfolioCta).toHaveText("Check my portfolio");
  await expect(portfolioCta).toHaveAttribute("href", "https://marksiazon.dev");
  await portfolioCta.hover();
  await expect(page.getByText("Open Mark's portfolio and project work.")).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(true);

  await expect
    .poll(() =>
      page.evaluate(() => {
        const footer = document.querySelector(
          'footer:not([data-nextjs-error-overlay-footer])',
        );
        return footer?.getBoundingClientRect().height ?? 0;
      }),
    )
    .toBeLessThanOrEqual(290);
});

test("footer portfolio call-to-action replaces internal developer control", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1269, height: 958 });
  await resetE2ESessionStorage(page);
  await page.goto("/");

  await expect(page.getByTestId("production-readiness-panel")).toBeHidden();

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();

  await expect(footer.getByTestId("developer-readiness-trigger")).toHaveCount(0);
  await expect(footer.getByTestId("footer-portfolio-cta")).toHaveAttribute(
    "target",
    "_blank",
  );
  await expect(footer.getByTestId("footer-portfolio-cta")).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
});

test("design system footer stays compact after short content", async ({ page }) => {
  await page.setViewportSize({ width: 554, height: 958 });
  await resetE2ESessionStorage(page);
  await page.goto("/design-system?selected=shadcn-button");
  await waitForDesignSystemPreview(page);

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const footer = document.querySelector(
          'footer:not([data-nextjs-error-overlay-footer])',
        );
        return footer?.getBoundingClientRect().height ?? 0;
      }),
    )
    .toBeLessThanOrEqual(410);

  await expect
    .poll(() =>
      page.evaluate(() => {
        const footer = document.querySelector(
          'footer:not([data-nextjs-error-overlay-footer])',
        );
        if (!footer) return false;
        const footerBottom =
          footer.getBoundingClientRect().bottom + window.scrollY;
        const documentBottom = document.documentElement.scrollHeight;
        return documentBottom - footerBottom <= 4;
      }),
    )
    .toBe(true);
});

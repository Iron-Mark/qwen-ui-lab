import { expect, test } from "@playwright/test";
import { resetE2ESessionStorage } from "./helpers/e2e-ui";

const HERO_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1269, height: 958 },
] as const;

test("home hero is visual-led, compact, and leaves the workflow visible", async ({
  page,
}) => {
  for (const viewport of HERO_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await resetE2ESessionStorage(page);
    await page.goto("/");

    const hero = page.getByTestId("home-marketing-hero");
    await expect(hero).toBeVisible();
    await expect(hero.getByTestId("home-hero-visual")).toBeVisible();
    await expect(
      hero.getByRole("heading", { name: /turn screenshots into editable react/i }),
    ).toBeVisible();
    await expect(hero.locator(".growth-snippet")).toContainText(
      /inspect the detected structure, then download/i,
    );
    const benefitRail = hero.getByTestId("hero-benefit-rail");
    await expect(benefitRail).toBeVisible();
    await expect(benefitRail.getByText("Plan", { exact: true })).toBeVisible();
    await expect(benefitRail.getByText("Preview", { exact: true })).toBeVisible();
    await expect(benefitRail.getByText("Download", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /build a component preview/i })).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(() => {
          const hero = document.querySelector<HTMLElement>(
            '[data-testid="home-marketing-hero"]',
          );
          const benefitItems = [
            ...document.querySelectorAll<HTMLElement>(
              '[aria-label="Key benefits"] > li',
            ),
          ];
          const page = document.documentElement;
          const heroHeight = hero?.getBoundingClientRect().height ?? 0;
          const benefitBodyParagraphs = document.querySelectorAll(
            '[aria-label="Key benefits"] li > p + p',
          ).length;
          const visibleBenefitText = [
            ...document.querySelectorAll<HTMLElement>(
              '[data-testid="hero-benefit-rail"] li',
            ),
          ].map((item) =>
            [...item.querySelectorAll("p")]
              .map((label) => label.textContent?.trim())
              .filter(Boolean)
              .join(" "),
          );

          return {
            benefitBodyParagraphs,
            benefitLabelsOnly: visibleBenefitText.every(
              (text) => /^0[1-3] (?:Plan|Preview|Download)$/.test(text),
            ),
            benefitItemsCompact: benefitItems.every(
              (item) => item.getBoundingClientRect().height <= 100,
            ),
            heroFitsViewport: heroHeight <= window.innerHeight * 0.78,
            noHorizontalOverflow: page.scrollWidth <= page.clientWidth + 1,
          };
        }),
      )
      .toEqual({
        benefitBodyParagraphs: 0,
        benefitLabelsOnly: true,
        benefitItemsCompact: true,
        heroFitsViewport: true,
        noHorizontalOverflow: true,
      });
  }
});

import { expect, test } from "@playwright/test";

const FILTER_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 693, height: 958 },
] as const;

test("design system title block is foreground content, not a card", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1269, height: 958 });
  await page.goto("/design-system?selected=shadcn-button");

  const titleBlock = page.getByTestId("design-system-title-block");
  await expect(titleBlock).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Atomic component lab" }),
  ).toBeVisible();

  await expect
    .poll(() =>
      titleBlock.evaluate((header) => {
        const style = getComputedStyle(header);
        return {
          backgroundColor: style.backgroundColor,
          borderTopWidth: style.borderTopWidth,
          borderRadius: style.borderTopLeftRadius,
          position: style.position,
        };
      }),
    )
    .toEqual({
      backgroundColor: "rgba(0, 0, 0, 0)",
      borderTopWidth: "0px",
      borderRadius: "0px",
      position: "static",
    });
});

test("design system title block does not cover the workspace while scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1269, height: 958 });
  await page.goto("/design-system?selected=shadcn-button");

  const titleBlock = page.getByTestId("design-system-title-block");
  const appHeader = page.getByRole("banner");
  await expect(titleBlock).toBeVisible();
  await expect(page.getByText("Button (shadcn)").first()).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, 520));
  await expect
    .poll(() =>
      page.evaluate(() => {
        const title = document.querySelector<HTMLElement>(
          '[data-testid="design-system-title-block"]',
        );
        const header = document.querySelector<HTMLElement>("body > div > header");
        if (!title || !header) return null;
        const titleBox = title.getBoundingClientRect();
        const headerBox = header.getBoundingClientRect();
        return {
          floatingOverWorkspace: titleBox.bottom > headerBox.bottom + 1,
          position: getComputedStyle(title).position,
        };
      }),
    )
    .toEqual({
      floatingOverWorkspace: false,
      position: "static",
    });

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect
    .poll(() =>
      page.evaluate(() => {
        const title = document.querySelector<HTMLElement>(
          '[data-testid="design-system-title-block"]',
        );
        const header = document.querySelector<HTMLElement>("body > div > header");
        if (!title || !header) return null;
        const titleBox = title.getBoundingClientRect();
        const headerBox = header.getBoundingClientRect();
        const centerX = titleBox.left + titleBox.width / 2;
        const centerY = titleBox.top + titleBox.height / 2;
        const topElement = document.elementFromPoint(centerX, centerY);
        return {
          belowAppHeader: titleBox.top >= headerBox.bottom - 1,
          titleOwnsCenter: Boolean(topElement?.closest('[data-testid="design-system-title-block"]')),
        };
      }),
    )
    .toEqual({
      belowAppHeader: true,
      titleOwnsCenter: true,
    });

  await expect(appHeader).toBeVisible();
});

test("design system filter controls are foreground content, not a card", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1269, height: 958 });
  await page.goto("/design-system?selected=shadcn-button");

  const filterControls = page.getByTestId("design-system-filter-controls");
  const searchShell = page.getByTestId("catalog-search-shell");
  await expect(filterControls).toBeVisible();
  await expect(searchShell).toBeVisible();
  await expect(page.getByRole("searchbox", { name: /search catalog/i })).toBeVisible();

  await expect
    .poll(() =>
      filterControls.evaluate((header) => {
        const style = getComputedStyle(header);
        return {
          backgroundColor: style.backgroundColor,
          borderTopWidth: style.borderTopWidth,
          borderRadius: style.borderTopLeftRadius,
        };
      }),
    )
    .toEqual({
      backgroundColor: "rgba(0, 0, 0, 0)",
      borderTopWidth: "0px",
      borderRadius: "0px",
    });

  await expect
    .poll(() =>
      searchShell.evaluate((shell) => {
        const style = getComputedStyle(shell);
        return {
          backgroundColor: style.backgroundColor,
          borderBottomWidth: style.borderBottomWidth,
          borderLeftWidth: style.borderLeftWidth,
          borderRadius: style.borderTopLeftRadius,
          borderRightWidth: style.borderRightWidth,
          borderTopWidth: style.borderTopWidth,
        };
      }),
    )
    .toEqual({
      backgroundColor: "rgba(0, 0, 0, 0)",
      borderBottomWidth: "1px",
      borderLeftWidth: "0px",
      borderRadius: "0px",
      borderRightWidth: "0px",
      borderTopWidth: "0px",
    });
});

test("design system domain filter tabs stay inside their container", async ({
  page,
}) => {
  for (const viewport of FILTER_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto("/design-system?selected=shadcn-button");
    await expect(page.getByRole("searchbox", { name: /search catalog/i })).toBeVisible();

    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const tabList = document.querySelector<HTMLElement>(
              'main#main header [data-slot="tabs-list"]',
            );
            if (!tabList) return false;
            const listBox = tabList.getBoundingClientRect();
            const triggers = [
              ...tabList.querySelectorAll<HTMLElement>(
                '[data-slot="tabs-trigger"]',
              ),
            ];

            if (triggers.length !== 4) return false;
            const triggersStayInside = triggers.every((trigger) => {
              const box = trigger.getBoundingClientRect();
              return (
                box.left >= listBox.left - 1 &&
                box.right <= listBox.right + 1 &&
                box.top >= listBox.top - 1 &&
                box.bottom <= listBox.bottom + 1
              );
            });

            return (
              tabList.scrollWidth <= tabList.clientWidth + 1 &&
              document.documentElement.scrollWidth <=
                document.documentElement.clientWidth + 1 &&
              triggersStayInside
            );
          }),
        {
          message: `expected domain filter tabs to fit at ${viewport.width}px`,
        },
      )
      .toBe(true);
  }
});

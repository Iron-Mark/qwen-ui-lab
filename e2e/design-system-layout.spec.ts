import { expect, test } from "@playwright/test";
import { waitForDesignSystemPreview } from "./helpers/e2e-ui";

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

test("design system preview scrolls with page content and clears the footer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1243, height: 958 });
  await page.goto("/design-system?selected=shadcn-button");
  await waitForDesignSystemPreview(page);

  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );

  await expect
    .poll(() =>
      page.evaluate(() => {
        const previewPanel = document.querySelector<HTMLElement>(
          "#component-preview-panel",
        );
        const previewBody = document.querySelector<HTMLElement>(
          '[data-testid="component-preview-body"]',
        );
        const footer = document.querySelector<HTMLElement>(
          'footer:not([data-nextjs-error-overlay-footer])',
        );
        if (!previewPanel || !previewBody || !footer) return null;

        const previewBox = previewPanel.getBoundingClientRect();
        const footerBox = footer.getBoundingClientRect();
        const previewStyle = getComputedStyle(previewPanel);
        const previewBodyStyle = getComputedStyle(previewBody);

        return {
          clearsFooter: previewBox.bottom <= footerBox.top + 1,
          previewPosition: previewStyle.position,
          previewBodyOverflowY: previewBodyStyle.overflowY,
          previewBodyHasInternalScroll:
            previewBody.scrollHeight > previewBody.clientHeight + 1,
        };
      }),
    )
    .toEqual({
      clearsFooter: true,
      previewPosition: "static",
      previewBodyOverflowY: "visible",
      previewBodyHasInternalScroll: false,
    });
});

test("design system preview modes resize the component viewport, not the panel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1243, height: 958 });
  await page.goto("/design-system?selected=shadcn-button");
  await waitForDesignSystemPreview(page);

  const previewPanel = page.getByLabel("Component preview");
  const viewport = page.getByTestId("component-preview-viewport");
  const modeLabel = page.getByTestId("component-preview-mode-label");

  await expect(previewPanel).toBeVisible();
  await expect(viewport).toBeVisible();
  await expect(modeLabel).toContainText("Desktop canvas");

  const panelBefore = await previewPanel.boundingBox();
  const desktopBox = await viewport.boundingBox();
  expect(panelBefore).not.toBeNull();
  expect(desktopBox).not.toBeNull();

  await page.getByRole("tab", { name: "Mobile preview" }).click();
  await expect(viewport).toHaveAttribute("data-preview-mode", "mobile");
  await expect(modeLabel).toContainText("Mobile canvas");

  const panelAfter = await previewPanel.boundingBox();
  const mobileBox = await viewport.boundingBox();
  expect(panelAfter).not.toBeNull();
  expect(mobileBox).not.toBeNull();
  expect(mobileBox!.width).toBeLessThan(desktopBox!.width - 120);
  expect(Math.abs(panelAfter!.width - panelBefore!.width)).toBeLessThan(2);

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(true);
});

test("design system selected preview does not repeat tier summary counts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 840, height: 958 });
  await page.goto("/design-system?selected=shadcn-button");
  await waitForDesignSystemPreview(page);

  const previewPanel = page.locator("#component-preview-panel");
  await expect(previewPanel).toBeVisible();
  await expect(previewPanel.getByText(/^ATOM$/)).toHaveCount(0);
  await expect(previewPanel.getByText(/^MOLECULE$/)).toHaveCount(0);
  await expect(previewPanel.getByText(/^ORGANISM$/)).toHaveCount(0);
});

test("design system selected preview avoids duplicate page actions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 840, height: 958 });
  await page.goto("/design-system?selected=shadcn-button");
  await waitForDesignSystemPreview(page);

  const previewPanel = page.locator("#component-preview-panel");
  await expect(previewPanel).toBeVisible();
  await expect(
    previewPanel.getByRole("toolbar", { name: "Preview panel actions" }),
  ).toHaveCount(0);
  await expect(previewPanel.getByText("Back to dashboard demo")).toHaveCount(0);
  await expect(previewPanel.getByText("Export all snippets")).toHaveCount(0);
  await expect(
    previewPanel.getByText("Try screenshot-to-scaffold workflow"),
  ).toHaveCount(0);
  await expect(
    previewPanel.getByText("Button (shadcn)", { exact: true }),
  ).toBeVisible();
});

test("design system component list metadata has clear visual hierarchy", async ({
  page,
}) => {
  await page.setViewportSize({ width: 840, height: 958 });
  await page.goto("/design-system?selected=shadcn-button");
  await waitForDesignSystemPreview(page);

  await expect(page.getByText("Dense view")).toHaveCount(0);
  const metadata = page.getByTestId("component-list-metadata").first();
  await expect(metadata).toBeVisible();
  await expect(metadata.getByText("Level", { exact: true })).toBeVisible();
  await expect(metadata.getByText("Atom", { exact: true })).toBeVisible();
  await expect(metadata.getByText("Collection", { exact: true })).toBeVisible();
  await expect(metadata.getByText("Product", { exact: true })).toBeVisible();
  await expect(metadata.getByText("product", { exact: true })).toHaveCount(0);
  await expect(metadata.locator("svg")).toHaveCount(2);
});

test("design system reference source follows the active domain tab", async ({
  page,
}) => {
  await page.setViewportSize({ width: 840, height: 958 });
  await page.goto("/design-system?selected=shadcn-button");
  await waitForDesignSystemPreview(page);

  const refs = page.getByTestId("catalog-reference-row");
  await expect(refs).toContainText("Product catalog");
  await expect(refs).toContainText("uilaws.com");
  await expect(refs).toContainText("lawsofux.com");

  await page.getByRole("tab", { name: "Product", exact: true }).click();
  await expect(refs).toContainText("Product catalog");
  await expect(refs).not.toContainText("uilaws.com");
  await expect(refs).not.toContainText("lawsofux.com");

  await page.getByRole("tab", { name: "UILaws", exact: true }).click();
  await expect(refs).toContainText("uilaws.com");
  await expect(refs).not.toContainText("Product catalog");
  await expect(refs).not.toContainText("lawsofux.com");

  await page.getByRole("tab", { name: "Laws of UX", exact: true }).click();
  await expect(refs).toContainText("lawsofux.com");
  await expect(refs).not.toContainText("Product catalog");
  await expect(refs).not.toContainText("uilaws.com");
});

test("design system tier filter uses three icon toggles", async ({ page }) => {
  await page.setViewportSize({ width: 1243, height: 958 });
  await page.goto("/design-system?selected=shadcn-button");
  await waitForDesignSystemPreview(page);

  const tierControls = page.getByTestId("tier-filter-controls");
  await expect(tierControls).toBeVisible();
  await expect(tierControls.getByRole("button")).toHaveCount(3);
  await expect(
    tierControls.getByRole("button", { name: "All", exact: true }),
  ).toHaveCount(0);

  for (const label of ["Atom", "Molecule", "Organism"]) {
    const button = tierControls.getByRole("button", {
      name: label,
      exact: true,
    });
    await expect(button).toBeVisible();
    await expect(button.locator("svg")).toHaveCount(1);
  }

  const molecule = tierControls.getByRole("button", {
    name: "Molecule",
    exact: true,
  });
  await molecule.click();
  await expect.poll(() => new URL(page.url()).searchParams.get("level")).toBe(
    "molecule",
  );
  await expect(molecule).toHaveAttribute("aria-pressed", "true");

  await molecule.click();
  await expect.poll(() => new URL(page.url()).searchParams.has("level")).toBe(
    false,
  );
  await expect(molecule).toHaveAttribute("aria-pressed", "false");
});

test("design system disables tiers with no matches for the selected domain", async ({
  page,
}) => {
  await page.setViewportSize({ width: 840, height: 958 });
  await page.goto("/design-system?domain=uilaws&level=atom");
  await waitForDesignSystemPreview(page);

  await expect
    .poll(() => new URL(page.url()).searchParams.get("level"))
    .toBeNull();

  const tierControls = page.getByTestId("tier-filter-controls");
  const atom = tierControls.getByRole("button", {
    name: "Atom",
    exact: true,
  });
  const molecule = tierControls.getByRole("button", {
    name: "Molecule",
    exact: true,
  });
  const organism = tierControls.getByRole("button", {
    name: "Organism",
    exact: true,
  });

  await expect(atom).toBeDisabled();
  await expect(atom).toHaveAttribute("aria-pressed", "false");
  await expect(molecule).toBeEnabled();
  await expect(organism).toBeEnabled();
  await expect(page.getByText("No components match your search.")).toHaveCount(0);
  await expect(page.getByText(/visible/i).first()).not.toHaveText(/0\s+visible/i);
});

test("design system filter controls are foreground content, not a card", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1269, height: 958 });
  await page.goto("/design-system?selected=shadcn-button");

  const filterControls = page.getByTestId("design-system-filter-controls");
  const searchShell = page.getByTestId("catalog-search-shell");
  const searchInput = page.getByRole("searchbox", { name: /search catalog/i });
  await expect(filterControls).toBeVisible();
  await expect(searchShell).toBeVisible();
  await expect(searchInput).toBeVisible();

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
          borderBottomWidth: style.borderBottomWidth,
          borderLeftWidth: style.borderLeftWidth,
          borderRadiusIsVisible: Number.parseFloat(style.borderTopLeftRadius) >= 8,
          borderTopWidth: style.borderTopWidth,
          borderRightWidth: style.borderRightWidth,
          overflowX: style.overflowX,
        };
      }),
    )
    .toEqual({
      borderBottomWidth: "1px",
      borderLeftWidth: "1px",
      borderRadiusIsVisible: true,
      borderTopWidth: "1px",
      borderRightWidth: "1px",
      overflowX: "hidden",
    });

  await expect
    .poll(() =>
      searchInput.evaluate((input) => {
        const style = getComputedStyle(input);
        return {
          height: Math.round(Number.parseFloat(style.height)),
          paddingLeft: Math.round(Number.parseFloat(style.paddingLeft)),
          paddingRight: Math.round(Number.parseFloat(style.paddingRight)),
        };
      }),
    )
    .toEqual({
      height: 44,
      paddingLeft: 44,
      paddingRight: 48,
    });
});

test("design system search row stays contained at tablet width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 840, height: 958 });
  await page.goto("/design-system?domain=uilaws&selected=law-information-card");
  await expect(page.getByRole("searchbox", { name: /search catalog/i })).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const shell = document.querySelector<HTMLElement>(
          '[data-testid="catalog-search-shell"]',
        );
        const controls = document.querySelector<HTMLElement>(
          '[data-testid="design-system-filter-controls"]',
        );
        if (!shell || !controls) return false;

        const shellBox = shell.getBoundingClientRect();
        const controlsBox = controls.getBoundingClientRect();

        return (
          shell.scrollWidth <= shell.clientWidth + 1 &&
          shellBox.left >= controlsBox.left - 1 &&
          shellBox.right <= controlsBox.right + 1 &&
          document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1
        );
      }),
    )
    .toBe(true);
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

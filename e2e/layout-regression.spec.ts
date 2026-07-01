import { expect, test } from "@playwright/test";

const ROUTES = [
  { path: "/", expectedStatus: 200 },
  { path: "/?account=1", expectedStatus: 200 },
  { path: "/design-system?selected=shadcn-button", expectedStatus: 200 },
  {
    path: "/design-system?domain=laws-of-ux&selected=law-of-ux-aesthetic-usability",
    expectedStatus: 200,
  },
  { path: "/demo", expectedStatus: 200 },
  { path: "/share/not-a-real-id", expectedStatus: 404 },
] as const;

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 840, height: 958 },
  { name: "desktop", width: 1366, height: 900 },
] as const;

type LayoutIssue = {
  selector: string;
  text: string;
  left?: number;
  right?: number;
  width?: number;
  scrollWidth?: number;
  clientWidth?: number;
};

test("core routes do not horizontally overflow or clip primary controls", async ({
  page,
}) => {
  test.setTimeout(90_000);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);

    for (const route of ROUTES) {
      const response = await page.goto(route.path, {
        waitUntil: "networkidle",
      });
      expect(response?.status(), `${viewport.name} ${route.path}`).toBe(
        route.expectedStatus,
      );

      const result = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const pageHasHorizontalOverflow =
          document.documentElement.scrollWidth > viewportWidth + 1 ||
          document.body.scrollWidth > viewportWidth + 1;

        const overflowingElements = Array.from(
          document.querySelectorAll<HTMLElement>("body *"),
        )
          .map((element) => {
            const box = element.getBoundingClientRect();
            return {
              selector: [
                element.tagName.toLowerCase(),
                element.id ? `#${element.id}` : "",
              ].join(""),
              text: (element.textContent ?? "")
                .trim()
                .replace(/\s+/g, " ")
                .slice(0, 100),
              left: Math.round(box.left),
              right: Math.round(box.right),
              width: Math.round(box.width),
            };
          })
          .filter(
            (item) =>
              item.width > 0 &&
              (item.left < -2 || item.right > viewportWidth + 2),
          )
          .slice(0, 5);

        const clippedTablists = Array.from(
          document.querySelectorAll<HTMLElement>('[role="tablist"]'),
        )
          .map((element) => ({
            selector: '[role="tablist"]',
            text: (element.textContent ?? "")
              .trim()
              .replace(/\s+/g, " ")
              .slice(0, 100),
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
          }))
          .filter((item) => item.scrollWidth > item.clientWidth + 2);

        const clippedActions = Array.from(
          document.querySelectorAll<HTMLElement>("button, a"),
        )
          .map((element) => ({
            selector: element.tagName.toLowerCase(),
            text: (element.textContent ?? "")
              .trim()
              .replace(/\s+/g, " ")
              .slice(0, 100),
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
          }))
          .filter((item) => item.scrollWidth > item.clientWidth + 4)
          .slice(0, 5);

        return {
          pageHasHorizontalOverflow,
          overflowingElements,
          clippedTablists,
          clippedActions,
        };
      });

      expect(
        result,
        `${viewport.name} ${route.path} layout issues: ${JSON.stringify(
          [
            ...result.overflowingElements,
            ...result.clippedTablists,
            ...result.clippedActions,
          ] satisfies LayoutIssue[],
        )}`,
      ).toEqual({
        pageHasHorizontalOverflow: false,
        overflowingElements: [],
        clippedTablists: [],
        clippedActions: [],
      });
    }
  }
});

import { expect, test } from "@playwright/test";
import { waitForUploadFlowReady } from "./helpers/e2e-ui";

const shareFixturePayload = {
  file: "dashboard.png",
  mode: "Ready to analyze",
  summary: "Local layout analysis for a dashboard screenshot.",
  stats: [{ l: "sections", v: "4" }],
};

test("home workflow renders zh sample layout copy", async ({ page }) => {
  await page.goto("/?lang=zh");
  await waitForUploadFlowReady(page);

  const picker = page.getByTestId("sample-picker");
  await expect(picker).toBeVisible();
  await expect(picker.getByText("\u8bd5\u7528\u6837\u4f8b")).toBeVisible();
  await expect(
    picker.getByRole("button", {
      name: "\u52a0\u8f7d \u4eea\u8868\u76d8 \u5e03\u5c40",
    }),
  ).toBeVisible();
});

test("404 page renders zh copy with ?lang=zh", async ({ page }) => {
  const response = await page.goto("/does-not-exist?lang=zh");
  expect(response?.status()).toBe(404);

  await expect(page.getByRole("heading", { name: "页面未找到" })).toBeVisible();
  const notFoundNav = page.getByRole("navigation", { name: "返回已知页面" });
  await expect(
    notFoundNav.getByRole("link", { name: "返回工作流" }),
  ).toHaveAttribute("href", "/?lang=zh");
  await expect(
    notFoundNav.getByRole("link", { name: "设计系统" }),
  ).toHaveAttribute("href", "/design-system?lang=zh");
});

test("laws-of-ux redirect preserves ?lang=zh", async ({ page }) => {
  await page.goto("/design-system/laws-of-ux?lang=zh");
  await expect(page).toHaveURL((url) => {
    return (
      url.pathname === "/design-system" &&
      url.searchParams.get("domain") === "laws-of-ux" &&
      url.searchParams.get("lang") === "zh"
    );
  });
  await expect(page.getByRole("heading", { name: "组件库" })).toBeVisible();
});

test("uilaws redirect preserves ?lang=zh", async ({ page }) => {
  await page.goto("/design-system/uilaws?lang=zh");
  await expect(page).toHaveURL((url) => {
    return (
      url.pathname === "/design-system" &&
      url.searchParams.get("domain") === "uilaws" &&
      url.searchParams.get("lang") === "zh"
    );
  });
  await expect(page.getByRole("heading", { name: "组件库" })).toBeVisible();
});

test("/account redirects to zh account modal with ?lang=zh", async ({ page }) => {
  await page.goto("/account?lang=zh");

  await expect(page).toHaveURL((url) => {
    return (
      url.pathname === "/" &&
      url.searchParams.get("account") === "1" &&
      url.searchParams.get("lang") === "zh"
    );
  });
  await expect(page.getByTestId("account-modal")).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "资料",
      level: 2,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("account-mode-badge")).toHaveText("访客资料");
  await expect(page.getByTestId("header-account-link")).toContainText("访客");
});

test("/share/[id] renders zh chrome with ?lang=zh", async ({ page, request }) => {
  const createResponse = await request.post("/api/share", {
    data: shareFixturePayload,
  });
  expect(createResponse.ok()).toBeTruthy();
  const { id } = (await createResponse.json()) as { id: string };

  await page.goto(`/share/${id}?lang=zh`);

  await expect(page.getByRole("heading", { name: "只读分析摘要" })).toBeVisible();
  await expect(page.getByTestId("shared-result-summary")).toBeVisible();
  await expect(page.getByText(shareFixturePayload.summary)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "返回工作流" }),
  ).toHaveAttribute("href", "/?lang=zh");
  await expect(page.locator('#main a[href="/demo?lang=zh"]')).toBeVisible();
});

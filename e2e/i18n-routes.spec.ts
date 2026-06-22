import { expect, test } from "@playwright/test";

const shareFixturePayload = {
  file: "dashboard.png",
  mode: "offline-demo",
  summary: "Offline demo layout analysis for meetup presentation.",
  stats: [{ l: "sections", v: "4" }],
};

test("404 page renders zh copy with ?lang=zh", async ({ page }) => {
  const response = await page.goto("/does-not-exist?lang=zh");
  expect(response?.status()).toBe(404);

  await expect(page.getByRole("heading", { name: "页面未找到" })).toBeVisible();
  const notFoundNav = page.getByRole("navigation", { name: "返回已知页面" });
  await expect(
    notFoundNav.getByRole("link", { name: "返回工作台" }),
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
  await expect(page.getByRole("heading", { name: "原子组件实验室" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "原子组件实验室" })).toBeVisible();
});

test("/account renders zh copy with ?lang=zh", async ({ page }) => {
  await page.goto("/account?lang=zh");

  await expect(page.getByRole("heading", { name: "个性化此浏览器标签页" })).toBeVisible();
  await expect(page.getByTestId("account-mode-badge")).toHaveText("访客");
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
    page.getByRole("link", { name: "体验 live demo" }),
  ).toHaveAttribute("href", "/?lang=zh");
  await expect(
    page.getByRole("link", { name: "一键演示" }),
  ).toHaveAttribute("href", "/demo?lang=zh");
});

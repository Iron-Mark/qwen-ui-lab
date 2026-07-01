import { test, expect, type Locator, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import {
  mockAnalyzeApiForE2E,
  stubClipboardForE2E,
} from "./helpers/mock-analyze-api";
import { waitForUploadFlowReady } from "./helpers/e2e-ui";

// No live Qwen: route mocks + dev server env (see playwright.config.ts).
test.beforeEach(async ({ page }) => {
  await stubClipboardForE2E(page);
  await mockAnalyzeApiForE2E(page);
});

test("upload dropzone renders as a recessed upload target", async ({ page }) => {
  await page.goto("/");
  await waitForUploadFlowReady(page);

  const dropzone = page.getByTestId("upload-dropzone-button");
  await expect(dropzone).toBeVisible();
  await expect(dropzone.getByText("Drop a screenshot here")).toBeVisible();

  const styles = await dropzone.evaluate((node) => {
    const computed = window.getComputedStyle(node);
    return {
      boxShadow: computed.boxShadow.toLowerCase(),
      minHeight: Number.parseFloat(computed.minHeight),
    };
  });

  expect(styles.boxShadow).toContain("inset");
  expect(styles.minHeight).toBeGreaterThanOrEqual(288);
});

test("upload flow hides the output panel before a screenshot exists", async ({
  page,
}) => {
  await page.setViewportSize({ width: 840, height: 958 });
  await page.goto("/");
  await waitForUploadFlowReady(page);

  await expect(page.getByTestId("upload-dropzone-button")).toBeVisible();
  await expect(page.getByTestId("workflow-output-panel")).toHaveCount(0);
  await expect(page.getByTestId("upload-flow-stepper")).toHaveCount(0);
  await expect(page.getByText(/run analysis to see the generated plan/i)).toHaveCount(0);
});

test("sample selector uses a shadcn-style popup", async ({ page }) => {
  await page.setViewportSize({ width: 840, height: 958 });
  await page.goto("/");
  await waitForUploadFlowReady(page);

  const trigger = page.getByTestId("sample-select");
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("data-slot", "select-trigger");
  await expect(trigger).toContainText("Dashboard");

  await trigger.click();

  const popup = page.getByTestId("sample-select-content");
  await expect(popup).toBeVisible();
  await expect(popup).toHaveAttribute("data-slot", "select-content");
  await expect(page.getByTestId("sample-select-option-auth")).toContainText(
    "form fields",
  );

  await page.getByTestId("sample-select-option-mobile").click();
  await expect(trigger).toContainText("Mobile app");
  await expect(page.getByTestId("sample-picker")).toContainText(
    "bottom navigation",
  );
  await expect(page.getByTestId("sample-picker")).toHaveCount(1);
  await expect(page.getByText(/PNG screenshot/i)).toHaveCount(0);
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

test("pasting an image on the page loads and focuses the upload dropzone", async ({
  page,
}) => {
  await page.goto("/");
  await waitForUploadFlowReady(page);

  await page.evaluate(() => {
    const base64Png =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
    const bytes = Uint8Array.from(atob(base64Png), (char) =>
      char.charCodeAt(0),
    );
    const file = new File([bytes], "pasted-screenshot.png", {
      type: "image/png",
      lastModified: Date.now(),
    });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    document.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: transfer,
      }),
    );
  });

  await expect(page.getByText(/pasted-screenshot\.png/i)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId("upload-dropzone-button")).toBeFocused();
  await expect(
    page.getByRole("button", {
      name: /analyze & generate preview|generate preview|regenerate preview/i,
    }),
  ).toBeEnabled({ timeout: 10_000 });
});

test("workflow stepper marks unavailable steps as disabled", async ({ page }) => {
  await page.goto("/");
  await waitForUploadFlowReady(page);

  const samplePath = path.join(
    process.cwd(),
    "public",
    "references",
    "dashboard-reference.png",
  );

  await page.locator('input[type="file"]').setInputFiles(samplePath);
  await expect(page.getByText(/dashboard-reference\.png/i)).toBeVisible();

  await expect(page.getByTestId("workflow-output-panel")).toBeVisible();
  const stepper = page.getByTestId("upload-flow-stepper");
  await expect(stepper).toBeVisible();
  await expect(page.getByTestId("upload-flow-step")).toHaveCount(6);

  const steps = await page.getByTestId("upload-flow-step").evaluateAll((nodes) =>
    nodes.map((node) => {
      return {
        label: node.textContent?.replace(/\s+/g, " ").trim(),
        state: node.getAttribute("data-step-state"),
        current: node.getAttribute("aria-current"),
        disabled: node.getAttribute("aria-disabled"),
      };
    }),
  );

  expect(steps).toEqual([
    {
      label: "Upload",
      state: "current",
      current: "step",
      disabled: null,
    },
    {
      label: "Analyze",
      state: "locked",
      current: null,
      disabled: "true",
    },
    {
      label: "Plan",
      state: "locked",
      current: null,
      disabled: "true",
    },
    {
      label: "Generate",
      state: "locked",
      current: null,
      disabled: "true",
    },
    {
      label: "Preview",
      state: "locked",
      current: null,
      disabled: "true",
    },
    {
      label: "Export",
      state: "locked",
      current: null,
      disabled: "true",
    },
  ]);
});

test("export package dialog keeps tabs and actions visible on tablet widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 789, height: 958 });
  await page.goto("/");
  await waitForUploadFlowReady(page);

  const samplePath = path.join(
    process.cwd(),
    "public",
    "references",
    "dashboard-reference.png",
  );

  await page.locator('input[type="file"]').setInputFiles(samplePath);
  await page
    .getByRole("button", {
      name: /analyze & generate preview|generate preview|regenerate preview/i,
    })
    .click();

  await expect(page.getByText(/Generated component/i)).toBeVisible({
    timeout: 10_000,
  });

  await page.getByTestId("export-package-review").click();

  const dialog = page.getByRole("dialog", { name: /review export package/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /files/i })).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /changes/i })).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /package notes/i })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /download package/i })).toBeVisible();

  const layout = await dialog.evaluate((node) => {
    const dialogRect = node.getBoundingClientRect();
    const tablist = node.querySelector('[role="tablist"]');
    const footer = node.querySelector('[data-testid="export-package-actions"]');
    const tablistRect = tablist?.getBoundingClientRect();
    const footerRect = footer?.getBoundingClientRect();

    return {
      pageHasHorizontalOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
      tablistInside:
        !!tablistRect &&
        tablistRect.left >= dialogRect.left - 1 &&
        tablistRect.right <= dialogRect.right + 1 &&
        tablistRect.top >= dialogRect.top - 1,
      footerInside:
        !!footerRect &&
        footerRect.left >= dialogRect.left - 1 &&
        footerRect.right <= dialogRect.right + 1 &&
        footerRect.bottom <= dialogRect.bottom + 1,
    };
  });

  expect(layout).toEqual({
    pageHasHorizontalOverflow: false,
    tablistInside: true,
    footerInside: true,
  });
});

test("upload → analyze → generate → copy/export smoke flow", async ({
  page,
}) => {
  await page.goto("/");
  await waitForUploadFlowReady(page);

  const samplePath = path.join(
    process.cwd(),
    "public",
    "references",
    "dashboard-reference.png",
  );

  await page.locator('input[type="file"]').setInputFiles(samplePath);

  const runPipeline = page.getByRole("button", {
    name: /analyze & generate preview|generate preview|regenerate preview/i,
  });

  await expect(runPipeline).toBeEnabled({ timeout: 10_000 });
  await runPipeline.click();

  await expect(page.getByText(/Generated component/i)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText(/Live preview/i)).toBeVisible();
  await expect(page.getByTestId("detection-overlay-count")).toContainText(/detected/i);
  const movableDetectionIndex = await page
    .getByTestId("detection-box")
    .evaluateAll((boxes) => {
      const overlay = document
        .querySelector('[data-testid="detection-overlay"]')
        ?.getBoundingClientRect();
      if (!overlay) return -1;
      return boxes.findIndex((box) => {
        const rect = box.getBoundingClientRect();
        return (
          rect.width < overlay.width * 0.85 &&
          rect.height < overlay.height * 0.85 &&
          rect.right < overlay.right - 12 &&
          rect.bottom < overlay.bottom - 12
        );
      });
    });
  expect(movableDetectionIndex).toBeGreaterThanOrEqual(0);
  const firstDetectionBox = page.getByTestId("detection-box").nth(movableDetectionIndex);
  await expect(firstDetectionBox).toBeVisible();
  await expect(page.getByTestId("detector-quality-dashboard")).toBeVisible();
  await expect(page.getByTestId("visual-diff-score")).toContainText(/% visual match/i);
  await expect(page.getByTestId("undo-detection-edit")).toBeDisabled();

  const initialBox = await firstDetectionBox.boundingBox();
  expect(initialBox).toBeTruthy();
  await dragPointerBy(firstDetectionBox, page, 24, 12);
  await expect
    .poll(async () => {
      const movedBox = await firstDetectionBox.boundingBox();
      return Math.round((movedBox?.x ?? initialBox!.x) - initialBox!.x);
    })
    .not.toBe(0);

  const resizeHandle = firstDetectionBox.getByTestId("detection-resize-handle-se");
  const beforeResize = await firstDetectionBox.boundingBox();
  const resizeBox = await resizeHandle.boundingBox();
  expect(resizeBox).toBeTruthy();
  await dragPointerBy(resizeHandle, page, 28, 16);
  await expect
    .poll(async () => {
      const afterResize = await firstDetectionBox.boundingBox();
      return Math.round((afterResize?.width ?? beforeResize!.width) - beforeResize!.width);
    })
    .not.toBe(0);

  const editedDetectionId = await firstDetectionBox.getAttribute("data-detection-id");
  expect(editedDetectionId).toBeTruthy();
  await firstDetectionBox.click();
  await expect(page.getByTestId("detection-details")).toBeVisible();
  await expect(page.getByTestId("detection-details")).toContainText(/confidence/i);
  await page.getByTestId("toggle-detector-debug").click();
  await expect(page.getByTestId("detection-debug-panel")).toContainText(/Geometry/i);
  await expect(firstDetectionBox.getByTestId("detection-debug-label")).toBeVisible();
  const beforeKeyboardMove = await firstDetectionBox.boundingBox();
  await firstDetectionBox.focus();
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(async () => {
      const afterKeyboardMove = await firstDetectionBox.boundingBox();
      return Math.round((afterKeyboardMove?.x ?? beforeKeyboardMove!.x) - beforeKeyboardMove!.x);
    })
    .not.toBe(0);
  await page.getByTestId("detection-kind-select").selectOption("button-or-input");
  await expect(page.getByTestId("undo-detection-edit")).toBeEnabled();
  await page.getByTestId("undo-detection-edit").click();
  await page.getByTestId("redo-detection-edit").click();
  await expect(page.getByTestId("detection-kind-select")).toHaveValue("button-or-input");
  await page.getByTestId("toggle-detection-include").click();
  await expect(page.getByTestId("detection-overlay-count")).toContainText(/active/i);
  await page.getByTestId("snap-detections-grid").click();

  const jsonDownloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-detections-json").click();
  const jsonDownload = await jsonDownloadPromise;
  expect(jsonDownload.suggestedFilename()).toMatch(/\.detections\.json$/);
  const jsonPath = await jsonDownload.path();
  expect(jsonPath).toBeTruthy();
  const exportedDetections = JSON.parse(await fs.readFile(jsonPath!, "utf8"));
  const exportedEditedElement = exportedDetections.detections.elements.find(
    (element: { id: string }) => element.id === editedDetectionId,
  );
  expect(exportedEditedElement.kind).toBe("button-or-input");
  expect(exportedEditedElement.included).toBe(false);
  expect(exportedEditedElement.userEdited).toBe(true);

  await page.getByRole("button", {
    name: /generate preview|regenerate preview/i,
  }).click();
  await expect(page.getByTestId("generated-comparison-preview")).toBeVisible();
  await expect(page.getByTestId("generated-mock-element").first()).toBeVisible();
  await expect(
    page.locator(
      `[data-testid="generated-mock-element"][data-detection-id="${editedDetectionId}"]`,
    ),
  ).toHaveCount(0);

  await page.getByTestId("toggle-detection-overlay").click();
  await expect(page.getByTestId("detection-box")).toHaveCount(0);

  await page.getByRole("button", { name: /copy all code/i }).click();
  await expect(page.getByText(/Component copied/i)).toBeVisible({
    timeout: 5_000,
  });

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("scaffold-export-panel").getByRole("button", { name: /download component/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/generated-.*\.tsx$/);

  const designMdDownloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-design-md").click();
  const designMdDownload = await designMdDownloadPromise;
  expect(designMdDownload.suggestedFilename()).toBe("DESIGN.md");
  const designMdPath = await designMdDownload.path();
  expect(designMdPath).toBeTruthy();
  const designMd = await fs.readFile(designMdPath!, "utf8");
  expect(designMd).toContain("# DESIGN.md");
  expect(designMd).toContain("## Component Inventory");
  expect(designMd).toContain("## E2E Contract");
  expect(designMd).toContain("Download DESIGN.md");

  const packageDownloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-handoff-bundle").click();
  const packageDownload = await packageDownloadPromise;
  expect(packageDownload.suggestedFilename()).toBe("qwen-ui-lab-export-package.zip");

  await page.getByTestId("gist-export-button").click();
  await expect(page.getByText(/GitHub Gist needs setup/i)).toBeVisible({
    timeout: 5_000,
  });

  const repoZipDownloadPromise = page.waitForEvent("download");
  await page.getByTestId("repo-export-button").click();
  const repoZipDownload = await repoZipDownloadPromise;
  expect(repoZipDownload.suggestedFilename()).toBe("qwen-ui-lab-export-package.zip");
  await expect(page.getByText(/Export package downloaded/i).first()).toBeVisible({
    timeout: 5_000,
  });

  await page.evaluate(() => {
    (window as typeof window & { __copiedText?: string }).__copiedText = undefined;
  });
  await page.getByTestId("copy-share-link").click();
  let copiedShareUrl: string | undefined;
  await expect
    .poll(
      async () => {
        copiedShareUrl = await page.evaluate(
          () => (window as typeof window & { __copiedText?: string }).__copiedText,
        );
        return copiedShareUrl ?? "";
      },
      { timeout: 10_000 },
    )
    .toContain("/share/");
  expect(copiedShareUrl).toContain("/share/");
  await page.goto(new URL(copiedShareUrl!).pathname);
  await expect(page.getByTestId("shared-detection-preview")).toBeVisible();
  await expect(
    page.locator(
      `[data-testid="shared-detection-element"][data-detection-id="${editedDetectionId}"]`,
    ),
  ).toHaveCount(0);
});

test("export package dialog keeps tabs and actions visible on mobile widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await waitForUploadFlowReady(page);

  const samplePath = path.join(
    process.cwd(),
    "public",
    "references",
    "dashboard-reference.png",
  );

  await page.locator('input[type="file"]').setInputFiles(samplePath);
  await page
    .getByRole("button", {
      name: /analyze & generate preview|generate preview|regenerate preview/i,
    })
    .click();

  await expect(page.getByText(/Generated component/i)).toBeVisible({
    timeout: 10_000,
  });

  await page.getByTestId("export-package-review").click();

  const dialog = page.getByRole("dialog", { name: /review export package/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /files/i })).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /changes/i })).toBeVisible();
  await expect(dialog.getByRole("tab", { name: /package notes/i })).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: /download package/i }),
  ).toBeVisible();

  const layout = await dialog.evaluate((node) => {
    const dialogRect = node.getBoundingClientRect();
    const tablist = node.querySelector('[role="tablist"]');
    const footer = node.querySelector('[data-testid="export-package-actions"]');
    const tablistRect = tablist?.getBoundingClientRect();
    const footerRect = footer?.getBoundingClientRect();

    return {
      pageHasHorizontalOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
      tablistInside:
        !!tablistRect &&
        tablistRect.left >= dialogRect.left - 1 &&
        tablistRect.right <= dialogRect.right + 1 &&
        tablistRect.top >= dialogRect.top - 1,
      footerInside:
        !!footerRect &&
        footerRect.left >= dialogRect.left - 1 &&
        footerRect.right <= dialogRect.right + 1 &&
        footerRect.bottom <= dialogRect.bottom + 1,
      touchTargets: Array.from(node.querySelectorAll("button, a"))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .every((element) => {
          const rect = element.getBoundingClientRect();
          return rect.height >= 34 || element.getAttribute("aria-label") === "Close";
        }),
    };
  });

  expect(layout).toEqual({
    pageHasHorizontalOverflow: false,
    tablistInside: true,
    footerInside: true,
    touchTargets: true,
  });
});

test("oversized uploads are rejected before analysis", async ({ page }) => {
  await page.goto("/");
  await waitForUploadFlowReady(page);

  await page.locator('input[type="file"]').setInputFiles({
    name: "oversized-dashboard.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(4 * 1024 * 1024 + 1),
  });

  await expect(page.getByText(/Upload an image up to 4 MB/i)).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /analyze & generate preview|generate preview|regenerate preview/i,
    }),
  ).toBeDisabled();
});

async function dragPointerBy(
  locator: Locator,
  page: Page,
  deltaX: number,
  deltaY: number,
) {
  const box = await locator.boundingBox();
  expect(box).toBeTruthy();
  const startX = box!.x + box!.width / 2;
  const startY = box!.y + box!.height / 2;
  await locator.dispatchEvent("pointerdown", {
    bubbles: true,
    cancelable: true,
    clientX: startX,
    clientY: startY,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    buttons: 1,
  });
  await page.evaluate(
    ({ clientX, clientY }) => {
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true,
          buttons: 1,
        }),
      );
    },
    { clientX: startX + deltaX, clientY: startY + deltaY },
  );
  await page.evaluate(
    ({ clientX, clientY }) => {
      window.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true,
          buttons: 0,
        }),
      );
    },
    { clientX: startX + deltaX, clientY: startY + deltaY },
  );
}

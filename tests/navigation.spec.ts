import { test, expect } from "@playwright/test";

test.describe("Navigation — App shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/index.html");
  });

  const pages = [
    { label: "Schools workspace", pageId: "page-explore" },
    { label: "Applications", pageId: "page-applications" },
    { label: "Materials workspace", pageId: "page-documents" },
    { label: "Timeline", pageId: "page-timeline" },
    { label: "Resources", pageId: "page-resources" },
    { label: "Profile", pageId: "page-profile" },
    { label: "Settings", pageId: "page-settings" },
  ];

  for (const { label, pageId } of pages) {
    test(`navigates to ${label}`, async ({ page }) => {
      await page.getByRole("button", { name: label }).click();
      await expect(page.locator(`#${pageId}`)).toBeVisible();
      await expect(page.locator(`#${pageId}`)).toHaveClass(/active/);
    });
  }

  test("Today nav item is active on load", async ({ page }) => {
    const todayBtn = page.getByRole("button", { name: "Today workspace" });
    await expect(todayBtn).toHaveClass(/active/);
  });

  test("active nav item updates when switching pages", async ({ page }) => {
    await page.getByRole("button", { name: "Schools workspace" }).click();
    const schoolsBtn = page.getByRole("button", { name: "Schools workspace" });
    await expect(schoolsBtn).toHaveClass(/active/);
    const todayBtn = page.getByRole("button", { name: "Today workspace" });
    await expect(todayBtn).not.toHaveClass(/active/);
  });

  test("⌘K search button is visible in topbar", async ({ page }) => {
    await expect(page.locator(".top-search")).toBeVisible();
    await expect(page.locator(".top-search .kbd")).toContainText("⌘K");
  });
});

test.describe("Navigation — Landing page (info.html)", () => {
  test("CTA button links to app", async ({ page }) => {
    await page.goto("/info.html");
    const ctaBtn = page.getByRole("link", { name: /get started|open workspace/i }).first();
    await expect(ctaBtn).toBeVisible();
  });

  test("page title contains TransferSpace", async ({ page }) => {
    await page.goto("/info.html");
    await expect(page).toHaveTitle(/TransferSpace/);
  });
});

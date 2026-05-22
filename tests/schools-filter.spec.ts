import { test, expect } from "@playwright/test";

test.describe("Schools — Search and filter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/index.html");
    await page.getByRole("button", { name: "Schools workspace" }).click();
    await expect(page.locator("#page-explore")).toBeVisible();
  });

  test("search input is visible and focusable", async ({ page }) => {
    const search = page.locator("#schoolSearch");
    await expect(search).toBeVisible();
    await search.click();
    await expect(search).toBeFocused();
  });

  test("typing in search filters the school grid", async ({ page }) => {
    const search = page.locator("#schoolSearch");
    const grid = page.locator("#schoolGrid");
    await search.fill("Harvard");
    await expect(grid).toContainText("Harvard");
  });

  test("clear button resets search", async ({ page }) => {
    const search = page.locator("#schoolSearch");
    await search.fill("Stanford");
    await page.locator(".search-clear").click();
    await expect(search).toHaveValue("");
  });

  test("empty state shows when no results match", async ({ page }) => {
    const search = page.locator("#schoolSearch");
    await search.fill("xxxxxxxxxnotaschool");
    await expect(page.locator("#schoolEmpty")).toBeVisible();
    await expect(page.locator("#schoolGrid")).not.toBeVisible();
  });

  test("reset filters button clears search and hides empty state", async ({
    page,
  }) => {
    await page.locator("#schoolSearch").fill("xxxxxxxxxnotaschool");
    await expect(page.locator("#schoolEmpty")).toBeVisible();
    await page.locator("#schoolEmpty .btn-primary").click();
    await expect(page.locator("#schoolEmpty")).not.toBeVisible();
    await expect(page.locator("#schoolGrid")).toBeVisible();
  });

  test("view toggle switches between grid and table", async ({ page }) => {
    const tableBtn = page.locator("#viewToggle button").last();
    await tableBtn.click();
    await expect(page.locator("#schoolTable")).toBeVisible();
    await expect(page.locator("#schoolGrid")).not.toBeVisible();
  });

  test("sort select renders without error", async ({ page }) => {
    const sort = page.locator("#sortSelect");
    await expect(sort).toBeVisible();
    await sort.selectOption("alpha");
    await expect(sort).toHaveValue("alpha");
  });

  test("region chips toggle active state on click", async ({ page }) => {
    const chip = page.locator('[data-filter="region"] .chip').first();
    await chip.click();
    await expect(chip).toHaveClass(/active/);
    await chip.click();
    await expect(chip).not.toHaveClass(/active/);
  });
});

test.describe("Schools — Mobile layout", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("school search is reachable on mobile", async ({ page }) => {
    await page.goto("/index.html");
    await page.locator('[data-page="schools"]').click();
    await expect(page.locator("#schoolSearch")).toBeVisible();
  });
});

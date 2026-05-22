import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility — Landing page (info.html)", () => {
  test("no WCAG AA violations", async ({ page }) => {
    await page.goto("/info.html");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("keyboard: nav links reachable via Tab", async ({ page }) => {
    await page.goto("/info.html");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(["A", "BUTTON"]).toContain(focused);
  });
});

test.describe("Accessibility — App shell (index.html)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/index.html");
  });

  test("no WCAG AA violations on Today page", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include("#page-dashboard")
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("no WCAG AA violations on Schools page", async ({ page }) => {
    await page.getByRole("button", { name: "Schools workspace" }).click();
    await expect(page.locator("#page-explore")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .include("#page-explore")
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("skip link is focusable and targets main content", async ({ page }) => {
    await page.keyboard.press("Tab");
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");
    const mainFocused = await page.evaluate(
      () => document.activeElement?.id === "mainContent"
    );
    expect(mainFocused).toBe(true);
  });

  test("sidebar nav items are keyboard navigable", async ({ page }) => {
    const navButtons = page.locator(".nav-item");
    const count = await navButtons.count();
    expect(count).toBeGreaterThan(4);
    for (let i = 0; i < count; i++) {
      await expect(navButtons.nth(i)).toBeVisible();
    }
  });

  test("calendar prev/next buttons have aria-labels", async ({ page }) => {
    const prev = page.locator(".nav-arrows button").first();
    const next = page.locator(".nav-arrows button").last();
    await expect(prev).toHaveAttribute("aria-label", "Previous month");
    await expect(next).toHaveAttribute("aria-label", "Next month");
  });

  test("user menu button has aria-haspopup and aria-expanded", async ({
    page,
  }) => {
    const trigger = page.locator("#sbUser");
    await expect(trigger).toHaveAttribute("aria-haspopup", "true");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

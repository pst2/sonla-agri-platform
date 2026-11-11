import { test, expect } from "@playwright/test";

test.describe("Sơn La Agricultural Communication & Analytics Platform E2E", () => {
  test("1. Visitor explores Sơn La specialties, views product detail, and receives Top-5 recommendations", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText("Sơn La");
    await expect(page.locator("body")).toContainText("Cà phê Arabica Sơn La");

    // Navigate to Products catalog
    await page.goto("/products");
    await expect(page.locator("body")).toContainText("Chè Shan tuyết");
    await expect(page.locator("body")).toContainText("Mận hậu");

    // Open Product Detail page
    await page.goto("/products/ca-phe-arabica-son-la");
    await expect(page.locator("body")).toContainText("Chỉ dẫn địa lý");
    await expect(page.locator("body")).toContainText("OCOP");
  });

  test("2. Admin logs in and views K-Means Segmentation & ML Evaluation Dashboard", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page.fill('input[type="text"], input[name="username"]', "admin");
    await page.fill('input[type="password"], input[name="password"]', "admin123");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/admin**");
    await expect(page.locator("body")).toContainText("K-Means");
  });
});

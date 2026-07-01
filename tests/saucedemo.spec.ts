import { test, expect } from "../src/self-heal/fixtures";
import { LoginPage } from "./pages/login.page";
import { InventoryPage } from "./pages/inventory.page";

test.describe("self-healing in real login flow", () => {
    test("logs in despite stale selectors", async ({ page, sh }) => {
    const login = new LoginPage(page, sh);
    const inventory = new InventoryPage(page, sh);

    await login.goto();
    await login.login("standard_user", "secret_sauce");

    // The username + login-button selectors were stale; healing recovered them.
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(await inventory.title()).toHaveText("Products");
  });

  test("adds an item to the cart via healed locators", async ({ page, sh }) => {
      const login = new LoginPage(page, sh);
      const inventory = new InventoryPage(page, sh);

      await login.goto();
      await login.login("standard_user", "secret_sauce");

      await (await inventory.addBackpackToCart()).click();
      await expect(await inventory.cartBadge()).toHaveText("1");
    });
  
  test("a genuinely missing element is NOT healed (fails loudly)", async ({ page, sh }) => {
    // This documents the most important guarantee: sh heals broken
    // *locators*, not broken *features*. With no valid fallback, it throws.
    await page.goto("https://www.saucedemo.com/");
    await expect(
      sh.find({
        key: "nonexistent.element",
        primary: "#this-never-existed",
        intent: "An element that genuinely does not exist on the page",
        fallbacks: { testId: "also-not-real" },
      }),
    ).rejects.toThrow(/Could not resolve/);
  });
});
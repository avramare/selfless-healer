import { test as base } from "@playwright/test";
import { SelfHeal } from "./engine";

/**
 * Adds a `sh` (self-heal) fixture to every test.
 * Page objects take it in their constructor and use `sh.find(descriptor)` instead of `page.locator(...)`.
 *
 *   import { test, expect } from "../src/self-heal/fixtures";
 *   test("...", async ({ page, sh }) => { ... });
 */
export const test = base.extend<{ sh: SelfHeal }>({
  sh: async ({ page }, use) => {
    await use(new SelfHeal(page));
  },
});

export { expect } from "@playwright/test";

import { Page } from '@playwright/test';
import type { SelfHeal } from '../../src/self-heal';

export class InventoryPage {
  constructor(
    private readonly page: Page,
    private readonly sf: SelfHeal
  ) { }

  url(): string {
    return this.page.url();
  }

  title() {
    return this.sf.find({
      key: 'inventory.title',
      primary: ".title--legacy", // real selector: .title
      intent: 'The "Products" page heading',
      fallbacks: { text: 'Products', role: { role: 'heading' } },
    })
  }

  addBackpackToCart() {
    return this.sf.find({
      key: 'inventory.addBackpackToCart',
      primary: "#add-backpack-btn--legacy",
      intent: "The 'Add to cart' button for the Sauce Labs Backpack",
      fallbacks: {
        testId: "add-to-cart-sauce-labs-backpack",
        role: { role: "button", name: "Add to cart" },
      },
    });
  }
  
  cartBadge() {
    return this.sf.find({
      key: "inventory.cartBadge",
      primary: ".shopping_cart_badge", // correct → tier 1
      intent: "The cart item-count badge",
      fallbacks: { css: [".shopping_cart_link .fa-layers-counter"] },
    });
  }
}
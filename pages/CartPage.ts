import { Locator, Page } from '@playwright/test';
import { AppHeader } from './components/AppHeader';

export class CartPage {
  readonly page: Page;
  readonly header: AppHeader;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new AppHeader(page);
    this.cartItems = page.locator('.cart_item');
    this.checkoutButton = page.locator('[data-test="checkout"]');
  }

  async getItemNames(): Promise<string[]> {
    return this.cartItems.locator('[data-test="inventory-item-name"]').allInnerTexts();
  }

  async getItemPrice(productName: string): Promise<string> {
    const item = this.cartItems.filter({ hasText: productName });
    return item.locator('[data-test="inventory-item-price"]').innerText();
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}

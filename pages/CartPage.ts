import { Locator, Page } from '@playwright/test';
import { AppHeader } from './components/AppHeader';

export class CartPage {
  readonly page: Page;
  readonly header: AppHeader;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new AppHeader(page);
    this.cartItems = page.locator('.cart_item');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  private toSlug(productName: string): string {
    return productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  async getItemNames(): Promise<string[]> {
    return this.cartItems.locator('[data-test="inventory-item-name"]').allInnerTexts();
  }

  async getItemPrice(productName: string): Promise<string> {
    const item = this.cartItems.filter({ hasText: productName });
    return item.locator('[data-test="inventory-item-price"]').innerText();
  }

  async getItemQuantity(productName: string): Promise<string> {
    const item = this.cartItems.filter({ hasText: productName });
    return item.locator('[data-test="item-quantity"]').innerText();
  }

  async removeProduct(productName: string) {
    await this.page.locator(`[data-test="remove-${this.toSlug(productName)}"]`).click();
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}

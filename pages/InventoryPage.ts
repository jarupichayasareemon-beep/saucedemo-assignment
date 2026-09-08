import { Locator, Page } from '@playwright/test';
import { AppHeader } from './components/AppHeader';

export class InventoryPage {
  readonly page: Page;
  readonly header: AppHeader;
  readonly pageTitle: Locator;
  readonly inventoryItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new AppHeader(page);
    this.pageTitle = page.locator('[data-test="title"]');
    this.inventoryItems = page.locator('.inventory_item');
  }

  private toSlug(productName: string): string {
    return productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  async addProductToCart(productName: string) {
    await this.page.locator(`[data-test="add-to-cart-${this.toSlug(productName)}"]`).click();
  }

  async removeProductFromCart(productName: string) {
    await this.page.locator(`[data-test="remove-${this.toSlug(productName)}"]`).click();
  }

  async getProductPrice(productName: string): Promise<string> {
    const item = this.inventoryItems.filter({ hasText: productName });
    return item.locator('[data-test="inventory-item-price"]').innerText();
  }

  isProductInCart(productName: string): Locator {
    return this.page.locator(`[data-test="remove-${this.toSlug(productName)}"]`);
  }
}

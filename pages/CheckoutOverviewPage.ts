import { Locator, Page } from '@playwright/test';

export class CheckoutOverviewPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('.cart_item');
    this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
    this.taxLabel = page.locator('[data-test="tax-label"]');
    this.totalLabel = page.locator('[data-test="total-label"]');
    this.finishButton = page.locator('[data-test="finish"]');
  }

  async getItemNames(): Promise<string[]> {
    return this.cartItems.locator('[data-test="inventory-item-name"]').allInnerTexts();
  }

  async getItemPrices(): Promise<number[]> {
    const priceTexts = await this.cartItems.locator('[data-test="inventory-item-price"]').allInnerTexts();
    return priceTexts.map((text) => parseFloat(text.replace('$', '')));
  }

  private async parseCurrencyLabel(locator: Locator): Promise<number> {
    const text = await locator.innerText();
    const match = text.match(/\$([\d.]+)/);
    return match ? parseFloat(match[1]) : NaN;
  }

  async getSubtotal(): Promise<number> {
    return this.parseCurrencyLabel(this.subtotalLabel);
  }

  async getTax(): Promise<number> {
    return this.parseCurrencyLabel(this.taxLabel);
  }

  async getTotal(): Promise<number> {
    return this.parseCurrencyLabel(this.totalLabel);
  }

  async finish() {
    await this.finishButton.click();
  }
}

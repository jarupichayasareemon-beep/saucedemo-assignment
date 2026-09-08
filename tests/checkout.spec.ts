import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInfoPage } from '../pages/CheckoutInfoPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { users } from '../test-data/testData';

// Automates the Checkout cases documented in TEST_CASES.md (CO-01 .. CO-06).

test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(page).toHaveURL(/inventory\.html/);

    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.header.goToCart();
    await page.locator('[data-test="checkout"]').click();
    await expect(page).toHaveURL(/checkout-step-one\.html/);
  });

  test.describe('Positive Cases', () => {
    test('CO-01: Cancel on Checkout Info returns to Cart', async ({ page }) => {
      const checkoutInfoPage = new CheckoutInfoPage(page);
      const cartPage = new CartPage(page);

      await checkoutInfoPage.cancel();

      await expect(page).toHaveURL(/cart\.html/);
      expect(await cartPage.getItemNames()).toEqual(['Sauce Labs Backpack']);
    });

    test('CO-02: Cancel on Checkout Overview returns to Inventory', async ({ page }) => {
      const checkoutInfoPage = new CheckoutInfoPage(page);
      const checkoutOverviewPage = new CheckoutOverviewPage(page);
      const inventoryPage = new InventoryPage(page);

      await checkoutInfoPage.fillInfo('John', 'Doe', '12345');
      await checkoutInfoPage.continueToOverview();
      await expect(page).toHaveURL(/checkout-step-two\.html/);

      await checkoutOverviewPage.cancel();

      // Documented asymmetry: unlike Cancel on step one, this lands on Inventory, not Cart.
      await expect(page).toHaveURL(/inventory\.html/);
      await expect(inventoryPage.header.cartBadge).toHaveText('1');
    });

    test('CO-03: cart is cleared after completing an order', async ({ page }) => {
      const checkoutInfoPage = new CheckoutInfoPage(page);
      const checkoutOverviewPage = new CheckoutOverviewPage(page);
      const checkoutCompletePage = new CheckoutCompletePage(page);
      const cartPage = new CartPage(page);

      await checkoutInfoPage.fillInfo('John', 'Doe', '12345');
      await checkoutInfoPage.continueToOverview();
      await checkoutOverviewPage.finish();
      await expect(page).toHaveURL(/checkout-complete\.html/);

      await checkoutCompletePage.backToProducts();

      await expect(page).toHaveURL(/inventory\.html/);
      await expect(page.locator('.shopping_cart_badge')).toBeHidden();

      await page.locator('.shopping_cart_link').click();
      expect(await cartPage.getItemNames()).toEqual([]);
    });

    test('CO-04: Checkout Overview shows correct static payment/shipping info', async ({ page }) => {
      const checkoutInfoPage = new CheckoutInfoPage(page);
      const checkoutOverviewPage = new CheckoutOverviewPage(page);

      await checkoutInfoPage.fillInfo('John', 'Doe', '12345');
      await checkoutInfoPage.continueToOverview();

      await expect(checkoutOverviewPage.paymentInfoValue).toHaveText('SauceCard #31337');
      await expect(checkoutOverviewPage.shippingInfoValue).toHaveText('Free Pony Express Delivery!');
    });
  });

  test.describe('Negative Cases', () => {
    test('CO-05: First Name of only whitespace is accepted (documented gap)', async ({ page }) => {
      const checkoutInfoPage = new CheckoutInfoPage(page);

      await checkoutInfoPage.fillInfo('   ', 'Doe', '12345');
      await checkoutInfoPage.continueToOverview();

      await expect(page).toHaveURL(/checkout-step-two\.html/);
      await expect(checkoutInfoPage.errorMessage).toHaveCount(0);
    });

    test('CO-06: Postal Code accepts non-numeric input (documented gap)', async ({ page }) => {
      const checkoutInfoPage = new CheckoutInfoPage(page);

      await checkoutInfoPage.fillInfo('John', 'Doe', 'ABCDE');
      await checkoutInfoPage.continueToOverview();

      await expect(page).toHaveURL(/checkout-step-two\.html/);
      await expect(checkoutInfoPage.errorMessage).toHaveCount(0);
    });
  });
});

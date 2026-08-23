import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInfoPage } from '../pages/CheckoutInfoPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { users, customerInfo, productsToPurchase } from '../test-data/testData';

test.describe('Sauce Demo — place an order successfully', () => {
  test('user can complete a full purchase journey from login to logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutInfoPage = new CheckoutInfoPage(page);
    const checkoutOverviewPage = new CheckoutOverviewPage(page);
    const checkoutCompletePage = new CheckoutCompletePage(page);

    // Assignment step 1: Login
    await test.step('Login with valid credentials', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await expect(page).toHaveURL(/inventory\.html/);
      await expect(inventoryPage.pageTitle).toHaveText('Products');
    });

    const expectedPrices: Record<string, string> = {};

    // Assignment step 2: Select Products
    await test.step('Add at least two different products to the cart', async () => {
      for (const product of productsToPurchase) {
        expectedPrices[product] = await inventoryPage.getProductPrice(product);
        await inventoryPage.addProductToCart(product);
      }
      await expect(inventoryPage.header.cartBadge).toHaveText(String(productsToPurchase.length));
    });

    // Assignment step 3: Review Cart
    await test.step('Review the cart', async () => {
      await inventoryPage.header.goToCart();

      await expect(page).toHaveURL(/cart\.html/);
      const cartItemNames = await cartPage.getItemNames();
      expect(cartItemNames.sort()).toEqual([...productsToPurchase].sort());

      for (const product of productsToPurchase) {
        await expect.soft(cartPage.getItemPrice(product)).resolves.toBe(expectedPrices[product]);
      }
    });

    // Assignment step 4: Checkout
    await test.step('Proceed through checkout with valid customer information', async () => {
      await cartPage.checkout();
      await expect(page).toHaveURL(/checkout-step-one\.html/);

      await checkoutInfoPage.fillInfo(
        customerInfo.firstName,
        customerInfo.lastName,
        customerInfo.postalCode
      );
      await checkoutInfoPage.continueToOverview();

      await expect(page).toHaveURL(/checkout-step-two\.html/);
    });

    // Assignment step 5: Verify Pricing
    await test.step('Verify pricing on the checkout overview page', async () => {
      const overviewItemNames = await checkoutOverviewPage.getItemNames();
      expect(overviewItemNames.sort()).toEqual([...productsToPurchase].sort());

      const itemPrices = await checkoutOverviewPage.getItemPrices();
      const subtotal = await checkoutOverviewPage.getSubtotal();
      const tax = await checkoutOverviewPage.getTax();
      const total = await checkoutOverviewPage.getTotal();

      const sumOfItemPrices = itemPrices.reduce((sum, price) => sum + price, 0);
      expect(subtotal).toBeCloseTo(sumOfItemPrices, 2);
      expect(total).toBeCloseTo(subtotal + tax, 2);
    });

    // Assignment step 6: Complete Order
    await test.step('Complete the order', async () => {
      await checkoutOverviewPage.finish();

      await expect(page).toHaveURL(/checkout-complete\.html/);
      await expect(checkoutCompletePage.completeHeader).toHaveText('Thank you for your order!');
    });

    // Assignment step 7: Logout
    await test.step('Logout', async () => {
      await checkoutCompletePage.header.logout();

      await expect(page).toHaveURL('https://www.saucedemo.com/');
      await expect(loginPage.loginButton).toBeVisible();
    });
  });
});

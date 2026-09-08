import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInfoPage } from '../pages/CheckoutInfoPage';
import { users } from '../test-data/testData';

// Automates the cases documented in TEST_CASES.md (TC-01 .. TC-17).

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test.describe('Positive Cases', () => {
    test('TC-01: add a single product to the cart', async ({ page }) => {
      const inventoryPage = new InventoryPage(page);

      await inventoryPage.addProductToCart('Sauce Labs Backpack');

      await expect(inventoryPage.header.cartBadge).toHaveText('1');
      await expect(inventoryPage.isProductInCart('Sauce Labs Backpack')).toBeVisible();
    });

    test('TC-02: add multiple different products to the cart', async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const products = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];

      for (const product of products) {
        await inventoryPage.addProductToCart(product);
      }

      await expect(inventoryPage.header.cartBadge).toHaveText(String(products.length));
      for (const product of products) {
        await expect(inventoryPage.isProductInCart(product)).toBeVisible();
      }
    });

    test('TC-03: cart page shows correct item details', async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);
      const products = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];
      const expectedPrices: Record<string, string> = {};

      for (const product of products) {
        expectedPrices[product] = await inventoryPage.getProductPrice(product);
        await inventoryPage.addProductToCart(product);
      }

      await inventoryPage.header.goToCart();

      const cartItemNames = await cartPage.getItemNames();
      expect(cartItemNames.sort()).toEqual([...products].sort());

      for (const product of products) {
        await expect(cartPage.getItemPrice(product)).resolves.toBe(expectedPrices[product]);
        await expect(cartPage.getItemQuantity(product)).resolves.toBe('1');
      }
    });

    test('TC-04: remove an item from the Cart page', async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

      await inventoryPage.addProductToCart('Sauce Labs Backpack');
      await inventoryPage.addProductToCart('Sauce Labs Bike Light');
      await inventoryPage.header.goToCart();

      await cartPage.removeProduct('Sauce Labs Backpack');

      const remainingNames = await cartPage.getItemNames();
      expect(remainingNames).toEqual(['Sauce Labs Bike Light']);
      await expect(inventoryPage.header.cartBadge).toHaveText('1');
    });

    test('TC-05: remove an item directly from the Inventory page', async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

      await inventoryPage.addProductToCart('Sauce Labs Backpack');
      await inventoryPage.removeProductFromCart('Sauce Labs Backpack');

      await expect(inventoryPage.header.cartBadge).toBeHidden();

      await inventoryPage.header.goToCart();
      expect(await cartPage.getItemNames()).toEqual([]);
    });

    test('TC-06: "Continue Shopping" preserves cart contents', async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

      await inventoryPage.addProductToCart('Sauce Labs Backpack');
      await inventoryPage.header.goToCart();

      await cartPage.continueShopping();

      await expect(page).toHaveURL(/inventory\.html/);
      await expect(inventoryPage.header.cartBadge).toHaveText('1');
    });

    test('TC-07: cart contents survive a page reload', async ({ page }) => {
      const inventoryPage = new InventoryPage(page);

      await inventoryPage.addProductToCart('Sauce Labs Backpack');
      await page.reload();

      await expect(inventoryPage.header.cartBadge).toHaveText('1');
      await expect(inventoryPage.isProductInCart('Sauce Labs Backpack')).toBeVisible();
    });

    test('TC-08: cart contents survive logout then login', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);

      await inventoryPage.addProductToCart('Sauce Labs Backpack');
      await inventoryPage.header.logout();

      await expect(page).toHaveURL('https://www.saucedemo.com/');
      await loginPage.login(users.standard.username, users.standard.password);

      await expect(inventoryPage.header.cartBadge).toHaveText('1');
    });

    test('TC-09: Checkout button proceeds with items in cart', async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

      await inventoryPage.addProductToCart('Sauce Labs Backpack');
      await inventoryPage.header.goToCart();

      await cartPage.checkout();

      await expect(page).toHaveURL(/checkout-step-one\.html/);
    });

    test('TC-10: add then remove then re-add leaves no stale state', async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

      await inventoryPage.addProductToCart('Sauce Labs Backpack');
      await inventoryPage.removeProductFromCart('Sauce Labs Backpack');
      await inventoryPage.addProductToCart('Sauce Labs Backpack');

      await expect(inventoryPage.header.cartBadge).toHaveText('1');

      await inventoryPage.header.goToCart();
      expect(await cartPage.getItemNames()).toEqual(['Sauce Labs Backpack']);
    });
  });

  test.describe('Negative Cases', () => {
    test('TC-11: Checkout with an empty cart is not blocked', async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

      await inventoryPage.header.goToCart();
      expect(await cartPage.getItemNames()).toEqual([]);

      await cartPage.checkout();

      // Documented gap: the app proceeds to checkout with no items and no warning.
      await expect(page).toHaveURL(/checkout-step-one\.html/);
    });

    test('TC-12: Checkout Overview reachable without completing Checkout Info', async ({ page }) => {
      await page.goto('/checkout-step-two.html');

      // Documented gap: no redirect/guard back to checkout-step-one.
      await expect(page).toHaveURL(/checkout-step-two\.html/);
    });

    test('TC-13: Order Complete page reachable without finishing checkout', async ({ page }) => {
      await page.goto('/checkout-complete.html');

      // Documented gap: the confirmation page renders even though no order was placed.
      await expect(page).toHaveURL(/checkout-complete\.html/);
    });

    test('TC-14: Checkout Info — empty First Name', async ({ page }) => {
      const checkoutInfoPage = new CheckoutInfoPage(page);
      await page.goto('/checkout-step-one.html');

      await checkoutInfoPage.continueToOverview();

      await expect(checkoutInfoPage.errorMessage).toHaveText('Error: First Name is required');
      await expect(page).toHaveURL(/checkout-step-one\.html/);
    });

    test('TC-15: Checkout Info — empty Last Name', async ({ page }) => {
      const checkoutInfoPage = new CheckoutInfoPage(page);
      await page.goto('/checkout-step-one.html');

      await checkoutInfoPage.firstNameInput.fill('John');
      await checkoutInfoPage.continueToOverview();

      await expect(checkoutInfoPage.errorMessage).toHaveText('Error: Last Name is required');
    });

    test('TC-16: Checkout Info — empty Postal Code', async ({ page }) => {
      const checkoutInfoPage = new CheckoutInfoPage(page);
      await page.goto('/checkout-step-one.html');

      await checkoutInfoPage.firstNameInput.fill('John');
      await checkoutInfoPage.lastNameInput.fill('Doe');
      await checkoutInfoPage.continueToOverview();

      await expect(checkoutInfoPage.errorMessage).toHaveText('Error: Postal Code is required');
    });

    test('TC-17: dismissing the validation error', async ({ page }) => {
      const checkoutInfoPage = new CheckoutInfoPage(page);
      await page.goto('/checkout-step-one.html');

      await checkoutInfoPage.continueToOverview();
      await expect(checkoutInfoPage.errorMessage).toBeVisible();

      await checkoutInfoPage.dismissError();

      await expect(checkoutInfoPage.errorMessage).toBeHidden();
    });
  });
});

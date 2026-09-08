# Test Cases — Shopping Cart & Checkout Features

Covers two features on [saucedemo.com](https://www.saucedemo.com/): the **Shopping Cart**
(adding/removing items, cart contents, persistence) and **Checkout**
(customer info form, overview, cancel paths, order completion).

Environment: `standard_user` / `secret_sauce`, Chromium, https://www.saucedemo.com

Legend — **Priority**: P1 (blocks the purchase flow) · P2 (should work correctly) · P3 (edge case / worth flagging)

## Feature: Shopping Cart

### Positive Cases

| ID | Title | Preconditions | Steps | Expected Result | Priority |
|----|-------|---------------|-------|------------------|----------|
| TC-01 | Add a single product to the cart | Logged in, on Inventory page, cart empty | 1. Click **Add to cart** on any product | Cart badge shows `1`; the button on that product changes to **Remove** | P1 |
| TC-02 | Add multiple different products to the cart | Logged in, on Inventory page, cart empty | 1. Click **Add to cart** on 2+ different products | Cart badge count equals the number of products added; each product's button changes to **Remove** | P1 |
| TC-03 | Cart page shows correct item details | 2 products added to cart | 1. Click the cart icon | Cart page lists exactly the added products, each with correct name, description, price, and quantity `1` (matching what was shown on the Inventory page) | P1 |
| TC-04 | Remove an item from the Cart page | 2+ products in cart | 1. Go to Cart page 2. Click **Remove** on one item | That item disappears from the cart list; badge count decreases by 1 | P1 |
| TC-05 | Remove an item directly from the Inventory page | 1+ product in cart | 1. On Inventory page, click **Remove** on a product already in the cart | Button reverts to **Add to cart**; badge count decreases by 1; item no longer appears on Cart page | P2 |
| TC-06 | "Continue Shopping" preserves cart contents | 1+ product in cart, on Cart page | 1. Click **Continue Shopping** | Returns to Inventory page; cart badge count is unchanged | P2 |
| TC-07 | Cart contents survive a page reload | 1 product in cart | 1. Reload the page (F5) | Cart badge still shows the same count; item is still present on the Cart page | P2 |
| TC-08 | Cart contents survive logout → login | 1 product in cart | 1. Logout 2. Log back in with the same account | Cart badge still shows the item added before logout | P3 — confirm this matches intended behavior (cart is stored client-side, not tied to a server session) |
| TC-09 | Checkout button proceeds with items in cart | 1+ product in cart, on Cart page | 1. Click **Checkout** | Navigates to `checkout-step-one.html` | P1 |
| TC-10 | Adding then removing the same product doesn't leave stale state | Cart empty | 1. Add a product 2. Remove it 3. Add it again | Badge shows `1` (not `2`), only one entry for that product on the Cart page | P2 |

### Negative Cases

| ID | Title | Preconditions | Steps | Expected Result | Priority |
|----|-------|---------------|-------|------------------|----------|
| TC-11 | Checkout with an empty cart | Logged in, cart empty | 1. Go to Cart page 2. Click **Checkout** | **Actual (verified):** app proceeds to `checkout-step-one.html` anyway, with no items and no warning. **Flag as a gap:** an empty order should arguably be blocked with a message — confirm with product owner whether this is intended | P3 |
| TC-12 | Checkout Overview reachable without completing Checkout Info | Logged in | 1. Navigate directly to `/checkout-step-two.html` via URL, skipping step one | **Actual (verified):** page loads with no redirect/guard back to step one | P3 — missing route guard |
| TC-13 | Order Complete page reachable without finishing checkout | Logged in | 1. Navigate directly to `/checkout-complete.html` via URL | **Actual (verified):** the confirmation page renders even though no order was placed | P3 — missing route guard |
| TC-14 | Checkout Info — empty First Name | On `checkout-step-one.html`, all fields empty | 1. Click **Continue** without filling anything | Error banner: `Error: First Name is required`; user stays on the same page | P1 |
| TC-15 | Checkout Info — empty Last Name | First Name filled, Last Name and Postal Code empty | 1. Click **Continue** | Error banner: `Error: Last Name is required` | P1 |
| TC-16 | Checkout Info — empty Postal Code | First Name and Last Name filled, Postal Code empty | 1. Click **Continue** | Error banner: `Error: Postal Code is required` | P1 |
| TC-17 | Dismissing the validation error | Any of TC-14–16 triggered | 1. Click the **X** on the error banner | Error banner closes; form fields keep whatever was typed | P3 |

## Feature: Checkout

### Positive Cases

| ID | Title | Preconditions | Steps | Expected Result | Priority |
|----|-------|---------------|-------|------------------|----------|
| CO-01 | Cancel on Checkout Info returns to Cart | 1 item in cart, on `checkout-step-one.html` | 1. Click **Cancel** | **Actual (verified):** returns to `cart.html`; the item is still in the cart | P2 |
| CO-02 | Cancel on Checkout Overview returns to Inventory | 1 item in cart, filled Checkout Info, on `checkout-step-two.html` | 1. Click **Cancel** | **Actual (verified):** returns to `inventory.html` (not the Cart page) with the item still in the cart — a different destination than CO-01 for what is nominally the same action; worth confirming this asymmetry is intentional | P3 |
| CO-03 | Cart is cleared after completing an order | 1 item in cart, reached `checkout-complete.html` via **Finish** | 1. Click **Back Home** | Returns to Inventory page; cart badge is gone and the cart is empty — the completed order's items are no longer in the cart | P1 |
| CO-04 | Checkout Overview shows correct static payment/shipping info | On `checkout-step-two.html` | 1. Read the Payment Information and Shipping Information rows | Payment Information reads `SauceCard #31337`; Shipping Information reads `Free Pony Express Delivery!` | P2 |

### Negative Cases

| ID | Title | Preconditions | Steps | Expected Result | Priority |
|----|-------|---------------|-------|------------------|----------|
| CO-05 | First Name of only whitespace is accepted | On `checkout-step-one.html` | 1. Fill First Name with `"   "` (spaces only), Last Name and Postal Code with valid values 2. Click **Continue** | **Actual (verified):** no validation error; proceeds to `checkout-step-two.html`. **Flag as a gap:** the "required" check does not trim whitespace, so a blank-looking name passes | P3 |
| CO-06 | Postal Code accepts non-numeric input | On `checkout-step-one.html` | 1. Fill Postal Code with letters (e.g. `ABCDE`), fill First/Last Name with valid values 2. Click **Continue** | **Actual (verified):** no validation error; proceeds to `checkout-step-two.html`. The field only checks for "non-empty", not a valid postal code format | P3 |

## Notes

- TC-11 through TC-13, CO-02, CO-05, and CO-06 are not implementation bugs necessarily —
  they're documented gaps discovered by exploring the app directly (verified with Playwright
  against the live site on 2026-08-25), included here because a thorough QA pass should surface
  missing guardrails even when they're outside the original assignment's happy-path scope.
- These cases describe *manual/exploratory* test intent. `tests/purchase-flow.spec.ts` already
  automates the happy-path subset relevant to the end-to-end purchase journey (TC-01, TC-02,
  TC-03, TC-09), and `tests/cart.spec.ts` / `tests/checkout.spec.ts` automate the rest, using the
  existing `CartPage`, `InventoryPage`, `CheckoutInfoPage`, and `CheckoutOverviewPage` objects in
  `pages/`.

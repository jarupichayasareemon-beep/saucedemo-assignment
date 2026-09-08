# Sauce Demo — Automated E2E Test

End-to-end test suite for [saucedemo.com](https://www.saucedemo.com/): the full purchase
journey (login → add products to cart → review cart → checkout → verify pricing → complete
order → logout), plus a focused Positive/Negative test suite for the **Shopping Cart** and
**Checkout** features.

Built with [Playwright](https://playwright.dev/) + TypeScript, using the Page Object Model to
keep interactions with the site (selectors, actions) separate from the tests' assertions and
flow.

## Project structure

```
pages/                       Page objects — one class per screen, plus a shared header component
  components/AppHeader.ts      Burger menu / cart link / logout, present on every logged-in page
  LoginPage.ts
  InventoryPage.ts
  CartPage.ts
  CheckoutInfoPage.ts
  CheckoutOverviewPage.ts
  CheckoutCompletePage.ts

test-data/testData.ts        Credentials, customer info, and the products used by the tests

tests/
  purchase-flow.spec.ts        The full end-to-end purchase journey, broken into test.step()s
  cart.spec.ts                 Shopping Cart: Positive (TC-01..10) and Negative (TC-11..17) cases
  checkout.spec.ts             Checkout: Positive (CO-01..04) and Negative (CO-05..06) cases

TEST_CASES.md                 Test case documentation the cart/checkout specs are traced to
playwright.config.ts          Base URL, trace/screenshot settings, browser projects
```

Page objects expose actions and raw data (e.g. `getItemPrices()`), but assertions live in the
test files — this keeps each test readable as a single source of truth for "what should be true
at each step," while page objects stay reusable across all three spec files.

## How to run

```bash
npm install
npx playwright install chromium   # first time only, installs the browser binary
npm test                          # runs all 24 tests across the 3 spec files
```

Run a single spec file, or a single case by name:

```bash
npx playwright test tests/cart.spec.ts
npx playwright test tests/checkout.spec.ts -g "CO-03"
```

Useful variants:

```bash
npx playwright test --headed      # watch it run in a real browser window
npx playwright test --ui          # interactive mode: step through, inspect each action
npx playwright test --debug       # step through with the Playwright inspector
npx playwright show-report        # open the HTML report from the last run
```

On failure, Playwright captures a screenshot and trace automatically (configured in
`playwright.config.ts`); view a trace with `npx playwright show-trace <path>`.

## Test case documentation

[TEST_CASES.md](TEST_CASES.md) lists the Positive and Negative test cases for the Shopping Cart
and Checkout features in table form (ID, preconditions, steps, expected result, priority),
independent of the Playwright code. A few cases document **actual, verified gaps** in the app
rather than confirmed passes — e.g. checkout proceeds with an empty cart, and the Checkout Info
form accepts a whitespace-only name or a non-numeric postal code. Every TC-/CO- ID in that file
has a matching automated test in `cart.spec.ts` / `checkout.spec.ts`.

## Assumptions

- Tested against the `standard_user` account. The other seeded accounts (`locked_out_user`,
  `problem_user`, `performance_glitch_user`, etc.) exercise different bugs/edge cases and are
  out of scope for this assignment.
- Checkout customer info (name, postal code) is static test data by default; specific invalid
  values (empty fields, whitespace-only, non-numeric postal code) are used deliberately in the
  Negative cases to probe validation.
- "Pricing is presented clearly and consistently" is verified by asserting the line-item prices
  on the cart and overview screens match the prices originally shown on the product listing, and
  that subtotal + tax = total on the overview page — rather than hardcoding expected dollar
  amounts, so the tests don't break if Sauce Labs changes product prices.
- The tests run against the public saucedemo.com site (`baseURL` in `playwright.config.ts`);
  no local environment or mock server is needed.
- Single browser (Chromium) project for this assignment. The structure (page objects +
  data-driven config) generalizes to more browsers or scenarios without rework.

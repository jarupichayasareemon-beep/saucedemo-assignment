# Sauce Demo — Automated E2E Test

End-to-end test for [saucedemo.com](https://www.saucedemo.com/) covering the full purchase
journey: login → add products to cart → review cart → checkout → verify pricing → complete
order → logout.

Built with [Playwright](https://playwright.dev/) + TypeScript, using the Page Object Model to
keep interactions with the site (selectors, actions) separate from the test's assertions and
flow.

## Project structure

```
pages/                    Page objects — one class per screen, plus a shared header component
  components/AppHeader.ts   Burger menu / cart link / logout, present on every logged-in page
  LoginPage.ts
  InventoryPage.ts
  CartPage.ts
  CheckoutInfoPage.ts
  CheckoutOverviewPage.ts
  CheckoutCompletePage.ts
test-data/testData.ts     Credentials, customer info, and the products used by the test
tests/purchase-flow.spec.ts  The end-to-end scenario, broken into test.step()s
playwright.config.ts      Base URL, trace/screenshot settings, browser projects
```

Page objects expose actions and raw data (e.g. `getItemPrices()`), but assertions live in the
test file — this keeps the test readable as a single source of truth for "what should be true
at each step," while page objects stay reusable across future tests.

## How to run

```bash
npm install
npx playwright install chromium   # first time only, installs the browser binary
npm test                          # runs playwright test
```

Useful variants:

```bash
npx playwright test --headed      # watch it run in a real browser window
npx playwright test --debug       # step through with the Playwright inspector
npx playwright show-report        # open the HTML report from the last run
```

On failure, Playwright captures a screenshot and trace automatically (configured in
`playwright.config.ts`); view a trace with `npx playwright show-trace <path>`.

## Assumptions

- Tested against the `standard_user` account. The other seeded accounts (`locked_out_user`,
  `problem_user`, `performance_glitch_user`, etc.) exercise different bugs/edge cases and are
  out of scope for this "happy path" scenario.
- Checkout customer info (name, postal code) is static test data since the site doesn't
  validate it beyond "non-empty" — no need to generate it dynamically.
- "Pricing is presented clearly and consistently" is verified by asserting the line-item prices
  on the cart and overview screens match the prices originally shown on the product listing, and
  that subtotal + tax = total on the overview page — rather than hardcoding expected dollar
  amounts, so the test doesn't break if Sauce Labs changes product prices.
- The test runs against the public saucedemo.com site (`baseURL` in `playwright.config.ts`);
  no local environment or mock server is needed.
- Single scenario, single browser (Chromium) project for this assignment. The structure
  (page objects + data-driven config) generalizes to more scenarios/browsers without rework.

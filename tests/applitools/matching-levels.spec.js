import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import {
  BatchInfo,
  BrowserType,
  Configuration,
  DeviceName,
  Eyes,
  ScreenOrientation,
  Target,
  VisualGridRunner,
} from '@applitools/eyes-playwright';

dotenv.config();

const APPLITOOLS_API_KEY = process.env.APPLITOOLS_API_KEY;
const APP_NAME = 'Fast React Pizza';
const BATCH_NAME = `QE Assignment Matching Levels - ${new Date()
  .toISOString()
  .slice(0, 10)}`;

const runner = new VisualGridRunner({ testConcurrency: 5 });

const menuFixture = [
  {
    id: 1,
    name: 'Margherita',
    unitPrice: 12,
    ingredients: ['tomato', 'mozzarella', 'basil'],
    soldOut: false,
    imageUrl: 'https://placehold.co/120x120?text=Margherita',
  },
  {
    id: 2,
    name: 'Pepperoni',
    unitPrice: 14,
    ingredients: ['tomato', 'mozzarella', 'pepperoni'],
    soldOut: false,
    imageUrl: 'https://placehold.co/120x120?text=Pepperoni',
  },
  {
    id: 3,
    name: 'Veggie Deluxe',
    unitPrice: 13,
    ingredients: ['tomato', 'mushroom', 'onion', 'pepper'],
    soldOut: true,
    imageUrl: 'https://placehold.co/120x120?text=Veggie',
  },
];

function createOrderFixture(overrides = {}) {
  return {
    id: 'TEST123',
    status: 'preparing',
    priority: false,
    priorityPrice: 0,
    orderPrice: 26,
    estimatedDelivery: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
    cart: [
      {
        id: 101,
        pizzaId: 1,
        name: 'Margherita',
        quantity: 1,
        totalPrice: 12,
      },
      {
        id: 102,
        pizzaId: 2,
        name: 'Pepperoni',
        quantity: 1,
        totalPrice: 14,
      },
    ],
    ...overrides,
  };
}

function buildConfig() {
  const config = new Configuration();
  config.setApiKey(APPLITOOLS_API_KEY);
  config.setAppName(APP_NAME);
  config.setBatch(
    new BatchInfo({
      name: BATCH_NAME,
    })
  );

  // Add a small multi-browser matrix so the experiment can show cross-browser capability.
  config.addBrowser(1280, 720, BrowserType.CHROME);
  config.addBrowser(1024, 768, BrowserType.FIREFOX);
  config.addDeviceEmulation(
    DeviceName.iPhone_14_Pro,
    ScreenOrientation.PORTRAIT
  );

  return config;
}

async function openEyes(page, testName) {
  const eyes = new Eyes(runner);
  eyes.setConfiguration(buildConfig());
  await eyes.open(page, APP_NAME, testName);
  return eyes;
}

async function mockMenuApi(page) {
  await page.route('**/api/menu', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: menuFixture,
      }),
    });
  });
}

async function mockOrderApis(page, orderData = createOrderFixture()) {
  await page.route('**/api/order', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          id: orderData.id,
        },
      }),
    });
  });

  await page.route('**/api/order/*', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: orderData,
        }),
      });
      return;
    }

    if (method === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: null,
        }),
      });
      return;
    }

    await route.fallback();
  });
}

async function goToMenu(page) {
  await mockMenuApi(page);
  await page.goto('/');
  await page.getByPlaceholder('Your full name').fill('Visual QA Student');
  await page.getByRole('button', { name: 'Start ordering' }).click();
  await expect(page.getByText('Margherita')).toBeVisible();
}

async function addItemsAndOpenCart(page) {
  await goToMenu(page);

  // Click by pizza row so re-rendering after the first add does not break index-based locators.
  await page
    .locator('li', { hasText: 'Margherita' })
    .getByRole('button', { name: 'Add to cart' })
    .click();
  await page
    .locator('li', { hasText: 'Pepperoni' })
    .getByRole('button', { name: 'Add to cart' })
    .click();

  await page.getByRole('link', { name: /open cart/i }).click();
  await expect(page.getByText('Your cart, Visual QA Student')).toBeVisible();
}

test.describe('Applitools matching-level experiment', () => {
  test.skip(
    !APPLITOOLS_API_KEY,
    'Set APPLITOOLS_API_KEY in .env to run Applitools tests.'
  );

  test('Strict: Home page visual baseline', async ({ page }) => {
    const eyes = await openEyes(page, 'Strict - Home Page');

    try {
      await page.goto('/');
      await expect(page.getByText('The best pizza.')).toBeVisible();

      await eyes.check('Strict - Home', Target.window().fully().strict());
      await eyes.close(false);
    } finally {
      await eyes.abortIfNotClosed();
    }
  });

  test('Layout: Menu page structure check', async ({ page }) => {
    const eyes = await openEyes(page, 'Layout - Menu Page');

    try {
      await goToMenu(page);

      await eyes.check(
        'Layout - Menu structure',
        Target.window().fully().layout()
      );
      await eyes.close(false);
    } finally {
      await eyes.abortIfNotClosed();
    }
  });

  test('IgnoreColors: Menu text-focused check', async ({ page }) => {
    const eyes = await openEyes(page, 'IgnoreColors - Menu Main Area');

    try {
      await goToMenu(page);

      await eyes.check(
        'IgnoreColors - Main menu area',
        Target.region('main').ignoreColors()
      );
      await eyes.close(false);
    } finally {
      await eyes.abortIfNotClosed();
    }
  });

  test('Strict: Cart page after adding orders', async ({ page }) => {
    const eyes = await openEyes(page, 'Strict - Cart With Items');

    try {
      await addItemsAndOpenCart(page);

      await eyes.check('Strict - Cart page', Target.window().fully().strict());
      await eyes.close(false);
    } finally {
      await eyes.abortIfNotClosed();
    }
  });

  test('Layout: Order details page', async ({ page }) => {
    const eyes = await openEyes(page, 'Layout - Order Details');
    const orderData = createOrderFixture({ id: 'VISUAL456' });

    try {
      await mockMenuApi(page);
      await mockOrderApis(page, orderData);
      await page.goto('/order/VISUAL456');
      await expect(
        page.getByRole('heading', { name: /order #visual456 status/i })
      ).toBeVisible();

      await eyes.check(
        'Layout - Order status page',
        Target.window().fully().layout()
      );
      await eyes.close(false);
    } finally {
      await eyes.abortIfNotClosed();
    }
  });

  test('IgnoreColor: Order complete flow (Create -> Complete)', async ({
    page,
  }) => {
    const eyes = await openEyes(page, 'IgnoreColor - Order Complete Flow');
    const completedOrder = createOrderFixture({
      id: 'COMPLETE999',
      status: 'preparing',
    });

    try {
      await mockMenuApi(page);
      await mockOrderApis(page, completedOrder);

      await addItemsAndOpenCart(page);
      await page.getByRole('link', { name: 'Order pizzas' }).click();
      await expect(
        page.getByRole('heading', { name: /ready to order\? let's go!/i })
      ).toBeVisible();

      await page.locator('input[name="customer"]').fill('Visual QA Student');
      await page.locator('input[name="phone"]').fill('+1 555 123 4567');
      await page.locator('input[name="address"]').fill('42 Applitools Avenue');
      await page.getByRole('button', { name: /order now for/i }).click();

      await expect(
        page.getByRole('heading', { name: /order #complete999 status/i })
      ).toBeVisible();

      await eyes.check(
        'IgnoreColor - Order complete page',
        Target.window().fully().ignoreColors()
      );
      await eyes.close(false);
    } finally {
      await eyes.abortIfNotClosed();
    }
  });

  test.afterAll(async () => {
    if (!APPLITOOLS_API_KEY) return;

    const summary = await runner.getAllTestResults(false);
    // Prints a concise summary link and counts in the terminal for your results slide.
    console.log(summary.toString());
  });
});

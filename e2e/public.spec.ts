import { expect, test } from '@playwright/test';
import { fakeSupabase } from './fakeSupabase';

test.beforeEach(async ({ page }) => {
  await fakeSupabase(page);
});

test('the landing page leads to the sign-in screen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar' }).first().click();

  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByText('Entre para acessar seus dados')).toBeVisible();
});

test('a protected page sends signed-out visitors to sign in', async ({ page }) => {
  await page.goto('/galeria');

  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByLabel('E-mail')).toBeVisible();
});

test('an unknown public portfolio shows a friendly not-found message', async ({ page }) => {
  await page.goto('/p/nao-existe');
  await expect(page.getByRole('heading', { name: 'Portfólio não encontrado' })).toBeVisible();
});

test('the about page is reachable directly', async ({ page }) => {
  const response = await page.goto('/sobre');
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

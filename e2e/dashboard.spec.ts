import { expect, test, type Page } from '@playwright/test';
import { fakeSupabase, profileRow, signInBeforeLoad, TEST_USER } from './fakeSupabase';

async function openTab(page: Page, name: string) {
  const menuButton = page.getByRole('button', { name: 'Abrir menu', exact: true });
  if (await menuButton.isVisible()) await menuButton.click();
  await page.getByRole('link', { name, exact: true }).first().click();
}

test('signing in with e-mail and password opens the dashboard', async ({ page }) => {
  await fakeSupabase(page, { profiles: [profileRow()] });
  await page.goto('/entrar');

  await page.getByLabel('E-mail').fill(TEST_USER.email);
  await page.getByLabel('Senha', { exact: true }).fill('uma-senha-segura');
  await page.locator('form').getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('Olá, Ana Souza')).toBeVisible();
  await expect(page).toHaveURL(/\/certificados$/);
});

test.describe('signed in', () => {
  test.beforeEach(async ({ page }) => {
    await signInBeforeLoad(page);
  });

  test('each tab has its own URL, and the back button returns to the previous tab', async ({ page }) => {
    await fakeSupabase(page, { profiles: [profileRow()] });
    await page.goto('/');
    await expect(page.getByText('Nenhum certificado encontrado')).toBeVisible();

    await openTab(page, 'Prompts');
    await expect(page).toHaveURL(/\/prompts$/);
    await expect(page.getByText('Nenhum prompt encontrado')).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/certificados$/);
    await expect(page.getByText('Nenhum certificado encontrado')).toBeVisible();
  });

  test('a deep link opens that tab directly', async ({ page }) => {
    await fakeSupabase(page, { profiles: [profileRow()] });
    await page.goto('/desafios');
    await expect(page.getByRole('heading', { name: 'Desafios' })).toBeVisible();
  });

  test('a new certificate is saved and listed', async ({ page }) => {
    const db = await fakeSupabase(page, { profiles: [profileRow()] });
    await page.goto('/certificados');

    await page.getByRole('button', { name: 'Novo certificado' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Título do Certificado *').fill('Google Cloud Digital Leader');
    await dialog.getByLabel('Emissor / Organização').fill('Google Cloud');
    await dialog.getByRole('button', { name: 'Salvar' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Google Cloud Digital Leader' })).toBeVisible();
    expect(db.certificates).toEqual([
      expect.objectContaining({ title: 'Google Cloud Digital Leader', issuer: 'Google Cloud', user_id: TEST_USER.id }),
    ]);
  });

  test('signing out returns to the public landing page', async ({ page }) => {
    await fakeSupabase(page, { profiles: [profileRow()] });
    await page.goto('/certificados');

    await page.getByRole('button', { name: 'Abrir menu da conta' }).click();
    await page.getByRole('button', { name: 'Sair da conta' }).click();

    await expect(page.getByRole('button', { name: 'Entrar' }).first()).toBeVisible();
  });
});

test.describe('desktop layout', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');
  test.beforeEach(async ({ page }) => {
    await signInBeforeLoad(page);
  });

  for (const collapsed of [false, true]) {
    test(`the ${collapsed ? 'collapsed' : 'expanded'} sidebar scrolls on its own, not the window`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 360 });
      await page.addInitScript((value) => localStorage.setItem('gsa_sidebar_collapsed', value), String(collapsed));
      await fakeSupabase(page, { profiles: [profileRow()] });
      await page.goto('/certificados');

      const nav = page.locator('#app-sidebar nav');
      await expect(nav).toBeVisible();
      const metrics = await nav.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
        return {
          overflows: el.scrollHeight > el.clientHeight,
          scrolled: el.scrollTop > 0,
          horizontal: el.scrollWidth > el.clientWidth,
          windowScrolls: document.documentElement.scrollHeight > window.innerHeight,
        };
      });
      expect(metrics).toEqual({ overflows: true, scrolled: true, horizontal: false, windowScrolls: false });

      const header = await page.getByRole('banner').boundingBox();
      expect(header?.width).toBe(1280);
    });
  }
});

test.describe('Grupo de Estudos', () => {
  test.beforeEach(async ({ page }) => {
    await signInBeforeLoad(page);
  });

  test('the quick access buttons share the row with the Guia / Meus eventos tabs', async ({ page, isMobile }) => {
    if (isMobile) await page.setViewportSize({ width: 360, height: 740 });
    await fakeSupabase(page, { profiles: [profileRow()] });
    await page.goto('/grupo-de-estudos');

    const tabs = page.getByRole('tablist', { name: 'Seções do guia' });
    const bar = page.getByRole('navigation', { name: 'Acesso rápido' });
    await expect(tabs).toBeVisible();
    await expect(bar).toBeVisible();

    const [tabsBox, barBox] = [await tabs.boundingBox(), await bar.boundingBox()];
    expect(Math.abs(tabsBox!.y + tabsBox!.height / 2 - (barBox!.y + barBox!.height / 2))).toBeLessThan(4);
    expect(barBox!.x).toBeGreaterThan(tabsBox!.x + tabsBox!.width);

    const overflow = await bar.evaluate((el) => {
      const inner = el.firstElementChild as HTMLElement;
      return inner.scrollWidth - inner.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

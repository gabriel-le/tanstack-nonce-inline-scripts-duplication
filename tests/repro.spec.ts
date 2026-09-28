import { expect, test } from '@playwright/test'
import { NONCE, POLICY } from '../src/csp'

// These assertions confirm the reported bug on the pinned, unpatched version.
for (const mode of ['none', 'meta', 'header'] as const) {
  test(`${mode}: ${mode === 'header' ? 'duplicates' : 'deduplicates'} the route script`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const response = await page.goto(`/?mode=${mode}`)
    expect(response?.status()).toBe(200)
    expect(response?.headers()['content-security-policy']).toBe(mode === 'header' ? POLICY : undefined)
    // Verify the original inline counter exists in the server response.
    expect(await response?.text()).toContain('window.__reproRuns = (window.__reproRuns || 0) + 1;')
    const output = page.getByTestId('scripts')
    await expect(output).not.toHaveText('Waiting for hydration…')
    const scripts = JSON.parse(await output.innerText())
    expect(scripts).toHaveLength(mode === 'header' ? 1 : 0)
    if (mode === 'header') {
      expect(scripts[0]).toMatchObject({ nonceAttribute: '', nonceProperty: NONCE })
      expect(scripts[0].text).toContain('window.__reproRuns')
    }
    await expect(page.getByTestId('runs')).toHaveText(mode === 'header' ? '2' : '1')
    await page.getByRole('button', { name: 'Clicked 0 times' }).click()
    await expect(page.getByRole('button')).toHaveText('Clicked 1 times')
    expect(errors).toEqual([])
  })
}

test('Trusted Types rejects the duplicate script text assignment', async ({ page }) => {
  const response = await page.goto('/?mode=trusted-types')
  expect(response?.headers()['content-security-policy']).toBe(`${POLICY}; require-trusted-types-for 'script'`)
  await expect(page.getByText('Something went wrong!')).toBeVisible()
  await page.getByRole('button', { name: 'Show Error' }).click()
  await expect(page.locator('body')).toContainText('TrustedScript')
  await expect(page.locator('body')).toContainText('textContent')
})

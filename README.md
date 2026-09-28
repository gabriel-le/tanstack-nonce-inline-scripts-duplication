# TanStack inline scripts are duplicated with a CSP header

Minimal TanStack Start reproduction using the latest npm releases checked on September 28, 2026, pinned for repeatability:

- `@tanstack/react-router` **1.170.40**
- `@tanstack/react-start` **1.168.59**
- `react` / `react-dom` **19.3.0**

The page defines one inline route script that increments `window.__reproRuns`. It should run once, during SSR document parsing. Hydration should recognize the existing script and avoid executing it again.

## Run

Use Node.js 22.12+ and npm.

```sh
npm ci
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000). Use the production build for this reproduction; Vite's development scripts introduce additional CSP and Trusted Types concerns.

The page has four links. Each performs a full document navigation so the response policy changes.

| URL | Policy | Observed behavior on the affected version |
| --- | --- | --- |
| `/?mode=header` | CSP response header | Counter is **2**; a duplicate script remains in `<head>` |
| `/?mode=meta` | Same CSP in a meta tag | Counter is **1**; no duplicate in `<head>` |
| `/?mode=none` | No CSP, but the same router nonce | Counter is **1**; no duplicate in `<head>` |
| `/?mode=trusted-types` | Header CSP plus `require-trusted-types-for 'script'` | TanStack's error boundary replaces the page |

For the Trusted Types case, click **Show Error**. Chromium reports:

```text
This document requires 'TrustedScript' assignment.
```

The exact browser wording may differ. No Trusted Types policy is installed by the repro.

## What triggers it

The relevant application code is:

```tsx
// src/router.tsx
createRouter({ routeTree, ssr: { nonce: NONCE } })

// src/routes/index.tsx
scripts: () => [{
  'data-repro': 'inline-counter',
  children: 'window.__reproRuns = (window.__reproRuns || 0) + 1;',
}]
```

`src/server.ts` adds the response header. `src/routes/__root.tsx` renders `<HeadContent />` and `<Scripts />`, and adds the meta policy only in the meta control. `src/csp.ts` holds the shared policy and a fixed demonstration nonce. A real application should generate a fresh nonce for each response.

In the header case, the page displays the duplicate's `nonceAttribute` as `""` and `nonceProperty` as the original nonce. The HTML standard's [nonce-hiding behavior](https://html.spec.whatwg.org/multipage/urls-and-fetching.html#nonce-attributes) explains the difference. Router's `Script` comparison reads `getAttribute('nonce')`, so it misses the existing server-rendered element and creates another one. Trusted Types rejects the subsequent `script.textContent` assignment.

The page diagnostics only read the DOM. There are no patched dependencies or patched browser APIs. React eventually removes the original SSR script, so the execution count proves duplication even though two copies do not remain in the DOM.

## Automated verification

```sh
npx playwright install chromium
npm test
npm run typecheck
npm run check
```

`npm test` builds the production app, starts it on port 3000, and checks all four cases in Chromium. Keep that port free. The tests **assert the existing bug**, so passing means the reproduction succeeded. After an upstream fix, the header and Trusted Types tests should fail until their expectations are updated.

Verified with Chromium 153.0.8010.12. Other browsers have not been tested in this reproduction.

## Note for the issue report

This version of Start emits an external client-entry script with `src`. The reproduction therefore uses the route's `scripts` option with `children`, which still reaches the affected `Script` lookup. It does not demonstrate duplication of Start's client entry on every page in the latest release. Update that claim separately from the version numbers.

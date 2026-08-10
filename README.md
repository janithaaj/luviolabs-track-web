This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## E2E tests (Playwright)

Smoke UI tests live in `e2e/`. They hit the real Nest API.

**Prerequisites**

1. API running on **http://localhost:4000** (sibling repo `luvio-tracker-api`, with seed users).
2. FE is started automatically on **http://localhost:3001** by Playwright (`webServer`), or reuse an existing Next server on that port.

```bash
# Terminal 1 — API
cd ../luvio-tracker-api && npm run start:dev   # or: node dist/main.js

# Terminal 2 — e2e (starts/reuses Next on :3001)
cd ../luvio-tracker
npm run test:e2e
# Interactive UI:
npm run test:e2e:ui
```

**Credentials** (defaults match seed data; override via env or `e2e/.env` — not committed):

| Var | Default |
| --- | --- |
| `PLAYWRIGHT_ADMIN_EMAIL` | `admin@luvio.com` |
| `PLAYWRIGHT_ADMIN_PASSWORD` | `admin123` |
| `PLAYWRIGHT_EMPLOYEE_EMAIL` | `employee@luvio.com` |
| `PLAYWRIGHT_EMPLOYEE_PASSWORD` | `employee123` |

See `e2e/.env.example`.

**CI:** `.github/workflows/test.yml` runs `lint` + `next build` on every push/PR. The `e2e` job checks out the sibling API repo (`<owner>/luvio-tracker-api`, overridable via `workflow_dispatch` input `api_repository`), starts Mongo + seeded Nest on `:4000`, then runs Playwright. Private API repos need a PAT in secret `API_CHECKOUT_TOKEN`. Seed credentials above are used as CI defaults.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

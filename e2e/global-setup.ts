/**
 * Fail fast with a clear message when the Nest API is not reachable.
 * Playwright does not start the API — it must already listen on :4000.
 */
async function globalSetup() {
  const apiBase =
    process.env.PLAYWRIGHT_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000/api/v1';

  const email = process.env.PLAYWRIGHT_ADMIN_EMAIL?.trim();
  const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD?.trim();
  if (!email || !password) {
    throw new Error(
      [
        'Missing PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD.',
        'Copy e2e/.env.example → e2e/.env and set credentials that match your seeded admin.',
      ].join('\n')
    );
  }

  try {
    const res = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${text.slice(0, 200)}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      [
        `Nest API is not reachable at ${apiBase} (${message}).`,
        'Start the sibling API on port 4000 before running e2e:',
        '  cd ../luvio-tracker-api && ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed && npm run start:dev',
      ].join('\n')
    );
  }
}

export default globalSetup;

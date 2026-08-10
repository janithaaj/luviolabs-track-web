/**
 * Fail fast with a clear message when the Nest API is not reachable.
 * Playwright does not start the API — it must already listen on :4000.
 */
async function globalSetup() {
  const apiBase =
    process.env.PLAYWRIGHT_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000/api/v1';

  try {
    const res = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.PLAYWRIGHT_ADMIN_EMAIL || 'admin@luvio.com',
        password: process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'admin123',
      }),
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
        '  cd ../luvio-tracker-api && npm run start:dev',
        'Seed users: admin@luvio.com / admin123, employee@luvio.com / employee123',
      ].join('\n')
    );
  }
}

export default globalSetup;

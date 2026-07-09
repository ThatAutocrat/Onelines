// Pings Supabase with a trivial read so the free-tier project
// doesn't get auto-paused for inactivity.
//
// Requires env vars SUPABASE_URL and SUPABASE_ANON_KEY (set as
// GitHub Actions secrets — see .github/workflows/keep-alive.yml).

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars')
  process.exit(1)
}

// Any small existing table works — profiles is a good pick since it's
// tiny and always present per supabase_schema.sql. We only fetch 1 row.
const endpoint = `${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`

try {
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })

  if (!res.ok) {
    console.error(`Ping failed: ${res.status} ${res.statusText}`)
    const body = await res.text()
    console.error(body)
    process.exit(1)
  }

  const data = await res.json()
  console.log(`Ping succeeded at ${new Date().toISOString()}. Rows returned: ${data.length}`)
} catch (err) {
  console.error('Ping errored:', err)
  process.exit(1)
}

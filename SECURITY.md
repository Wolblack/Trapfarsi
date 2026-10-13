# Security policy

## Reporting a vulnerability

Do not publish exploit details or credentials in a public issue. Until a private security contact is configured, keep reports limited to the repository owner and avoid including real listener data. Add a monitored security email or private reporting channel before a public launch.

## Security boundaries

- Only the Supabase publishable/anon key belongs in `supabase-config.js`. Never commit `service_role`, provider API keys, passwords, or tokens.
- The optional lyric endpoint expects Supabase JWT verification to remain enabled and fails closed if the server-side rate-limit store is unavailable.
- Database RLS is part of the security model. Apply `supabase-schema.sql` and verify policies against two separate test accounts before enabling public writes.
- Client-side checks are not a security boundary. Validate permissions, limits, ownership, and user input server-side.
- Configure provider spending limits and monitor abuse. IP-fingerprint rate limiting is a baseline, not a substitute for WAF controls, abuse monitoring, and provider quotas.

## Launch requirements

1. Rotate any secret that was ever committed or exposed.
2. Verify RLS for every table with anonymous and authenticated test users.
3. Test authentication redirect URLs and sign-out behavior.
4. Add rate limits and moderation workflows for public posting/report intake.
5. Keep dependencies and the Supabase Edge Function runtime updated.

# Transactional Email (sign-in links, codes, reminders)

SusuFlow sends transactional email through a pluggable provider chain in
`src/lib/mail.ts`:

1. **Resend** — when `RESEND_API_KEY` is set. Preferred (best inbox deliverability).
2. **SMTP** — when `SMTP_HOST` is set (cPanel / self-hosted / any SMTP).
3. **Dev console** — when `NODE_ENV=development` and neither is set (prints links/codes).

## Resend setup (recommended)

1. Create an account at [resend.com](https://resend.com).
2. Create an API key (Settings → API Keys) and set `RESEND_API_KEY` in `.env`.
3. **Verify your domain** at **resend.com/domains** → Add Domain → `giscop.com`.
   Resend gives you DNS records (SPF/DKIM/MX) to add in Cloudflare.
4. Set `MAIL_FROM_ADDRESS="SusuFlow <no-reply@giscop.com>"`.

> **Important:** until `giscop.com` is verified, Resend only sends to your
> account's own test email address. Without verification, `no-reply@giscop.com`
> cannot email arbitrary recipients — this is Resend's anti-spam guard.

## cPanel SMTP (fallback, known deliverability limits)

The cPanel/shared-host SMTP server (`mail.giscop.com`) accepts mail with `250 OK`,
but shared-host IPs are frequently blocklisted and `giscop.com`'s SPF did not
include the actual sending IP, so external delivery to Gmail was unreliable.
Prefer Resend for production sign-in email.
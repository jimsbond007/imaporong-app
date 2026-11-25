# Email verification with Google (Gmail) SMTP

iMaporong sends its verification emails through **Supabase Auth**, and Supabase
delivers them through **Google's SMTP server**. Nothing about Google lives in
the app's code or `.env` files: the App Password is stored only in the Supabase
dashboard, so there is no secret to leak from the repo.

```
Resident registers → Supabase Auth → smtp.gmail.com → resident's inbox
Resident clicks link → /auth/confirm → session + role check → portal
```

## 1. Google account

Use a dedicated address for the barangay (e.g. `imaporong.noreply@gmail.com`)
rather than a personal one. Your normal Google password will **not** work for
SMTP; you need an App Password.

1. Open <https://myaccount.google.com/security> and turn on **2-Step
   Verification** (required for App Passwords).
2. Open <https://myaccount.google.com/apppasswords>, name it `imaporong-supabase`
   and click **Create**.
3. Copy the 16-character password (shown once). Spaces don't matter.

> Google Workspace accounts: if the App Passwords page is missing, your
> administrator has disabled it. Ask them to allow it, or use a personal Gmail
> account instead.

## 2. Supabase

**Authentication → Emails → SMTP Settings** (older dashboards: *Project
Settings → Authentication → SMTP Settings*). Enable custom SMTP:

| Field | Value |
| --- | --- |
| Sender email | the Gmail address from step 1 |
| Sender name | `iMaporong · Barangay Maporong` |
| Host | `smtp.gmail.com` |
| Port | `465` (or `587`) |
| Username | the full Gmail address |
| Password | the 16-character App Password |

Gmail always sends from the authenticated account, so the sender email must be
that same Gmail address. Only the display name can be customised.

Then check these:

- **Authentication → Sign In / Providers → Email**: *Confirm email* is **on**.
- **Authentication → URL Configuration**:
  - *Site URL*: your production URL, e.g. `https://imaporong.example`
  - *Redirect URLs*: add `https://imaporong.example/auth/callback` and
    `http://localhost:3000/auth/callback`
- **Authentication → Emails → Templates → Confirm signup**: set the subject to
  `Confirm your iMaporong account` and paste the body from
  `supabase/email-templates/confirm-signup.html`.
- **Authentication → Rate Limits**: after enabling custom SMTP Supabase applies
  a low default email limit (around 30/hour). Raise it if needed, but note
  Gmail's own cap below.

## Gmail sending limits

Free Gmail accounts can send roughly **500 emails per day** (Google Workspace
about 2,000). That is plenty for a barangay portal, but a burst of sign-ups
past the cap will fail until the next day. If you outgrow it, switch to a
transactional provider; no app code changes are needed, only the SMTP fields.

## 3. Test it

1. Register at `/auth?mode=register` with an address you can read.
2. Expect "We sent a verification link to …" and a 60-second resend timer.
3. Open the email and click **Confirm my email**: you should land on `/dashboard`.
4. Try signing in with another unconfirmed account: the form explains the email
   is not confirmed and offers **Resend verification email**.
5. Check the Gmail account's **Sent** folder and Supabase **Logs → Auth** if
   something doesn't arrive.

## What the app does

- `AuthForm` passes `emailRedirectTo`, shows the resend button (60 s cooldown),
  detects already-registered addresses, and handles `email_not_confirmed`.
- `app/auth/confirm/route.ts` verifies the `token_hash` and applies the same
  resident/admin role gate as sign-in. `?error=verify` shows an expired-link message.
- `app/auth/callback/route.ts` still handles Google sign-in and the default
  Supabase link format, so either template style works.
- Email verification is separate from a barangay staff verifying a resident
  record (`profiles.is_verified`); that flow is unchanged.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| "Error sending confirmation email" on register | Used the normal Google password instead of an App Password, or the username isn't the full Gmail address |
| App Passwords page not available | 2-Step Verification is off, or a Workspace admin disabled it |
| Email arrives in spam | Brand-new account sending its first messages; mark one as "Not spam", and keep the template plain as provided |
| Link says invalid/expired | Links are single-use and expire (default 1 hour); use **Resend** |
| Link opens the homepage instead of signing in | Redirect URL not in the allow-list, or the Site URL is wrong |
| Sign-ups suddenly stop sending | Daily Gmail limit reached; wait or move to a transactional provider |

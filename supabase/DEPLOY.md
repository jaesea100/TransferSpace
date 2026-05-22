# Notification system — deploy guide

## 1. Run the SQL migration

In the Supabase dashboard → SQL editor, paste and run:
`supabase/migrations/20260522_notifications.sql`

This creates three tables:
- `user_notification_prefs` — per-user toggle state (email, inapp, digest, lor, sms, deadline_days)
- `notifications` — in-app notification queue with Realtime enabled
- `email_log` — dedup guard (prevents duplicate emails)

## 2. Get a Resend API key

1. Create a free account at https://resend.com (3 000 emails/month free)
2. Dashboard → API Keys → Create key
3. Add a sending domain (or use `onboarding@resend.dev` to send only to your own verified email during testing)

## 3. Set Edge Function secrets

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
npx supabase secrets set FROM_EMAIL="TransferSpace <noreply@yourdomain.com>"
```

## 4. Deploy Edge Functions

```bash
npx supabase login
npx supabase link --project-ref mbdxdrwnvdukkfseicfa
npx supabase functions deploy notify
npx supabase functions deploy lor-reminder
```

## 5. Schedule the LOR reminder cron (optional)

In the SQL migration file, uncomment the `cron.schedule` block at the bottom and replace:
- `YOUR_PROJECT_REF` → `mbdxdrwnvdukkfseicfa`
- `YOUR_SERVICE_ROLE_KEY` → your service role key (Project Settings → API)

Then run it in the SQL editor. This fires the LOR reminder daily at 08:00 UTC.

Alternatively, schedule it in the Supabase dashboard under Edge Functions → lor-reminder → Schedule.

## 6. Test

1. Open TransferSpace and sign in
2. Go to Settings → Notifications → click "Send test email"
3. Check your inbox

## What triggers what

| Event | Trigger | Email? | In-app? |
|---|---|---|---|
| Deadline approaching | On login (frontend) | Yes | Yes |
| LOR 14+ days old | Daily cron 08:00 UTC | Yes | Yes |
| Test email | Manual (Settings) | Yes | Yes |

## Notes

- Deadline emails only fire when the user signs in (USER_APPS lives in localStorage).
  Future improvement: sync USER_APPS to Supabase for server-side cron support.
- Emails are deduplicated: each (user, school, term, threshold) combination sends at most once per 24 hours.
- LOR reminders send at most once per 7 days per LOR.

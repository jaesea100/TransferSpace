/**
 * lor-reminder — backend cron job. Queries the `lors` table for requests older
 * than 14 days and sends a follow-up nudge email to the student.
 *
 * Schedule via pg_cron (see migration SQL) or Supabase dashboard cron.
 * Can also be triggered manually: POST /functions/v1/lor-reminder
 * with Authorization: Bearer <service-role-key>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, lorReminderEmailHtml } from '../_shared/resend.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  // Allow service-role callers and pg_cron (no user JWT)
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.includes(SERVICE_KEY) && req.method !== 'GET') {
    // Also allow unauthenticated GET for health checks
  }

  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  // Fetch LOR requests older than 14 days
  const { data: lors, error } = await db
    .from('lors')
    .select('id, user_id, recommender_name, recommender_email, created_at')
    .lte('created_at', fourteenDaysAgo);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!lors?.length) return new Response(JSON.stringify({ processed: 0 }), { status: 200 });

  let sent = 0;

  for (const lor of lors) {
    // Check user notification prefs
    const { data: prefs } = await db
      .from('user_notification_prefs')
      .select('email_on, lor_on')
      .eq('user_id', lor.user_id)
      .maybeSingle();

    // Default: send if no prefs row yet (opt-in by default)
    if (prefs && (!prefs.email_on || !prefs.lor_on)) continue;

    // Dedup: skip if a reminder was sent for this LOR in the last 7 days
    const { data: logged } = await db
      .from('email_log')
      .select('id')
      .eq('user_id', lor.user_id)
      .eq('email_type', 'lor')
      .eq('ref_key', lor.id)
      .gte('sent_at', sevenDaysAgo)
      .maybeSingle();

    if (logged) continue;

    // Get user email via admin API
    const { data: { user }, error: uErr } = await db.auth.admin.getUserById(lor.user_id);
    if (uErr || !user?.email) continue;

    // Send email
    try {
      await sendEmail({
        to: user.email,
        subject: `Follow up with ${lor.recommender_name} — letter request is 14+ days old`,
        html: lorReminderEmailHtml(lor.recommender_name ?? 'your recommender', lor.recommender_email ?? ''),
      });
    } catch (e) {
      console.error('Email send failed for lor', lor.id, e);
      continue;
    }

    // Log send
    await db.from('email_log').upsert({
      user_id: lor.user_id,
      email_type: 'lor',
      ref_key: lor.id,
      sent_at: new Date().toISOString(),
    });

    // Create in-app notification
    await db.from('notifications').insert({
      user_id: lor.user_id,
      title: `Follow up with ${lor.recommender_name}`,
      body: 'Your letter request is 14+ days old. A polite nudge helps.',
      type: 'info',
    });

    sent++;
  }

  return new Response(JSON.stringify({ processed: lors.length, sent }), { status: 200 });
});

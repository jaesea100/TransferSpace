/**
 * notify — called from the TransferSpace frontend to send emails + create in-app notifications.
 *
 * Setup:
 *   supabase secrets set RESEND_API_KEY=re_xxxx
 *   supabase secrets set FROM_EMAIL="TransferSpace <noreply@yourdomain.com>"
 *   supabase functions deploy notify
 *
 * Resend: https://resend.com — free tier: 3 000 emails/month.
 * The FROM_EMAIL domain must be verified in your Resend dashboard.
 * For local testing you can send to your own address using onboarding@resend.dev.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, deadlineEmailHtml } from '../_shared/resend.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  // Verify caller is an authenticated user
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: cors });

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user?.email) return new Response('Unauthorized', { status: 401, headers: cors });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad request', { status: 400, headers: cors });
  }

  const type = body.type as string;
  const results: Record<string, unknown> = {};

  // ── Deadline reminder ──────────────────────────────────────────────────────
  if (type === 'deadline') {
    const deadlines = body.deadlines as Array<{
      schoolId: string; school: string; term: string; daysLeft: number; date: string;
    }>;
    if (!deadlines?.length) return new Response(JSON.stringify({ skipped: 'no deadlines' }), { headers: cors });

    // Check user email pref
    const { data: prefs } = await admin
      .from('user_notification_prefs')
      .select('email_on')
      .eq('user_id', user.id)
      .maybeSingle();
    if (prefs && prefs.email_on === false) {
      return new Response(JSON.stringify({ skipped: 'email off' }), { headers: cors });
    }

    // Dedup: skip schools already emailed today for this daysLeft threshold
    const toSend: typeof deadlines = [];
    for (const d of deadlines) {
      const refKey = `${d.schoolId}-${d.term.toLowerCase()}-${d.daysLeft}`;
      const yesterday = new Date(Date.now() - 23 * 3600 * 1000).toISOString();
      const { data: logged } = await admin
        .from('email_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('email_type', 'deadline')
        .eq('ref_key', refKey)
        .gte('sent_at', yesterday)
        .maybeSingle();
      if (!logged) toSend.push(d);
    }

    if (toSend.length === 0) {
      return new Response(JSON.stringify({ skipped: 'already sent' }), { headers: cors });
    }

    // Send email
    const subject = toSend.length === 1
      ? `${toSend[0].school} ${toSend[0].term} deadline in ${toSend[0].daysLeft} day${toSend[0].daysLeft === 1 ? '' : 's'}`
      : `${toSend.length} upcoming transfer deadlines`;

    await sendEmail({ to: user.email, subject, html: deadlineEmailHtml(toSend) });

    // Log each sent entry
    await admin.from('email_log').insert(
      toSend.map(d => ({
        user_id: user.id,
        email_type: 'deadline',
        ref_key: `${d.schoolId}-${d.term.toLowerCase()}-${d.daysLeft}`,
      }))
    );

    // Create in-app notification
    const notifTitle = toSend.length === 1
      ? `${toSend[0].school} ${toSend[0].term} deadline in ${toSend[0].daysLeft} day${toSend[0].daysLeft === 1 ? '' : 's'}`
      : `${toSend.length} upcoming deadlines`;
    const notifBody = toSend.map(d => `${d.school}: ${d.daysLeft}d`).join(' · ');

    await admin.from('notifications').insert({
      user_id: user.id,
      title: notifTitle,
      body: notifBody,
      type: 'warning',
    });

    results.sent = toSend.length;
  }

  // ── Test ping ──────────────────────────────────────────────────────────────
  if (type === 'test') {
    await sendEmail({
      to: user.email,
      subject: 'TransferSpace notifications are working',
      html: `<p style="font-family:sans-serif;padding:2rem;">Email notifications are configured correctly for <strong>${user.email}</strong>. You're all set.</p>`,
    });
    await admin.from('notifications').insert({
      user_id: user.id,
      title: 'Email test sent',
      body: `Test email delivered to ${user.email}`,
      type: 'success',
    });
    results.sent = 1;
  }

  return new Response(JSON.stringify(results), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});

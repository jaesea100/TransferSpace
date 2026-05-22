const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM = Deno.env.get('FROM_EMAIL') ?? 'TransferSpace <noreply@transferspace.app>';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!RESEND_KEY) throw new Error('RESEND_API_KEY secret not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: payload.to, subject: payload.subject, html: payload.html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

// --- Email HTML builders ---

export function deadlineEmailHtml(deadlines: { school: string; term: string; daysLeft: number; date: string }[]): string {
  const rows = deadlines.map(d => `
    <tr>
      <td style="padding:.7rem .5rem;border-bottom:1px solid #E8E5DC;color:#1a1a1a;font-weight:500;">${d.school}</td>
      <td style="padding:.7rem .5rem;border-bottom:1px solid #E8E5DC;color:#4B4A46;">${d.term}</td>
      <td style="padding:.7rem .5rem;border-bottom:1px solid #E8E5DC;color:#2563EB;font-weight:600;white-space:nowrap;">${d.daysLeft === 1 ? 'Tomorrow' : `${d.daysLeft} days`}</td>
      <td style="padding:.7rem .5rem;border-bottom:1px solid #E8E5DC;color:#7A7871;font-size:.85rem;">${d.date}</td>
    </tr>`).join('');

  const headline = deadlines.length === 1
    ? `${deadlines[0].school} deadline in ${deadlines[0].daysLeft === 1 ? '1 day' : `${deadlines[0].daysLeft} days`}.`
    : `${deadlines.length} upcoming transfer deadlines.`;

  return wrapEmail(`
    <p style="color:#4B4A46;font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;font-weight:600;margin:0 0 .6rem;">Upcoming deadline${deadlines.length > 1 ? 's' : ''}</p>
    <h1 style="font-size:1.45rem;color:#1a1a1a;margin:0 0 1.5rem;line-height:1.2;letter-spacing:-.02em;">${headline}</h1>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #E8E5DC;border-radius:8px;overflow:hidden;margin-bottom:1.75rem;">
      <thead><tr style="background:#F5F3EE;">
        <th style="padding:.6rem .5rem;text-align:left;font-size:.75rem;color:#7A7871;font-weight:600;letter-spacing:.06em;text-transform:uppercase;">School</th>
        <th style="padding:.6rem .5rem;text-align:left;font-size:.75rem;color:#7A7871;font-weight:600;letter-spacing:.06em;text-transform:uppercase;">Term</th>
        <th style="padding:.6rem .5rem;text-align:left;font-size:.75rem;color:#7A7871;font-weight:600;letter-spacing:.06em;text-transform:uppercase;">Due in</th>
        <th style="padding:.6rem .5rem;text-align:left;font-size:.75rem;color:#7A7871;font-weight:600;letter-spacing:.06em;text-transform:uppercase;">Date</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <a href="https://transferspace.app" style="display:inline-block;background:#2563EB;color:#fff;padding:.65rem 1.3rem;border-radius:8px;text-decoration:none;font-weight:500;font-size:.9rem;">Open TransferSpace →</a>
  `);
}

export function lorReminderEmailHtml(recommenderName: string, recommenderEmail: string): string {
  return wrapEmail(`
    <p style="color:#4B4A46;font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;font-weight:600;margin:0 0 .6rem;">Letter of Recommendation</p>
    <h1 style="font-size:1.45rem;color:#1a1a1a;margin:0 0 1rem;line-height:1.2;letter-spacing:-.02em;">Time to follow up with ${recommenderName}.</h1>
    <p style="color:#4B4A46;line-height:1.6;margin:0 0 1.5rem;">It's been 14 days since you requested a letter. A brief, polite email goes a long way — recommenders are busy, and a nudge is always appropriate at this stage.</p>
    ${recommenderEmail ? `<a href="mailto:${recommenderEmail}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:.65rem 1.3rem;border-radius:8px;text-decoration:none;font-weight:500;font-size:.9rem;margin-bottom:1.5rem;">Email ${recommenderName} →</a>` : ''}
    <p style="color:#7A7871;font-size:.85rem;margin:0;">Track this in TransferSpace under Materials → Letters of Recommendation.</p>
  `);
}

function wrapEmail(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F5F3EE;margin:0;padding:2rem 1rem;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="margin-bottom:1.25rem;display:flex;align-items:center;gap:.6rem;">
      <div style="width:28px;height:28px;background:#2563EB;border-radius:6px;display:inline-block;"></div>
      <span style="font-weight:600;font-size:.92rem;color:#1a1a1a;letter-spacing:-.01em;">TransferSpace</span>
    </div>
    <div style="background:#fff;border-radius:12px;border:1px solid #E8E5DC;padding:2rem;">
      ${body}
    </div>
    <p style="color:#A8A59C;font-size:.75rem;margin:1.25rem 0 0;text-align:center;">
      You're receiving this because email reminders are enabled in your TransferSpace settings.<br>
      <a href="https://transferspace.app" style="color:#2563EB;text-decoration:none;">Manage preferences</a>
    </p>
  </div>
</body></html>`;
}

interface HaltedUser {
  id: string;
  email: string;
  name?: string | null;
}

async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] Email skipped (no RESEND_API_KEY). Would send to ${opts.to}: ${opts.subject}`);
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL || 'Interosense <noreply@interosense.app>';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html }),
  });
  if (!response.ok) {
    console.error('Resend email failed:', await response.text());
  }
}

async function sendSlackAlert(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[DEV] Slack alert skipped (no SLACK_WEBHOOK_URL). Message:', message);
    return;
  }
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
    if (!response.ok) {
      console.error('Slack webhook failed:', await response.text());
    }
  } catch (err) {
    console.error('Slack webhook error:', err);
  }
}

export async function notifySubscriptionHalted(user: HaltedUser, subscriptionId?: string): Promise<void> {
  const displayName = user.name || 'there';

  const userEmailHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #FAFAFE;">
      <img src="https://interosense.app/logo.png" alt="Interosense" width="48" style="margin-bottom: 24px;" />
      <h2 style="color: #6B5B95; font-size: 22px; margin: 0 0 12px;">Your Interosense Premium subscription has been paused</h2>
      <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Hi ${displayName},
      </p>
      <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        We were unable to collect your subscription payment after several attempts. As a result, your Interosense Premium access has been temporarily paused.
      </p>
      <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        To restore access, please update your payment method through your bank or card provider and reply to this email — our support team will reactivate your subscription right away.
      </p>
      <a href="mailto:support@interosense.app?subject=Reactivate%20my%20subscription"
         style="display: inline-block; background: #6B5B95; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; margin-bottom: 24px;">
        Contact Support
      </a>
      <p style="color: #999; font-size: 13px; line-height: 1.5; margin: 0;">
        If you believe this is an error or have already updated your payment details, please ignore this email or reply and we will sort it out promptly.
      </p>
    </div>
  `;

  const teamAlertMessage =
    `*Subscription halted* — payment retries exhausted.\n` +
    `• User: ${displayName} (ID ${user.id}, <mailto:${user.email}|${user.email}>)\n` +
    (subscriptionId ? `• Subscription: \`${subscriptionId}\`\n` : '') +
    `• Action: premium access revoked. Please follow up to help them reactivate.`;

  await Promise.allSettled([
    sendResendEmail({
      to: user.email,
      subject: 'Your Interosense Premium subscription has been paused',
      html: userEmailHtml,
    }).catch(err => console.error('Failed to send halted email to user:', err)),

    sendSlackAlert(teamAlertMessage)
      .catch(err => console.error('Failed to send Slack halted alert:', err)),
  ]);

  console.log(
    `[subscription.halted] Notified user ${user.id} (${user.email})` +
    (subscriptionId ? ` sub=${subscriptionId}` : '') +
    `. RESEND=${!!process.env.RESEND_API_KEY} SLACK=${!!process.env.SLACK_WEBHOOK_URL}`
  );
}

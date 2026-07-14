import { Router, Request, Response } from 'express';
import { getRazorpayKeyId, getRazorpayClient, verifyPaymentSignature, verifyWebhookSignature, isRazorpayConfigured, PLANS } from './razorpayClient';
import { storage } from './storage';
import { notifySubscriptionHalted } from './notifications';

const router = Router();

router.post('/api/razorpay/create-subscription', async (req: Request, res: Response) => {
  if (!isRazorpayConfigured()) {
    return res.status(503).json({
      error: 'Payment not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Secrets.',
    });
  }

  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const planKey = req.body.planId === 'annual' ? 'annual' : 'monthly';
  const currency = 'INR';

  const planIdEnv = planKey === 'annual'
    ? process.env.RAZORPAY_ANNUAL_PLAN_ID
    : process.env.RAZORPAY_MONTHLY_PLAN_ID;

  if (!planIdEnv) {
    return res.status(503).json({
      error: 'Subscription plans not configured. Run POST /api/razorpay/setup-plans to create them.',
      setup_required: true,
    });
  }

  try {
    const user = await storage.getUser(userId);
    const client = getRazorpayClient();

    const totalCount = planKey === 'annual' ? 10 : 120;
    // Only give trial to first-time subscribers — returning/cancelled members get no trial
    const isFirstTimeSubscriber = !user?.stripeSubscriptionId;

    const sub: any = await (client.subscriptions as any).create({
      plan_id: planIdEnv,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 1,
      ...(isFirstTimeSubscriber ? { trial_period: 7 } : {}),
      notes: {
        userId: String(userId),
        plan: planKey,
        currency,
      },
    });

    const subscriptionId: string = sub.id;

    const forwardedProto = req.header('x-forwarded-proto') || req.protocol || 'https';
    const forwardedHost = req.header('x-forwarded-host') || req.get('host') || '';
    const baseUrl = `${forwardedProto}://${forwardedHost}`;

    const checkoutUrl =
      `${baseUrl}/razorpay-checkout?` +
      new URLSearchParams({
        key: getRazorpayKeyId(),
        subscription_id: subscriptionId,
        user_id: String(userId),
        name: user?.name || '',
        email: user?.email || '',
        plan: planKey,
        currency,
      }).toString();

    return res.json({
      subscription_id: subscriptionId,
      key: getRazorpayKeyId(),
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: '',
      },
      plan: planKey,
      currency,
      url: checkoutUrl,
    });
  } catch (err: any) {
    console.error('Razorpay create-subscription error:', err);
    return res.status(500).json({ error: err.message || 'Failed to start checkout' });
  }
});

router.post('/api/razorpay/verify-payment', async (req: Request, res: Response) => {
  const verifyUserId = (req.session as any)?.userId;
  if (!verifyUserId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' });
  }

  const valid = verifyPaymentSignature({
    paymentId: razorpay_payment_id,
    subscriptionId: razorpay_subscription_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  try {
    await storage.updateUser(String(verifyUserId), {
      isPremium: true,
      stripeCustomerId: razorpay_subscription_id,
      stripeSubscriptionId: razorpay_subscription_id,
    });
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Razorpay verify-payment error:', err);
    return res.status(500).json({ error: 'Failed to update subscription status' });
  }
});

router.post('/api/razorpay/webhook', async (req: Request, res: Response) => {
  const rawBody = (req as any).rawBody;
  const signature = req.headers['x-razorpay-signature'] as string | undefined;

  if (!verifyWebhookSignature(
    rawBody ? rawBody.toString() : JSON.stringify(req.body),
    signature || '',
  )) {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error('Razorpay webhook: RAZORPAY_WEBHOOK_SECRET not configured — request rejected');
      return res.status(503).json({ error: 'Webhook secret not configured on server' });
    }
    console.warn('Razorpay webhook: invalid signature — request rejected');
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const event = req.body;
  if (!event?.event) return res.status(400).json({ error: 'Invalid webhook payload' });

  try {
    const sub = event.payload?.subscription?.entity;
    const notes = sub?.notes || {};
    const userId = notes.userId;
    const subscriptionId = sub?.id;

    if (event.event === 'subscription.activated' || event.event === 'subscription.charged') {
      if (userId) {
        await storage.updateUser(String(userId), {
          isPremium: true,
          stripeSubscriptionId: subscriptionId,
        });
      }
    } else if (
      event.event === 'subscription.cancelled' ||
      event.event === 'subscription.expired' ||
      event.event === 'subscription.completed'
    ) {
      if (userId) {
        await storage.updateUser(String(userId), {
          isPremium: false,
          stripeSubscriptionId: null,
        });
      }
    } else if (event.event === 'subscription.halted') {
      if (userId) {
        await storage.updateUser(String(userId), {
          isPremium: false,
          stripeSubscriptionId: null,
        });
        const user = await storage.getUser(String(userId));
        if (user) {
          notifySubscriptionHalted(user, subscriptionId).catch(err =>
            console.error('notifySubscriptionHalted failed:', err)
          );
        }
      }
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error('Razorpay webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.get('/api/razorpay/subscription-status', async (req: Request, res: Response) => {
  const statusUserId = (req.session as any)?.userId;
  if (!statusUserId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = await storage.getUser(String(statusUserId));
    const subscriptionId = user?.stripeSubscriptionId;

    if (!subscriptionId) {
      return res.json({ subscription: null });
    }

    if (!isRazorpayConfigured()) {
      return res.json({ subscription: { id: subscriptionId, status: 'unknown', plan: 'unknown' } });
    }

    const client = getRazorpayClient();
    const sub: any = await (client.subscriptions as any).fetch(subscriptionId);

    const planNote = sub?.notes?.plan || 'monthly';
    const planLabel = planNote === 'annual' ? 'Annual' : 'Monthly';
    const amount = planNote === 'annual' ? '₹3,990/year' : '₹399/month';

    return res.json({
      subscription: {
        id: sub.id,
        status: sub.status,
        plan: planLabel,
        amount,
        currentStart: sub.current_start ? new Date(sub.current_start * 1000).toISOString() : null,
        currentEnd: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null,
        chargeAt: sub.charge_at ? new Date(sub.charge_at * 1000).toISOString() : null,
        trialEndAt: sub.trial_end_at ? new Date(sub.trial_end_at * 1000).toISOString() : null,
      },
    });
  } catch (err: any) {
    console.error('Razorpay subscription-status error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch subscription details' });
  }
});

router.post('/api/razorpay/cancel', async (req: Request, res: Response) => {
  const cancelUserId = (req.session as any)?.userId;
  if (!cancelUserId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = await storage.getUser(String(cancelUserId));
    const subscriptionId = user?.stripeSubscriptionId;

    if (subscriptionId && isRazorpayConfigured()) {
      const client = getRazorpayClient();
      // cancel_at_cycle_end: 1 → user keeps access until billing period ends
      await (client.subscriptions as any).cancel(subscriptionId, { cancel_at_cycle_end: 1 });
    }

    // Keep isPremium true — webhook will set it false when period expires
    // But record that cancellation was requested by clearing stripeCustomerId as a flag
    return res.json({ success: true, message: 'Subscription will be cancelled at the end of the current billing period.' });
  } catch (err: any) {
    console.error('Razorpay cancel error:', err);
    return res.status(500).json({ error: err.message || 'Failed to cancel subscription' });
  }
});

router.post('/api/razorpay/setup-plans', async (req: Request, res: Response) => {
  const adminSecret = process.env.ADMIN_SECRET;
  const providedSecret = req.headers['x-admin-secret'] || req.body?.adminSecret;
  if (!adminSecret || providedSecret !== adminSecret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!isRazorpayConfigured()) {
    return res.status(503).json({
      error: 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set before creating plans.',
    });
  }

  const existing = {
    monthly_inr: process.env.RAZORPAY_MONTHLY_PLAN_ID,
    annual_inr: process.env.RAZORPAY_ANNUAL_PLAN_ID,
  };

  if (existing.monthly_inr && existing.annual_inr) {
    return res.json({
      message: 'All plans already configured',
      plans: existing,
    });
  }

  try {
    const client = getRazorpayClient();
    const results: Record<string, string> = {};
    const instructions: string[] = [];

    if (!existing.monthly_inr) {
      const plan: any = await (client.plans as any).create({
        period: PLANS.inr.monthly.period,
        interval: PLANS.inr.monthly.interval,
        item: {
          name: PLANS.inr.monthly.name,
          amount: PLANS.inr.monthly.amount,
          currency: 'INR',
          description: 'Interosense Premium, monthly subscription',
        },
        notes: { plan_type: 'monthly_inr' },
      });
      results.monthly_inr = plan.id;
      instructions.push(`Set RAZORPAY_MONTHLY_PLAN_ID = ${plan.id}`);
    } else {
      results.monthly_inr = existing.monthly_inr;
    }

    if (!existing.annual_inr) {
      const plan: any = await (client.plans as any).create({
        period: PLANS.inr.annual.period,
        interval: PLANS.inr.annual.interval,
        item: {
          name: PLANS.inr.annual.name,
          amount: PLANS.inr.annual.amount,
          currency: 'INR',
          description: 'Interosense Premium, annual subscription',
        },
        notes: { plan_type: 'annual_inr' },
      });
      results.annual_inr = plan.id;
      instructions.push(`Set RAZORPAY_ANNUAL_PLAN_ID = ${plan.id}`);
    } else {
      results.annual_inr = existing.annual_inr;
    }

    console.log('Razorpay plans created:');
    instructions.forEach(i => console.log(' ', i));

    return res.json({
      message: instructions.length
        ? 'Plans created. Copy the IDs below into Replit Secrets.'
        : 'All plans were already configured.',
      plans: results,
      instructions,
    });
  } catch (err: any) {
    const detail = err?.error?.description || err?.message || JSON.stringify(err);
    console.error('Razorpay setup-plans error:', detail);
    return res.status(500).json({ error: detail });
  }
});

export default router;

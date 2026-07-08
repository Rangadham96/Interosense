import { Router, Request, Response } from 'express';
import { getRazorpayKeyId, getRazorpayClient, verifyPaymentSignature, isRazorpayConfigured } from './razorpayClient';
import { storage } from './storage';

const router = Router();

router.post('/api/razorpay/create-subscription', async (req: Request, res: Response) => {
  if (!isRazorpayConfigured()) {
    return res.status(503).json({
      error: 'Payment not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Secrets.',
    });
  }

  const sessionUser = (req.session as any)?.user;
  if (!sessionUser?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const planKey = req.body.planId === 'annual' ? 'annual' : 'monthly';
  const planIdEnv =
    planKey === 'annual'
      ? process.env.RAZORPAY_ANNUAL_PLAN_ID
      : process.env.RAZORPAY_MONTHLY_PLAN_ID;

  if (!planIdEnv) {
    return res.status(503).json({
      error:
        'Subscription plans not configured. Set RAZORPAY_MONTHLY_PLAN_ID and RAZORPAY_ANNUAL_PLAN_ID in Secrets.',
      setup_required: true,
    });
  }

  try {
    const user = await storage.getUser(sessionUser.id);
    const client = getRazorpayClient();

    const totalCount = planKey === 'annual' ? 10 : 120;
    const sub: any = await (client.subscriptions as any).create({
      plan_id: planIdEnv,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId: String(sessionUser.id),
        plan: planKey,
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
        user_id: String(sessionUser.id),
        name: user?.name || '',
        email: user?.email || '',
        plan: planKey,
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
      url: checkoutUrl,
    });
  } catch (err: any) {
    console.error('Razorpay create-subscription error:', err);
    return res.status(500).json({ error: err.message || 'Failed to start checkout' });
  }
});

router.post('/api/razorpay/verify-payment', async (req: Request, res: Response) => {
  const sessionUser = (req.session as any)?.user;
  if (!sessionUser?.id) {
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
    await storage.updateUser(String(sessionUser.id), {
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
      event.event === 'subscription.halted' ||
      event.event === 'subscription.completed'
    ) {
      if (userId) {
        await storage.updateUser(String(userId), {
          isPremium: false,
          stripeSubscriptionId: null,
        });
      }
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error('Razorpay webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/api/razorpay/cancel', async (req: Request, res: Response) => {
  const sessionUser = (req.session as any)?.user;
  if (!sessionUser?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    await storage.updateUser(String(sessionUser.id), {
      isPremium: false,
      stripeSubscriptionId: null,
    });
    return res.json({ success: true, message: 'Subscription cancelled' });
  } catch (err: any) {
    console.error('Razorpay cancel error:', err);
    return res.status(500).json({ error: err.message || 'Failed to cancel subscription' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

const router = Router();

function getBaseUrl(req: Request): string {
  const forwardedProto = req.header('x-forwarded-proto') || req.protocol || 'https';
  const forwardedHost = req.header('x-forwarded-host') || req.get('host') || '';
  return `${forwardedProto}://${forwardedHost}`;
}

router.post('/api/stripe/create-checkout-session', async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { planId } = req.body;
    const stripe = await getUncachableStripeClient();
    const user = await storage.getUser(req.session.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      await storage.updateUser(user.id, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID;
    const annualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID;

    const priceId = planId === 'annual' ? annualPriceId : monthlyPriceId;

    if (!priceId) {
      return res.status(503).json({ message: 'Stripe prices not configured. Please set STRIPE_MONTHLY_PRICE_ID and STRIPE_ANNUAL_PRICE_ID environment variables.' });
    }

    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId: user.id },
      },
      success_url: `${baseUrl}/app/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/app/premium`,
      customer_email: customerId ? undefined : user.email,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Create checkout session error:', error);
    return res.status(500).json({ message: error.message || 'Failed to create checkout session' });
  }
});

router.post('/api/stripe/portal', async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await storage.getUser(req.session.userId);

    if (!user?.stripeCustomerId) {
      return res.status(400).json({ message: 'No Stripe customer found. Please subscribe first.' });
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = getBaseUrl(req);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/app/(tabs)/profile`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Create portal session error:', error);
    return res.status(500).json({ message: error.message || 'Failed to create portal session' });
  }
});

router.post('/api/stripe/confirm-session', async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'Missing session_id' });
    }

    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.payment_status === 'paid' || (session.subscription as any)?.status === 'trialing') {
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as any)?.id;

      await storage.updateUser(req.session.userId, {
        isPremium: true,
        stripeSubscriptionId: subscriptionId || undefined,
        stripeCustomerId: session.customer as string || undefined,
      });

      const user = await storage.getUser(req.session.userId);
      const { password: _, ...safeUser } = user as any;
      return res.status(200).json({ success: true, user: safeUser });
    }

    return res.status(200).json({ success: false, message: 'Payment not yet completed' });
  } catch (error: any) {
    console.error('Confirm session error:', error);
    return res.status(500).json({ message: error.message || 'Failed to confirm session' });
  }
});

export default router;

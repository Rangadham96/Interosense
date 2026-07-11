import Razorpay from 'razorpay';
import crypto from 'crypto';

export function getRazorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) throw new Error('RAZORPAY_KEY_ID not set');
  return keyId;
}

export function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in Secrets');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      'RAZORPAY_WEBHOOK_SECRET is not set — all webhook requests will be rejected. ' +
      'Add the secret from Razorpay Dashboard → Settings → Webhooks to enable webhook processing.',
    );
    return false;
  }
  if (!signature) {
    return false;
  }
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

export function verifyPaymentSignature(params: {
  subscriptionId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;
  const message = `${params.paymentId}|${params.subscriptionId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(message)
    .digest('hex');
  return expectedSignature === params.signature;
}

export function isRazorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export const PLANS = {
  inr: {
    monthly: {
      amount: 39900,
      currency: 'INR',
      period: 'monthly' as const,
      interval: 1 as const,
      name: 'Interosense Premium Monthly',
    },
    annual: {
      amount: 399000,
      currency: 'INR',
      period: 'yearly' as const,
      interval: 1 as const,
      name: 'Interosense Premium Annual',
    },
  },
  usd: {
    monthly: {
      amount: 799,
      currency: 'USD',
      period: 'monthly' as const,
      interval: 1 as const,
      name: 'Interosense Premium Monthly',
    },
    annual: {
      amount: 7990,
      currency: 'USD',
      period: 'yearly' as const,
      interval: 1 as const,
      name: 'Interosense Premium Annual',
    },
  },
};

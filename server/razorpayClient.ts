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
  if (!secret) return true;
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
  monthly: { amount: 79900, period: 'monthly', name: 'Interosense Premium Monthly', interval: 1 as const },
  annual:  { amount: 499900, period: 'yearly',  name: 'Interosense Premium Annual',  interval: 1 as const },
};

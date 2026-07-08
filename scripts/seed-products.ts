import { getUncachableStripeClient } from '../server/stripeClient';

async function createProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    console.log('Connected to Stripe. Creating Interosense Premium products...');

    const existingProducts = await stripe.products.search({
      query: "name:'Interosense Premium' AND active:'true'",
    });

    if (existingProducts.data.length > 0) {
      console.log('Interosense Premium product already exists.');
      const product = existingProducts.data[0];
      console.log(`Product ID: ${product.id}`);

      const prices = await stripe.prices.list({ product: product.id, active: true });
      for (const price of prices.data) {
        const interval = (price.recurring as any)?.interval;
        const amount = price.unit_amount ? price.unit_amount / 100 : 0;
        console.log(`  Price: $${amount} / ${interval} — ID: ${price.id}`);
        if (interval === 'month') {
          console.log(`  STRIPE_MONTHLY_PRICE_ID=${price.id}`);
        } else if (interval === 'year') {
          console.log(`  STRIPE_ANNUAL_PRICE_ID=${price.id}`);
        }
      }
      return;
    }

    const product = await stripe.products.create({
      name: 'Interosense Premium',
      description: 'Full access to all Interosense exercises, clinical assessments, AI personalisation, and advanced analytics.',
      metadata: {
        app: 'interosense',
        tier: 'premium',
      },
    });
    console.log(`Created product: ${product.name} (${product.id})`);

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 999,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    console.log(`Created monthly price: $9.99/month (${monthlyPrice.id})`);

    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 5999,
      currency: 'usd',
      recurring: { interval: 'year' },
    });
    console.log(`Created annual price: $59.99/year (${annualPrice.id})`);

    console.log('\n=== IMPORTANT ===');
    console.log('Set these environment variables in your Replit secrets:');
    console.log(`STRIPE_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
    console.log(`STRIPE_ANNUAL_PRICE_ID=${annualPrice.id}`);
    console.log('=================\n');

    console.log('Products and prices created successfully!');
  } catch (error: any) {
    console.error('Error creating products:', error.message);
    process.exit(1);
  }
}

createProducts();

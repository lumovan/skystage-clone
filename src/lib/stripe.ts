import Stripe from 'stripe';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export interface PaymentData {
  amount: number; // in cents
  currency: string;
  description: string;
  customerEmail: string;
  customerName: string;
  bookingId: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  status: string;
}

// Create payment intent for booking
export async function createPaymentIntent(paymentData: PaymentData): Promise<PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentData.amount,
      currency: paymentData.currency,
      description: paymentData.description,
      receipt_email: paymentData.customerEmail,
      metadata: {
        booking_id: paymentData.bookingId,
        customer_name: paymentData.customerName,
        ...paymentData.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
}

// Create customer in Stripe
export async function createCustomer(email: string, name: string, phone?: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      phone,
    });

    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }
}

// Get or create customer
export async function getOrCreateCustomer(email: string, name: string, phone?: string) {
  try {
    // Search for existing customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer
    return await createCustomer(email, name, phone);
  } catch (error) {
    console.error('Error getting or creating customer:', error);
    throw new Error('Failed to get or create customer');
  }
}

// Create checkout session for booking
export async function createCheckoutSession(
  paymentData: PaymentData,
  successUrl: string,
  cancelUrl: string
) {
  try {
    const customer = await getOrCreateCustomer(
      paymentData.customerEmail,
      paymentData.customerName
    );

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: paymentData.currency,
            product_data: {
              name: 'SkyStage Drone Show Booking',
              description: paymentData.description,
            },
            unit_amount: paymentData.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        booking_id: paymentData.bookingId,
        customer_name: paymentData.customerName,
        ...paymentData.metadata,
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

// Calculate booking price
export function calculateBookingPrice(
  droneCount: number,
  duration: number, // in minutes
  eventType: string,
  location: string
): number {
  // Base pricing logic (in cents)
  const basePricePerDrone = 1000; // $10 per drone
  const durationMultiplier = Math.max(1, duration / 30); // Minimum 30 minutes

  let eventMultiplier = 1;
  switch (eventType.toLowerCase()) {
    case 'wedding':
      eventMultiplier = 1.5;
      break;
    case 'corporate':
      eventMultiplier = 2.0;
      break;
    case 'festival':
      eventMultiplier = 1.8;
      break;
    case 'private':
      eventMultiplier = 1.2;
      break;
    default:
      eventMultiplier = 1.0;
  }

  // Location premium (simplified)
  let locationMultiplier = 1;
  const premiumLocations = ['new york', 'los angeles', 'san francisco', 'miami'];
  if (premiumLocations.some(city => location.toLowerCase().includes(city))) {
    locationMultiplier = 1.3;
  }

  const basePrice = basePricePerDrone * droneCount;
  const totalPrice = Math.round(basePrice * durationMultiplier * eventMultiplier * locationMultiplier);

  // Minimum booking price
  return Math.max(totalPrice, 50000); // Minimum $500
}

// Generate price quote
export function generatePriceQuote(
  droneCount: number,
  duration: number,
  eventType: string,
  location: string
) {
  const basePrice = calculateBookingPrice(droneCount, duration, eventType, location);

  // Add breakdown
  const breakdown = {
    basePrice: Math.round(basePrice * 0.7),
    eventTypeAdjustment: Math.round(basePrice * 0.2),
    locationAdjustment: Math.round(basePrice * 0.1),
    total: basePrice,
  };

  return {
    totalCents: basePrice,
    totalDollars: basePrice / 100,
    breakdown,
    currency: 'usd',
    formattedPrice: formatPrice(basePrice),
  };
}

// Format price for display
export function formatPrice(amountInCents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}

// Verify webhook signature
export function verifyWebhookSignature(body: string, signature: string): Stripe.Event {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    return stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

// Handle successful payment
export async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  // This would update the booking status in the database
  const bookingId = paymentIntent.metadata.booking_id;

  if (bookingId) {
    // Update booking status to 'paid'
    // Send confirmation emails
    // Create invoice
    console.log(`Payment successful for booking ${bookingId}`);
  }
}

// Handle failed payment
export async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.booking_id;

  if (bookingId) {
    // Update booking status to 'payment_failed'
    // Send failure notification
    console.log(`Payment failed for booking ${bookingId}`);
  }
}

// Refund payment
export async function refundPayment(paymentIntentId: string, amount?: number) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount, // If not specified, refunds the full amount
    });

    return refund;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw new Error('Failed to create refund');
  }
}

// Get payment details
export async function getPaymentDetails(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving payment details:', error);
    throw new Error('Failed to retrieve payment details');
  }
}

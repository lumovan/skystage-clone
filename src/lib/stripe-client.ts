
// Type definitions for better type safety
interface FormationData {
  id: string;
  name: string;
  description: string;
  category: string;
  drone_count: number;
  duration: number;
  thumbnail_url: string;
  file_url: string | null;
  price: number | null;
  created_by: string;
  is_public: boolean;
  tags: string;
  formation_data: string;
  metadata: string;
  source: string;
  source_id: string;
  sync_status: string;
  download_count: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

interface APIResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  message?: string;
}

interface DronePosition {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface AdminDashboardData {
  overview: {
    total_users: number;
    total_organizations: number;
    total_formations: number;
    total_bookings: number;
    total_sync_jobs: number;
  };
  users: {
    total: number;
    new_this_week: number;
    new_this_month: number;
    by_type: Array<{ user_type: string; count: number }>;
  };
  formations: {
    total: number;
    by_category: Array<{ category: string; count: number }>;
    most_popular: Array<{ id: string; name: string; downloads: number; rating: number }>;
  };
  bookings: {
    total: number;
    pending: number;
    by_status: Array<{ status: string; count: number }>;
  };
  activity: {
    recent_events: unknown[];
    daily_active_users: number;
  };
}


/**
 * Stripe Payment Integration
 * Handles payment processing for bookings and subscriptions
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!key) {
      console.warn('Stripe publishable key not found. Payments will not work.');
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(key);
    }
  }

  return stripePromise;
};

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Browse formation library',
      'Create up to 3 shows',
      'Basic export options',
      'Community support'
    ],
    limits: {
      shows: 3,
      formations: 10,
      teamMembers: 1,
      exportFormats: ['json']
    }
  },
  grow: {
    id: 'grow',
    name: 'Grow',
    price: 1500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_GROW_PRICE_ID || 'price_grow',
    features: [
      'Everything in Free',
      'Create unlimited shows',
      '50 formations per library',
      '2 team members',
      'Export to Blender/DSS',
      'Priority support'
    ],
    limits: {
      shows: -1, // unlimited
      formations: 50,
      teamMembers: 2,
      exportFormats: ['json', 'blender', 'dss', 'csv']
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: null, // Contact for pricing
    priceId: null,
    features: [
      'Everything in Grow',
      'Unlimited formations',
      'Unlimited team members',
      'Advanced AI generation',
      'Custom integrations',
      'Dedicated support',
      'White-label options'
    ],
    limits: {
      shows: -1,
      formations: -1,
      teamMembers: -1,
      exportFormats: ['json', 'blender', 'dss', 'csv', 'skybrush', 'custom']
    }
  }
};

// Show booking pricing (per show)
export const SHOW_PRICING = {
  small: {
    id: 'small',
    name: 'Small Show',
    drones: '50-100',
    basePrice: 5000,
    description: 'Perfect for private events and small celebrations'
  },
  medium: {
    id: 'medium',
    name: 'Medium Show',
    drones: '100-200',
    basePrice: 15000,
    description: 'Ideal for corporate events and public gatherings'
  },
  large: {
    id: 'large',
    name: 'Large Show',
    drones: '200-500',
    basePrice: 35000,
    description: 'Spectacular displays for major events and festivals'
  },
  custom: {
    id: 'custom',
    name: 'Custom Show',
    drones: '500+',
    basePrice: null,
    description: 'Tailored solutions for unique requirements'
  }
};

// Create checkout session
export async function createCheckoutSession(params: {
  priceId?: string;
  mode: 'payment' | 'subscription';
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  lineItems?: Array<{
    price?: string;
    quantity?: number;
    price_data?: {
      currency: string;
      product_data: {
        name: string;
        description?: string;
        images?: string[];
      };
      unit_amount: number;
    };
  }>;
}) {
  try {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    const stripe = await getStripe();

    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
}

// Create subscription
export async function createSubscription(tierId: keyof typeof SUBSCRIPTION_TIERS) {
  const tier = SUBSCRIPTION_TIERS[tierId];

  if (!tier.priceId) {
    throw new Error('Invalid subscription tier');
  }

  return createCheckoutSession({
    priceId: tier.priceId,
    mode: 'subscription',
    successUrl: `${window.location.origin}/dashboard?subscription=success`,
    cancelUrl: `${window.location.origin}/pricing?subscription=cancelled`,
    metadata: {
      tier: tierId,
    },
  });
}

// Book a show
export async function bookShow(params: {
  showType: keyof typeof SHOW_PRICING;
  date: string;
  location: string;
  duration: number;
  formations: string[];
  extras?: string[];
}) {
  const showPackage = SHOW_PRICING[params.showType];

  if (!showPackage.basePrice && params.showType !== 'custom') {
    throw new Error('Invalid show package');
  }

  // Calculate total price
  let totalPrice = showPackage.basePrice || 50000; // Default for custom

  // Add extras pricing
  if (params.extras?.includes('rush')) totalPrice *= 1.5;
  if (params.extras?.includes('music_sync')) totalPrice += 2000;
  if (params.extras?.includes('custom_formations')) totalPrice += 5000;

  return createCheckoutSession({
    mode: 'payment',
    successUrl: `${window.location.origin}/booking/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${window.location.origin}/book-show?cancelled=true`,
    lineItems: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${showPackage.name} - Drone Show`,
          description: `${params.duration} minute show on ${params.date} at ${params.location}`,
          images: ['https://skystage.com/show-preview.jpg'],
        },
        unit_amount: totalPrice * 100, // Convert to cents
      },
      quantity: 1,
    }],
    metadata: {
      showType: params.showType,
      date: params.date,
      location: params.location,
      duration: params.duration.toString(),
      formations: params.formations.join(','),
    },
  });
}

// Handle webhook events
export async function handleStripeWebhook(data: unknown) {
  switch (event.type) {
    case 'checkout.session.completed':
      // Handle successful payment/subscription
      const session = event.data.object;

      if (session.mode === 'subscription') {
        // Update user subscription in database
        await updateUserSubscription(session.customer, session.subscription);
      } else {
        // Create booking record
        await createBookingRecord(session);
      }
      break;

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // Handle subscription changes
      await handleSubscriptionChange(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

// Helper functions (to be implemented with database)
async function updateUserSubscription(customerId: string, subscriptionId: string) {
  // Update user subscription in database
  console.log('Updating subscription:', { customerId, subscriptionId });
}

async function createBookingRecord(data: unknown) {
  // Create booking record in database
  console.log('Creating booking:', session);
}

async function handleSubscriptionChange(data: unknown) {
  // Handle subscription changes
  console.log('Subscription change:', subscription);
}

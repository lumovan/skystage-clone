
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


import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      priceId,
      mode,
      customerId,
      successUrl,
      cancelUrl,
      metadata,
      lineItems,
    } = body;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    };

    // Add customer if provided
    if (customerId) {
      sessionParams.customer = customerId;
    }

    // Add line items
    if (lineItems && lineItems.length > 0) {
      sessionParams.line_items = lineItems;
    } else if (priceId) {
      sessionParams.line_items = [{
        price: priceId,
        quantity: 1,
      }];
    }

    // Add subscription data for recurring payments
    if (mode === 'subscription') {
      sessionParams.subscription_data = {
        trial_period_days: 14,
        metadata,
      };
    }

    // Add payment intent data for one-time payments
    if (mode === 'payment') {
      sessionParams.payment_intent_data = {
        metadata,
      };
      sessionParams.invoice_creation = {
        enabled: true,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 400 }
);
  }
}

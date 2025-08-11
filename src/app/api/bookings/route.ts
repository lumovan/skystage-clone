
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
 * Bookings API Endpoints
 * GET /api/bookings - List bookings (admin/operator access)
 * POST /api/bookings - Create new booking request
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { bookingDb, analyticsDb, emailDb } from '@/lib/db';
import { requireAuth, requireUserType, getUserFromRequest, createErrorResponse } from '@/lib/auth';

// Validation schema for creating bookings
const createBookingSchema = z.object({
  contact_name: z.string().min(1, 'Contact name is required').max(100),
  contact_email: z.string().email('Valid email is required'),
  contact_phone: z.string().optional(),
  event_name: z.string().max(200).optional(),
  event_date: z.string().optional(), // ISO date string
  location: z.string().max(300).optional(),
  budget_range: z.enum([
    'under-10k',
    '10k-25k',
    '25k-50k',
    '50k-100k',
    'over-100k'
  ]).optional(),
  message: z.string().max(1000).optional(),
  subscribe_newsletter: z.boolean().optional().default(false)
});

/**
 * GET /api/bookings
 * List bookings (admin and operators only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin or operator access
    const user = await requireUserType(request, ['admin', 'operator']);

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get bookings from database
    const bookings = bookingDb.getAll({
      status,
      limit,
      offset
    });

    // Get total count for pagination
    const totalBookings = bookingDb.getAll({ status }).length;
    const totalPages = Math.ceil(totalBookings / limit);

    // Record analytics event
    analyticsDb.recordEvent({
      event_type: 'bookings_viewed',
      entity_type: 'booking',
      user_id: user.id,
      metadata: {
        filters: { status },
        page,
        limit,
        results_count: bookings.length,
        viewer_type: user.user_type
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page,
          limit,
          total: totalBookings,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: { status }
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching bookings:', error);

    // Handle auth errors
    if (error.message.includes('required') || error.message.includes('Access denied')) {
      return NextResponse.json(
        createErrorResponse('Unauthorized access' as unknown),
        { status: 403 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Failed to fetch bookings' as unknown),
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * Create new booking request (public endpoint, optional authentication)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createBookingSchema.parse(body);

    // Get user if authenticated (optional)
    const user = await getUserFromRequest(request);
    const userId = user?.id || 'anonymous';

    // Generate booking ID
    const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create booking data
    const bookingData = {
      id: bookingId,
      user_id: userId,
      contact_name: validatedData.contact_name,
      contact_email: validatedData.contact_email,
      contact_phone: validatedData.contact_phone,
      event_name: validatedData.event_name,
      event_date: validatedData.event_date,
      location: validatedData.location,
      budget_range: validatedData.budget_range,
      message: validatedData.message
    };

    // Save to database
    bookingDb.create(bookingData);

    // Subscribe to newsletter if requested
    if (validatedData.subscribe_newsletter) {
      try {
        emailDb.subscribe(validatedData.contact_email, 'newsletter');
      } catch (error) {
        console.warn('Newsletter subscription failed:', error);
        // Don't fail the booking creation if newsletter signup fails
      }
    }

    // Record analytics event
    analyticsDb.recordEvent({
      event_type: 'booking_created',
      entity_type: 'booking',
      entity_id: bookingId,
      user_id: user?.id,
      metadata: {
        contact_email: validatedData.contact_email,
        event_date: validatedData.event_date,
        budget_range: validatedData.budget_range,
        location: validatedData.location,
        is_authenticated: !!user,
        subscribed_newsletter: validatedData.subscribe_newsletter
      }
    });

    // TODO: Send notification email to admins/operators
    // This would integrate with your email service (Nodemailer, SendGrid, etc.)

    return NextResponse.json({
      success: true,
      data: {
        booking_id: bookingId,
        status: 'pending'
      },
      message: 'Booking request submitted successfully. We will contact you soon!'
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating booking:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        createErrorResponse(`Validation error: ${error.errors[0].message}` as unknown),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Failed to submit booking request' as unknown),
      { status: 500 }
    );
  }
}

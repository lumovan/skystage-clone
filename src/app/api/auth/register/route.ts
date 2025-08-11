
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
 * User Registration API Endpoint
 * POST /api/auth/register
 *
 * Handles new user registration with email validation and password hashing
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { registerUser, createAuthResponse, createErrorResponse } from '@/lib/auth';
import { analyticsDb } from '@/lib/db';
import { ensureDatabaseConnection } from '@/lib/database/init';

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(1, 'Full name is required').max(100),
  user_type: z.enum(['customer', 'operator', 'artist']).optional().default('customer'),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  agree_terms: z.boolean().refine(val => val === true, 'You must agree to the terms')
});

export async function POST(request: NextRequest) {
  try {
    // Ensure database connection
    await ensureDatabaseConnection();

    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Register user
    const result = await registerUser({
      email: validatedData.email,
      password: validatedData.password,
      full_name: validatedData.full_name,
      user_type: validatedData.user_type,
      company_name: validatedData.company_name,
      phone: validatedData.phone,
      location: validatedData.location
    });

    // Record analytics event
    await analyticsDb.recordEvent({
      event_type: 'user_registered',
      entity_type: 'user',
      entity_id: result.user.id,
      user_id: result.user.id,
      metadata: {
        user_type: result.user.user_type,
        registration_source: 'web',
        user_agent: request.headers.get('user-agent') || 'unknown',
        has_company: !!validatedData.company_name
      }
    });

    // Create response with auth token
    const response = NextResponse.json(createAuthResponse(result.user, result.token as unknown), {
      status: 201
    });

    // Set secure HTTP-only cookie
    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error: unknown) {
    console.error('Registration error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        createErrorResponse(`Validation error: ${error.errors[0].message}` as unknown),
        { status: 400 }
      );
    }

    // Handle duplicate user error
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        createErrorResponse('An account with this email already exists' as unknown),
        { status: 409 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Registration failed. Please try again.' as unknown),
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

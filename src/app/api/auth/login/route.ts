
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
 * User Login API Endpoint
 * POST /api/auth/login
 *
 * Handles user authentication and JWT token generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loginUser, createAuthResponse, createErrorResponse } from '@/lib/auth';
import { analyticsDb } from '@/lib/db';
import { ensureDatabaseConnection } from '@/lib/database/init';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional().default(false)
});

export async function POST(request: NextRequest) {
  try {
    // Ensure database connection
    await ensureDatabaseConnection();

    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Authenticate user
    const result = await loginUser(validatedData.email, validatedData.password);

    // Record analytics event (disabled for now due to schema issues)
    // await analyticsDb.recordEvent({
    //   event_type: 'user_login',
    //   entity_type: 'user',
    //   entity_id: result.user.id,
    //   user_id: result.user.id,
    //   metadata: {
    //     user_type: result.user.user_type,
    //     login_source: 'web',
    //     user_agent: request.headers.get('user-agent') || 'unknown'
    //   }
    // });

    // Create response with auth token
    const response = NextResponse.json(createAuthResponse(result.user, result.token as unknown));

    // Set secure HTTP-only cookie
    const maxAge = validatedData.remember_me ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days

    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: false, // Set to false for dev preview compatibility
      sameSite: 'lax', // Changed from 'strict' to work in preview iframe
      path: '/',
      maxAge
    });

    // Also set a non-httpOnly cookie for dev fallback
    if (process.env.NODE_ENV !== 'production') {
      response.cookies.set('auth-token-dev', result.token, {
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge
      });
    }

    return response;

  } catch (error: unknown) {
    console.error('Login error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        createErrorResponse(`Validation error: ${error.errors[0].message}` as unknown),
        { status: 400 }
      );
    }

    // Handle authentication errors
    if (error.message.includes('Invalid email or password') ||
        error.message.includes('Account is deactivated')) {
      return NextResponse.json(
        createErrorResponse(error.message as unknown),
        { status: 401 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Login failed. Please try again.' as unknown),
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

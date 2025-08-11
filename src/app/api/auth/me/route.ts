
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
 * Current User Information API Endpoint
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, createAuthResponse, createErrorResponse } from '@/lib/auth';
import { analyticsDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get current user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        createErrorResponse('Not authenticated' as unknown),
        { status: 401 }
      );
    }

    // Record analytics event (optional, for user activity tracking)
    analyticsDb.recordEvent({
      event_type: 'user_info_requested',
      entity_type: 'user',
      entity_id: user.id,
      user_id: user.id,
      metadata: {
        user_type: user.user_type,
        request_source: 'web'
      }
    });

    // Return user information (excluding sensitive data)
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        is_verified: user.is_verified
      }
    });

  } catch (error: unknown) {
    console.error('Error getting user info:', error);

    return NextResponse.json(
      createErrorResponse('Failed to get user information' as unknown),
      { status: 500 }
    );
  }
}

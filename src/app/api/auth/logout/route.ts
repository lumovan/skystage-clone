
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
 * User Logout API Endpoint
 * POST /api/auth/logout
 *
 * Handles user logout by clearing authentication cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { analyticsDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get current user for analytics
    const user = await getUserFromRequest(request);

    // Record logout event if user was authenticated
    if (user) {
      analyticsDb.recordEvent({
        event_type: 'user_logout',
        entity_type: 'user',
        entity_id: user.id,
        user_id: user.id,
        metadata: {
          logout_source: 'web'
        }
      });
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0 // Expire immediately
    });

    // Also clear dev cookie in development
    if (process.env.NODE_ENV !== 'production') {
      response.cookies.set('auth-token-dev', '', {
        secure: false,
        sameSite: 'lax',
        maxAge: 0
      });
    }

    return response;

  } catch (error: unknown) {
    console.error('Logout error:', error);

    // Still clear the cookie even if there's an error
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    return response;
  }
}

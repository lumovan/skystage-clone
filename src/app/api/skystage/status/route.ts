
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
 * Skystage Status API
 * Check connection status and user info
 */

import { NextRequest, NextResponse } from 'next/server';
import { skystageClient } from '@/lib/skystage-client';

export async function GET(request: NextRequest) {
  try {
    // Try to load existing session
    const sessionLoaded = await skystageClient.loadSession();

    if (sessionLoaded && skystageClient.isLoggedIn()) {
      const user = skystageClient.getUser();

      return NextResponse.json({
        success: true,
        connected: true,
        user: {
          email: user?.email,
          name: user?.name,
          userType: user?.userType,
          membership: user?.membership
        },
        lastSync: null // Could be retrieved from database
      });
    }

    return NextResponse.json({
      success: true,
      connected: false,
      user: null,
      lastSync: null
    });

  } catch (error: unknown) {
    console.error('Skystage status check failed:', error);
    return NextResponse.json({
      success: true,
      connected: false,
      error: error.message
    });
  }
}

export const dynamic = 'force-dynamic';

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
 * Database Health Check API
 * Provides database connection status and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseHealthStatus } from '@/lib/database/init';
import { getDatabaseStats } from '@/lib/database/factory';
import { dbUtils } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get comprehensive health status
    const health = await getDatabaseHealthStatus();

    // Get database statistics if connected
    let dbStats = null;
    if (health.connected) {
      try {
        dbStats = await dbUtils.getStats();
      } catch (error) {
        console.warn('[Health Check] Failed to get database stats:', error);
      }
    }

    // Get connection information
    const connectionStats = getDatabaseStats();

    return NextResponse.json({
      success: true,
      data: {
        health: {
          status: health.status,
          connected: health.connected,
          latency: health.latency,
          provider: health.provider,
          timestamp: new Date().toISOString()
        },
        connection: {
          provider: connectionStats.provider,
          availableProviders: connectionStats.availableProviders,
          config: connectionStats.config
        },
        statistics: dbStats,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          databaseProvider: process.env.DATABASE_PROVIDER || 'sqlite',
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasPostgresConfig: !!(process.env.POSTGRES_HOST && process.env.POSTGRES_PASSWORD)
        }
      }
    });

  } catch (error: unknown) {
    console.error('[Health Check] Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      details: error.message,
      data: {
        health: {
          status: 'error',
          connected: false,
          latency: 0,
          provider: 'unknown',
          timestamp: new Date().toISOString()
        }
      }
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

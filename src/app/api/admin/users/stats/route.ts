
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
 * User Statistics API
 * Provide user analytics and statistics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all users to calculate statistics
    const allUsers = userDb.getAll(10000, 0); // Get all users

    // Calculate basic stats
    const total = allUsers.length;
    const active = allUsers.filter(user => user.is_active).length;
    const verified = allUsers.filter(user => user.is_verified).length;

    // Calculate new users this month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const newThisMonth = allUsers.filter(user => {
      const createdAt = new Date(user.created_at);
      return createdAt >= currentMonth;
    }).length;

    // Group by user type
    const byType: Record<string, number> = {};
    allUsers.forEach(user => {
      const type = user.user_type || 'customer';
      byType[type] = (byType[type] || 0) + 1;
    });

    // Mock subscription data (in real implementation, this would come from a subscriptions table)
    const bySubscription = {
      free: Math.floor(total * 0.6),
      basic: Math.floor(total * 0.25),
      pro: Math.floor(total * 0.12),
      enterprise: Math.floor(total * 0.03)
    };

    const stats = {
      total,
      active,
      verified,
      new_this_month: newThisMonth,
      by_type: byType,
      by_subscription: bySubscription,
      growth_rate: newThisMonth > 0 ? ((newThisMonth / total) * 100).toFixed(1) : '0',
      activity_rate: total > 0 ? ((active / total) * 100).toFixed(1) : '0',
      verification_rate: total > 0 ? ((verified / total) * 100).toFixed(1) : '0'
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error: unknown) {
    console.error('User stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
);
  }
}

export const dynamic = 'force-dynamic';

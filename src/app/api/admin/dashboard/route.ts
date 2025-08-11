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
 * Admin Dashboard API Endpoint
 * GET /api/admin/dashboard
 *
 * Provides comprehensive analytics and statistics for the admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createErrorResponse, getUserFromRequest } from '@/lib/auth';
import { analyticsDb, userDb, bookingDb, formationDb, syncJobDb, organizationDb } from '@/lib/db';
import { ensureDatabaseConnection } from '@/lib/database/init';

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    await ensureDatabaseConnection();

    console.log('[Admin Dashboard] Checking authentication...');

    // In development, provide debug information
    if (process.env.NODE_ENV === 'development') {
      const cookies = request.cookies.getAll();
      const authHeader = request.headers.get('authorization');

      console.log('[Admin Dashboard] Debug Info:');
      console.log('- Cookies:', cookies.map(c => `${c.name}=${c.value?.substring(0, 20)}...`));
      console.log('- Auth Header:', authHeader?.substring(0, 50) + '...');
    }

    // Try to get user first
    const user = await getUserFromRequest(request);
    console.log('[Admin Dashboard] User found:', user ? `${user.email} (${user.user_type})` : 'None');

    // Development bypass for testing - if no user found, try admin bypass
    if (!user && process.env.NODE_ENV === 'development') {
      console.log('[Admin Dashboard] Dev mode: Attempting admin bypass...');

      // Create a mock admin for development testing
      const mockAdmin = {
        id: 'dev-admin',
        email: 'admin@skystage.local',
        user_type: 'admin',
        is_verified: true,
        is_active: true
      };

      // Generate mock dashboard data for development
      const mockStats = await generateMockDashboardStats();

      return NextResponse.json({
        success: true,
        data: mockStats,
        debug: {
          mode: 'development_bypass',
          message: 'Using mock data for development testing'
        }
      });
    }

    // Require admin access (this will throw if not admin)
    let admin;
    try {
      admin = await requireAdmin(request);
    } catch (error: unknown) {
      console.error('[Admin Dashboard] Auth error:', authError.message);

      return NextResponse.json(
        createErrorResponse('Admin access required', {
          debug: process.env.NODE_ENV === 'development' ? {
            authError: authError.message,
            userFound: !!user,
            userType: user?.user_type,
            suggestion: 'Try logging in via /admin/login'
          } : undefined
        } as unknown),
        { status: 403 }
      );
    }

    console.log('[Admin Dashboard] Admin authenticated:', admin.email);

    // Get comprehensive dashboard statistics
    const stats = await analyticsDb.getDashboardStats();

    // Get additional detailed metrics in parallel
    const [
      userCount,
      bookingCount,
      formationCount,
      organizationCount,
      syncJobCount,
      newUsersThisWeek,
      newUsersThisMonth,
      mostPopularFormations,
      recentFormations,
      recentSyncJobs,
      pendingBookings,
      recentUsers
    ] = await Promise.all([
      userDb.getCount(),
      getCountSafe('bookings'),
      getCountSafe('formations'),
      organizationDb.getCount(),
      getCountSafe('sync_jobs'),
      getNewUsersThisWeek(),
      getNewUsersThisMonth(),
      getMostPopularFormations(),
      getRecentFormations(),
      getRecentSyncJobs(),
      getPendingBookings(),
      getRecentUsers()
    ]);

    // Calculate growth metrics
    const userGrowth = await calculateUserGrowth();
    const formationGrowth = await calculateFormationGrowth();

    const dashboardStats = {
      // Overview metrics
      overview: {
        total_users: userCount,
        total_organizations: organizationCount,
        total_formations: formationCount,
        total_bookings: bookingCount,
        total_sync_jobs: syncJobCount
      },

      // User metrics with growth
      users: {
        total: userCount,
        new_this_week: newUsersThisWeek,
        new_this_month: newUsersThisMonth,
        growth_percentage: userGrowth.percentage,
        growth_direction: userGrowth.direction,
        by_type: stats.users || [],
        recent: recentUsers
      },

      // Formation metrics with analytics
      formations: {
        total: formationCount,
        by_category: stats.formations || [],
        most_popular: mostPopularFormations,
        recent_uploads: recentFormations,
        growth_percentage: formationGrowth.percentage,
        growth_direction: formationGrowth.direction
      },

      // Booking metrics with status breakdown
      bookings: {
        total: bookingCount,
        pending: pendingBookings.length,
        confirmed: 0,
        completed: 0,
        recent: pendingBookings.slice(0, 5),
        by_status: stats.bookings || []
      },

      // Sync job metrics
      sync_jobs: {
        total: syncJobCount,
        recent: recentSyncJobs,
        success_rate: calculateSyncSuccessRate(recentSyncJobs)
      },

      // Activity metrics
      activity: {
        recent_events: stats.recentActivity || [],
        daily_active_users: Math.floor(Math.random() * 50) + 10, // Mock for now
        daily_trends: await getDailyTrends(),
        popular_categories: await getPopularCategories()
      },

      // System health
      system: {
        database_provider: process.env.DATABASE_PROVIDER || 'sqlite',
        total_records: userCount + formationCount + bookingCount + organizationCount,
        last_sync: await getLastSyncTime()
      }
    };

    // Record admin dashboard view
    try {
      await analyticsDb.recordEvent({
        event_type: 'admin_dashboard_viewed',
        entity_type: 'admin',
        user_id: admin.id,
        metadata: {
          stats_generated_at: new Date().toISOString(),
          total_users: userCount,
          total_formations: formationCount,
          total_bookings: bookingCount,
          database_provider: process.env.DATABASE_PROVIDER
        }
      });
    } catch (analyticsError) {
      console.warn('[Admin Dashboard] Analytics recording failed:', analyticsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...dashboardStats,
        generated_at: new Date().toISOString(),
        generated_by: admin.id
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching admin dashboard:', error);

    // Handle auth errors
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        createErrorResponse('Admin access required', {
          debug: process.env.NODE_ENV === 'development' ? {
            error: error.message,
            suggestion: 'Please log in as an admin user'
          } : undefined
        } as unknown),
        { status: 403 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Failed to fetch dashboard data', {
        debug: process.env.NODE_ENV === 'development' ? {
          error: error.message,
          stack: error.stack
        } : undefined
      } as unknown),
      { status: 500 }
    );
  }
}

/**
 * Safe count function that handles errors gracefully
 */
async function getCountSafe(table: string): Promise<number> {
  try {
    switch (table) {
      case 'bookings':
        return await bookingDb.count('bookings');
      case 'formations':
        return await formationDb.count('formations');
      case 'sync_jobs':
        return await syncJobDb.count('sync_jobs');
      default:
        return 0;
    }
  } catch (error) {
    console.warn(`Error counting ${table}:`, error);
    return 0;
  }
}

/**
 * Generate mock dashboard stats for development
 */
async function generateMockDashboardStats() {
  return {
    overview: {
      total_users: 12,
      total_organizations: 3,
      total_formations: 74,
      total_bookings: 8,
      total_sync_jobs: 2
    },
    users: {
      total: 12,
      new_this_week: 3,
      new_this_month: 8,
      growth_percentage: 25,
      growth_direction: 'up',
      by_type: [
        { user_type: 'customer', count: 6 },
        { user_type: 'operator', count: 4 },
        { user_type: 'admin', count: 2 }
      ],
      recent: []
    },
    formations: {
      total: 74,
      by_category: [
        { category: 'Wedding', count: 25 },
        { category: 'Epic', count: 20 },
        { category: 'Christmas', count: 15 },
        { category: 'Corporate', count: 14 }
      ],
      most_popular: [
        { id: '1', name: 'Beating Heart', downloads: 4792, rating: 4.8, drone_count: 100 },
        { id: '2', name: 'Wedding Rings', downloads: 3421, rating: 4.9, drone_count: 80 },
        { id: '3', name: 'Epic Dragon', downloads: 2987, rating: 4.7, drone_count: 150 }
      ],
      recent_uploads: [],
      growth_percentage: 15,
      growth_direction: 'up'
    },
    bookings: {
      total: 8,
      pending: 3,
      confirmed: 4,
      completed: 1,
      recent: [],
      by_status: [
        { status: 'pending', count: 3 },
        { status: 'confirmed', count: 4 },
        { status: 'completed', count: 1 }
      ]
    },
    sync_jobs: {
      total: 2,
      recent: [],
      success_rate: 100
    },
    activity: {
      recent_events: [],
      daily_active_users: 28,
      daily_trends: [],
      popular_categories: []
    },
    system: {
      database_provider: 'sqlite',
      total_records: 96,
      last_sync: new Date().toISOString()
    },
    generated_at: new Date().toISOString(),
    generated_by: 'dev-admin'
  };
}

/**
 * Helper functions for dashboard metrics using the new database system
 */

async function getNewUsersThisWeek(): Promise<number> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  try {
    const users = await userDb.getAll({
      where: {},  // We'll filter by date in the query
      orderBy: [{ column: 'created_at', direction: 'DESC' }]
    });

    return users.filter(user =>
      new Date(user.created_at) >= oneWeekAgo
    ).length;
  } catch (error) {
    console.warn('Error getting new users this week:', error);
    return 0;
  }
}

async function getNewUsersThisMonth(): Promise<number> {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  try {
    const users = await userDb.getAll({
      orderBy: [{ column: 'created_at', direction: 'DESC' }]
    });

    return users.filter(user =>
      new Date(user.created_at) >= oneMonthAgo
    ).length;
  } catch (error) {
    console.warn('Error getting new users this month:', error);
    return 0;
  }
}

async function getMostPopularFormations(): Promise<any[]> {
  try {
    const formations = await formationDb.getAll({
      where: { is_public: true },
      orderBy: [
        { column: 'download_count', direction: 'DESC' },
        { column: 'rating', direction: 'DESC' }
      ],
      limit: 5
    });

    return formations.map(f => ({
      id: f.id,
      name: f.name,
      category: f.category,
      download_count: f.download_count || 0,
      rating: f.rating || 0,
      drone_count: f.drone_count
    }));
  } catch (error) {
    console.warn('Error getting popular formations:', error);
    return [];
  }
}

async function getRecentFormations(): Promise<any[]> {
  try {
    const formations = await formationDb.getAll({
      orderBy: [{ column: 'created_at', direction: 'DESC' }],
      limit: 5
    });

    // Get creator information for each formation
    const formationsWithCreators = await Promise.all(
      formations.map(async (formation) => {
        const creator = await userDb.findById(formation.created_by);
        return {
          id: formation.id,
          name: formation.name,
          category: formation.category,
          created_at: formation.created_at,
          creator_name: creator?.full_name || 'Unknown',
          creator_email: creator?.email || '',
          drone_count: formation.drone_count,
          is_public: formation.is_public
        };
      })
    );

    return formationsWithCreators;
  } catch (error) {
    console.warn('Error getting recent formations:', error);
    return [];
  }
}

async function getRecentSyncJobs(): Promise<any[]> {
  try {
    return await syncJobDb.getRecent(5);
  } catch (error) {
    console.warn('Error getting recent sync jobs:', error);
    return [];
  }
}

async function getPendingBookings(): Promise<any[]> {
  try {
    return await bookingDb.getByStatus('pending', { limit: 10 });
  } catch (error) {
    console.warn('Error getting pending bookings:', error);
    return [];
  }
}

async function getRecentUsers(): Promise<any[]> {
  try {
    const users = await userDb.getAll({
      orderBy: [{ column: 'created_at', direction: 'DESC' }],
      limit: 5,
      select: ['id', 'email', 'full_name', 'user_type', 'is_verified', 'created_at']
    });

    return users;
  } catch (error) {
    console.warn('Error getting recent users:', error);
    return [];
  }
}

async function calculateUserGrowth(): Promise<{ percentage: number; direction: 'up' | 'down' | 'stable' }> {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const users = await userDb.getAll();

    const thisMonthUsers = users.filter(user =>
      new Date(user.created_at) >= lastMonth
    ).length;

    const lastMonthUsers = users.filter(user => {
      const createdAt = new Date(user.created_at);
      return createdAt >= twoMonthsAgo && createdAt < lastMonth;
    }).length;

    if (lastMonthUsers === 0) {
      return { percentage: 0, direction: 'stable' };
    }

    const percentage = Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100);
    const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable';

    return { percentage: Math.abs(percentage), direction };
  } catch (error) {
    console.warn('Error calculating user growth:', error);
    return { percentage: 0, direction: 'stable' };
  }
}

async function calculateFormationGrowth(): Promise<{ percentage: number; direction: 'up' | 'down' | 'stable' }> {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const formations = await formationDb.getAll();

    const thisMonthFormations = formations.filter(formation =>
      new Date(formation.created_at) >= lastMonth
    ).length;

    const lastMonthFormations = formations.filter(formation => {
      const createdAt = new Date(formation.created_at);
      return createdAt >= twoMonthsAgo && createdAt < lastMonth;
    }).length;

    if (lastMonthFormations === 0) {
      return { percentage: 0, direction: 'stable' };
    }

    const percentage = Math.round(((thisMonthFormations - lastMonthFormations) / lastMonthFormations) * 100);
    const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable';

    return { percentage: Math.abs(percentage), direction };
  } catch (error) {
    console.warn('Error calculating formation growth:', error);
    return { percentage: 0, direction: 'stable' };
  }
}

function calculateSyncSuccessRate(syncJobs: unknown[]): number {
  if (syncJobs.length === 0) return 0;

  const successful = syncJobs.filter(job => job.status === 'completed').length;
  return Math.round((successful / syncJobs.length) * 100);
}

async function getDailyTrends(): Promise<any[]> {
  try {
    const events = await analyticsDb.getByEventType('user_login', {
      limit: 100,
      orderBy: [{ column: 'created_at', direction: 'DESC' }]
    });

    // Group by date
    const trends = events.reduce((acc, event) => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(trends)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
  } catch (error) {
    console.warn('Error getting daily trends:', error);
    return [];
  }
}

async function getPopularCategories(): Promise<any[]> {
  try {
    const formations = await formationDb.getAll({
      where: { is_public: true }
    });

    const categoryCounts = formations.reduce((acc, formation) => {
      acc[formation.category] = (acc[formation.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch (error) {
    console.warn('Error getting popular categories:', error);
    return [];
  }
}

async function getLastSyncTime(): Promise<string | null> {
  try {
    const recentSyncs = await syncJobDb.getAll({
      where: { type: 'skystage_formations' },
      orderBy: [{ column: 'completed_at', direction: 'DESC' }],
      limit: 1
    });

    return recentSyncs[0]?.completed_at || null;
  } catch (error) {
    console.warn('Error getting last sync time:', error);
    return null;
  }
}

export const dynamic = 'force-dynamic';

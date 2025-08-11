
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
 * User Export API
 * Export user data to CSV format
 */

import { NextRequest, NextResponse } from 'next/server';
import { userDb, analyticsDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userIds, filters } = await request.json();

    let users;

    if (userIds && userIds.length > 0) {
      // Export specific users
      users = userIds.map((id: string) => userDb.findById(id)).filter(Boolean);
    } else {
      // Export all users (with filters)
      users = userDb.getAll(10000, 0); // Get all users

      if (filters) {
        users = users.filter(user => {
          let matches = true;

          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            matches = matches && (
              user.email.toLowerCase().includes(searchLower) ||
              (user.full_name && user.full_name.toLowerCase().includes(searchLower)) ||
              (user.company_name && user.company_name.toLowerCase().includes(searchLower))
            );
          }

          if (filters.filterType && filters.filterType !== 'all') {
            matches = matches && user.user_type === filters.filterType;
          }

          if (filters.filterStatus && filters.filterStatus !== 'all') {
            if (filters.filterStatus === 'active') {
              matches = matches && user.is_active;
            } else if (filters.filterStatus === 'inactive') {
              matches = matches && !user.is_active;
            } else if (filters.filterStatus === 'verified') {
              matches = matches && user.is_verified;
            } else if (filters.filterStatus === 'unverified') {
              matches = matches && !user.is_verified;
            }
          }

          return matches;
        });
      }
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users found to export' },
        { status: 400 }
);
    }

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Email',
      'Full Name',
      'User Type',
      'Company',
      'Phone',
      'Location',
      'Active',
      'Verified',
      'Created Date',
      'Last Login'
    ];

    const csvRows = users.map(user => [
      user.id,
      user.email,
      user.full_name || '',
      user.user_type,
      user.company_name || '',
      user.phone || '',
      user.location || '',
      user.is_active ? 'Yes' : 'No',
      user.is_verified ? 'Yes' : 'No',
      new Date(user.created_at).toLocaleDateString(),
      user.last_login ? new Date(user.last_login).toLocaleDateString() : ''
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => {
        // Escape fields that contain commas or quotes
        if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(','))
    ].join('\n');

    // Record analytics event
    analyticsDb.recordEvent({
      event_type: 'users_exported',
      entity_type: 'user',
      metadata: {
        export_count: users.length,
        has_filters: !!filters,
        specific_users: !!userIds
      }
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`,
        'Content-Length': Buffer.byteLength(csvContent).toString()
      }
    });

  } catch (error: unknown) {
    console.error('User export error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
);
  }
}

export const dynamic = 'force-dynamic';

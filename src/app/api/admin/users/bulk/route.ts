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
 * Bulk User Operations API
 * Handle bulk actions on multiple users
 */

import { NextRequest, NextResponse } from 'next/server';
import { userDb, analyticsDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userIds, action, value } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User IDs required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action required' },
        { status: 400 }
);
    }

    let updatedCount = 0;

    // Process bulk action
    for (const userId of userIds) {
      try {
        let updateData: unknown = {};

        switch (action) {
          case 'activate':
            updateData = { is_active: true };
            break;
          case 'deactivate':
            updateData = { is_active: false };
            break;
          case 'verify':
            updateData = { is_verified: true };
            break;
          case 'unverify':
            updateData = { is_verified: false };
            break;
          case 'update_type':
            if (value && ['customer', 'operator', 'artist', 'admin'].includes(value)) {
              updateData = { user_type: value };
            } else {
              continue; // Skip invalid user type
            }
            break;
          case 'send_welcome_email':
            // In a real implementation, you would send an email here
            // For now, we'll just log the action
            analyticsDb.recordEvent({
              event_type: 'email_sent',
              entity_type: 'user',
              entity_id: userId,
              metadata: { email_type: 'welcome' }
            });
            updatedCount++;
            continue;
          default:
            continue; // Skip unknown actions
        }

        if (Object.keys(updateData).length > 0) {
          userDb.update(userId, updateData);
          updatedCount++;

          // Record analytics event
          analyticsDb.recordEvent({
            event_type: 'user_bulk_update',
            entity_type: 'user',
            entity_id: userId,
            metadata: { action, updates: updateData }
          });
        }
      } catch (error) {
        console.error(`Failed to update user ${userId}:`, error);
        // Continue with other users
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} users`,
      updated_count: updatedCount
    });

  } catch (error: unknown) {
    console.error('Bulk user operation failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
);
  }
}

export const dynamic = 'force-dynamic';

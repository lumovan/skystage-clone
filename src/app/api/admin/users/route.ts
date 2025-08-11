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
 * Admin Users Management API Endpoints
 * GET /api/admin/users - List all users with filtering and pagination
 * PUT /api/admin/users - Update user (activate/deactivate, change role, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, createErrorResponse } from '@/lib/auth';
import { userDb, analyticsDb } from '@/lib/db';

// Validation schema for user updates
const updateUserSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  updates: z.object({
    is_active: z.boolean().optional(),
    is_verified: z.boolean().optional(),
    user_type: z.enum(['customer', 'operator', 'artist', 'admin']).optional(),
    full_name: z.string().max(100).optional(),
    company_name: z.string().max(100).optional(),
    location: z.string().max(100).optional()
  })
});

/**
 * GET /api/admin/users
 * List all users with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const admin = await requireAdmin(request);

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const user_type = searchParams.get('user_type') || undefined;
    const is_active = searchParams.get('is_active');
    const is_verified = searchParams.get('is_verified');
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;

    // Build dynamic query
    let query = `
      SELECT id, email, full_name, user_type, company_name, location,
             is_verified, is_active, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params: unknown[] = [];

    // Add filters
    if (user_type) {
      query += ' AND user_type = ?';
      params.push(user_type);
    }

    if (is_active !== null && is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    if (is_verified !== null && is_verified !== undefined) {
      query += ' AND is_verified = ?';
      params.push(is_verified === 'true' ? 1 : 0);
    }

    if (search) {
      query += ' AND (email LIKE ? OR full_name LIKE ? OR company_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Add ordering and pagination
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Execute query
    const db = getDb();
    const stmt = db.prepare(query);
    const users = stmt.all(...params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const countParams: unknown[] = [];

    if (user_type) {
      countQuery += ' AND user_type = ?';
      countParams.push(user_type);
    }

    if (is_active !== null && is_active !== undefined) {
      countQuery += ' AND is_active = ?';
      countParams.push(is_active === 'true' ? 1 : 0);
    }

    if (is_verified !== null && is_verified !== undefined) {
      countQuery += ' AND is_verified = ?';
      countParams.push(is_verified === 'true' ? 1 : 0);
    }

    if (search) {
      countQuery += ' AND (email LIKE ? OR full_name LIKE ? OR company_name LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countStmt = db.prepare(countQuery);
    const total = countStmt.get(...countParams)?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Record analytics event
    analyticsDb.recordEvent({
      event_type: 'admin_users_viewed',
      entity_type: 'user',
      user_id: admin.id,
      metadata: {
        filters: { user_type, is_active, is_verified, search },
        page,
        limit,
        results_count: users.length
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: { user_type, is_active, is_verified, search }
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching users:', error);

    // Handle auth errors
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        createErrorResponse('Admin access required' as unknown),
        { status: 403 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Failed to fetch users' as unknown),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users
 * Update user details (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    // Require admin access
    const admin = await requireAdmin(request);

    const body = await request.json();

    // Validate input
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = userDb.findById(validatedData.user_id);
    if (!existingUser) {
      return NextResponse.json(
        createErrorResponse('User not found' as unknown),
        { status: 404 }
      );
    }

    // Prevent admin from deactivating themselves
    if (validatedData.user_id === admin.id && validatedData.updates.is_active === false) {
      return NextResponse.json(
        createErrorResponse('Cannot deactivate your own account' as unknown),
        { status: 400 }
      );
    }

    // Update user
    userDb.update(validatedData.user_id, validatedData.updates);

    // Get updated user
    const updatedUser = userDb.findById(validatedData.user_id);

    // Record analytics event
    analyticsDb.recordEvent({
      event_type: 'admin_user_updated',
      entity_type: 'user',
      entity_id: validatedData.user_id,
      user_id: admin.id,
      metadata: {
        target_user_id: validatedData.user_id,
        target_user_email: existingUser.email,
        updates: validatedData.updates,
        admin_id: admin.id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        user_type: updatedUser.user_type,
        is_active: updatedUser.is_active,
        is_verified: updatedUser.is_verified,
        updated_at: updatedUser.updated_at
      },
      message: 'User updated successfully'
    });

  } catch (error: unknown) {
    console.error('Error updating user:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        createErrorResponse(`Validation error: ${error.errors[0].message}` as unknown),
        { status: 400 }
      );
    }

    // Handle auth errors
    if (error.message === 'Authentication required' || error.message === 'Admin access required') {
      return NextResponse.json(
        createErrorResponse('Admin access required' as unknown),
        { status: 403 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Failed to update user' as unknown),
      { status: 500 }
    );
  }
}

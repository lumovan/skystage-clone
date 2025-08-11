
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
 * Formations API Endpoints
 * GET /api/formations - List formations with filtering and pagination
 * POST /api/formations - Create new formation (authenticated users only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { formationDb, analyticsDb } from '@/lib/db';
import { requireAuth, createErrorResponse } from '@/lib/auth';
import { ensureDatabaseConnection } from '@/lib/database/init';

// Validation schema for creating formations
const createFormationSchema = z.object({
  name: z.string().min(1, 'Formation name is required').max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1, 'Category is required'),
  drone_count: z.number().min(1, 'Drone count must be at least 1').max(10000),
  duration: z.number().min(0.1, 'Duration must be positive'),
  price: z.number().min(0).optional().default(0),
  is_public: z.boolean().optional().default(true),
  tags: z.array(z.string()).optional(),
  formation_data: z.any().optional(),
  metadata: z.any().optional()
});

/**
 * GET /api/formations
 * List formations with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    await ensureDatabaseConnection();

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;
    const includePrivate = searchParams.get('include_private') === 'true';

    // Build query options
    const queryOptions = {
      limit,
      offset,
      orderBy: [{ column: 'created_at', direction: 'DESC' as const }],
      where: {} as any
    };

    // Add category filter
    if (category) {
      queryOptions.where.category = category;
    }

    // Add public filter (unless specifically including private)
    if (!includePrivate) {
      queryOptions.where.is_public = true;
    }

    // Get formations from database
    let formations;
    if (search) {
      formations = await formationDb.search(search, queryOptions);
    } else {
      formations = await formationDb.getAll(queryOptions);
    }

    // Get total count for pagination
    const totalFormations = await formationDb.count('formations', queryOptions.where);
    const totalPages = Math.ceil(totalFormations / limit);

    // Get categories for filters
    const categories = await formationDb.getCategories();

    // Record analytics event
    await analyticsDb.recordEvent({
      event_type: 'formations_viewed',
      entity_type: 'formation',
      metadata: {
        filters: { category, search, includePrivate },
        page,
        limit,
        results_count: formations.length
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        formations,
        pagination: {
          page,
          limit,
          total: totalFormations,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        categories: categories.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          formation_count: c.formation_count || 0
        } as unknown)),
        filters: { category, search, includePrivate }
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching formations:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch formations' as unknown),
      { status: 500 }
    );
  }
}

/**
 * POST /api/formations
 * Create new formation (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure database connection
    await ensureDatabaseConnection();

    // Require authentication
    const user = await requireAuth(request);

    const body = await request.json();

    // Validate input
    const validatedData = createFormationSchema.parse(body);

    // Create formation data
    const formationData = {
      name: validatedData.name,
      description: validatedData.description || '',
      category: validatedData.category,
      drone_count: validatedData.drone_count,
      duration: validatedData.duration,
      price: validatedData.price || 0,
      created_by: user.id,
      is_public: validatedData.is_public !== false,
      tags: validatedData.tags ? validatedData.tags.join(',') : '',
      formation_data: validatedData.formation_data || null,
      metadata: validatedData.metadata || null,
      source: 'manual'
    };

    // Save to database
    const createdFormation = await formationDb.create(formationData);

    // Record analytics event
    await analyticsDb.recordEvent({
      event_type: 'formation_created',
      entity_type: 'formation',
      entity_id: createdFormation.id,
      user_id: user.id,
      metadata: {
        category: validatedData.category,
        drone_count: validatedData.drone_count,
        duration: validatedData.duration,
        is_public: validatedData.is_public
      }
    });

    return NextResponse.json({
      success: true,
      data: createdFormation,
      message: 'Formation created successfully'
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating formation:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        createErrorResponse(`Validation error: ${error.errors[0].message}` as unknown),
        { status: 400 }
      );
    }

    // Handle auth errors
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        createErrorResponse('Authentication required' as unknown),
        { status: 401 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Failed to create formation' as unknown),
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

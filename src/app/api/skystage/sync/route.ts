
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
 * Enhanced Skystage Sync API
 * Handles comprehensive formation import from SkyStage.com
 * POST /api/skystage/sync - Start formation sync
 * GET /api/skystage/sync - Get sync status
 */

import { NextRequest, NextResponse } from 'next/server';
import { formationDb, syncJobDb, analyticsDb } from '@/lib/db';
import { requireAuth, createErrorResponse } from '@/lib/auth';
import { ensureDatabaseConnection } from '@/lib/database/init';
import { AdvancedFormationScraper } from '@/lib/formation-scraper';

export async function POST(request: NextRequest) {
  try {
    // Ensure database connection
    await ensureDatabaseConnection();

    // Require authentication
    const user = await requireAuth(request);

    const body = await request.json();
    const { syncType = 'full_import', options = {} } = body;

    console.log('🚀 Starting comprehensive SkyStage formation import...');

    // Create sync job in database
    const syncJob = await syncJobDb.create({
      type: 'skystage_formations_comprehensive',
      status: 'pending',
      progress: 0,
      total_items: 0,
      processed_items: 0,
      successful_items: 0,
      failed_items: 0,
      metadata: {
        syncType,
        options,
        initiatedBy: user.email,
        startedAt: new Date().toISOString()
      },
      created_by: user.id
    });

    // Start the import process asynchronously
    const importProcess = startFormationImport(syncJob.id, options);

    // Don't await the import process - let it run in background
    importProcess.catch(error => {
      console.error('Formation import failed:', error);
      // Update sync job status to failed
      syncJobDb.update(syncJob.id, {
        status: 'failed',
        metadata: {
          ...syncJob.metadata,
          error: error.message,
          completedAt: new Date().toISOString()
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        syncJobId: syncJob.id,
        status: 'started',
        message: 'Comprehensive formation import started. This may take several minutes to complete.',
        estimatedTime: '10-30 minutes',
        checkStatusUrl: `/api/skystage/sync?jobId=${syncJob.id}`
      }
    });

  } catch (error: unknown) {
    console.error('Error starting formation sync:', error);

    // Handle auth errors
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        createErrorResponse('Authentication required' as unknown),
        { status: 401 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Failed to start formation sync', {
        error: error.message
      } as unknown),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    await ensureDatabaseConnection();

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Get specific sync job status
      const syncJob = await syncJobDb.getById(jobId);

      if (!syncJob) {
        return NextResponse.json(
          createErrorResponse('Sync job not found' as unknown),
          { status: 404 }
        );
      }

      // Get recent formations count to show progress
      const recentCount = await formationDb.getCount();

      return NextResponse.json({
        success: true,
        data: {
          syncJob,
          currentFormationCount: recentCount,
          estimatedTimeRemaining: syncJob.metadata?.estimatedTimeRemaining || null,
          lastUpdate: syncJob.updated_at
        }
      });
    } else {
      // Get all recent sync jobs
      const recentJobs = await syncJobDb.getRecent(10);
      const totalFormations = await formationDb.getCount();

      return NextResponse.json({
        success: true,
        data: {
          recentJobs,
          totalFormations,
          lastImport: recentJobs[0] || null
        }
      });
    }

  } catch (error: unknown) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      createErrorResponse('Failed to get sync status' as unknown),
      { status: 500 }
    );
  }
}

/**
 * Start the comprehensive formation import process
 */
async function startFormationImport(syncJobId: string, options: unknown = {}): Promise<void> {
  console.log(`Starting formation import for sync job: ${syncJobId}`);

  try {
    // Create scraper instance with sync job ID
    const scraper = new AdvancedFormationScraper(syncJobId);

    // Update sync job to running status
    await syncJobDb.update(syncJobId, {
      status: 'running',
      metadata: {
        phase: 'initialization',
        startedAt: new Date().toISOString()
      }
    });

    // Start the full import process
    const result = await scraper.startFullImport();

    // Update sync job with final results
    await syncJobDb.update(syncJobId, {
      status: result.status === 'completed' ? 'completed' : 'failed',
      progress: 100,
      total_items: result.total,
      processed_items: result.processed,
      successful_items: result.successful,
      failed_items: result.failed,
      metadata: {
        ...result,
        completedAt: new Date().toISOString(),
        duration: Date.now() - result.startTime.getTime()
      }
    });

    // Record comprehensive analytics
    await analyticsDb.recordEvent({
      event_type: 'comprehensive_formation_import_completed',
      entity_type: 'system',
      metadata: {
        syncJobId,
        totalFormations: result.total,
        successfulImports: result.successful,
        failedImports: result.failed,
        duration: Date.now() - result.startTime.getTime(),
        source: 'skystage.com',
        importType: 'comprehensive'
      }
    });

    console.log(`✅ Formation import completed: ${result.successful}/${result.total} formations imported`);

  } catch (error: unknown) {
    console.error('Formation import process failed:', error);

    // Update sync job with error
    await syncJobDb.update(syncJobId, {
      status: 'failed',
      metadata: {
        error: error.message,
        failedAt: new Date().toISOString()
      }
    });

    // Record failure event
    await analyticsDb.recordEvent({
      event_type: 'formation_import_failed',
      entity_type: 'system',
      metadata: {
        syncJobId,
        error: error.message,
        failedAt: new Date().toISOString()
      }
    });

    throw error;
  }
}

export const dynamic = 'force-dynamic';

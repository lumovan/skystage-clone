
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
 * Formation Export API
 * Handles exporting formations to various formats
 * POST /api/formations/export - Export formation
 */

import { NextRequest, NextResponse } from 'next/server';
import { formationDb, analyticsDb } from '@/lib/db';
import { formationExporter, FormationExporter, ExportOptions } from '@/lib/formation-export';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const {
      formationId,
      format,
      options = {}
    }: {
      formationId: string;
      format: 'blender' | 'skybrush' | 'dss' | 'csv' | 'json';
      options: Partial<ExportOptions>;
    } = await request.json();

    // Validate request
    if (!formationId) {
      return NextResponse.json(
        { success: false, error: 'Formation ID required' },
        { status: 400 }
);
    }

    if (!format) {
      return NextResponse.json(
        { success: false, error: 'Export format required' },
        { status: 400 }
);
    }

    // Get formation from database
    const formation = formationDb.getById(formationId);
    if (!formation) {
      return NextResponse.json(
        { success: false, error: 'Formation not found' },
        { status: 404 }
);
    }

    // Convert to export format
    const exportFormation = FormationExporter.convertSkystageFormation({
      id: formation.id,
      name: formation.name,
      description: formation.description || '',
      category: formation.category,
      thumbnailUrl: formation.thumbnail_url || '',
      droneCount: formation.drone_count,
      duration: formation.duration,
      price: formation.price || 0,
      tags: formation.tags ? formation.tags.split(',') : [],
      creator: formation.created_by || 'Unknown',
      rating: 0,
      downloads: 0,
      createdAt: formation.created_at,
      isPublic: formation.is_public === 1
    });

    // Set export options
    const exportOptions: ExportOptions = {
      format,
      includeColors: options.includeColors ?? true,
      frameRate: options.frameRate ?? 24,
      coordinateSystem: options.coordinateSystem ?? 'xyz',
      scaleFactor: options.scaleFactor ?? 1,
      centerOrigin: options.centerOrigin ?? true,
      ...options
    };

    // Export formation
    const result = await formationExporter.exportFormation(exportFormation, exportOptions);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
);
    }

    // Read the exported file
    const fileBuffer = await fs.readFile(result.filePath!);
    const fileName = path.basename(result.filePath!);

    // Record analytics
    analyticsDb.recordEvent({
      event_type: 'formation_exported',
      entity_type: 'formation',
      entity_id: formationId,
      metadata: {
        format,
        options: exportOptions,
        fileSize: result.metadata?.fileSize,
        droneCount: result.metadata?.droneCount
      }
    });

    // Determine content type based on format
    const contentType = getContentType(format, fileName);

    // Return file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'X-Export-Metadata': JSON.stringify(result.metadata)
      }
    });

  } catch (error: unknown) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
);
  }
}

/**
 * Get available export formats
 */
export async function GET(request: NextRequest) {
  try {
    const formats = [
      {
        id: 'blender',
        name: 'Blender Python Script',
        description: 'Python script for importing into Blender with animation keyframes',
        extensions: ['.py', '.csv'],
        features: ['3D Animation', 'Color Support', 'Material Creation']
      },
      {
        id: 'skybrush',
        name: 'Skybrush Show File',
        description: 'Native Skybrush format for drone light shows',
        extensions: ['.skyc'],
        features: ['Timeline Animation', 'LED Colors', 'Show Metadata']
      },
      {
        id: 'dss',
        name: 'Drone Show Software',
        description: 'Compatible with popular drone show control software',
        extensions: ['.dss', '.json'],
        features: ['Trajectory Data', 'Multi-drone Support', 'Timing Control']
      },
      {
        id: 'csv',
        name: 'CSV Data Export',
        description: 'Comma-separated values for data analysis and custom import',
        extensions: ['.csv'],
        features: ['Universal Format', 'Data Analysis', 'Custom Processing']
      },
      {
        id: 'json',
        name: 'JSON Data Export',
        description: 'Structured JSON format with complete formation data',
        extensions: ['.json'],
        features: ['Complete Data', 'Web Compatible', 'API Integration']
      }
    ];

    const options = {
      coordinateSystems: [
        { id: 'xyz', name: 'XYZ (Standard)', description: 'Standard 3D coordinates' },
        { id: 'ned', name: 'NED (North-East-Down)', description: 'Aviation standard' },
        { id: 'enu', name: 'ENU (East-North-Up)', description: 'Geographic standard' }
      ],
      frameRates: [12, 24, 25, 30, 50, 60],
      scaleFactors: [0.1, 0.5, 1, 2, 5, 10],
      features: {
        includeColors: 'Include LED color information',
        centerOrigin: 'Center formation around origin point',
        scaleFactor: 'Scale formation size',
        coordinateSystem: 'Choose coordinate system',
        frameRate: 'Animation frame rate'
      }
    };

    return NextResponse.json({
      success: true,
      formats,
      options
    });

  } catch (error: unknown) {
    console.error('Export formats error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
);
  }
}

/**
 * Get content type for file format
 */
function getContentType(format: string, fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();

  switch (format) {
    case 'blender':
      return extension === '.py' ? 'text/x-python' : 'text/csv';
    case 'skybrush':
      return 'application/json';
    case 'dss':
      return 'application/json';
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

export const dynamic = 'force-dynamic';

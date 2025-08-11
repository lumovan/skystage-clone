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


import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { verifyToken } from '@/lib/auth';
import { getDB } from '@/lib/db';

const UPLOAD_DIR = './public/uploads/formations';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['.json', '.csv', '.zip', '.blend'];

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('formation') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }, { status: 400 });
    }

    // Validate file type
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_TYPES.includes(ext)) {
      return NextResponse.json({
        error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ' as unknown)}`
      }, { status: 400 });
    }

    // Generate unique filename
    const id = randomUUID();
    const filename = `${id}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Process formation file
    let formationData = null;
    try {
      formationData = await processFormationFile(file, buffer, ext);
    } catch (error) {
      console.error('Error processing formation:', error);
      return NextResponse.json({
        error: 'Failed to process formation file'
      }, { status: 400 });
    }

    // Save to database
    const db = getDB();

    const result = db.prepare(`
      INSERT INTO formations (
        id, name, description, thumbnail_url, drone_count,
        duration, file_path, file_type, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      id,
      formationData.name,
      formationData.description || '',
      formationData.thumbnail || null,
      formationData.droneCount || 0,
      formationData.duration || 0,
      `/uploads/formations/${filename}`,
      ext,
      user.id
    );

    return NextResponse.json({
      id,
      name: formationData.name,
      description: formationData.description,
      thumbnail: formationData.thumbnail,
      droneCount: formationData.droneCount,
      duration: formationData.duration,
      filePath: `/uploads/formations/${filename}`,
      fileType: ext,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Process formation file based on type
async function processFormationFile(file: File, buffer: Buffer, ext: string) {
  const defaultData = {
    name: file.name.replace(ext, ''),
    description: `Uploaded formation file: ${file.name}`,
    droneCount: 0,
    duration: 0,
    thumbnail: null,
  };

  switch (ext) {
    case '.json':
      return processJSONFormation(buffer, defaultData);
    case '.csv':
      return processCSVFormation(buffer, defaultData);
    case '.zip':
      // For ZIP files, we'd need to extract and process contents
      return { ...defaultData, description: 'ZIP formation package' };
    case '.blend':
      // For Blender files, this would require special processing
      return { ...defaultData, description: 'Blender formation file' };
    default:
      return defaultData;
  }
}

function processJSONFormation(data: unknown) {
  try {
    const jsonString = buffer.toString('utf8');
    const data = JSON.parse(jsonString);

    return {
      name: data.name || defaultData.name,
      description: data.description || defaultData.description,
      droneCount: data.droneCount || data.drone_count || 0,
      duration: data.duration || 0,
      thumbnail: null, // Would generate thumbnail here
    };
  } catch (error) {
    console.error('Error parsing JSON formation:', error);
    return defaultData;
  }
}

function processCSVFormation(data: unknown) {
  try {
    const csvString = buffer.toString('utf8');
    const lines = csvString.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return defaultData;
    }

    // Assume CSV format: time,drone_id,x,y,z,color
    const dataLines = lines.slice(1); // Skip header
    const droneIds = new Set();
    let maxTime = 0;

    for (const line of dataLines) {
      const parts = line.split(',');
      if (parts.length >= 5) {
        const time = parseFloat(parts[0]);
        const droneId = parts[1];

        droneIds.add(droneId);
        maxTime = Math.max(maxTime, time);
      }
    }

    return {
      name: defaultData.name,
      description: `CSV formation with ${droneIds.size} drones`,
      droneCount: droneIds.size,
      duration: maxTime,
      thumbnail: null,
    };
  } catch (error) {
    console.error('Error parsing CSV formation:', error);
    return defaultData;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDB();

    // Get user's uploaded formations
    const formations = db.prepare(`
      SELECT
        id, name, description, thumbnail_url, drone_count,
        duration, file_type, created_at, updated_at
      FROM formations
      WHERE created_by = ?
      ORDER BY created_at DESC
    `).all(user.id);

    return NextResponse.json({ formations });

  } catch (error) {
    console.error('Get formations error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

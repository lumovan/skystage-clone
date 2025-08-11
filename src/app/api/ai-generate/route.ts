
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
import { formationDb } from '@/lib/db';
import { initializeAppDatabase } from '@/lib/database/init';

// Simulated AI generation (in production, this would call OpenAI or similar)
async function generateFormation(prompt: string) {
  // Parse the prompt to extract key elements
  const lowerPrompt = prompt.toLowerCase();

  // Determine category based on keywords
  let category = 'Abstract';
  if (lowerPrompt.includes('heart') || lowerPrompt.includes('love') || lowerPrompt.includes('wedding')) {
    category = 'Love';
  } else if (lowerPrompt.includes('star') || lowerPrompt.includes('galaxy') || lowerPrompt.includes('space')) {
    category = 'Epic';
  } else if (lowerPrompt.includes('tree') || lowerPrompt.includes('flower') || lowerPrompt.includes('nature')) {
    category = 'Nature';
  } else if (lowerPrompt.includes('sport') || lowerPrompt.includes('ball') || lowerPrompt.includes('game')) {
    category = 'Sports';
  } else if (lowerPrompt.includes('company') || lowerPrompt.includes('logo') || lowerPrompt.includes('business')) {
    category = 'Corporate';
  }

  // Extract drone count if specified
  let droneCount = 100;
  const droneMatch = prompt.match(/(\d+)\s*drone/i);
  if (droneMatch) {
    droneCount = Math.min(Math.max(parseInt(droneMatch[1]), 50), 500);
  }

  // Generate formation name from prompt
  const words = prompt.split(' ').filter(w => w.length > 3);
  const name = words.slice(0, 3).map(w =>
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ') || 'AI Generated Formation';

  // Generate coordinate data
  const coordinates = [];
  const pattern = lowerPrompt.includes('circle') ? 'circle' :
                  lowerPrompt.includes('heart') ? 'heart' :
                  lowerPrompt.includes('star') ? 'star' :
                  lowerPrompt.includes('spiral') ? 'spiral' : 'random';

  for (let i = 0; i < droneCount; i++) {
    const t = i / droneCount;
    let x, y, z;

    switch (pattern) {
      case 'circle':
        const angle = t * Math.PI * 2;
        x = Math.cos(angle) * 20;
        y = Math.sin(angle) * 20;
        z = 0;
        break;

      case 'heart':
        const heartAngle = t * Math.PI * 2;
        x = 16 * Math.pow(Math.sin(heartAngle), 3);
        y = 13 * Math.cos(heartAngle) - 5 * Math.cos(2 * heartAngle) - 2 * Math.cos(3 * heartAngle) - Math.cos(4 * heartAngle);
        z = Math.sin(heartAngle * 2) * 5;
        break;

      case 'star':
        const starAngle = t * Math.PI * 10;
        const radius = (i % 2 === 0) ? 20 : 10;
        x = Math.cos(starAngle) * radius;
        y = Math.sin(starAngle) * radius;
        z = Math.sin(starAngle * 3) * 5;
        break;

      case 'spiral':
        const spiralAngle = t * Math.PI * 6;
        const spiralRadius = t * 25;
        x = Math.cos(spiralAngle) * spiralRadius;
        y = Math.sin(spiralAngle) * spiralRadius;
        z = t * 20;
        break;

      default:
        x = (Math.random() - 0.5) * 40;
        y = (Math.random() - 0.5) * 40;
        z = Math.random() * 20;
    }

    coordinates.push({
      drone_id: i,
      time: 0,
      x: x,
      y: y,
      z: z,
      r: 255,
      g: Math.floor(Math.random() * 155) + 100,
      b: Math.floor(Math.random() * 155) + 100
    });
  }

  // Add animation keyframes
  const keyframes = [];
  for (let frame = 0; frame <= 10; frame++) {
    keyframes.push({
      time: frame * 3,
      positions: coordinates.map(coord => ({
        ...coord,
        time: frame * 3,
        x: coord.x + Math.sin(frame / 2) * 5,
        y: coord.y + Math.cos(frame / 2) * 5,
        z: coord.z + frame * 2
      }))
    });
  }

  return {
    name,
    category,
    drone_count: droneCount,
    duration: 30,
    description: `AI-generated formation based on: "${prompt}"`,
    formation_data: {
      pattern,
      coordinates,
      keyframes,
      ai_generated: true,
      prompt: prompt
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    await initializeAppDatabase();

    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
);
    }

    // Generate formation using AI
    const generatedFormation = await generateFormation(prompt);

    // Save to database
    const formation = await formationDb.create({
      name: generatedFormation.name,
      description: generatedFormation.description,
      category: generatedFormation.category,
      drone_count: generatedFormation.drone_count,
      duration: generatedFormation.duration,
      thumbnail_url: `/assets/formations/ai-generated.jpg`,
      file_url: null,
      price: null,
      created_by: 'ai-generator',
      is_public: true,
      tags: `ai-generated,${generatedFormation.category.toLowerCase()},${generatedFormation.formation_data.pattern}`,
      formation_data: JSON.stringify(generatedFormation.formation_data),
      metadata: JSON.stringify({
        ai_generated: true,
        prompt: prompt,
        generated_at: new Date().toISOString()
      }),
      source: 'ai',
      source_id: `ai-${Date.now()}`,
      sync_status: 'synced',
      download_count: 0,
      rating: 4.5
    });

    return NextResponse.json({
      success: true,
      data: {
        formation,
        coordinates: generatedFormation.formation_data.coordinates
      }
    });

  } catch (error: unknown) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
);
  }
}

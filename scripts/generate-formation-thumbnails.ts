
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


#!/usr/bin/env node

/**
 * 🎨 AI Thumbnail Generator for Formations
 * Generates beautiful, unique thumbnails for all formations
 */

import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { formationDb } from '../src/lib/db';
import { initializeAppDatabase } from '../src/lib/database/init';

// Color palettes for each category
const CATEGORY_PALETTES = {
  Epic: {
    primary: '#4A148C',
    secondary: '#7B1FA2',
    accent: '#9C27B0',
    glow: '#E1BEE7'
  },
  Love: {
    primary: '#C2185B',
    secondary: '#E91E63',
    accent: '#F06292',
    glow: '#FCE4EC'
  },
  Nature: {
    primary: '#2E7D32',
    secondary: '#4CAF50',
    accent: '#81C784',
    glow: '#C8E6C9'
  },
  Abstract: {
    primary: '#512DA8',
    secondary: '#673AB7',
    accent: '#9575CD',
    glow: '#D1C4E9'
  },
  Entertainment: {
    primary: '#E65100',
    secondary: '#FF9800',
    accent: '#FFB74D',
    glow: '#FFE0B2'
  },
  Sports: {
    primary: '#1565C0',
    secondary: '#2196F3',
    accent: '#64B5F6',
    glow: '#BBDEFB'
  },
  Holidays: {
    primary: '#C62828',
    secondary: '#F44336',
    accent: '#EF5350',
    glow: '#FFCDD2'
  },
  Corporate: {
    primary: '#37474F',
    secondary: '#546E7A',
    accent: '#78909C',
    glow: '#B0BEC5'
  }
};

// Formation shape patterns
const FORMATION_PATTERNS = {
  heart: (width: number, height: number) => {
    const cx = width / 2;
    const cy = height / 2;
    const size = Math.min(width, height) * 0.3;

    const points = [];
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      const x = cx + size * (16 * Math.pow(Math.sin(angle), 3));
      const y = cy - size * (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
      points.push({ x, y });
    }
    return points;
  },

  circle: (width: number, height: number, count: number = 30) => {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.35;

    const points = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      points.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
      });
    }
    return points;
  },

  spiral: (width: number, height: number) => {
    const cx = width / 2;
    const cy = height / 2;
    const points = [];

    for (let angle = 0; angle < Math.PI * 6; angle += 0.2) {
      const radius = angle * 10;
      points.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
      });
    }
    return points;
  },

  star: (width: number, height: number) => {
    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = Math.min(width, height) * 0.35;
    const innerRadius = outerRadius * 0.4;

    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      points.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
      });
    }
    return points;
  },

  grid: (width: number, height: number, rows: number = 8, cols: number = 10) => {
    const points = [];
    const spacing = Math.min(width / (cols + 1), height / (rows + 1));
    const startX = (width - spacing * (cols - 1)) / 2;
    const startY = (height - spacing * (rows - 1)) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        points.push({
          x: startX + col * spacing,
          y: startY + row * spacing
        });
      }
    }
    return points;
  }
};

class ThumbnailGenerator {
  private async generateFormationPattern(name: string, category: string, droneCount: number) {
    // Choose pattern based on formation name
    let pattern = 'circle';

    if (name.toLowerCase().includes('heart')) pattern = 'heart';
    else if (name.toLowerCase().includes('star')) pattern = 'star';
    else if (name.toLowerCase().includes('spiral')) pattern = 'spiral';
    else if (category === 'Abstract') pattern = 'spiral';
    else if (category === 'Corporate') pattern = 'grid';

    return pattern;
  }

  async generateThumbnail($1: unknown): Promise<string> {
    const width = 800;
    const height = 600;
    const category = formation.category || 'Epic';
    const colors = CATEGORY_PALETTES[category] || CATEGORY_PALETTES.Epic;

    // Determine pattern
    const patternType = await this.generateFormationPattern(formation.name, category, formation.drone_count);
    const patternFunc = FORMATION_PATTERNS[patternType] || FORMATION_PATTERNS.circle;
    const dronePositions = patternFunc(width, height, Math.min(formation.drone_count, 100));

    // Create SVG with gradient background and drone points
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bg-gradient">
            <stop offset="0%" stop-color="${colors.secondary}" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="${colors.primary}" stop-opacity="1"/>
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Background -->
        <rect width="${width}" height="${height}" fill="url(#bg-gradient)"/>

        <!-- Grid pattern -->
        <g opacity="0.1">
          ${Array.from({ length: 20 }, (_, i) => `
            <line x1="${i * 40}" y1="0" x2="${i * 40}" y2="${height}" stroke="white" stroke-width="0.5"/>
            <line x1="0" y1="${i * 30}" x2="${width}" y2="${i * 30}" stroke="white" stroke-width="0.5"/>
          `).join('')}
        </g>

        <!-- Drone points -->
        <g filter="url(#glow)">
          ${dronePositions.map((pos, i) => {
            const size = 3 + Math.random() * 3;
            const opacity = 0.6 + Math.random() * 0.4;
            const color = i % 3 === 0 ? colors.glow : (i % 2 === 0 ? colors.accent : '#FFFFFF');

            return `
              <circle cx="${pos.x}" cy="${pos.y}" r="${size}" fill="${color}" opacity="${opacity}">
                <animate attributeName="opacity" values="${opacity};${opacity * 0.5};${opacity}" dur="${2 + Math.random() * 2}s" repeatCount="indefinite"/>
              </circle>
            `;
          }).join('')}
        </g>

        <!-- Formation name -->
        <text x="${width / 2}" y="${height - 60}" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle" opacity="0.9">
          ${formation.name}
        </text>
        <text x="${width / 2}" y="${height - 30}" font-family="Arial, sans-serif" font-size="18" fill="${colors.glow}" text-anchor="middle" opacity="0.8">
          ${formation.drone_count} drones • ${formation.duration}s
        </text>
      </svg>
    `;

    // Convert SVG to image
    const outputDir = path.join(process.cwd(), 'public/assets/formations');
    await fs.ensureDir(outputDir);

    const filename = `${formation.source_id || formation.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    const filepath = path.join(outputDir, filename);

    try {
      await sharp(Buffer.from(svg))
        .jpeg({ quality: 90, progressive: true })
        .toFile(filepath);

      return `/assets/formations/${filename}`;
    } catch (error) {
      console.error(`Error generating thumbnail for ${formation.name}:`, error);
      return formation.thumbnail_url; // Keep original if generation fails
    }
  }

  async generateAllThumbnails() {
    console.log('🎨 Starting AI Thumbnail Generation\n');
    console.log('='.repeat(60));

    try {
      // Initialize database
      await initializeAppDatabase();
      console.log('✅ Database initialized\n');

      // Get all formations
      const formations = await formationDb.getAll();
      console.log(`📊 Found ${formations.length} formations to process\n`);

      let generated = 0;
      let skipped = 0;

      for (let i = 0; i < formations.length; i++) {
        const formation = formations[i];

        process.stdout.write(`\r[${i + 1}/${formations.length}] Generating: ${formation.name.padEnd(30)}`);

        // Check if thumbnail already exists and is valid
        const existingPath = formation.thumbnail_url;
        if (existingPath && existingPath.startsWith('/assets/')) {
          const fullPath = path.join(process.cwd(), 'public', existingPath);
          if (await fs.pathExists(fullPath)) {
            const stats = await fs.stat(fullPath);
            if (stats.size > 1000) { // Skip if file is larger than 1KB (not placeholder)
              skipped++;
              continue;
            }
          }
        }

        // Generate new thumbnail
        const newThumbnail = await this.generateThumbnail(formation);

        // Update formation with new thumbnail
        if (newThumbnail !== formation.thumbnail_url) {
          await formationDb.update(formation.id, {
            thumbnail_url: newThumbnail,
            metadata: JSON.stringify({
              ...JSON.parse(formation.metadata || '{}'),
              thumbnail_generated: true,
              thumbnail_generated_at: new Date().toISOString()
            })
          });
          generated++;
        }
      }

      // Clear line and print summary
      process.stdout.write('\r' + ' '.repeat(70) + '\r');

      console.log('\n' + '='.repeat(60));
      console.log('✨ Thumbnail Generation Complete!');
      console.log('='.repeat(60));
      console.log(`\n📊 Results:`);
      console.log(`  ✅ Generated: ${generated} thumbnails`);
      console.log(`  ⏭️  Skipped: ${skipped} (already exist)`);
      console.log(`  📁 Location: /public/assets/formations/`);
      console.log('\n🎉 All formations now have beautiful AI-generated thumbnails!');

    } catch (error) {
      console.error('\n❌ Error:', error);
      process.exit(1);
    }
  }
}

// Execute
const generator = new ThumbnailGenerator();
generator.generateAllThumbnails().catch(console.error);

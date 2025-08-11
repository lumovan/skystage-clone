
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
 * 🗂️ Formation Asset Organizer
 *
 * Professional asset management system that:
 * - Organizes downloaded assets into structured directories
 * - Optimizes images for web performance
 * - Generates multiple thumbnail sizes
 * - Validates and scores asset quality
 * - Detects and removes duplicates
 * - Creates metadata indexes
 */

import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import { glob } from 'glob';
import { formationDb } from '../src/lib/db';
import { initializeAppDatabase } from '../src/lib/database/init';

// Configuration
const CONFIG = {
  // Directory structure
  directories: {
    input: path.join(process.cwd(), 'public/assets'),
    output: path.join(process.cwd(), 'public/assets/organized'),
    structure: {
      thumbnails: {
        small: 'thumbnails/small',    // 200x150
        medium: 'thumbnails/medium',  // 400x300
        large: 'thumbnails/large',    // 800x600
        original: 'thumbnails/original'
      },
      blender: {
        formations: 'blender/formations',
        materials: 'blender/materials',
        scripts: 'blender/scripts'
      },
      data: {
        csv: 'data/csv',
        skybrush: 'data/skybrush',
        dss: 'data/dss',
        json: 'data/json'
      },
      videos: {
        previews: 'videos/previews',
        tutorials: 'videos/tutorials'
      }
    }
  },

  // Image optimization settings
  imageOptimization: {
    formats: ['webp', 'jpg'],
    quality: {
      webp: 85,
      jpg: 90
    },
    sizes: {
      small: { width: 200, height: 150 },
      medium: { width: 400, height: 300 },
      large: { width: 800, height: 600 }
    }
  },

  // Quality scoring criteria
  qualityScoring: {
    minResolution: { width: 200, height: 150 },
    preferredResolution: { width: 800, height: 600 },
    maxFileSize: 10 * 1024 * 1024, // 10MB
    requiredFormats: ['jpg', 'png', 'webp'],
    bonusFormats: ['blend', 'csv', 'json']
  },

  // Duplicate detection
  duplicateDetection: {
    checksumAlgorithm: 'md5',
    similarityThreshold: 0.95
  }
};

/**
 * Asset quality scorer
 */
class AssetQualityScorer {
  async scoreAsset(filepath: string): Promise<number> {
    let score = 0;
    const maxScore = 100;

    try {
      const stats = await fs.stat(filepath);
      const ext = path.extname(filepath).toLowerCase();

      // File size scoring (0-20 points)
      if (stats.size > 0) {
        if (stats.size < CONFIG.qualityScoring.maxFileSize) {
          score += 20;
        } else {
          score += 10; // Partial credit for oversized files
        }
      }

      // Image-specific scoring
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        const metadata = await sharp(filepath).metadata();

        // Resolution scoring (0-30 points)
        if (metadata.width && metadata.height) {
          const { width, height } = metadata;

          if (width >= CONFIG.qualityScoring.preferredResolution.width &&
              height >= CONFIG.qualityScoring.preferredResolution.height) {
            score += 30;
          } else if (width >= CONFIG.qualityScoring.minResolution.width &&
                     height >= CONFIG.qualityScoring.minResolution.height) {
            score += 20;
          } else {
            score += 10;
          }

          // Aspect ratio scoring (0-10 points)
          const aspectRatio = width / height;
          if (aspectRatio >= 1.3 && aspectRatio <= 1.8) {
            score += 10; // Good aspect ratio for formations
          }
        }

        // Color depth and channels (0-10 points)
        if (metadata.channels && metadata.channels >= 3) {
          score += 10;
        }
      }

      // File format scoring (0-20 points)
      if (CONFIG.qualityScoring.requiredFormats.some(fmt => ext.includes(fmt))) {
        score += 10;
      }
      if (CONFIG.qualityScoring.bonusFormats.some(fmt => ext.includes(fmt))) {
        score += 10;
      }

      // File integrity (0-10 points)
      // Basic check - file can be read
      score += 10;

    } catch (error) {
      console.error(`Error scoring asset ${filepath}:`, error);
      score = 0;
    }

    return Math.min(score, maxScore);
  }
}

/**
 * Image optimizer
 */
class ImageOptimizer {
  async optimizeImage(inputPath: string, outputDir: string, formationId: string): Promise<any> {
    const results = {
      thumbnails: {},
      savings: 0
    };

    try {
      const originalStats = await fs.stat(inputPath);

      // Generate multiple sizes
      for (const [sizeName, dimensions] of Object.entries(CONFIG.imageOptimization.sizes)) {
        const sizeDir = path.join(outputDir, CONFIG.directories.structure.thumbnails[sizeName]);
        await fs.ensureDir(sizeDir);

        // Generate WebP version
        const webpPath = path.join(sizeDir, `${formationId}.webp`);
        await sharp(inputPath)
          .resize(dimensions.width, dimensions.height, { fit: 'cover' })
          .webp({ quality: CONFIG.imageOptimization.quality.webp })
          .toFile(webpPath);

        // Generate JPEG version as fallback
        const jpgPath = path.join(sizeDir, `${formationId}.jpg`);
        await sharp(inputPath)
          .resize(dimensions.width, dimensions.height, { fit: 'cover' })
          .jpeg({ quality: CONFIG.imageOptimization.quality.jpg })
          .toFile(jpgPath);

        results.thumbnails[sizeName] = {
          webp: webpPath,
          jpg: jpgPath
        };

        // Calculate savings
        const webpStats = await fs.stat(webpPath);
        results.savings += originalStats.size - webpStats.size;
      }

      // Keep original
      const originalDir = path.join(outputDir, CONFIG.directories.structure.thumbnails.original);
      await fs.ensureDir(originalDir);
      const originalPath = path.join(originalDir, `${formationId}${path.extname(inputPath)}`);
      await fs.copy(inputPath, originalPath);
      results.thumbnails['original'] = originalPath;

      console.log(`  ✅ Optimized image: ${formationId} (saved ${(results.savings / 1024).toFixed(1)}KB)`);

    } catch (error) {
      console.error(`  ❌ Error optimizing image:`, error);
    }

    return results;
  }
}

/**
 * Duplicate detector
 */
class DuplicateDetector {
  private checksums: Map<string, string[]> = new Map();

  async detectDuplicates(directory: string): Promise<Map<string, string[]>> {
    const files = await glob(`${directory}/**/*`, { nodir: true });
    const duplicates = new Map<string, string[]>();

    for (const file of files) {
      const checksum = await this.calculateChecksum(file);

      if (this.checksums.has(checksum)) {
        // Found duplicate
        const existing = this.checksums.get(checksum)!;
        existing.push(file);
        duplicates.set(checksum, existing);
      } else {
        this.checksums.set(checksum, [file]);
      }
    }

    return duplicates;
  }

  private async calculateChecksum(filepath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(CONFIG.duplicateDetection.checksumAlgorithm);
      const stream = fs.createReadStream(filepath);

      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async removeDuplicates(duplicates: Map<string, string[]>): Promise<number> {
    let removed = 0;

    for (const [checksum, files] of duplicates) {
      // Keep the first file, remove the rest
      for (let i = 1; i < files.length; i++) {
        await fs.remove(files[i]);
        console.log(`  🗑️ Removed duplicate: ${path.basename(files[i])}`);
        removed++;
      }
    }

    return removed;
  }
}

/**
 * Main asset organizer
 */
class AssetOrganizer {
  private scorer: AssetQualityScorer;
  private optimizer: ImageOptimizer;
  private detector: DuplicateDetector;
  private stats = {
    organized: 0,
    optimized: 0,
    duplicatesRemoved: 0,
    totalSavings: 0,
    qualityScores: []
  };

  constructor() {
    this.scorer = new AssetQualityScorer();
    this.optimizer = new ImageOptimizer();
    this.detector = new DuplicateDetector();
  }

  async organize() {
    console.log('🗂️ Starting Formation Asset Organization\n');
    console.log('='.repeat(60));

    try {
      // Initialize database
      await initializeAppDatabase();
      console.log('✅ Database initialized\n');

      // Phase 1: Setup directory structure
      console.log('📁 PHASE 1: Creating Directory Structure\n');
      await this.setupDirectories();

      // Phase 2: Detect and remove duplicates
      console.log('🔍 PHASE 2: Detecting Duplicates\n');
      const duplicates = await this.detector.detectDuplicates(CONFIG.directories.input);
      if (duplicates.size > 0) {
        console.log(`  Found ${duplicates.size} sets of duplicate files`);
        this.stats.duplicatesRemoved = await this.detector.removeDuplicates(duplicates);
        console.log(`  ✅ Removed ${this.stats.duplicatesRemoved} duplicate files\n`);
      } else {
        console.log('  ✅ No duplicates found\n');
      }

      // Phase 3: Process formations
      console.log('📥 PHASE 3: Processing Formation Assets\n');
      const formations = await formationDb.getAll();

      for (let i = 0; i < formations.length; i++) {
        const formation = formations[i];
        console.log(`\n[${i + 1}/${formations.length}] Processing: ${formation.name}`);

        try {
          // Process thumbnails
          if (formation.thumbnail_url && formation.thumbnail_url.startsWith('/assets/')) {
            const thumbnailPath = path.join(process.cwd(), 'public', formation.thumbnail_url);

            if (await fs.pathExists(thumbnailPath)) {
              // Score asset quality
              const score = await this.scorer.scoreAsset(thumbnailPath);
              this.stats.qualityScores.push(score);
              console.log(`  📊 Quality score: ${score}/100`);

              // Optimize image
              const optimized = await this.optimizer.optimizeImage(
                thumbnailPath,
                CONFIG.directories.output,
                formation.id
              );

              if (optimized.savings > 0) {
                this.stats.totalSavings += optimized.savings;
                this.stats.optimized++;
              }

              // Update formation with optimized paths
              await formationDb.update(formation.id, {
                metadata: JSON.stringify({
                  ...JSON.parse(formation.metadata || '{}'),
                  optimized_assets: optimized.thumbnails,
                  quality_score: score
                })
              });
            }
          }

          // Process Blender files
          if (formation.file_url) {
            await this.organizeBlenderFile(formation);
          }

          // Process data files
          const metadata = JSON.parse(formation.metadata || '{}');
          if (metadata.assets?.data) {
            await this.organizeDataFiles(formation, metadata.assets.data);
          }

          this.stats.organized++;

        } catch (error) {
          console.error(`  ❌ Error processing formation:`, error.message);
        }
      }

      // Phase 4: Create indexes
      console.log('\n📝 PHASE 4: Creating Asset Indexes\n');
      await this.createAssetIndexes();

      // Phase 5: Generate report
      console.log('📊 PHASE 5: Generating Report\n');
      this.generateReport();

    } catch (error) {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    }
  }

  private async setupDirectories() {
    const baseDir = CONFIG.directories.output;

    // Create all directory structure
    for (const [category, paths] of Object.entries(CONFIG.directories.structure)) {
      if (typeof paths === 'object') {
        for (const subPath of Object.values(paths)) {
          const fullPath = path.join(baseDir, subPath);
          await fs.ensureDir(fullPath);
          console.log(`  ✅ Created: ${subPath}`);
        }
      }
    }

    console.log();
  }

  private async organizeBlenderFile($1: unknown) {
    const blenderPath = formation.file_url;
    if (!blenderPath || !blenderPath.startsWith('/assets/')) return;

    const sourcePath = path.join(process.cwd(), 'public', blenderPath);
    if (!await fs.pathExists(sourcePath)) return;

    const destDir = path.join(CONFIG.directories.output, CONFIG.directories.structure.blender.formations);
    const destPath = path.join(destDir, `${formation.id}.blend`);

    await fs.copy(sourcePath, destPath);
    console.log(`  ✅ Organized Blender file: ${formation.id}.blend`);
  }

  private async organizeDataFiles($1: unknown) {
    for (const [format, filepath] of Object.entries(dataFiles)) {
      if (!filepath || typeof filepath !== 'string') continue;

      const sourcePath = path.join(process.cwd(), 'public', filepath);
      if (!await fs.pathExists(sourcePath)) continue;

      let destSubdir = CONFIG.directories.structure.data.json;
      if (format === 'csv') destSubdir = CONFIG.directories.structure.data.csv;
      else if (format === 'skyc') destSubdir = CONFIG.directories.structure.data.skybrush;
      else if (format === 'dss') destSubdir = CONFIG.directories.structure.data.dss;

      const destDir = path.join(CONFIG.directories.output, destSubdir);
      const destPath = path.join(destDir, `${formation.id}.${format}`);

      await fs.copy(sourcePath, destPath);
      console.log(`  ✅ Organized data file: ${formation.id}.${format}`);
    }
  }

  private async createAssetIndexes() {
    const indexPath = path.join(CONFIG.directories.output, 'index.json');

    const index = {
      created_at: new Date().toISOString(),
      statistics: this.stats,
      directories: CONFIG.directories.structure,
      formations: []
    };

    const formations = await formationDb.getAll();
    for (const formation of formations) {
      const metadata = JSON.parse(formation.metadata || '{}');

      index.formations.push({
        id: formation.id,
        name: formation.name,
        category: formation.category,
        quality_score: metadata.quality_score || 0,
        optimized_assets: metadata.optimized_assets || {}
      });
    }

    await fs.writeJson(indexPath, index, { spaces: 2 });
    console.log('  ✅ Created asset index: index.json\n');
  }

  private generateReport() {
    console.log('='.repeat(60));
    console.log('📊 ASSET ORGANIZATION REPORT');
    console.log('='.repeat(60));
    console.log(`\n✅ Formations Organized: ${this.stats.organized}`);
    console.log(`🖼️  Images Optimized: ${this.stats.optimized}`);
    console.log(`🗑️  Duplicates Removed: ${this.stats.duplicatesRemoved}`);
    console.log(`💾 Total Space Saved: ${(this.stats.totalSavings / (1024 * 1024)).toFixed(2)} MB`);

    if (this.stats.qualityScores.length > 0) {
      const avgScore = this.stats.qualityScores.reduce((a, b) => a + b, 0) / this.stats.qualityScores.length;
      console.log(`📊 Average Quality Score: ${avgScore.toFixed(1)}/100`);
    }

    console.log('\n✨ Asset organization complete!');
    console.log(`📁 Organized assets available at: ${CONFIG.directories.output}`);
  }
}

// Main execution
async function main() {
  const organizer = new AssetOrganizer();
  await organizer.organize();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { AssetOrganizer, AssetQualityScorer, ImageOptimizer, DuplicateDetector };

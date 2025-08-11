
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
 * 🎮 Master Deep Scraper Mission Controller
 *
 * Complete mission orchestration for importing the entire SkyStage
 * formation library with all assets, Blender files, and metadata.
 *
 * Mission Objectives:
 * - Import 1,500-2,000+ formations
 * - Download all associated assets
 * - Achieve 85%+ success rate
 * - Complete within 2-4 hours
 */

import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { formationDb, analyticsDb, syncJobDb } from '../src/lib/db';
import { initializeAppDatabase } from '../src/lib/database/init';

// Mission configuration
const MISSION_CONFIG = {
  // Target metrics
  targets: {
    minFormations: 500,
    targetFormations: 1500,
    successRate: 0.85,
    maxDuration: 4 * 60 * 60 * 1000, // 4 hours
    qualityScore: 70
  },

  // Execution phases
  phases: [
    {
      name: 'Pre-flight Checks',
      description: 'System validation and readiness verification',
      critical: true
    },
    {
      name: 'Discovery',
      description: 'Comprehensive URL pattern analysis',
      critical: true
    },
    {
      name: 'Scraping',
      description: 'Formation extraction with asset downloads',
      critical: true
    },
    {
      name: 'Organization',
      description: 'Asset categorization and optimization',
      critical: false
    },
    {
      name: 'Quality Assurance',
      description: 'Validation and scoring',
      critical: false
    },
    {
      name: 'Database Integration',
      description: 'Metadata enrichment and relationships',
      critical: true
    },
    {
      name: 'Verification',
      description: 'Final validation and reporting',
      critical: false
    }
  ],

  // Logging configuration
  logging: {
    dir: path.join(process.cwd(), 'mission-logs'),
    reportDir: path.join(process.cwd(), 'mission-reports')
  }
};

/**
 * Mission executor
 */
class MissionExecutor {
  private startTime: number = 0;
  private currentPhase: number = 0;
  private missionLog: string[] = [];
  private stats = {
    formations: {
      discovered: 0,
      imported: 0,
      failed: 0
    },
    assets: {
      thumbnails: 0,
      blender: 0,
      data: 0,
      videos: 0
    },
    quality: {
      averageScore: 0,
      highQuality: 0,
      lowQuality: 0
    },
    performance: {
      duration: 0,
      successRate: 0,
      efficiency: 0
    }
  };

  async execute() {
    console.clear();
    this.printMissionHeader();

    this.startTime = Date.now();

    try {
      // Initialize mission
      await this.initializeMission();

      // Execute phases
      for (let i = 0; i < MISSION_CONFIG.phases.length; i++) {
        this.currentPhase = i;
        const phase = MISSION_CONFIG.phases[i];

        await this.executePhase(phase);

        // Check if we should abort
        if (phase.critical && !await this.checkPhaseSuccess(phase)) {
          throw new Error(`Critical phase "${phase.name}" failed. Mission aborted.`);
        }
      }

      // Mission completion
      await this.completeMission();

    } catch (error) {
      console.error(chalk.red('\n💥 MISSION FAILED'));
      console.error(chalk.red(error.message));
      await this.generateEmergencyReport(error);
      process.exit(1);
    }
  }

  private printMissionHeader() {
    console.log(chalk.cyan('╔' + '═'.repeat(58) + '╗'));
    console.log(chalk.cyan('║') + chalk.bold.white(' 🚀 SKYSTAGE DEEP SCRAPER MISSION CONTROL'.padEnd(57)) + chalk.cyan('║'));
    console.log(chalk.cyan('╠' + '═'.repeat(58) + '╣'));
    console.log(chalk.cyan('║') + chalk.yellow(' Mission: Import Complete Formation Library'.padEnd(57)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray(' Target: 1,500+ formations with all assets'.padEnd(57)) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray(' Duration: 2-4 hours estimated'.padEnd(57)) + chalk.cyan('║'));
    console.log(chalk.cyan('╚' + '═'.repeat(58) + '╝'));
    console.log();
  }

  private async initializeMission() {
    const spinner = ora('Initializing mission systems...').start();

    try {
      // Create directories
      await fs.ensureDir(MISSION_CONFIG.logging.dir);
      await fs.ensureDir(MISSION_CONFIG.logging.reportDir);

      // Initialize database
      await initializeAppDatabase();

      // Create mission sync job
      const syncJob = await syncJobDb.create({
        job_type: 'master_deep_scrape_mission',
        status: 'initializing',
        total_items: 0,
        processed_items: 0,
        success_items: 0,
        failed_items: 0,
        error_log: [],
        metadata: {
          mission_start: new Date().toISOString(),
          target_formations: MISSION_CONFIG.targets.targetFormations,
          phases: MISSION_CONFIG.phases.map(p => p.name)
        }
      });

      this.log(`Mission initialized - Job ID: ${syncJob.id}`);

      spinner.succeed('Mission systems initialized');
    } catch (error) {
      spinner.fail('Failed to initialize mission systems');
      throw error;
    }
  }

  private async executePhase($1: unknown) {
    console.log();
    console.log(chalk.blue('━'.repeat(60)));
    console.log(chalk.bold.blue(`PHASE ${this.currentPhase + 1}: ${phase.name.toUpperCase()}`));
    console.log(chalk.gray(phase.description));
    console.log(chalk.blue('━'.repeat(60)));
    console.log();

    const phaseSpinner = ora(`Executing ${phase.name}...`).start();
    const phaseStart = Date.now();

    try {
      switch (phase.name) {
        case 'Pre-flight Checks':
          await this.runPreflightChecks();
          break;

        case 'Discovery':
          await this.runDiscovery();
          break;

        case 'Scraping':
          await this.runScraping();
          break;

        case 'Organization':
          await this.runOrganization();
          break;

        case 'Quality Assurance':
          await this.runQualityAssurance();
          break;

        case 'Database Integration':
          await this.runDatabaseIntegration();
          break;

        case 'Verification':
          await this.runVerification();
          break;
      }

      const duration = ((Date.now() - phaseStart) / 1000).toFixed(1);
      phaseSpinner.succeed(`${phase.name} completed (${duration}s)`);
      this.log(`Phase "${phase.name}" completed successfully in ${duration}s`);

    } catch (error) {
      phaseSpinner.fail(`${phase.name} failed`);
      this.log(`Phase "${phase.name}" failed: ${error.message}`);

      if (phase.critical) {
        throw error;
      }
    }
  }

  private async runPreflightChecks() {
    const checks = [
      { name: 'Database connectivity', check: this.checkDatabase },
      { name: 'Storage availability', check: this.checkStorage },
      { name: 'Network connectivity', check: this.checkNetwork },
      { name: 'Dependencies installed', check: this.checkDependencies },
      { name: 'Memory availability', check: this.checkMemory }
    ];

    for (const { name, check } of checks) {
      const spinner = ora(`Checking ${name}...`).start();

      try {
        await check.call(this);
        spinner.succeed(`${name} ✓`);
      } catch (error) {
        spinner.fail(`${name} ✗`);
        throw new Error(`Pre-flight check failed: ${name}`);
      }
    }
  }

  private async checkDatabase() {
    const formations = await formationDb.getAll({ limit: 1 });
    return true;
  }

  private async checkStorage() {
    const storageDir = path.join(process.cwd(), 'public/assets');
    await fs.ensureDir(storageDir);

    // Check available space (simplified)
    const stats = await fs.stat(storageDir);
    return true;
  }

  private async checkNetwork() {
    // Test network connectivity
    import axios from '$2';
    await axios.get('https://www.skystage.com', { timeout: 5000 });
    return true;
  }

  private async checkDependencies() {
    const deps = ['puppeteer', 'axios', 'cheerio', 'sharp'];
    for (const dep of deps) {
      require.resolve(dep);
    }
    return true;
  }

  private async checkMemory() {
    import os from '$2';
    const freeMem = os.freemem();
    const requiredMem = 1024 * 1024 * 1024; // 1GB

    if (freeMem < requiredMem) {
      throw new Error('Insufficient memory available');
    }
    return true;
  }

  private async runDiscovery() {
    console.log(chalk.yellow('🔍 Starting comprehensive discovery...'));

    // Run the advanced deep scraper in discovery mode
    const discoveryProcess = spawn('node', [
      path.join(__dirname, 'advanced-deep-scraper.ts'),
      '--discovery-only'
    ], { stdio: 'pipe' });

    let discoveredCount = 0;

    discoveryProcess.stdout.on('data', (data) => {
      const output = data.toString();

      // Parse discovery output
      const countMatch = output.match(/Found (\d+) unique formations/);
      if (countMatch) {
        discoveredCount = parseInt(countMatch[1]);
        this.stats.formations.discovered = discoveredCount;
      }

      // Log progress
      if (output.includes('✓')) {
        console.log(chalk.green('  ' + output.trim()));
      }
    });

    await new Promise((resolve, reject) => {
      discoveryProcess.on('exit', (code) => {
        if (code === 0) {
          console.log(chalk.green(`\n✅ Discovery complete: ${discoveredCount} formations found`));
          resolve(true);
        } else {
          reject(new Error('Discovery process failed'));
        }
      });
    });
  }

  private async runScraping() {
    console.log(chalk.yellow('📥 Starting intensive scraping operation...'));
    console.log(chalk.gray('  This may take 1-2 hours. Please be patient.\n'));

    // Run the scraper
    const scraperProcess = spawn('node', [
      path.join(__dirname, 'advanced-deep-scraper.ts')
    ], { stdio: 'pipe' });

    let progressBar = '';
    let lastProgress = 0;

    scraperProcess.stdout.on('data', (data) => {
      const output = data.toString();

      // Parse progress
      const progressMatch = output.match(/\[(\d+)\/(\d+)\]/);
      if (progressMatch) {
        const current = parseInt(progressMatch[1]);
        const total = parseInt(progressMatch[2]);
        const progress = Math.floor((current / total) * 100);

        if (progress > lastProgress) {
          lastProgress = progress;
          progressBar = this.createProgressBar(progress);
          process.stdout.write(`\r  ${progressBar} ${progress}% (${current}/${total})`);
        }
      }

      // Parse success/failure
      if (output.includes('Successfully imported')) {
        this.stats.formations.imported++;
      } else if (output.includes('Error processing')) {
        this.stats.formations.failed++;
      }

      // Log important messages
      if (output.includes('✅') || output.includes('❌')) {
        console.log('\n' + chalk.gray('  ' + output.trim()));
      }
    });

    await new Promise((resolve, reject) => {
      scraperProcess.on('exit', (code) => {
        console.log(); // New line after progress bar

        if (code === 0) {
          console.log(chalk.green(`\n✅ Scraping complete: ${this.stats.formations.imported} formations imported`));
          resolve(true);
        } else {
          reject(new Error('Scraping process failed'));
        }
      });
    });
  }

  private async runOrganization() {
    console.log(chalk.yellow('🗂️ Organizing and optimizing assets...'));

    // Run the asset organizer
    const organizerProcess = spawn('node', [
      path.join(__dirname, 'formation-asset-organizer.ts')
    ], { stdio: 'pipe' });

    organizerProcess.stdout.on('data', (data) => {
      const output = data.toString();

      // Parse optimization stats
      if (output.includes('Images Optimized')) {
        const match = output.match(/Images Optimized: (\d+)/);
        if (match) this.stats.assets.thumbnails = parseInt(match[1]);
      }

      // Log progress
      if (output.includes('✅')) {
        console.log(chalk.green('  ' + output.trim()));
      }
    });

    await new Promise((resolve) => {
      organizerProcess.on('exit', () => {
        console.log(chalk.green('\n✅ Asset organization complete'));
        resolve(true);
      });
    });
  }

  private async runQualityAssurance() {
    console.log(chalk.yellow('📊 Running quality assurance checks...'));

    const formations = await formationDb.getAll();
    let totalScore = 0;
    let highQuality = 0;
    let lowQuality = 0;

    for (const formation of formations) {
      const metadata = JSON.parse(formation.metadata || '{}');
      const score = metadata.quality_score || 50;

      totalScore += score;
      if (score >= 70) highQuality++;
      if (score < 40) lowQuality++;
    }

    this.stats.quality.averageScore = formations.length > 0 ? totalScore / formations.length : 0;
    this.stats.quality.highQuality = highQuality;
    this.stats.quality.lowQuality = lowQuality;

    console.log(chalk.green(`  ✅ Average quality score: ${this.stats.quality.averageScore.toFixed(1)}/100`));
    console.log(chalk.green(`  ✅ High quality formations: ${highQuality}`));
    console.log(chalk.yellow(`  ⚠️  Low quality formations: ${lowQuality}`));
  }

  private async runDatabaseIntegration() {
    console.log(chalk.yellow('💾 Finalizing database integration...'));

    // Update all formations with final metadata
    const formations = await formationDb.getAll();

    for (const formation of formations) {
      const metadata = JSON.parse(formation.metadata || '{}');

      // Add mission metadata
      metadata.mission_id = this.currentPhase;
      metadata.imported_at = new Date().toISOString();
      metadata.scraper_version = '2.0';

      await formationDb.update(formation.id, {
        metadata: JSON.stringify(metadata)
      });
    }

    console.log(chalk.green(`  ✅ Updated ${formations.length} formations with mission metadata`));

    // Record analytics
    await analyticsDb.recordEvent({
      event_type: 'mission_complete',
      entity_type: 'formation',
      metadata: {
        formations_imported: this.stats.formations.imported,
        quality_score: this.stats.quality.averageScore,
        duration: Date.now() - this.startTime
      }
    });
  }

  private async runVerification() {
    console.log(chalk.yellow('✔️  Running final verification...'));

    const formations = await formationDb.getAll();
    const successRate = formations.length > 0 ?
      (this.stats.formations.imported / this.stats.formations.discovered) : 0;

    this.stats.performance.successRate = successRate;
    this.stats.performance.duration = Date.now() - this.startTime;

    // Check targets
    const targetsHit = {
      formations: formations.length >= MISSION_CONFIG.targets.minFormations,
      successRate: successRate >= MISSION_CONFIG.targets.successRate,
      quality: this.stats.quality.averageScore >= MISSION_CONFIG.targets.qualityScore,
      duration: this.stats.performance.duration <= MISSION_CONFIG.targets.maxDuration
    };

    console.log(chalk.bold('\n  Target Achievement:'));
    console.log(chalk[targetsHit.formations ? 'green' : 'red'](
      `    Formations: ${formations.length}/${MISSION_CONFIG.targets.minFormations} ${targetsHit.formations ? '✓' : '✗'}`
    ));
    console.log(chalk[targetsHit.successRate ? 'green' : 'red'](
      `    Success Rate: ${(successRate * 100).toFixed(1)}%/${(MISSION_CONFIG.targets.successRate * 100)}% ${targetsHit.successRate ? '✓' : '✗'}`
    ));
    console.log(chalk[targetsHit.quality ? 'green' : 'red'](
      `    Quality Score: ${this.stats.quality.averageScore.toFixed(1)}/${MISSION_CONFIG.targets.qualityScore} ${targetsHit.quality ? '✓' : '✗'}`
    ));
    console.log(chalk[targetsHit.duration ? 'green' : 'red'](
      `    Duration: ${this.formatDuration(this.stats.performance.duration)} ${targetsHit.duration ? '✓' : '✗'}`
    ));

    const allTargetsHit = Object.values(targetsHit).every(hit => hit);

    if (!allTargetsHit) {
      console.log(chalk.yellow('\n  ⚠️  Some targets were not achieved'));
    } else {
      console.log(chalk.green('\n  🎯 All targets achieved!'));
    }
  }

  private async completeMission() {
    const duration = this.formatDuration(Date.now() - this.startTime);

    console.log();
    console.log(chalk.green('╔' + '═'.repeat(58) + '╗'));
    console.log(chalk.green('║') + chalk.bold.white(' 🎉 MISSION COMPLETE'.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('╠' + '═'.repeat(58) + '╣'));
    console.log(chalk.green('║') + chalk.white(` Duration: ${duration}`.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('║') + chalk.white(` Formations Imported: ${this.stats.formations.imported}`.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('║') + chalk.white(` Success Rate: ${(this.stats.performance.successRate * 100).toFixed(1)}%`.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('║') + chalk.white(` Quality Score: ${this.stats.quality.averageScore.toFixed(1)}/100`.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('╚' + '═'.repeat(58) + '╝'));

    // Generate final report
    await this.generateFinalReport();
  }

  private async generateFinalReport() {
    const reportPath = path.join(
      MISSION_CONFIG.logging.reportDir,
      `mission_${Date.now()}.json`
    );

    const report = {
      mission: {
        start_time: new Date(this.startTime).toISOString(),
        end_time: new Date().toISOString(),
        duration: this.formatDuration(Date.now() - this.startTime),
        status: 'completed'
      },
      statistics: this.stats,
      targets: MISSION_CONFIG.targets,
      log: this.missionLog
    };

    await fs.writeJson(reportPath, report, { spaces: 2 });
    console.log(chalk.gray(`\n📄 Mission report saved: ${reportPath}`));
  }

  private async generateEmergencyReport($1: unknown) {
    const reportPath = path.join(
      MISSION_CONFIG.logging.reportDir,
      `emergency_${Date.now()}.json`
    );

    const report = {
      mission: {
        start_time: new Date(this.startTime).toISOString(),
        failure_time: new Date().toISOString(),
        duration: this.formatDuration(Date.now() - this.startTime),
        status: 'failed',
        error: error.message,
        phase: MISSION_CONFIG.phases[this.currentPhase]?.name || 'Unknown'
      },
      statistics: this.stats,
      log: this.missionLog
    };

    await fs.writeJson(reportPath, report, { spaces: 2 });
    console.log(chalk.gray(`\n📄 Emergency report saved: ${reportPath}`));
  }

  private async checkPhaseSuccess($1: unknown): Promise<boolean> {
    // Phase-specific success criteria
    switch (phase.name) {
      case 'Discovery':
        return this.stats.formations.discovered > 0;

      case 'Scraping':
        return this.stats.formations.imported > 0;

      case 'Database Integration':
        const formations = await formationDb.getAll();
        return formations.length > 0;

      default:
        return true;
    }
  }

  private createProgressBar(percentage: number): string {
    const width = 30;
    const filled = Math.floor((percentage / 100) * width);
    const empty = width - filled;

    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private log(message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.missionLog.push(logEntry);

    // Also write to file
    const logFile = path.join(
      MISSION_CONFIG.logging.dir,
      `mission_${new Date().toISOString().split('T')[0]}.log`
    );

    fs.appendFileSync(logFile, logEntry + '\n');
  }
}

// Main execution
async function main() {
  const mission = new MissionExecutor();
  await mission.execute();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { MissionExecutor };

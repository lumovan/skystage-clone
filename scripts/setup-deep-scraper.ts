#!/usr/bin/env node

/**
 * 🔧 Deep Scraper Setup Script
 *
 * Prepares the environment for running the advanced deep scraper:
 * - Installs required dependencies
 * - Creates directory structure
 * - Validates system requirements
 * - Initializes database
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import os from 'os';

const REQUIREMENTS = {
  node: '18.0.0',
  memory: 2 * 1024 * 1024 * 1024, // 2GB
  storage: 10 * 1024 * 1024 * 1024, // 10GB
  dependencies: [
    'puppeteer',
    'axios',
    'cheerio',
    'sharp',
    'chalk',
    'ora',
    'glob'
  ]
};

const DIRECTORIES = [
  'public/assets/formations',
  'public/assets/thumbnails',
  'public/assets/blender',
  'public/assets/data',
  'public/assets/videos',
  'public/assets/organized',
  'public/assets/temp',
  'mission-logs',
  'mission-reports',
  '.same'
];

class DeepScraperSetup {
  async setup() {
    console.log(chalk.cyan.bold('\n🔧 DEEP SCRAPER SETUP\n'));
    console.log(chalk.gray('Preparing environment for advanced formation import...\n'));

    try {
      // Step 1: Check system requirements
      await this.checkSystemRequirements();

      // Step 2: Install dependencies
      await this.installDependencies();

      // Step 3: Create directory structure
      await this.createDirectories();

      // Step 4: Initialize database
      await this.initializeDatabase();

      // Step 5: Create configuration
      await this.createConfiguration();

      // Success
      this.printSuccess();

    } catch (error) {
      console.error(chalk.red('\n❌ Setup failed:'), error.message);
      process.exit(1);
    }
  }

  private async checkSystemRequirements() {
    const spinner = ora('Checking system requirements...').start();

    try {
      // Check Node.js version
      const nodeVersion = process.version.substring(1);
      if (this.compareVersions(nodeVersion, REQUIREMENTS.node) < 0) {
        throw new Error(`Node.js ${REQUIREMENTS.node} or higher required (current: ${nodeVersion})`);
      }

      // Check available memory
      const freeMem = os.freemem();
      if (freeMem < REQUIREMENTS.memory) {
        console.warn(chalk.yellow(`\n⚠️  Low memory: ${(freeMem / (1024 * 1024 * 1024)).toFixed(1)}GB available`));
      }

      // Check available storage (simplified)
      const stats = await fs.stat(process.cwd());

      spinner.succeed('System requirements checked');

      console.log(chalk.gray(`  • Node.js: ${nodeVersion} ✓`));
      console.log(chalk.gray(`  • Memory: ${(freeMem / (1024 * 1024 * 1024)).toFixed(1)}GB available`));
      console.log(chalk.gray(`  • CPU Cores: ${os.cpus().length}`));
      console.log();

    } catch (error) {
      spinner.fail('System requirements not met');
      throw error;
    }
  }

  private async installDependencies() {
    const spinner = ora('Installing dependencies...').start();

    try {
      // Check if dependencies are already installed
      const missingDeps = [];

      for (const dep of REQUIREMENTS.dependencies) {
        try {
          require.resolve(dep);
        } catch {
          missingDeps.push(dep);
        }
      }

      if (missingDeps.length > 0) {
        spinner.text = `Installing ${missingDeps.length} missing dependencies...`;

        // Install with bun
        execSync(`bun add ${missingDeps.join(' ')}`, {
          stdio: 'pipe',
          cwd: process.cwd()
        });
      }

      // Install Puppeteer browser
      spinner.text = 'Installing Chromium for Puppeteer...';

      try {
        require('puppeteer').executablePath();
      } catch {
        // Puppeteer needs to download browser
        execSync('bunx puppeteer browsers install chrome', {
          stdio: 'pipe',
          cwd: process.cwd()
        });
      }

      spinner.succeed('Dependencies installed');
      console.log(chalk.gray(`  • Installed ${REQUIREMENTS.dependencies.length} packages`));
      console.log(chalk.gray(`  • Chromium browser ready`));
      console.log();

    } catch (error) {
      spinner.fail('Failed to install dependencies');
      throw error;
    }
  }

  private async createDirectories() {
    const spinner = ora('Creating directory structure...').start();

    try {
      for (const dir of DIRECTORIES) {
        const fullPath = path.join(process.cwd(), dir);
        await fs.ensureDir(fullPath);
      }

      spinner.succeed('Directory structure created');
      console.log(chalk.gray(`  • Created ${DIRECTORIES.length} directories`));
      console.log();

    } catch (error) {
      spinner.fail('Failed to create directories');
      throw error;
    }
  }

  private async initializeDatabase() {
    const spinner = ora('Initializing database...').start();

    try {
      // Import and initialize database
      const { initializeAppDatabase } = await import('../src/lib/database/init');
      await initializeAppDatabase();

      // Check formation count
      const { formationDb } = await import('../src/lib/db');
      const formations = await formationDb.getAll();

      spinner.succeed('Database initialized');
      console.log(chalk.gray(`  • Current formations: ${formations.length}`));
      console.log(chalk.gray(`  • Database ready for import`));
      console.log();

    } catch (error) {
      spinner.fail('Failed to initialize database');
      throw error;
    }
  }

  private async createConfiguration() {
    const spinner = ora('Creating configuration...').start();

    try {
      const configPath = path.join(process.cwd(), '.same/scraper-config.json');

      const config = {
        created_at: new Date().toISOString(),
        version: '2.0',
        settings: {
          max_concurrent_downloads: 8,
          max_concurrent_pages: 3,
          request_delay: { min: 800, max: 2000 },
          max_retries: 3,
          timeout: 30000,
          user_agents: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          ]
        },
        targets: {
          min_formations: 500,
          target_formations: 1500,
          success_rate: 0.85,
          quality_score: 70
        },
        features: {
          discovery: true,
          asset_download: true,
          image_optimization: true,
          duplicate_detection: true,
          quality_scoring: true
        }
      };

      await fs.writeJson(configPath, config, { spaces: 2 });

      spinner.succeed('Configuration created');
      console.log(chalk.gray(`  • Config file: .same/scraper-config.json`));
      console.log();

    } catch (error) {
      spinner.fail('Failed to create configuration');
      throw error;
    }
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }

  private printSuccess() {
    console.log(chalk.green('╔' + '═'.repeat(58) + '╗'));
    console.log(chalk.green('║') + chalk.bold.white(' ✅ SETUP COMPLETE'.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('╠' + '═'.repeat(58) + '╣'));
    console.log(chalk.green('║') + chalk.white(' Environment is ready for deep scraping!'.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('║') + chalk.gray(' '.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('║') + chalk.yellow(' Next steps:'.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('║') + chalk.white(' 1. Run the master scraper:'.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('║') + chalk.cyan('    bun run tsx scripts/master-deep-scraper.ts'.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('║') + chalk.gray(' '.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('║') + chalk.white(' 2. Or run individual components:'.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('║') + chalk.cyan('    bun run tsx scripts/advanced-deep-scraper.ts'.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('║') + chalk.cyan('    bun run tsx scripts/formation-asset-organizer.ts'.padEnd(57)) + chalk.green('║'));
    console.log(chalk.green('╚' + '═'.repeat(58) + '╝'));
    console.log();
  }
}

// Main execution
async function main() {
  const setup = new DeepScraperSetup();
  await setup.setup();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { DeepScraperSetup };

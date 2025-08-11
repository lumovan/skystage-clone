#!/usr/bin/env node

/**
 * 🚀 SkyStage Asset Downloader (Simple Version)
 * Downloads all accessible assets from skystage.com
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';

const SKYSTAGE_BASE = 'https://www.skystage.com';
const OUTPUT_DIR = path.join(process.cwd(), 'public/skystage-assets');

class SimpleSkystageDownloader {
  private assets = new Set<string>();
  private libraries = new Set<string>();
  private apiEndpoints = new Set<string>();

  async run() {
    console.log('🚀 Starting SkyStage Asset Download\n');

    // Create directories
    await this.setupDirectories();

    // Analyze main pages
    await this.analyzePage('/');
    await this.analyzePage('/new-browse-formations');
    await this.analyzePage('/get-custom-formation');

    // Download discovered assets
    await this.downloadAssets();

    // Generate report
    await this.generateReport();

    console.log('\n✅ Download complete!');
  }

  private async setupDirectories() {
    const dirs = [
      OUTPUT_DIR,
      path.join(OUTPUT_DIR, 'css'),
      path.join(OUTPUT_DIR, 'js'),
      path.join(OUTPUT_DIR, 'images'),
      path.join(OUTPUT_DIR, 'fonts'),
      path.join(OUTPUT_DIR, 'data')
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  private async analyzePage(pagePath: string) {
    console.log(`📄 Analyzing ${pagePath}...`);

    try {
      const response = await axios.get(SKYSTAGE_BASE + pagePath, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);

      // Find all assets

      // CSS files
      $('link[rel="stylesheet"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          const fullUrl = this.resolveUrl(href);
          this.assets.add(fullUrl);
          this.detectLibrary(fullUrl);
        }
      });

      // JavaScript files
      $('script[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src) {
          const fullUrl = this.resolveUrl(src);
          this.assets.add(fullUrl);
          this.detectLibrary(fullUrl);
        }
      });

      // Images
      $('img[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !src.startsWith('data:')) {
          const fullUrl = this.resolveUrl(src);
          this.assets.add(fullUrl);
        }
      });

      // Background images in style attributes
      $('[style*="background-image"]').each((_, el) => {
        const style = $(el).attr('style');
        const match = style?.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (match) {
          const fullUrl = this.resolveUrl(match[1]);
          this.assets.add(fullUrl);
        }
      });

      // Extract inline scripts for analysis
      $('script:not([src])').each((_, el) => {
        const content = $(el).html();
        if (content) {
          // Look for API endpoints
          const apiMatches = content.match(/['"]\/api\/[^'"]+['"]/g);
          if (apiMatches) {
            apiMatches.forEach(match => {
              this.apiEndpoints.add(match.replace(/['"]/g, ''));
            });
          }

          // Look for asset URLs
          const urlMatches = content.match(/['"]https?:\/\/[^'"]+\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf)['"]/gi);
          if (urlMatches) {
            urlMatches.forEach(match => {
              this.assets.add(match.replace(/['"]/g, ''));
            });
          }
        }
      });

      // Extract data attributes
      $('[data-formation]').each((_, el) => {
        const data = $(el).attr('data-formation');
        if (data) {
          const filename = `formation-${Date.now()}.json`;
          fs.writeFileSync(path.join(OUTPUT_DIR, 'data', filename), data);
        }
      });

      console.log(`  ✓ Found ${this.assets.size} assets`);

    } catch (error) {
      console.error(`  ❌ Error analyzing ${pagePath}:`, error.message);
    }
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return SKYSTAGE_BASE + url;
    return SKYSTAGE_BASE + '/' + url;
  }

  private detectLibrary(url: string) {
    const libraries = {
      'react': 'React',
      'next': 'Next.js',
      'three': 'Three.js',
      'gsap': 'GSAP',
      'tailwind': 'Tailwind CSS',
      'framer-motion': 'Framer Motion',
      'stripe': 'Stripe',
      'firebase': 'Firebase',
      'supabase': 'Supabase',
      'skybrush': 'SkyBrush',
      'mapbox': 'Mapbox',
      'lottie': 'Lottie'
    };

    for (const [key, name] of Object.entries(libraries)) {
      if (url.toLowerCase().includes(key)) {
        this.libraries.add(name);
      }
    }
  }

  private async downloadAssets() {
    console.log(`\n📥 Downloading ${this.assets.size} assets...\n`);

    let downloaded = 0;
    let failed = 0;
    const assetArray = Array.from(this.assets);

    for (let i = 0; i < assetArray.length; i++) {
      const url = assetArray[i];

      process.stdout.write(`\r[${i + 1}/${assetArray.length}] Downloading: ${path.basename(url).substring(0, 50).padEnd(50)}`);

      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });

        // Determine file type and path
        let subdir = 'data';
        if (url.includes('.css')) subdir = 'css';
        else if (url.includes('.js')) subdir = 'js';
        else if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url)) subdir = 'images';
        else if (/\.(woff|woff2|ttf|eot)$/i.test(url)) subdir = 'fonts';

        const filename = path.basename(url).split('?')[0];
        const filepath = path.join(OUTPUT_DIR, subdir, filename);

        await fs.writeFile(filepath, response.data);
        downloaded++;

      } catch (error) {
        failed++;
      }
    }

    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.log(`✅ Downloaded: ${downloaded} files`);
    console.log(`❌ Failed: ${failed} files`);
  }

  private async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalAssets: this.assets.size,
        libraries: Array.from(this.libraries),
        apiEndpoints: Array.from(this.apiEndpoints)
      },
      assets: Array.from(this.assets),
      recommendations: [
        'Install detected libraries using: bun add ' + this.getPackageList(),
        'Review downloaded assets in: public/skystage-assets/',
        'Import CSS files from: public/skystage-assets/css/',
        'Use images from: public/skystage-assets/images/',
        'Apply fonts from: public/skystage-assets/fonts/'
      ]
    };

    await fs.writeJson(path.join(OUTPUT_DIR, 'download-report.json'), report, { spaces: 2 });

    console.log('\n📊 Download Report:');
    console.log('='.repeat(60));
    console.log(`Total Assets: ${report.summary.totalAssets}`);
    console.log(`\nLibraries Detected:`);
    report.summary.libraries.forEach(lib => console.log(`  • ${lib}`));
    console.log(`\nAPI Endpoints Found: ${report.summary.apiEndpoints.length}`);
    console.log('\n📄 Full report saved to: public/skystage-assets/download-report.json');
  }

  private getPackageList(): string {
    const packageMap = {
      'React': 'react react-dom',
      'Next.js': 'next',
      'Three.js': 'three @types/three',
      'GSAP': 'gsap',
      'Tailwind CSS': 'tailwindcss',
      'Framer Motion': 'framer-motion',
      'Stripe': '@stripe/stripe-js',
      'Lottie': 'lottie-web'
    };

    const packages: string[] = [];
    this.libraries.forEach(lib => {
      if (packageMap[lib]) {
        packages.push(packageMap[lib]);
      }
    });

    return packages.join(' ');
  }
}

// Execute
const downloader = new SimpleSkystageDownloader();
downloader.run().catch(console.error);

#!/usr/bin/env node

/**
 * 🚀 Complete SkyStage Asset Downloader & Analyzer
 * Downloads ALL files, libraries, assets, and analyzes the entire skystage.com
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';
import puppeteer from 'puppeteer';

const SKYSTAGE_BASE = 'https://www.skystage.com';
const OUTPUT_DIR = path.join(process.cwd(), 'skystage-assets');

interface AssetInfo {
  url: string;
  type: string;
  localPath: string;
  size?: number;
  headers?: any;
}

class SkyStageDownloader {
  private browser: puppeteer.Browser | null = null;
  private assets: Map<string, AssetInfo> = new Map();
  private libraries: Set<string> = new Set();
  private analyzedData = {
    totalAssets: 0,
    javascriptFiles: [] as string[],
    cssFiles: [] as string[],
    images: [] as string[],
    videos: [] as string[],
    fonts: [] as string[],
    dataFiles: [] as string[],
    apiEndpoints: [] as string[],
    libraries: [] as string[],
    technologies: [] as string[],
    formationData: [] as any[],
    thirdPartyScripts: [] as string[]
  };

  async initialize() {
    console.log('🚀 Initializing SkyStage Asset Downloader\n');

    // Create output directories
    await fs.ensureDir(OUTPUT_DIR);
    await fs.ensureDir(path.join(OUTPUT_DIR, 'js'));
    await fs.ensureDir(path.join(OUTPUT_DIR, 'css'));
    await fs.ensureDir(path.join(OUTPUT_DIR, 'images'));
    await fs.ensureDir(path.join(OUTPUT_DIR, 'videos'));
    await fs.ensureDir(path.join(OUTPUT_DIR, 'fonts'));
    await fs.ensureDir(path.join(OUTPUT_DIR, 'data'));
    await fs.ensureDir(path.join(OUTPUT_DIR, 'formations'));
    await fs.ensureDir(path.join(OUTPUT_DIR, 'api-responses'));

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async analyzePage(url: string) {
    console.log(`📄 Analyzing: ${url}`);

    const page = await this.browser!.newPage();

    // Intercept all network requests
    await page.setRequestInterception(true);

    const requests: unknown[] = [];
    const responses: unknown[] = [];

    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        resourceType: request.resourceType()
      });
      request.continue();
    });

    page.on('response', async (response) => {
      const url = response.url();
      const headers = response.headers();

      responses.push({
        url,
        status: response.status(),
        headers,
        contentType: headers['content-type']
      });

      // Categorize and queue for download
      if (url.includes('.js') || headers['content-type']?.includes('javascript')) {
        this.analyzedData.javascriptFiles.push(url);
        this.queueAsset(url, 'javascript');
      } else if (url.includes('.css') || headers['content-type']?.includes('css')) {
        this.analyzedData.cssFiles.push(url);
        this.queueAsset(url, 'css');
      } else if (headers['content-type']?.includes('image')) {
        this.analyzedData.images.push(url);
        this.queueAsset(url, 'image');
      } else if (headers['content-type']?.includes('video')) {
        this.analyzedData.videos.push(url);
        this.queueAsset(url, 'video');
      } else if (headers['content-type']?.includes('font') || url.includes('.woff') || url.includes('.ttf')) {
        this.analyzedData.fonts.push(url);
        this.queueAsset(url, 'font');
      } else if (url.includes('/api/')) {
        this.analyzedData.apiEndpoints.push(url);
        // Try to capture API response
        try {
          const buffer = await response.buffer();
          const content = buffer.toString();
          await this.saveApiResponse(url, content);
        } catch (e) {
          // Ignore errors
        }
      }
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

      // Extract all scripts and analyze libraries
      const pageContent = await page.content();
      await this.analyzeLibraries(pageContent);

      // Extract formation data
      const formationData = await page.evaluate(() => {
        // Try to find formation data in various places
        const formations: unknown[] = [];

        // Check window object for data
        if ((window as any).formations) {
          formations.push(...(window as any).formations);
        }

        // Check for data attributes
        document.querySelectorAll('[data-formation]').forEach(el => {
          const data = el.getAttribute('data-formation');
          if (data) {
            try {
              formations.push(JSON.parse(data));
            } catch (e) {}
          }
        });

        // Check for JSON-LD data
        document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
          try {
            const data = JSON.parse(el.textContent || '{}');
            if (data.formations) formations.push(...data.formations);
          } catch (e) {}
        });

        return formations;
      });

      if (formationData.length > 0) {
        this.analyzedData.formationData.push(...formationData);
      }

      // Extract inline scripts and styles
      await this.extractInlineAssets(pageContent);

    } catch (error) {
      console.error(`  ❌ Error analyzing ${url}:`, error.message);
    } finally {
      await page.close();
    }
  }

  private async analyzeLibraries(html: string) {
    const $ = cheerio.load(html);

    // Common library patterns
    const libraryPatterns = [
      { pattern: /react(?:\.production)?(?:\.min)?\.js/i, name: 'React' },
      { pattern: /next(?:\.min)?\.js/i, name: 'Next.js' },
      { pattern: /three(?:\.min)?\.js/i, name: 'Three.js' },
      { pattern: /gsap(?:\.min)?\.js/i, name: 'GSAP' },
      { pattern: /tailwind/i, name: 'Tailwind CSS' },
      { pattern: /bootstrap/i, name: 'Bootstrap' },
      { pattern: /jquery/i, name: 'jQuery' },
      { pattern: /vue(?:\.min)?\.js/i, name: 'Vue.js' },
      { pattern: /angular/i, name: 'Angular' },
      { pattern: /d3(?:\.min)?\.js/i, name: 'D3.js' },
      { pattern: /chart(?:\.min)?\.js/i, name: 'Chart.js' },
      { pattern: /mapbox/i, name: 'Mapbox' },
      { pattern: /stripe/i, name: 'Stripe' },
      { pattern: /firebase/i, name: 'Firebase' },
      { pattern: /supabase/i, name: 'Supabase' },
      { pattern: /framer-motion/i, name: 'Framer Motion' },
      { pattern: /lottie/i, name: 'Lottie' },
      { pattern: /swiper/i, name: 'Swiper' },
      { pattern: /aos/i, name: 'AOS (Animate on Scroll)' },
      { pattern: /skybrush/i, name: 'SkyBrush' }
    ];

    // Check script tags
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        libraryPatterns.forEach(lib => {
          if (lib.pattern.test(src)) {
            this.libraries.add(lib.name);
            this.analyzedData.libraries.push(lib.name);
          }
        });

        // Check for CDN libraries
        if (src.includes('cdn.jsdelivr.net') || src.includes('unpkg.com') || src.includes('cdnjs.cloudflare.com')) {
          this.analyzedData.thirdPartyScripts.push(src);
        }
      }
    });

    // Check link tags for CSS frameworks
    $('link[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        libraryPatterns.forEach(lib => {
          if (lib.pattern.test(href)) {
            this.libraries.add(lib.name);
          }
        });
      }
    });

    // Detect technologies from meta tags and comments
    if ($('meta[name="generator"]').length) {
      const generator = $('meta[name="generator"]').attr('content');
      if (generator) this.analyzedData.technologies.push(generator);
    }

    // Check for Next.js
    if ($('#__next').length || $('script[id="__NEXT_DATA__"]').length) {
      this.analyzedData.technologies.push('Next.js');

      // Extract Next.js build data
      const nextData = $('script[id="__NEXT_DATA__"]').html();
      if (nextData) {
        try {
          const data = JSON.parse(nextData);
          await this.saveApiResponse('__NEXT_DATA__', nextData);
        } catch (e) {}
      }
    }

    // Check for React
    if ($('[data-reactroot]').length || $('[data-react-helmet]').length) {
      this.analyzedData.technologies.push('React');
    }
  }

  private async extractInlineAssets(html: string) {
    const $ = cheerio.load(html);

    // Extract inline styles
    $('style').each(async (index, el) => {
      const content = $(el).html();
      if (content) {
        const filename = `inline-style-${index}.css`;
        await fs.writeFile(path.join(OUTPUT_DIR, 'css', filename), content);
      }
    });

    // Extract inline scripts
    $('script:not([src])').each(async (index, el) => {
      const content = $(el).html();
      if (content && !$(el).attr('type')?.includes('json')) {
        const filename = `inline-script-${index}.js`;
        await fs.writeFile(path.join(OUTPUT_DIR, 'js', filename), content);
      }
    });
  }

  private queueAsset(url: string, type: string) {
    if (!this.assets.has(url)) {
      let localPath = '';

      switch (type) {
        case 'javascript':
          localPath = path.join('js', path.basename(url));
          break;
        case 'css':
          localPath = path.join('css', path.basename(url));
          break;
        case 'image':
          localPath = path.join('images', path.basename(url));
          break;
        case 'video':
          localPath = path.join('videos', path.basename(url));
          break;
        case 'font':
          localPath = path.join('fonts', path.basename(url));
          break;
        default:
          localPath = path.join('data', path.basename(url));
      }

      this.assets.set(url, {
        url,
        type,
        localPath: path.join(OUTPUT_DIR, localPath)
      });
    }
  }

  private async saveApiResponse(url: string, content: string) {
    const filename = url.replace(/[^a-z0-9]/gi, '_') + '.json';
    const filepath = path.join(OUTPUT_DIR, 'api-responses', filename);

    try {
      const data = JSON.parse(content);
      await fs.writeJson(filepath, data, { spaces: 2 });
    } catch {
      // Save as text if not JSON
      await fs.writeFile(filepath, content);
    }
  }

  async downloadAssets() {
    console.log(`\n📥 Downloading ${this.assets.size} assets...\n`);

    let downloaded = 0;
    let failed = 0;

    for (const [url, asset] of this.assets) {
      try {
        process.stdout.write(`\r[${downloaded + failed + 1}/${this.assets.size}] Downloading: ${path.basename(url).substring(0, 50).padEnd(50)}`);

        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        await fs.writeFile(asset.localPath, response.data);
        asset.size = response.data.length;
        downloaded++;

      } catch (error) {
        failed++;
      }
    }

    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.log(`\n✅ Downloaded: ${downloaded} assets`);
    console.log(`❌ Failed: ${failed} assets`);
  }

  async crawlSite() {
    // Pages to analyze
    const pagesToCrawl = [
      '/',
      '/new-browse-formations',
      '/get-custom-formation',
      '/pricing',
      '/about',
      '/operators',
      '/artists',
      '/help',
      '/terms',
      '/privacy'
    ];

    for (const pagePath of pagesToCrawl) {
      await this.analyzePage(SKYSTAGE_BASE + pagePath);
    }

    // Try to find more formations
    const categories = [
      'epic', 'love', 'abstract', 'nature', 'entertainment',
      'sports', 'holidays', 'corporate', 'wedding', 'proposal'
    ];

    for (const category of categories) {
      await this.analyzePage(`${SKYSTAGE_BASE}/new-browse-formations?category=${category}`);
    }
  }

  async generateReport() {
    const report = {
      summary: {
        totalAssets: this.assets.size,
        totalSize: Array.from(this.assets.values()).reduce((sum, a) => sum + (a.size || 0), 0),
        javascriptFiles: this.analyzedData.javascriptFiles.length,
        cssFiles: this.analyzedData.cssFiles.length,
        images: this.analyzedData.images.length,
        videos: this.analyzedData.videos.length,
        fonts: this.analyzedData.fonts.length,
        apiEndpoints: this.analyzedData.apiEndpoints.length,
        formations: this.analyzedData.formationData.length
      },
      libraries: Array.from(this.libraries),
      technologies: [...new Set(this.analyzedData.technologies)],
      thirdPartyScripts: [...new Set(this.analyzedData.thirdPartyScripts)],
      apiEndpoints: [...new Set(this.analyzedData.apiEndpoints)],
      formations: this.analyzedData.formationData,
      assets: {
        javascript: [...new Set(this.analyzedData.javascriptFiles)],
        css: [...new Set(this.analyzedData.cssFiles)],
        images: [...new Set(this.analyzedData.images)].slice(0, 100), // Limit for readability
        videos: [...new Set(this.analyzedData.videos)],
        fonts: [...new Set(this.analyzedData.fonts)]
      }
    };

    await fs.writeJson(path.join(OUTPUT_DIR, 'analysis-report.json'), report, { spaces: 2 });

    console.log('\n📊 Analysis Report:');
    console.log('='.repeat(60));
    console.log(`Total Assets: ${report.summary.totalAssets}`);
    console.log(`Total Size: ${(report.summary.totalSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`\nFile Types:`);
    console.log(`  • JavaScript: ${report.summary.javascriptFiles} files`);
    console.log(`  • CSS: ${report.summary.cssFiles} files`);
    console.log(`  • Images: ${report.summary.images} files`);
    console.log(`  • Videos: ${report.summary.videos} files`);
    console.log(`  • Fonts: ${report.summary.fonts} files`);
    console.log(`\nLibraries Detected:`);
    report.libraries.forEach(lib => console.log(`  • ${lib}`));
    console.log(`\nTechnologies:`);
    report.technologies.forEach(tech => console.log(`  • ${tech}`));
    console.log(`\nAPI Endpoints: ${report.summary.apiEndpoints}`);
    console.log(`Formations Found: ${report.summary.formations}`);

    return report;
  }

  async integrateIntoProject($1: unknown) {
    console.log('\n🔧 Integrating into project...\n');

    // Copy essential assets to public folder
    const publicDir = path.join(process.cwd(), 'public/skystage-assets');
    await fs.ensureDir(publicDir);

    // Copy images
    if (await fs.pathExists(path.join(OUTPUT_DIR, 'images'))) {
      await fs.copy(path.join(OUTPUT_DIR, 'images'), path.join(publicDir, 'images'));
      console.log('  ✅ Copied images');
    }

    // Copy fonts
    if (await fs.pathExists(path.join(OUTPUT_DIR, 'fonts'))) {
      await fs.copy(path.join(OUTPUT_DIR, 'fonts'), path.join(publicDir, 'fonts'));
      console.log('  ✅ Copied fonts');
    }

    // Generate library installation script
    const packageJson = {
      dependencies: {}
    };

    // Map detected libraries to npm packages
    const libraryMap = {
      'React': 'react react-dom',
      'Next.js': 'next',
      'Three.js': 'three @types/three',
      'GSAP': 'gsap',
      'Tailwind CSS': 'tailwindcss',
      'Framer Motion': 'framer-motion',
      'Lottie': 'lottie-web',
      'Swiper': 'swiper',
      'AOS (Animate on Scroll)': 'aos',
      'Chart.js': 'chart.js',
      'D3.js': 'd3',
      'Stripe': '@stripe/stripe-js'
    };

    const packagesToInstall: string[] = [];
    report.libraries.forEach(lib => {
      if (libraryMap[lib]) {
        packagesToInstall.push(libraryMap[lib]);
      }
    });

    if (packagesToInstall.length > 0) {
      const installScript = `#!/bin/bash
# Install detected libraries from SkyStage

echo "Installing libraries detected from SkyStage..."
bun add ${packagesToInstall.join(' ')}
`;

      await fs.writeFile(path.join(process.cwd(), 'install-skystage-libraries.sh'), installScript);
      console.log('  ✅ Generated library installation script');
    }

    // Create integration summary
    const integrationSummary = `
# SkyStage Integration Summary

## Libraries to Install
${packagesToInstall.map(p => `- ${p}`).join('\n')}

## Assets Downloaded
- Images: ${report.summary.images} files
- Videos: ${report.summary.videos} files
- Fonts: ${report.summary.fonts} files
- JavaScript: ${report.summary.javascriptFiles} files
- CSS: ${report.summary.cssFiles} files

## Technologies Used by SkyStage
${report.technologies.map(t => `- ${t}`).join('\n')}

## API Endpoints Discovered
${report.apiEndpoints.slice(0, 20).map(e => `- ${e}`).join('\n')}

## Next Steps
1. Run: chmod +x install-skystage-libraries.sh && ./install-skystage-libraries.sh
2. Review downloaded assets in: skystage-assets/
3. Import formations from: skystage-assets/api-responses/
4. Use images from: public/skystage-assets/images/
5. Use fonts from: public/skystage-assets/fonts/
`;

    await fs.writeFile(path.join(process.cwd(), 'SKYSTAGE_INTEGRATION.md'), integrationSummary);
    console.log('  ✅ Created integration summary');

    console.log('\n✨ Integration complete!');
    console.log('📄 See SKYSTAGE_INTEGRATION.md for details');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.crawlSite();
      await this.downloadAssets();
      const report = await this.generateReport();
      await this.integrateIntoProject(report);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Execute
async function main() {
  const downloader = new SkyStageDownloader();
  await downloader.run();
}

main().catch(console.error);

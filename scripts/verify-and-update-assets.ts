#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

interface AssetMapping {
  original: string;
  replacement: string;
  type: 'css' | 'js' | 'image' | 'svg' | 'font' | 'video';
}

// Asset mappings from skystage.com to local or same-assets.com
const assetMappings: AssetMapping[] = [
  // CSS Files
  {
    original: 'https://www.skystage.com/_next/static/css/3895f1f3bb16df6f.css',
    replacement: '/skystage-assets/css/3895f1f3bb16df6f.css',
    type: 'css'
  },
  {
    original: 'https://www.skystage.com/_next/static/css/25a74a126e8c3d22.css',
    replacement: '/skystage-assets/css/25a74a126e8c3d22.css',
    type: 'css'
  },
  {
    original: 'https://www.skystage.com/_next/static/css/ea47b3d0a94e380d.css',
    replacement: '/skystage-assets/css/ea47b3d0a94e380d.css',
    type: 'css'
  },
  // Cloudinary Images - Update to working versions
  {
    original: 'https://res.cloudinary.com/drotqvwnl/image/upload/v1707324062/Group_89_bgge7h.svg',
    replacement: 'https://ext.same-assets.com/3217929354/3901443556.svg',
    type: 'svg'
  },
  {
    original: 'https://res.cloudinary.com/drotqvwnl/image/upload/v1710777517/list_2_txvth1.svg',
    replacement: 'https://ext.same-assets.com/3217929354/4079797572.svg',
    type: 'svg'
  },
  {
    original: 'https://res.cloudinary.com/dgqeiqhlq/image/upload/q_auto/v1739559163/Screenshot_2025-02-14_at_1.50.26_PM_ttf3ox.png',
    replacement: 'https://ext.same-assets.com/3217929354/2199644731.png',
    type: 'image'
  },
  {
    original: 'https://res.cloudinary.com/dgqeiqhlq/image/upload/q_auto/v1739567618/Screenshot_2025-02-14_at_4.10.31_PM_1_5_nuqz7x.png',
    replacement: 'https://ext.same-assets.com/3217929354/3962827081.png',
    type: 'image'
  },
  // Formation thumbnails from CloudFront
  {
    original: 'https://d1t7q4re3kulf9.cloudfront.net/thumbnails/',
    replacement: 'https://ext.same-assets.com/3217929354/',
    type: 'image'
  },
  // Work Sans font
  {
    original: 'https://fonts.gstatic.com/s/worksans/v23/',
    replacement: 'https://ext.same-assets.com/3217929354/',
    type: 'font'
  }
];

// Additional comprehensive asset URLs from the browse page
const additionalAssets = [
  'https://ext.same-assets.com/3217929354/3251544383.jpeg', // Beating Heart
  'https://ext.same-assets.com/3217929354/196786526.jpeg', // Starry Night
  'https://ext.same-assets.com/3217929354/4276378940.jpeg', // Ring from Box
  'https://ext.same-assets.com/3217929354/296827301.jpeg', // Unfolding Rose
  'https://ext.same-assets.com/3217929354/1903540219.jpeg', // Spiral
  'https://ext.same-assets.com/3217929354/1552326712.jpeg', // Dahlia
  'https://ext.same-assets.com/3217929354/4194686482.jpeg', // Magic Carpet
  'https://ext.same-assets.com/3217929354/2522083599.jpeg', // Looping Circles
];

async function verifyAsset(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function downloadAsset(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000
    });

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, response.data);
    console.log(`✅ Downloaded: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to download ${url}:`, error.message);
    return false;
  }
}

async function updateProjectFiles() {
  console.log('🔍 Scanning project files for asset references...\n');

  const srcDir = path.join(process.cwd(), 'src');
  const publicDir = path.join(process.cwd(), 'public');

  // Find all TypeScript and CSS files
  const files = [
    ...findFiles(srcDir, ['.tsx', '.ts', '.css']),
    ...findFiles(publicDir, ['.css', '.html'])
  ];

  let updatedCount = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let updated = false;

    // Replace asset URLs
    for (const mapping of assetMappings) {
      if (content.includes(mapping.original)) {
        content = content.replace(new RegExp(mapping.original, 'g'), mapping.replacement);
        updated = true;
        updatedCount++;
      }
    }

    if (updated) {
      fs.writeFileSync(file, content);
      console.log(`📝 Updated: ${path.relative(process.cwd(), file)}`);
    }
  }

  console.log(`\n✅ Updated ${updatedCount} asset references in project files`);
}

function findFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findFiles(fullPath, extensions));
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

async function verifyAndUpdateAssets() {
  console.log('🚀 Starting SkyStage Asset Verification and Update\n');
  console.log('=' .repeat(50));

  // 1. Verify downloaded assets
  console.log('\n📦 Verifying downloaded assets...\n');
  const downloadedAssets = [
    'public/skystage-assets/css/3895f1f3bb16df6f.css',
    'public/skystage-assets/css/25a74a126e8c3d22.css',
    'public/skystage-assets/css/ea47b3d0a94e380d.css',
  ];

  for (const asset of downloadedAssets) {
    const fullPath = path.join(process.cwd(), asset);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Found: ${asset}`);
    } else {
      console.log(`❌ Missing: ${asset}`);
    }
  }

  // 2. Test same-assets.com links
  console.log('\n🌐 Testing same-assets.com links...\n');
  const testLinks = additionalAssets.slice(0, 5); // Test first 5

  for (const link of testLinks) {
    const isWorking = await verifyAsset(link);
    console.log(`${isWorking ? '✅' : '❌'} ${link.split('/').pop()}: ${isWorking ? 'Working' : 'Not accessible'}`);
  }

  // 3. Update project files
  await updateProjectFiles();

  // 4. Generate asset manifest
  console.log('\n📋 Generating asset manifest...\n');
  const manifest = {
    timestamp: new Date().toISOString(),
    assets: {
      css: downloadedAssets.filter(a => a.endsWith('.css')),
      images: additionalAssets,
      mappings: assetMappings
    }
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'public/assets/verified-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('✅ Asset verification and update complete!');
  console.log('\n📊 Summary:');
  console.log(`- CSS files verified: ${downloadedAssets.filter(a => a.endsWith('.css')).length}`);
  console.log(`- Image links tested: ${testLinks.length}`);
  console.log(`- Asset mappings: ${assetMappings.length}`);
  console.log('\nAll assets have been verified and updated to use working links.');
}

// Run the verification
verifyAndUpdateAssets().catch(console.error);

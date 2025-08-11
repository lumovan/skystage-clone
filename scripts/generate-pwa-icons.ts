#!/usr/bin/env node

/**
 * PWA Icon Generator for SkyStage
 * Generates required icon sizes using sharp for PNG conversion
 */

import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';

const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

const ADDITIONAL_ICONS = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 72, name: 'badge-72x72.png' }
];

async function generateIcons() {
  console.log('🎨 Generating PWA icons for SkyStage...\n');

  const iconDir = path.join(process.cwd(), 'public/assets/icons');
  await fs.ensureDir(iconDir);

  // Create enhanced SVG-based icon template
  const generateSVGIcon = (size: number) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a49a7;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background circle with border -->
  <circle cx="${size/2}" cy="${size/2}" r="${(size-8)/2}" fill="url(#gradient)" stroke="#ffffff" stroke-width="3"/>

  <!-- Drone representation - modern abstract design -->
  <g transform="translate(${size/2}, ${size/2})" filter="url(#glow)">
    <!-- Central body -->
    <circle cx="0" cy="0" r="${size/10}" fill="#ffffff" opacity="0.95"/>

    <!-- Four propellers positioned at corners -->
    <circle cx="-${size/5}" cy="-${size/5}" r="${size/18}" fill="#ffffff" opacity="0.8"/>
    <circle cx="${size/5}" cy="-${size/5}" r="${size/18}" fill="#ffffff" opacity="0.8"/>
    <circle cx="-${size/5}" cy="${size/5}" r="${size/18}" fill="#ffffff" opacity="0.8"/>
    <circle cx="${size/5}" cy="${size/5}" r="${size/18}" fill="#ffffff" opacity="0.8"/>

    <!-- Connecting arms with improved styling -->
    <line x1="-${size/5}" y1="-${size/5}" x2="-${size/15}" y2="-${size/15}" stroke="#ffffff" stroke-width="3" opacity="0.9" stroke-linecap="round"/>
    <line x1="${size/5}" y1="-${size/5}" x2="${size/15}" y2="-${size/15}" stroke="#ffffff" stroke-width="3" opacity="0.9" stroke-linecap="round"/>
    <line x1="-${size/5}" y1="${size/5}" x2="-${size/15}" y2="${size/15}" stroke="#ffffff" stroke-width="3" opacity="0.9" stroke-linecap="round"/>
    <line x1="${size/5}" y1="${size/5}" x2="${size/15}" y2="${size/15}" stroke="#ffffff" stroke-width="3" opacity="0.9" stroke-linecap="round"/>

    <!-- Center highlight -->
    <circle cx="0" cy="0" r="${size/20}" fill="#ffffff" opacity="0.6"/>
  </g>

  <!-- Subtle outer glow -->
  <circle cx="${size/2}" cy="${size/2}" r="${(size-4)/2}" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
</svg>`;

  let successCount = 0;
  let failureCount = 0;

  // Generate all required PWA icons
  for (const icon of [...ICON_SIZES, ...ADDITIONAL_ICONS]) {
    const svgContent = generateSVGIcon(icon.size);
    const pngPath = path.join(iconDir, icon.name);

    try {
      // Convert SVG to PNG using sharp
      const svgBuffer = Buffer.from(svgContent);

      await sharp(svgBuffer)
        .resize(icon.size, icon.size)
        .png({ quality: 100, compressionLevel: 6 })
        .toFile(pngPath);

      console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size})`);
      successCount++;

    } catch (error) {
      console.error(`❌ Failed to generate ${icon.name}:`, error);
      failureCount++;
    }
  }

  // Generate screenshots placeholders (text files for now)
  const screenshotDir = path.join(process.cwd(), 'public/assets/screenshots');
  await fs.ensureDir(screenshotDir);

  const screenshots = [
    { name: 'desktop-home.png', size: '1920x1080', description: 'Homepage' },
    { name: 'desktop-builder.png', size: '1920x1080', description: 'Show Builder' },
    { name: 'mobile-home.png', size: '390x844', description: 'Mobile Homepage' },
    { name: 'mobile-formations.png', size: '390x844', description: 'Formation Library' }
  ];

  for (const screenshot of screenshots) {
    const screenshotPath = path.join(screenshotDir, screenshot.name);

    // Create a simple placeholder PNG with text
    const [width, height] = screenshot.size.split('x').map(Number);

    try {
      const placeholderSvg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#f3f4f6"/>
  <rect x="0" y="0" width="${width}" height="80" fill="#1a49a7"/>
  <text x="${width/2}" y="40" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">SkyStage</text>
  <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="18">${screenshot.description}</text>
  <text x="${width/2}" y="${height/2 + 30}" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="14">${screenshot.size} Screenshot Placeholder</text>
</svg>`;

      const svgBuffer = Buffer.from(placeholderSvg);
      await sharp(svgBuffer)
        .resize(width, height)
        .png()
        .toFile(screenshotPath);

      console.log(`✅ Generated screenshot placeholder ${screenshot.name}`);
    } catch (error) {
      console.error(`❌ Failed to generate screenshot ${screenshot.name}:`, error);
    }
  }

  // Generate shortcut icons
  const shortcutIcons = [
    { name: 'shortcut-create.png', description: '➕', color: '#10b981' },
    { name: 'shortcut-browse.png', description: '🔍', color: '#3b82f6' },
    { name: 'shortcut-book.png', description: '📅', color: '#f59e0b' }
  ];

  for (const shortcut of shortcutIcons) {
    const shortcutPath = path.join(iconDir, shortcut.name);

    const shortcutSvg = `
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <circle cx="48" cy="48" r="44" fill="${shortcut.color}"/>
  <text x="48" y="58" text-anchor="middle" fill="white" font-family="Arial" font-size="32">${shortcut.description}</text>
</svg>`;

    try {
      const svgBuffer = Buffer.from(shortcutSvg);
      await sharp(svgBuffer)
        .resize(96, 96)
        .png()
        .toFile(shortcutPath);

      console.log(`✅ Generated shortcut icon ${shortcut.name}`);
    } catch (error) {
      console.error(`❌ Failed to generate shortcut ${shortcut.name}:`, error);
    }
  }

  console.log('\n🎉 PWA icon generation complete!');
  console.log(`📊 Results: ${successCount} successful, ${failureCount} failed`);

  if (successCount > 0) {
    console.log('\n✅ Icons generated successfully! Your PWA should now have proper icons.');
    console.log('📱 Test installation: Open developer tools > Application > Manifest');
    console.log('🔄 Restart your development server to see the changes');
  }

  if (failureCount > 0) {
    console.log(`\n⚠️  Some icons failed to generate. Check the errors above.`);
  }
}

generateIcons().catch(console.error);

const fs = require('fs');
const path = require('path');
const https = require('https');

// Create asset directories
const assetDirs = {
  logos: './public/assets/logos',
  images: './public/assets/images',
  videos: './public/assets/videos',
  icons: './public/assets/icons',
  fonts: './public/assets/fonts',
  formations: './public/assets/formations',
};

// Ensure directories exist
Object.values(assetDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Asset mappings from same-assets.com URLs to local paths
const assetMappings = [
  // Main logo and branding
  { url: 'https://ext.same-assets.com/3217929354/2911840443.svg', local: 'logos/skystage-logo.svg' },
  { url: 'https://ext.same-assets.com/3217929354/3126707818.svg', local: 'logos/skystage-logo-alt.svg' },
  { url: 'https://ext.same-assets.com/3217929354/711367295.svg', local: 'logos/skystage-logo-header.svg' },

  // Hero video and images
  { url: 'https://ext.same-assets.com/3217929354/967202961.mp4', local: 'videos/hero-background.mp4' },
  { url: 'https://ext.same-assets.com/3217929354/3867534047.png', local: 'images/3d-preview-heart.png' },
  { url: 'https://ext.same-assets.com/3217929354/1552028429.png', local: 'images/drag-drop-designer.png' },

  // Icons and UI elements
  { url: 'https://ext.same-assets.com/3217929354/203728570.svg', local: 'icons/ai-icon.svg' },
  { url: 'https://ext.same-assets.com/3217929354/1392581921.svg', local: 'icons/arrow-left.svg' },
  { url: 'https://ext.same-assets.com/3217929354/1238676097.svg', local: 'icons/filter.svg' },
  { url: 'https://ext.same-assets.com/3217929354/3366102963.svg', local: 'icons/search.svg' },
  { url: 'https://ext.same-assets.com/3217929354/1262082240.svg', local: 'icons/drone-count.svg' },
  { url: 'https://ext.same-assets.com/3217929354/2707685175.svg', local: 'icons/duration.svg' },
  { url: 'https://ext.same-assets.com/3217929354/608646329.svg', local: 'icons/star-rating.svg' },

  // Guarantee/feature icons
  { url: 'https://ext.same-assets.com/3217929354/4056627843.svg', local: 'icons/guarantee-pricing.svg' },
  { url: 'https://ext.same-assets.com/3217929354/3554315709.svg', local: 'icons/guarantee-insurance.svg' },
  { url: 'https://ext.same-assets.com/3217929354/3458935830.svg', local: 'icons/guarantee-compliance.svg' },
  { url: 'https://ext.same-assets.com/3217929354/2409020944.svg', local: 'icons/guarantee-escrow.svg' },
  { url: 'https://ext.same-assets.com/3217929354/2745154041.svg', local: 'icons/guarantee-refund.svg' },
  { url: 'https://ext.same-assets.com/3217929354/1823160998.svg', local: 'icons/calendar.svg' },

  // Category icons
  { url: 'https://ext.same-assets.com/3217929354/4135231171.png', local: 'images/categories/wedding.png' },
  { url: 'https://ext.same-assets.com/3217929354/2557736812.png', local: 'images/categories/proposal.png' },
  { url: 'https://ext.same-assets.com/3217929354/2774912259.png', local: 'images/categories/epic.png' },
  { url: 'https://ext.same-assets.com/3217929354/3633343646.png', local: 'images/categories/christmas.png' },
  { url: 'https://ext.same-assets.com/3217929354/856609192.png', local: 'images/categories/july4th.png' },
  { url: 'https://ext.same-assets.com/3217929354/1032029115.png', local: 'images/categories/love.png' },
  { url: 'https://ext.same-assets.com/3217929354/1057319835.png', local: 'images/categories/celestial.png' },
  { url: 'https://ext.same-assets.com/3217929354/1051400054.png', local: 'images/categories/halloween.png' },
  { url: 'https://ext.same-assets.com/3217929354/1266389741.png', local: 'images/categories/gift.png' },

  // Formation thumbnails (sample set)
  { url: 'https://ext.same-assets.com/3217929354/1053690495.jpeg', local: 'formations/beating-heart.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/1807837556.jpeg', local: 'formations/starry-night.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/3894632651.jpeg', local: 'formations/ring-from-box.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/1530583935.jpeg', local: 'formations/unfolding-rose.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/2994348294.jpeg', local: 'formations/spiral.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/1325694607.jpeg', local: 'formations/dahlia.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/3886899748.jpeg', local: 'formations/magic-carpet.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/471822314.jpeg', local: 'formations/looping-circles.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/3715164333.jpeg', local: 'formations/yin-yang.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/983743494.jpeg', local: 'formations/flapping-dolphin.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/2369495706.jpeg', local: 'formations/sparkling-eiffel-tower.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/2826674649.jpeg', local: 'formations/torus-loop.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/3669108600.jpeg', local: 'formations/waving-american-flag.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/3742071098.jpeg', local: 'formations/looping-circles-100.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/3119561854.jpeg', local: 'formations/magic-carpet-100.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/265039351.jpeg', local: 'formations/rotating-circles-100.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/3413333981.jpeg', local: 'formations/heart-tunnel.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/1641838399.jpeg', local: 'formations/hot-air-balloon.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/2215883596.jpeg', local: 'formations/earth.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/3681124198.jpeg', local: 'formations/beating-hearts.jpg' },
  { url: 'https://ext.same-assets.com/3217929354/2359468155.jpeg', local: 'formations/two-hearts.jpg' },

  // Additional UI icons for formations
  { url: 'https://ext.same-assets.com/3217929354/1041432142.svg', local: 'icons/play.svg' },
  { url: 'https://ext.same-assets.com/3217929354/667604112.svg', local: 'icons/pause.svg' },
  { url: 'https://ext.same-assets.com/3217929354/952278276.svg', local: 'icons/drone-255.svg' },
  { url: 'https://ext.same-assets.com/3217929354/649647988.svg', local: 'icons/clock.svg' },
  { url: 'https://ext.same-assets.com/3217929354/109529994.svg', local: 'icons/star-filled.svg' },

  // Fonts
  { url: 'https://ext.same-assets.com/3217929354/600865854.otf', local: 'fonts/work-sans.otf' },
  { url: 'https://ext.same-assets.com/3217929354/847546811.woff2', local: 'fonts/work-sans.woff2' },

  // Error/404 page assets
  { url: 'https://ext.same-assets.com/3217929354/205771669.svg', local: 'icons/error-drone.svg' },

  // Chat/support widget
  { url: 'https://ext.same-assets.com/3217929354/2510367834.svg', local: 'icons/chat-widget.svg' },
];

// Download function
function downloadFile(url, localPath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, '..', localPath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(fullPath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${localPath}`);
        resolve(localPath);
      });

      file.on('error', (err) => {
        fs.unlink(fullPath, () => {}); // Delete file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Download all assets
async function downloadAllAssets() {
  console.log('🚀 Starting asset download...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const asset of assetMappings) {
    try {
      await downloadFile(asset.url, `public/assets/${asset.local}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to download ${asset.local}: ${error.message}`);
      errorCount++;
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Download Summary:`);
  console.log(`✅ Successfully downloaded: ${successCount} files`);
  console.log(`❌ Failed downloads: ${errorCount} files`);
  console.log(`📁 Assets saved to: ./public/assets/`);

  // Create asset manifest
  const manifest = {
    timestamp: new Date().toISOString(),
    totalAssets: assetMappings.length,
    successCount,
    errorCount,
    assets: assetMappings.map(asset => ({
      originalUrl: asset.url,
      localPath: asset.local,
    }))
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'public/assets/manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`📄 Asset manifest created: public/assets/manifest.json`);
}

// Run the download
if (require.main === module) {
  downloadAllAssets().catch(console.error);
}

module.exports = { downloadAllAssets, assetMappings };

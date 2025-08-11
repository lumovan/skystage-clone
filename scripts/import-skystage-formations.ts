
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


import { formationDb, syncJobDb, analyticsDb } from '../src/lib/db';
import { initializeAppDatabase } from '../src/lib/database/init';
import fs from 'fs';
import path from 'path';

// SkyStage Formation Data - Comprehensive collection from their formation library
const SKYSTAGE_FORMATIONS = [
  // Epic Category
  {
    name: "Beating Heart",
    description: "A pulsating heart formation that beats rhythmically with colored lights, perfect for romantic events and emotional moments.",
    category: "Epic",
    drone_count: 100,
    duration: 47.92,
    thumbnail_url: "/assets/formations/beating-heart.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "heart,love,romantic,pulsating,epic",
    formation_data: {
      type: "heart",
      animation: "pulsating",
      colors: ["red", "pink", "white"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "intermediate",
      rating: 5.0,
      weather_conditions: "light wind",
      altitude_range: "50-150ft"
    },
    source: "skystage",
    source_id: "beating-heart",
    sync_status: "synced",
    download_count: 0,
    rating: 5.0
  },
  {
    name: "Starry Night",
    description: "Van Gogh inspired swirling formation with 255 drones creating mesmerizing celestial patterns in the night sky.",
    category: "Epic",
    drone_count: 255,
    duration: 10.38,
    thumbnail_url: "/assets/formations/starry-night.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "van gogh,stars,swirling,celestial,epic,art",
    formation_data: {
      type: "artistic",
      animation: "swirling",
      colors: ["blue", "yellow", "white", "purple"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "expert",
      rating: 5.0,
      weather_conditions: "calm",
      altitude_range: "75-200ft"
    },
    source: "skystage",
    source_id: "starry-night",
    sync_status: "synced",
    download_count: 0,
    rating: 5.0
  },
  {
    name: "Spiral",
    description: "Mathematical precision meets artistic beauty in this 200-drone spiral formation with dynamic color transitions.",
    category: "Epic",
    drone_count: 200,
    duration: 45.0,
    thumbnail_url: "/assets/formations/spiral.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "spiral,mathematics,geometric,dynamic,epic",
    formation_data: {
      type: "geometric",
      animation: "spiral",
      colors: ["blue", "purple", "cyan", "white"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "advanced",
      rating: 4.8,
      weather_conditions: "light wind",
      altitude_range: "60-180ft"
    },
    source: "skystage",
    source_id: "spiral",
    sync_status: "synced",
    download_count: 0,
    rating: 4.8
  },
  {
    name: "Hot Air Balloon",
    description: "A majestic hot air balloon formation that inflates and deflates with 200 drones creating realistic movement.",
    category: "Epic",
    drone_count: 200,
    duration: 60.0,
    thumbnail_url: "/assets/formations/hot-air-balloon.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "balloon,flight,adventure,realistic,epic",
    formation_data: {
      type: "object",
      animation: "inflation",
      colors: ["red", "yellow", "blue", "green"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "advanced",
      rating: 4.7,
      weather_conditions: "calm to light wind",
      altitude_range: "75-200ft"
    },
    source: "skystage",
    source_id: "hot-air-balloon",
    sync_status: "synced",
    download_count: 0,
    rating: 4.7
  },
  {
    name: "Earth",
    description: "Our beautiful planet rotating in space with realistic continents and oceans rendered by 200 drones.",
    category: "Epic",
    drone_count: 200,
    duration: 50.0,
    thumbnail_url: "/assets/formations/earth.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "earth,planet,space,rotation,environment,epic",
    formation_data: {
      type: "celestial",
      animation: "rotation",
      colors: ["blue", "green", "brown", "white"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "expert",
      rating: 4.9,
      weather_conditions: "calm",
      altitude_range: "100-250ft"
    },
    source: "skystage",
    source_id: "earth",
    sync_status: "synced",
    download_count: 0,
    rating: 4.9
  },

  // Love Category
  {
    name: "Ring Coming Out of a Box",
    description: "The ultimate proposal formation - watch as an engagement ring emerges from an elegant box in the sky.",
    category: "Love",
    drone_count: 91,
    duration: 60.0,
    thumbnail_url: "/assets/formations/ring-from-box.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "proposal,engagement,ring,box,romantic,love",
    formation_data: {
      type: "proposal",
      animation: "emergence",
      colors: ["gold", "white", "diamond"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "intermediate",
      rating: 5.0,
      weather_conditions: "calm to light wind",
      altitude_range: "75-150ft",
      special_notes: "Perfect for marriage proposals"
    },
    source: "skystage",
    source_id: "ring-coming-out-of-box",
    sync_status: "synced",
    download_count: 0,
    rating: 5.0
  },
  {
    name: "Heart Tunnel",
    description: "A romantic tunnel of hearts that couples can walk through, created with 100 precisely positioned drones.",
    category: "Love",
    drone_count: 100,
    duration: 48.0,
    thumbnail_url: "/assets/formations/heart-tunnel.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "heart,tunnel,romantic,wedding,love,walkthrough",
    formation_data: {
      type: "tunnel",
      animation: "static_with_pulse",
      colors: ["red", "pink", "white"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "intermediate",
      rating: 4.9,
      weather_conditions: "calm",
      altitude_range: "30-100ft",
      special_notes: "Interactive - couples can walk through"
    },
    source: "skystage",
    source_id: "heart-tunnel",
    sync_status: "synced",
    download_count: 0,
    rating: 4.9
  },
  {
    name: "Two Hearts",
    description: "Two hearts that beat in perfect harmony, symbolizing unity and love between partners.",
    category: "Love",
    drone_count: 120,
    duration: 45.0,
    thumbnail_url: "/assets/formations/two-hearts.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "two hearts,unity,harmony,couples,love,synchronization",
    formation_data: {
      type: "dual_hearts",
      animation: "synchronized_beating",
      colors: ["red", "pink", "gold"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "intermediate",
      rating: 4.8,
      weather_conditions: "light wind",
      altitude_range: "50-150ft"
    },
    source: "skystage",
    source_id: "two-hearts",
    sync_status: "synced",
    download_count: 0,
    rating: 4.8
  },
  {
    name: "Unfolding Rose",
    description: "A beautiful rose that slowly unfolds its petals, revealing layers of beauty and elegance.",
    category: "Love",
    drone_count: 85,
    duration: 40.0,
    thumbnail_url: "/assets/formations/unfolding-rose.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "rose,flower,unfolding,elegant,romantic,love",
    formation_data: {
      type: "flower",
      animation: "unfolding",
      colors: ["red", "pink", "green"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "intermediate",
      rating: 4.6,
      weather_conditions: "calm to light wind",
      altitude_range: "40-120ft"
    },
    source: "skystage",
    source_id: "unfolding-rose",
    sync_status: "synced",
    download_count: 0,
    rating: 4.6
  },

  // Celestial Category
  {
    name: "Torus Loop",
    description: "A mesmerizing mathematical torus formation with 200 drones creating an infinite loop in space.",
    category: "Celestial",
    drone_count: 200,
    duration: 55.0,
    thumbnail_url: "/assets/formations/torus-loop.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "torus,loop,mathematics,infinite,celestial,space",
    formation_data: {
      type: "mathematical",
      animation: "continuous_rotation",
      colors: ["blue", "purple", "cyan", "white"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "expert",
      rating: 4.7,
      weather_conditions: "calm",
      altitude_range: "100-250ft"
    },
    source: "skystage",
    source_id: "torus-loop",
    sync_status: "synced",
    download_count: 0,
    rating: 4.7
  },

  // 4th of July Category
  {
    name: "Waving American Flag",
    description: "A patriotic American flag that waves majestically in the sky with 98 drones in red, white, and blue.",
    category: "4th of July",
    drone_count: 98,
    duration: 60.0,
    thumbnail_url: "/assets/formations/waving-american-flag.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "american flag,patriotic,july 4th,waving,usa,independence",
    formation_data: {
      type: "flag",
      animation: "waving",
      colors: ["red", "white", "blue"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "intermediate",
      rating: 4.8,
      weather_conditions: "light wind",
      altitude_range: "75-150ft",
      special_notes: "Perfect for Independence Day celebrations"
    },
    source: "skystage",
    source_id: "waving-american-flag",
    sync_status: "synced",
    download_count: 0,
    rating: 4.8
  },

  // Entertainment Category
  {
    name: "Sparkling Eiffel Tower",
    description: "The iconic Eiffel Tower with sparkling lights, recreated in the sky with precise drone positioning.",
    category: "Entertainment",
    drone_count: 150,
    duration: 45.0,
    thumbnail_url: "/assets/formations/sparkling-eiffel-tower.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "eiffel tower,paris,sparkling,iconic,architecture,entertainment",
    formation_data: {
      type: "architecture",
      animation: "sparkling",
      colors: ["gold", "white", "yellow"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "advanced",
      rating: 4.5,
      weather_conditions: "calm to light wind",
      altitude_range: "100-200ft"
    },
    source: "skystage",
    source_id: "sparkling-eiffel-tower",
    sync_status: "synced",
    download_count: 0,
    rating: 4.5
  },
  {
    name: "Flapping Dolphin",
    description: "A playful dolphin that jumps and flaps through the air, bringing joy and wonder to audiences.",
    category: "Entertainment",
    drone_count: 75,
    duration: 35.0,
    thumbnail_url: "/assets/formations/flapping-dolphin.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "dolphin,flapping,ocean,playful,entertainment,animals",
    formation_data: {
      type: "animal",
      animation: "flapping_jump",
      colors: ["blue", "cyan", "white"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "intermediate",
      rating: 4.3,
      weather_conditions: "light wind",
      altitude_range: "50-150ft"
    },
    source: "skystage",
    source_id: "flapping-dolphin",
    sync_status: "synced",
    download_count: 0,
    rating: 4.3
  },

  // Abstract Category
  {
    name: "Looping Circles",
    description: "Hypnotic circles that loop and interweave creating mesmerizing patterns in the night sky.",
    category: "Abstract",
    drone_count: 100,
    duration: 50.0,
    thumbnail_url: "/assets/formations/looping-circles.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "circles,looping,hypnotic,abstract,patterns,mesmerizing",
    formation_data: {
      type: "geometric",
      animation: "looping",
      colors: ["blue", "purple", "cyan", "white"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "intermediate",
      rating: 4.2,
      weather_conditions: "calm to light wind",
      altitude_range: "60-150ft"
    },
    source: "skystage",
    source_id: "looping-circles",
    sync_status: "synced",
    download_count: 0,
    rating: 4.2
  },
  {
    name: "Magic Carpet",
    description: "A floating magic carpet that glides through the air with ethereal movements and mystical colors.",
    category: "Abstract",
    drone_count: 80,
    duration: 42.0,
    thumbnail_url: "/assets/formations/magic-carpet.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "magic carpet,floating,mystical,ethereal,abstract,fantasy",
    formation_data: {
      type: "fantasy",
      animation: "floating_glide",
      colors: ["purple", "gold", "blue", "magenta"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "intermediate",
      rating: 4.1,
      weather_conditions: "light wind",
      altitude_range: "50-130ft"
    },
    source: "skystage",
    source_id: "magic-carpet",
    sync_status: "synced",
    download_count: 0,
    rating: 4.1
  },
  {
    name: "Yin Yang",
    description: "The ancient symbol of balance and harmony represented with flowing, complementary drone movements.",
    category: "Abstract",
    drone_count: 90,
    duration: 38.0,
    thumbnail_url: "/assets/formations/yin-yang.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "yin yang,balance,harmony,ancient,symbol,flow",
    formation_data: {
      type: "symbol",
      animation: "flowing_rotation",
      colors: ["black", "white", "gray"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "intermediate",
      rating: 4.4,
      weather_conditions: "calm",
      altitude_range: "60-140ft"
    },
    source: "skystage",
    source_id: "yin-yang",
    sync_status: "synced",
    download_count: 0,
    rating: 4.4
  },

  // Nature Category
  {
    name: "Dahlia",
    description: "A stunning dahlia flower that blooms in full glory with layers of petals in vibrant colors.",
    category: "Nature",
    drone_count: 95,
    duration: 43.0,
    thumbnail_url: "/assets/formations/dahlia.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "dahlia,flower,blooming,nature,petals,vibrant",
    formation_data: {
      type: "flower",
      animation: "blooming",
      colors: ["red", "orange", "yellow", "pink"]
    },
    metadata: {
      source: "skystage.com",
      difficulty: "intermediate",
      rating: 4.3,
      weather_conditions: "calm to light wind",
      altitude_range: "40-120ft"
    },
    source: "skystage",
    source_id: "dahlia",
    sync_status: "synced",
    download_count: 0,
    rating: 4.3
  }
];

// Additional formations for variety (smaller sets)
const ADDITIONAL_FORMATIONS = [
  {
    name: "Christmas Tree",
    description: "A festive Christmas tree with twinkling lights and a shining star on top.",
    category: "Christmas",
    drone_count: 120,
    duration: 60.0,
    thumbnail_url: "/assets/formations/christmas-tree.jpg",
    tags: "christmas,tree,festive,holiday,twinkling,star",
    rating: 4.8
  },
  {
    name: "Halloween Pumpkin",
    description: "A spooky jack-o'-lantern that glows and flickers in the darkness.",
    category: "Halloween",
    drone_count: 85,
    duration: 45.0,
    thumbnail_url: "/assets/formations/halloween-pumpkin.jpg",
    tags: "halloween,pumpkin,spooky,jack-o-lantern,flickering",
    rating: 4.2
  },
  {
    name: "Wedding Rings",
    description: "Interlocked wedding rings symbolizing eternal love and commitment.",
    category: "Wedding",
    drone_count: 110,
    duration: 50.0,
    thumbnail_url: "/assets/formations/wedding-rings.jpg",
    tags: "wedding,rings,marriage,eternal,commitment,love",
    rating: 4.7
  },
  {
    name: "Gift Box Opening",
    description: "A surprise gift box that opens to reveal sparkling contents inside.",
    category: "Gift",
    drone_count: 88,
    duration: 35.0,
    thumbnail_url: "/assets/formations/gift-box.jpg",
    tags: "gift,box,surprise,opening,sparkling,celebration",
    rating: 4.4
  }
];

// (...args: unknown[]) => unknown to download image thumbnails
async function downloadThumbnail(url: string, filename: string): Promise<string> {
  try {
    const formationsDir = path.join(process.cwd(), 'public/assets/formations');

    // Ensure the directory exists
    if (!fs.existsSync(formationsDir)) {
      fs.mkdirSync(formationsDir, { recursive: true });
    }

    const filePath = path.join(formationsDir, filename);

    // For now, we'll use the existing thumbnails or create placeholder
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  Thumbnail not found: ${filename} (will use placeholder)`);
      // Return the original URL as is - the thumbnails seem to already exist
      return url;
    }

    console.log(`  ✅ Thumbnail exists: ${filename}`);
    return url;

  } catch (error) {
    console.error(`  ❌ Error processing thumbnail ${filename}:`, error);
    return url; // Return original URL on error
  }
}

// Main import function
async function importSkyStageFormations() {
  console.log('🚀 Starting SkyStage Formation Import...\n');

  try {
    // Initialize database
    console.log('🔍 Initializing database...');
    await initializeAppDatabase();
    console.log('✅ Database initialized\n');

    // Create sync job
    const syncJob = await syncJobDb.create({
      job_type: 'formation_import',
      status: 'running',
      total_items: SKYSTAGE_FORMATIONS.length + ADDITIONAL_FORMATIONS.length,
      processed_items: 0,
      success_items: 0,
      failed_items: 0,
      error_log: [],
      metadata: {
        source: 'skystage.com',
        import_type: 'bulk_formation_library',
        categories: [...new Set(SKYSTAGE_FORMATIONS.map(f => f.category))]
      }
    });

    console.log(`📋 Created sync job: ${syncJob.id}\n`);

    // Process formations in batches
    const allFormations = [...SKYSTAGE_FORMATIONS, ...ADDITIONAL_FORMATIONS.map(f => ({
      ...f,
      file_url: null,
      price: null,
      created_by: "skystage",
      is_public: true,
      formation_data: {
        type: "imported",
        animation: "static",
        colors: ["multi"]
      },
      metadata: {
        source: "skystage.com",
        difficulty: "intermediate",
        rating: f.rating || 4.0,
        weather_conditions: "calm to light wind",
        altitude_range: "50-150ft"
      },
      source: "skystage",
      source_id: f.name.toLowerCase().replace(/\s+/g, '-'),
      sync_status: "synced",
      download_count: 0
    }))];

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    console.log(`📊 Processing ${allFormations.length} formations...\n`);

    for (let i = 0; i < allFormations.length; i++) {
      const formation = allFormations[i];

      try {
        console.log(`${i + 1}/${allFormations.length}. Processing: ${formation.name}`);

        // Check if formation already exists
        const existing = await formationDb.getAll({
          where: { source_id: formation.source_id }
        });

        if (existing.length > 0) {
          console.log(`  ⚠️  Formation already exists, skipping: ${formation.name}`);
          continue;
        }

        // Process thumbnail if it has one
        if (formation.thumbnail_url) {
          const filename = path.basename(formation.thumbnail_url);
          formation.thumbnail_url = await downloadThumbnail(formation.thumbnail_url, filename);
        }

        // Create formation in database
        const created = await formationDb.create({
          name: formation.name,
          description: formation.description,
          category: formation.category,
          drone_count: formation.drone_count,
          duration: formation.duration,
          thumbnail_url: formation.thumbnail_url,
          file_url: formation.file_url,
          price: formation.price,
          created_by: formation.created_by,
          is_public: formation.is_public,
          tags: formation.tags,
          formation_data: JSON.stringify(formation.formation_data),
          metadata: JSON.stringify(formation.metadata),
          source: formation.source,
          source_id: formation.source_id,
          sync_status: formation.sync_status,
          download_count: formation.download_count,
          rating: formation.rating
        });

        console.log(`  ✅ Created formation: ${created.name} (ID: ${created.id})`);
        successCount++;

        // Record analytics event
        await analyticsDb.recordEvent({
          event_type: 'formation_imported',
          entity_type: 'formation',
          entity_id: created.id,
          metadata: {
            source: 'skystage.com',
            category: formation.category,
            drone_count: formation.drone_count
          }
        });

      } catch ($1: unknown) {
        console.error(`  ❌ Error creating formation ${formation.name}:`, error.message);
        errorCount++;
        errors.push(`${formation.name}: ${error.message}`);
      }

      // Update sync job progress
      await syncJobDb.update(syncJob.id, {
        processed_items: i + 1,
        success_items: successCount,
        failed_items: errorCount,
        error_log: errors
      });
    }

    // Complete sync job
    await syncJobDb.update(syncJob.id, {
      status: errorCount === 0 ? 'completed' : 'completed_with_errors',
      completed_at: new Date().toISOString(),
      metadata: {
        ...syncJob.metadata,
        final_stats: {
          total: allFormations.length,
          success: successCount,
          errors: errorCount,
          categories_imported: [...new Set(allFormations.map(f => f.category))]
        }
      }
    });

    // Final report
    console.log('\n🎉 SkyStage Formation Import Complete!\n');
    console.log('📊 Import Statistics:');
    console.log(`   Total formations processed: ${allFormations.length}`);
    console.log(`   Successfully imported: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Success rate: ${((successCount / allFormations.length) * 100).toFixed(1)}%\n`);

    if (successCount > 0) {
      console.log('✅ Categories imported:');
      const categories = [...new Set(allFormations.map(f => f.category))];
      categories.forEach(cat => {
        const count = allFormations.filter(f => f.category === cat).length;
        console.log(`   • ${cat}: ${count} formations`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(error => console.log(`   • ${error}`));
    }

    console.log(`\n📋 Sync job ID: ${syncJob.id}`);
    console.log('🎯 Formation library successfully cloned from SkyStage!');

    // Record final analytics
    await analyticsDb.recordEvent({
      event_type: 'bulk_import_completed',
      entity_type: 'formation',
      metadata: {
        source: 'skystage.com',
        total_imported: successCount,
        categories: categories.length,
        sync_job_id: syncJob.id
      }
    });

  } catch ($1: unknown) {
    console.error('💥 Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the import
importSkyStageFormations();

export { importSkyStageFormations, SKYSTAGE_FORMATIONS, ADDITIONAL_FORMATIONS };

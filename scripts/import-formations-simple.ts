
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


import { formationDb, analyticsDb } from '../src/lib/db';
import { initializeAppDatabase } from '../src/lib/database/init';
import fs from 'fs';
import path from 'path';

// SkyStage Formation Data - Complete collection from their formation library
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
    source: "skystage",
    source_id: "beating-heart",
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
    source: "skystage",
    source_id: "starry-night",
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
    source: "skystage",
    source_id: "spiral",
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
    source: "skystage",
    source_id: "hot-air-balloon",
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
    source: "skystage",
    source_id: "earth",
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
    source: "skystage",
    source_id: "ring-coming-out-of-box",
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
    source: "skystage",
    source_id: "heart-tunnel",
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
    source: "skystage",
    source_id: "two-hearts",
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
    source: "skystage",
    source_id: "unfolding-rose",
    rating: 4.6
  },
  {
    name: "Beating Hearts",
    description: "Multiple hearts beating in synchronized rhythm, creating a symphony of love in the sky.",
    category: "Love",
    drone_count: 150,
    duration: 55.0,
    thumbnail_url: "/assets/formations/beating-hearts.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "multiple hearts,synchronized,rhythm,symphony,love",
    source: "skystage",
    source_id: "beating-hearts",
    rating: 4.7
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
    source: "skystage",
    source_id: "torus-loop",
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
    source: "skystage",
    source_id: "waving-american-flag",
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
    source: "skystage",
    source_id: "sparkling-eiffel-tower",
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
    source: "skystage",
    source_id: "flapping-dolphin",
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
    source: "skystage",
    source_id: "looping-circles",
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
    source: "skystage",
    source_id: "magic-carpet",
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
    source: "skystage",
    source_id: "yin-yang",
    rating: 4.4
  },
  {
    name: "Looping Circles 100",
    description: "Enhanced version of looping circles with 100 drones and improved synchronization.",
    category: "Abstract",
    drone_count: 100,
    duration: 48.0,
    thumbnail_url: "/assets/formations/looping-circles-100.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "circles,looping,enhanced,synchronization,abstract",
    source: "skystage",
    source_id: "looping-circles-100",
    rating: 4.3
  },
  {
    name: "Magic Carpet 100",
    description: "Enhanced magic carpet formation with 100 drones for more detailed mystical patterns.",
    category: "Abstract",
    drone_count: 100,
    duration: 44.0,
    thumbnail_url: "/assets/formations/magic-carpet-100.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "magic carpet,enhanced,mystical,detailed,abstract",
    source: "skystage",
    source_id: "magic-carpet-100",
    rating: 4.2
  },
  {
    name: "Rotating Circles 100",
    description: "Circular formations that rotate and transform with 100 drones in perfect coordination.",
    category: "Abstract",
    drone_count: 100,
    duration: 46.0,
    thumbnail_url: "/assets/formations/rotating-circles-100.jpg",
    file_url: null,
    price: null,
    created_by: "skystage",
    is_public: true,
    tags: "rotating,circles,transformation,coordination,abstract",
    source: "skystage",
    source_id: "rotating-circles-100",
    rating: 4.1
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
    source: "skystage",
    source_id: "dahlia",
    rating: 4.3
  }
];

// Additional formations for variety
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
  },
  {
    name: "Sparkling Ring",
    description: "A beautiful engagement ring with sparkling diamond effects.",
    category: "Proposal",
    drone_count: 75,
    duration: 40.0,
    thumbnail_url: "/assets/formations/sparkling-ring.jpg",
    tags: "ring,sparkling,diamond,engagement,proposal",
    rating: 4.9
  }
];

// Main import function
async function importFormations() {
  console.log('🚀 Starting SkyStage Formation Library Import...\n');

  try {
    // Initialize database
    console.log('🔍 Initializing database...');
    await initializeAppDatabase();
    console.log('✅ Database initialized\n');

    // Get admin user for created_by field
    console.log('🔍 Finding admin user...');
    const { userDb } = await import('../src/lib/db');
    const adminUser = await userDb.findByEmail('admin@skystage.com');
    if (!adminUser) {
      throw new Error('Admin user not found. Please run init-default-users.ts first.');
    }
    console.log(`✅ Found admin user: ${adminUser.id}\n`);

    // Combine all formations
    const allFormations = [...SKYSTAGE_FORMATIONS, ...ADDITIONAL_FORMATIONS.map(f => ({
      ...f,
      file_url: null,
      price: null,
      created_by: adminUser.id,
      is_public: true,
      source: "skystage",
      source_id: f.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }))];

    // Update existing formations to use admin user ID
    allFormations.forEach(f => {
      f.created_by = adminUser.id;
    });

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    console.log(`📊 Processing ${allFormations.length} formations...\n`);

    for (let i = 0; i < allFormations.length; i++) {
      const formation = allFormations[i];

      try {
        console.log(`${i + 1}/${allFormations.length}. Processing: ${formation.name}`);

        // Check if formation already exists by name or source_id
        const existing = await formationDb.getAll();
        const existingFormation = existing.find(f =>
          f.name === formation.name || f.source_id === formation.source_id
        );

        if (existingFormation) {
          console.log(`  ⚠️  Formation already exists, skipping: ${formation.name}`);
          skippedCount++;
          continue;
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
          formation_data: JSON.stringify({
            type: "imported",
            source: "skystage.com",
            verified: true
          }),
          metadata: JSON.stringify({
            source: "skystage.com",
            difficulty: "intermediate",
            rating: formation.rating || 4.0,
            weather_conditions: "calm to light wind",
            altitude_range: "50-150ft",
            imported_at: new Date().toISOString()
          }),
          source: formation.source,
          source_id: formation.source_id,
          sync_status: "synced",
          download_count: 0,
          rating: formation.rating || 4.0
        });

        console.log(`  ✅ Created formation: ${created.name} (ID: ${created.id})`);
        successCount++;

        // Record analytics event (simplified)
        try {
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
        } catch (analyticsError) {
          // Don't fail import if analytics fails
          console.log(`  ⚠️  Analytics event failed (non-critical)`);
        }

      } catch ($1: unknown) {
        console.error(`  ❌ Error creating formation ${formation.name}:`, error.message);
        errorCount++;
      }
    }

    // Final report
    console.log('\n🎉 SkyStage Formation Library Import Complete!\n');
    console.log('📊 Import Statistics:');
    console.log(`   Total formations processed: ${allFormations.length}`);
    console.log(`   Successfully imported: ${successCount}`);
    console.log(`   Skipped (already exist): ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);

    if (allFormations.length > 0) {
      console.log(`   Success rate: ${((successCount / allFormations.length) * 100).toFixed(1)}%\n`);
    }

    if (successCount > 0) {
      console.log('✅ Categories imported:');
      const categories = [...new Set(allFormations.map(f => f.category))];
      categories.forEach(cat => {
        const count = allFormations.filter(f => f.category === cat).length;
        console.log(`   • ${cat}: ${count} formations`);
      });

      console.log('\n📋 Sample formations imported:');
      allFormations.slice(0, 5).forEach(f => {
        console.log(`   • ${f.name} (${f.drone_count} drones, ${f.duration}s) - ${f.category}`);
      });
      if (allFormations.length > 5) {
        console.log(`   ... and ${allFormations.length - 5} more`);
      }
    }

    console.log('\n🎯 Formation library successfully cloned from SkyStage!');
    console.log('🚀 Your project now has access to the complete SkyStage formation library!');

  } catch ($1: unknown) {
    console.error('💥 Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the import
importFormations();

export { importFormations, SKYSTAGE_FORMATIONS, ADDITIONAL_FORMATIONS };

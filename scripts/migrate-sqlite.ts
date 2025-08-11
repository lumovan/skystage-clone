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


/**
 * SQLite Migration Script
 * Sets up the database schema for SQLite
 */

import { config } from 'dotenv';
import { databaseFactory } from '../src/lib/database/factory';
import { initialSchemaMigration } from '../src/lib/database/migrations/001_initial_schema';
import { DatabaseConfig } from '../src/lib/database/types';

// Load environment variables
config({ path: '.env.local' });

async function runSQLiteMigrations() {
  console.log('🚀 Starting SQLite migration...');

  try {
    // Configure SQLite connection
    const dbConfig: DatabaseConfig = {
      provider: 'sqlite',
      url: process.env.DATABASE_URL || './data/skystage.db',
    };

    console.log('📡 Connecting to SQLite...');
    const provider = await databaseFactory.initialize(dbConfig);

    console.log('✅ Connected to SQLite successfully');

    // Check if migration has already been run
    console.log('🔍 Checking existing schema...');

    let hasUsersTable = false;
    try {
      hasUsersTable = await provider.hasTable('users');
    } catch (error) {
      // Table checking might fail if database is new
      hasUsersTable = false;
    }

    if (hasUsersTable) {
      console.log('⚠️  Database schema already exists. Skipping migration.');
      console.log('💡 To force re-migration, delete the database file first.');
      process.exit(0);
    }

    // Run initial schema migration
    console.log('📋 Running initial schema migration...');
    await initialSchemaMigration.up(provider);

    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    const tables = [
      'users',
      'organizations',
      'formation_categories',
      'formation_tags',
      'formations',
      'shows',
      'bookings',
      'sync_jobs',
      'user_sessions',
      'analytics_events'
    ];

    for (const table of tables) {
      const exists = await provider.hasTable(table);
      if (exists) {
        console.log(`✅ Table '${table}' created successfully`);
      } else {
        console.log(`❌ Table '${table}' was not created`);
      }
    }

    // Insert default categories
    console.log('📝 Inserting default formation categories...');
    await insertDefaultCategories(provider);

    console.log('🎉 SQLite migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run db:init-users (to add default users)');
    console.log('2. Start the development server: npm run dev');

  } catch (error: unknown) {
    console.error('❌ Migration failed:', error);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check that the data directory exists and is writable');
    console.error('2. Ensure SQLite is properly installed');
    console.error('3. Verify the database path in DATABASE_URL');
    process.exit(1);
  } finally {
    await databaseFactory.closeAll();
  }
}

async function insertDefaultCategories(provider: any) {
  const defaultCategories = [
    {
      name: 'Abstract',
      slug: 'abstract',
      description: 'Abstract and artistic formations',
      icon: 'palette',
      color: '#8B5CF6',
      sort_order: 1,
      is_active: true
    },
    {
      name: 'Celebration',
      slug: 'celebration',
      description: 'Holiday and celebration themed formations',
      icon: 'party-popper',
      color: '#F59E0B',
      sort_order: 2,
      is_active: true
    },
    {
      name: 'Corporate',
      slug: 'corporate',
      description: 'Business and corporate event formations',
      icon: 'building',
      color: '#3B82F6',
      sort_order: 3,
      is_active: true
    },
    {
      name: 'Entertainment',
      slug: 'entertainment',
      description: 'Entertainment and show formations',
      icon: 'star',
      color: '#EF4444',
      sort_order: 4,
      is_active: true
    },
    {
      name: 'Nature',
      slug: 'nature',
      description: 'Nature and environmental themed formations',
      icon: 'tree',
      color: '#10B981',
      sort_order: 5,
      is_active: true
    },
    {
      name: 'Sports',
      slug: 'sports',
      description: 'Sports and athletic themed formations',
      icon: 'trophy',
      color: '#F97316',
      sort_order: 6,
      is_active: true
    },
    {
      name: 'Technology',
      slug: 'technology',
      description: 'Technology and futuristic formations',
      icon: 'cpu',
      color: '#6366F1',
      sort_order: 7,
      is_active: true
    },
    {
      name: 'Traditional',
      slug: 'traditional',
      description: 'Traditional and cultural formations',
      icon: 'landmark',
      color: '#8B5CF6',
      sort_order: 8,
      is_active: true
    }
  ];

  for (const category of defaultCategories) {
    try {
      await provider.create('formation_categories', category);
      console.log(`  ✅ Category '${category.name}' created`);
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed') || error.message.includes('duplicate')) {
        console.log(`  ⚠️  Category '${category.name}' already exists`);
      } else {
        console.error(`  ❌ Failed to create category '${category.name}':`, error.message);
      }
    }
  }
}

// Run migrations if script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runSQLiteMigrations();
}

export { runSQLiteMigrations };

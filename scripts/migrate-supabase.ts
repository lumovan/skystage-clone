
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


#!/usr/bin/env tsx

/**
 * Supabase Migration Script
 * Sets up the database schema and runs migrations
 */

import { config } from 'dotenv';
import { databaseFactory } from '../src/lib/database/factory';
import { initialSchemaMigration } from '../src/lib/database/migrations/001_initial_schema';
import { DatabaseConfig } from '../src/lib/database/types';

// Load environment variables
config({ path: '.env.local' });

async function runMigrations() {
  console.log('🚀 Starting Supabase migration...');

  try {
    // Validate environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Configure Supabase connection
    const dbConfig: DatabaseConfig = {
      provider: 'supabase',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      options: {
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        jwtSecret: process.env.SUPABASE_JWT_SECRET,
      }
    };

    console.log('📡 Connecting to Supabase...');
    const provider = await databaseFactory.initialize(dbConfig);

    console.log('✅ Connected to Supabase successfully');

    // Check if migration has already been run
    console.log('🔍 Checking existing schema...');

    const hasUsersTable = await provider.hasTable('users');
    if (hasUsersTable) {
      console.log('⚠️  Database schema already exists. Skipping migration.');
      console.log('💡 To force re-migration, drop existing tables first.');
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

    // Create RLS policies (if supported)
    console.log('🔒 Setting up Row Level Security policies...');
    await setupRLSPolicies(provider);

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run db:seed:supabase (to add sample data)');
    console.log('2. Update your .env.local with the Supabase credentials');
    console.log('3. Start the development server: npm run dev');

  } catch ($1: unknown) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check your Supabase credentials in .env.local');
    console.error('2. Ensure your Supabase project is active');
    console.error('3. Verify network connectivity');
    process.exit(1);
  } finally {
    await databaseFactory.closeAll();
  }
}

async function insertDefaultCategories($1: unknown) {
  const defaultCategories = [
    {
      name: 'Abstract',
      slug: 'abstract',
      description: 'Abstract and artistic formations',
      icon: 'palette',
      color: '#8B5CF6',
      sort_order: 1
    },
    {
      name: 'Celebration',
      slug: 'celebration',
      description: 'Holiday and celebration themed formations',
      icon: 'party-popper',
      color: '#F59E0B',
      sort_order: 2
    },
    {
      name: 'Corporate',
      slug: 'corporate',
      description: 'Business and corporate event formations',
      icon: 'building',
      color: '#3B82F6',
      sort_order: 3
    },
    {
      name: 'Entertainment',
      slug: 'entertainment',
      description: 'Entertainment and show formations',
      icon: 'star',
      color: '#EF4444',
      sort_order: 4
    },
    {
      name: 'Nature',
      slug: 'nature',
      description: 'Nature and environmental themed formations',
      icon: 'tree',
      color: '#10B981',
      sort_order: 5
    },
    {
      name: 'Sports',
      slug: 'sports',
      description: 'Sports and athletic themed formations',
      icon: 'trophy',
      color: '#F97316',
      sort_order: 6
    },
    {
      name: 'Technology',
      slug: 'technology',
      description: 'Technology and futuristic formations',
      icon: 'cpu',
      color: '#6366F1',
      sort_order: 7
    },
    {
      name: 'Traditional',
      slug: 'traditional',
      description: 'Traditional and cultural formations',
      icon: 'landmark',
      color: '#8B5CF6',
      sort_order: 8
    }
  ];

  for (const category of defaultCategories) {
    try {
      await provider.create('formation_categories', category);
      console.log(`  ✅ Category '${category.name}' created`);
    } catch ($1: unknown) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        console.log(`  ⚠️  Category '${category.name}' already exists`);
      } else {
        console.error(`  ❌ Failed to create category '${category.name}':`, error.message);
      }
    }
  }
}

async function setupRLSPolicies($1: unknown) {
  const policies = [
    // Users table policies
    `CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid()::text = id);`,
    `CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::text = id);`,

    // Organizations table policies
    `CREATE POLICY "Users can view organizations they belong to" ON organizations FOR SELECT USING (true);`,
    `CREATE POLICY "Organization owners can update their organization" ON organizations FOR UPDATE USING (auth.uid()::text = owner_id);`,

    // Formations table policies
    `CREATE POLICY "Public formations are viewable by everyone" ON formations FOR SELECT USING (is_public = true OR auth.uid()::text = created_by);`,
    `CREATE POLICY "Users can create formations" ON formations FOR INSERT WITH CHECK (auth.uid()::text = created_by);`,
    `CREATE POLICY "Users can update their own formations" ON formations FOR UPDATE USING (auth.uid()::text = created_by);`,
    `CREATE POLICY "Users can delete their own formations" ON formations FOR DELETE USING (auth.uid()::text = created_by);`,

    // Formation categories - read-only for all users
    `CREATE POLICY "Formation categories are viewable by everyone" ON formation_categories FOR SELECT USING (true);`,

    // Formation tags - read-only for all users
    `CREATE POLICY "Formation tags are viewable by everyone" ON formation_tags FOR SELECT USING (true);`,

    // Shows table policies
    `CREATE POLICY "Users can view shows they created or are assigned to" ON shows FOR SELECT USING (auth.uid()::text = created_by OR auth.uid()::text = client_id);`,
    `CREATE POLICY "Users can create shows" ON shows FOR INSERT WITH CHECK (auth.uid()::text = created_by);`,
    `CREATE POLICY "Users can update their own shows" ON shows FOR UPDATE USING (auth.uid()::text = created_by);`,

    // Bookings table policies
    `CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid()::text = user_id);`,
    `CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid()::text = user_id);`,
    `CREATE POLICY "Users can update their own bookings" ON bookings FOR UPDATE USING (auth.uid()::text = user_id);`,

    // Analytics events - insert only for authenticated users
    `CREATE POLICY "Authenticated users can insert analytics events" ON analytics_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);`,

    // User sessions - users can only see their own sessions
    `CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT USING (auth.uid()::text = user_id);`,

    // Sync jobs - users can view their own sync jobs
    `CREATE POLICY "Users can view their own sync jobs" ON sync_jobs FOR SELECT USING (auth.uid()::text = created_by);`,
  ];

  // Enable RLS on all tables
  const tables = [
    'users',
    'organizations',
    'formations',
    'formation_categories',
    'formation_tags',
    'shows',
    'bookings',
    'sync_jobs',
    'user_sessions',
    'analytics_events'
  ];

  try {
    for (const table of tables) {
      await provider.execute(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
      console.log(`  🔒 RLS enabled for table '${table}'`);
    }

    for (const policy of policies) {
      try {
        await provider.execute(policy);
        console.log('  ✅ RLS policy created');
      } catch ($1: unknown) {
        if (error.message.includes('already exists')) {
          console.log('  ⚠️  RLS policy already exists');
        } else {
          console.log('  ⚠️  Failed to create RLS policy (continuing...)');
        }
      }
    }
  } catch ($1: unknown) {
    console.log(`  ⚠️  RLS setup failed: ${error.message} (continuing...)`);
  }
}

// Run migrations if script is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };

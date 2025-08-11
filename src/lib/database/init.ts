
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
 * Database Initialization for Next.js Application
 * Handles database connection startup and configuration
 */

import { initializeDatabase, getDatabaseStats, checkDatabaseHealth } from './factory';
import { DatabaseConfig } from './types';

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize database connection for Next.js application
 */
export async function initializeAppDatabase(): Promise<void> {
  // Prevent multiple initialization attempts
  if (isInitialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = doInitialization();
  await initializationPromise;
}

async function doInitialization(): Promise<void> {
  try {
    console.log('[Database] Initializing application database...');

    // Get configuration from environment
    const config = getDatabaseConfigFromEnv();
    console.log(`[Database] Using provider: ${config.provider}`);

    // Initialize the database connection
    await initializeDatabase(config);

    // Verify connection
    const health = await checkDatabaseHealth();
    if (health.status !== 'healthy') {
      throw new Error(`Database health check failed: ${health.status}`);
    }

    // Log connection statistics
    const stats = getDatabaseStats();
    console.log('[Database] Connection established successfully');
    console.log(`[Database] Provider: ${stats.provider}, Connected: ${stats.connected}`);

    isInitialized = true;
  } catch (error: unknown) {
    console.error('[Database] Initialization failed:', error.message);

    // Reset state on failure
    isInitialized = false;
    initializationPromise = null;

    // In development, provide helpful error messages
    if (process.env.NODE_ENV === 'development') {
      console.error('\n🔧 Database Setup Help:');
      console.error('1. Check your .env.local file has the correct database credentials');
      console.error('2. For Supabase: Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
      console.error('3. For PostgreSQL: Ensure POSTGRES_HOST, POSTGRES_PASSWORD, etc. are set');
      console.error('4. For SQLite: Ensure the database file path is correct\n');
    }

    throw error;
  }
}

/**
 * Get database configuration from environment variables
 */
function getDatabaseConfigFromEnv(): DatabaseConfig {
  const provider = (process.env.DATABASE_PROVIDER || 'sqlite') as DatabaseConfig['provider'];

  const baseConfig: DatabaseConfig = {
    provider,
    poolConfig: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
      acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000'),
    }
  };

  switch (provider) {
    case 'supabase':
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for Supabase provider');
      }
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required for Supabase provider');
      }

      return {
        ...baseConfig,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        options: {
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          jwtSecret: process.env.SUPABASE_JWT_SECRET,
        }
      };

    case 'postgresql':
      // Check required PostgreSQL environment variables
      const requiredPostgresVars = ['POSTGRES_PASSWORD'];
      const missingVars = requiredPostgresVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        throw new Error(`Missing required PostgreSQL environment variables: ${missingVars.join(', ')}`);
      }

      return {
        ...baseConfig,
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'postgres',
        username: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD!,
        ssl: process.env.POSTGRES_SSL === 'true',
      };

    case 'sqlite':
      return {
        ...baseConfig,
        url: process.env.DATABASE_URL || './data/skystage.db',
      };

    default:
      throw new Error(`Unsupported database provider: ${provider}`);
  }
}

/**
 * Middleware to ensure database is initialized before handling requests
 */
export async function ensureDatabaseConnection(): Promise<void> {
  if (!isInitialized) {
    await initializeAppDatabase();
  }
}

/**
 * Health check endpoint helper
 */
export async function getDatabaseHealthStatus(): Promise<{
  status: string;
  provider: string;
  latency: number;
  connected: boolean;
  stats?: any;
}> {
  try {
    if (!isInitialized) {
      return {
        status: 'not_initialized',
        provider: 'none',
        latency: 0,
        connected: false
      };
    }

    const health = await checkDatabaseHealth();
    const stats = getDatabaseStats();

    return {
      ...health,
      connected: stats.connected,
      stats: {
        provider: stats.provider,
        availableProviders: stats.availableProviders
      }
    };
  } catch (error: unknown) {
    return {
      status: 'error',
      provider: 'unknown',
      latency: 0,
      connected: false,
      error: error.message
    };
  }
}

/**
 * Graceful shutdown helper
 */
export async function shutdownDatabase(): Promise<void> {
  if (isInitialized) {
    try {
      const { closeDatabaseConnections } = await import('./factory');
      await closeDatabaseConnections();
      console.log('[Database] Connections closed gracefully');
    } catch (error: unknown) {
      console.error('[Database] Error during shutdown:', error.message);
    } finally {
      isInitialized = false;
      initializationPromise = null;
    }
  }
}

/**
 * Reset initialization state (for testing)
 */
export function resetDatabaseState(): void {
  isInitialized = false;
  initializationPromise = null;
}

// Auto-initialize in Next.js server environment
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Initialize database when module is loaded (server-side only)
  initializeAppDatabase().catch(error => {
    console.error('[Database] Auto-initialization failed:', error.message);
    // Don't throw here as it would prevent the module from loading
  });

  // Handle graceful shutdown
  process.on('SIGTERM', shutdownDatabase);
  process.on('SIGINT', shutdownDatabase);
  process.on('beforeExit', shutdownDatabase);
}

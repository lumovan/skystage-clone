/**
 * Database Factory
 * Creates and manages database provider instances
 */

import { DatabaseProvider, DatabaseConfig } from './types';
import { SupabaseProvider } from './providers/supabase';
import { SQLiteProvider } from './providers/sqlite';
import { PostgreSQLProvider } from './providers/postgresql';

// Database provider instances
const providers = new Map<string, DatabaseProvider>();
let currentProvider: DatabaseProvider | null = null;

/**
 * Database Factory Class
 */
export class DatabaseFactory {
  private static instance: DatabaseFactory;
  private config: DatabaseConfig | null = null;

  private constructor() {}

  static getInstance(): DatabaseFactory {
    if (!DatabaseFactory.instance) {
      DatabaseFactory.instance = new DatabaseFactory();
    }
    return DatabaseFactory.instance;
  }

  /**
   * Initialize database connection
   */
  async initialize(config?: DatabaseConfig): Promise<DatabaseProvider> {
    const dbConfig = config || this.getConfigFromEnv();
    this.config = dbConfig;

    const provider = this.createProvider(dbConfig.provider);
    await provider.connect(dbConfig);

    // Store the provider instance
    providers.set(dbConfig.provider, provider);
    currentProvider = provider;

    console.log(`[DatabaseFactory] Connected to ${dbConfig.provider} database`);
    return provider;
  }

  /**
   * Get current database provider
   */
  getProvider(): DatabaseProvider {
    if (!currentProvider) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return currentProvider;
  }

  /**
   * Switch to a different database provider
   */
  async switchProvider(providerName: string, config?: DatabaseConfig): Promise<DatabaseProvider> {
    // Disconnect current provider
    if (currentProvider) {
      await currentProvider.disconnect();
    }

    // Get or create new provider
    let provider = providers.get(providerName);
    if (!provider) {
      const dbConfig = config || { ...this.config!, provider: providerName as any };
      provider = this.createProvider(providerName as any);
      await provider.connect(dbConfig);
      providers.set(providerName, provider);
    }

    currentProvider = provider;
    console.log(`[DatabaseFactory] Switched to ${providerName} database`);
    return provider;
  }

  /**
   * Get provider instance by name
   */
  getProviderByName(providerName: string): DatabaseProvider | null {
    return providers.get(providerName) || null;
  }

  /**
   * Close all database connections
   */
  async closeAll(): Promise<void> {
    const disconnectPromises = Array.from(providers.values()).map(provider =>
      provider.disconnect().catch(error =>
        console.error(`[DatabaseFactory] Error disconnecting provider:`, error)
      )
    );

    await Promise.all(disconnectPromises);
    providers.clear();
    currentProvider = null;
    console.log('[DatabaseFactory] All database connections closed');
  }

  /**
   * Create provider instance based on type
   */
  private createProvider(providerType: string): DatabaseProvider {
    switch (providerType) {
      case 'supabase':
        return new SupabaseProvider();
      case 'sqlite':
        return new SQLiteProvider();
      case 'postgresql':
        return new PostgreSQLProvider();
      default:
        throw new Error(`Unsupported database provider: ${providerType}`);
    }
  }

  /**
   * Get database configuration from environment variables
   */
  private getConfigFromEnv(): DatabaseConfig {
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
        return {
          ...baseConfig,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
          options: {
            anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            jwtSecret: process.env.SUPABASE_JWT_SECRET,
          }
        };

      case 'postgresql':
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
   * Health check for current provider
   */
  async healthCheck(): Promise<{ status: string; provider: string; latency: number }> {
    if (!currentProvider) {
      return { status: 'error', provider: 'none', latency: 0 };
    }

    const start = Date.now();
    try {
      const isHealthy = await currentProvider.ping();
      const latency = Date.now() - start;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        provider: this.config?.provider || 'unknown',
        latency
      };
    } catch (error) {
      const latency = Date.now() - start;
      return { status: 'error', provider: this.config?.provider || 'unknown', latency };
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    provider: string;
    connected: boolean;
    availableProviders: string[];
    config: Partial<DatabaseConfig>;
  } {
    return {
      provider: this.config?.provider || 'none',
      connected: currentProvider?.isConnected() || false,
      availableProviders: Array.from(providers.keys()),
      config: {
        provider: this.config?.provider,
        host: this.config?.host,
        database: this.config?.database,
        poolConfig: this.config?.poolConfig,
      }
    };
  }
}

// Singleton instance
export const databaseFactory = DatabaseFactory.getInstance();

/**
 * Convenience function to get the current database provider
 */
export function getDatabase(): DatabaseProvider {
  return databaseFactory.getProvider();
}

/**
 * Initialize database connection with configuration
 */
export async function initializeDatabase(config?: DatabaseConfig): Promise<DatabaseProvider> {
  return databaseFactory.initialize(config);
}

/**
 * Close all database connections
 */
export async function closeDatabaseConnections(): Promise<void> {
  return databaseFactory.closeAll();
}

/**
 * Switch database provider at runtime
 */
export async function switchDatabaseProvider(providerName: string, config?: DatabaseConfig): Promise<DatabaseProvider> {
  return databaseFactory.switchProvider(providerName, config);
}

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<{ status: string; provider: string; latency: number }> {
  return databaseFactory.healthCheck();
}

/**
 * Get database connection statistics
 */
export function getDatabaseStats(): {
  provider: string;
  connected: boolean;
  availableProviders: string[];
  config: Partial<DatabaseConfig>;
} {
  return databaseFactory.getStats();
}


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
 * Supabase Database Provider
 * Implementation for Supabase backend with real-time capabilities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseProvider, DatabaseConfig, QueryOptions, RealtimeEvent } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class SupabaseProvider implements DatabaseProvider {
  private client: SupabaseClient | null = null;
  private config: DatabaseConfig | null = null;
  private connected = false;
  private subscriptions = new Map<string, () => void>();

  async connect(config: DatabaseConfig): Promise<void> {
    try {
      if (!config.url || !config.options?.anonKey) {
        throw new Error('Supabase URL and anon key are required');
      }

      this.config = config;
      this.client = createClient(
        config.url,
        config.options.serviceRoleKey || config.options.anonKey,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: false,
          },
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        }
      );

      // Test connection
      const { data, error } = await this.client.from('users').select('count').limit(1);
      if (error && error.code !== '42P01') { // 42P01 = table doesn't exist (acceptable for initial setup)
        throw new Error(`Supabase connection failed: ${error.message}`);
      }

      this.connected = true;
      console.log('[SupabaseProvider] Connected successfully');
    } catch (error: unknown) {
      this.connected = false;
      throw new Error(`Failed to connect to Supabase: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      // Unsubscribe from all real-time subscriptions
      for (const [id, unsubscribe] of this.subscriptions) {
        try {
          unsubscribe();
        } catch (error) {
          console.warn(`[SupabaseProvider] Error unsubscribing from ${id}:`, error);
        }
      }
      this.subscriptions.clear();

      // Note: Supabase client doesn't have explicit disconnect method
      this.client = null;
      this.connected = false;
      console.log('[SupabaseProvider] Disconnected');
    }
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client.from('users').select('count').limit(1);
      return !error || error.code === '42P01'; // Table might not exist yet
    } catch {
      return false;
    }
  }

  async query<T = any>(sql: string, params?: unknown[]): Promise<T[]> {
    if (!this.client) throw new Error('Not connected to Supabase');

    try {
      const { data, error } = await this.client.rpc('execute_sql', {
        query: sql,
        parameters: params || []
      });

      if (error) throw new Error(`Query failed: ${error.message}`);
      return data || [];
    } catch (error: unknown) {
      console.error('[SupabaseProvider] Query error:', error);
      throw error;
    }
  }

  async queryFirst<T = any>(sql: string, params?: unknown[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  async execute(sql: string, params?: unknown[]): Promise<{ affectedRows: number; insertId?: any }> {
    if (!this.client) throw new Error('Not connected to Supabase');

    try {
      const { data, error } = await this.client.rpc('execute_sql', {
        query: sql,
        parameters: params || []
      });

      if (error) throw new Error(`Execute failed: ${error.message}`);

      return {
        affectedRows: data?.length || 0,
        insertId: data?.[0]?.id
      };
    } catch (error: unknown) {
      console.error('[SupabaseProvider] Execute error:', error);
      throw error;
    }
  }

  // CRUD Operations
  async findById<T>(table: string, id: string): Promise<T | null> {
    if (!this.client) throw new Error('Not connected to Supabase');

    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Find by ID failed: ${error.message}`);
    }

    return data as T;
  }

  async findAll<T>(table: string, options: QueryOptions = {}): Promise<T[]> {
    if (!this.client) throw new Error('Not connected to Supabase');

    let query = this.client.from(table).select(options.select?.join(',') || '*');

    // Apply where conditions
    if (options.where) {
      for (const [column, value] of Object.entries(options.where)) {
        query = query.eq(column, value);
      }
    }

    // Apply ordering
    if (options.orderBy?.length) {
      for (const order of options.orderBy) {
        query = query.order(order.column, { ascending: order.direction === 'ASC' });
      }
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 1000)) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Find all failed: ${error.message}`);
    }

    return data as T[];
  }

  async findBy<T>(table: string, criteria: Record<string, any>, options: QueryOptions = {}): Promise<T[]> {
    return this.findAll<T>(table, { ...options, where: { ...options.where, ...criteria } });
  }

  async findOne<T>(table: string, criteria: Record<string, any>): Promise<T | null> {
    const results = await this.findBy<T>(table, criteria, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async create<T>(table: string, data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    if (!this.client) throw new Error('Not connected to Supabase');

    const now = new Date().toISOString();
    const recordData = {
      id: uuidv4(),
      ...data,
      created_at: now,
      updated_at: now,
    };

    const { data: result, error } = await this.client
      .from(table)
      .insert(recordData)
      .select()
      .single();

    if (error) {
      throw new Error(`Create failed: ${error.message}`);
    }

    return result as T;
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    if (!this.client) throw new Error('Not connected to Supabase');

    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await this.client
      .from(table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }

    return result as T;
  }

  async delete(table: string, id: string): Promise<boolean> {
    if (!this.client) throw new Error('Not connected to Supabase');

    const { error } = await this.client
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return true;
  }

  async count(table: string, criteria: Record<string, any> = {}): Promise<number> {
    if (!this.client) throw new Error('Not connected to Supabase');

    let query = this.client.from(table).select('*', { count: 'exact', head: true });

    for (const [column, value] of Object.entries(criteria)) {
      query = query.eq(column, value);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Count failed: ${error.message}`);
    }

    return count || 0;
  }

  // Bulk Operations
  async bulkCreate<T>(table: string, data: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<T[]> {
    if (!this.client) throw new Error('Not connected to Supabase');

    const now = new Date().toISOString();
    const recordsData = data.map(item => ({
      id: uuidv4(),
      ...item,
      created_at: now,
      updated_at: now,
    }));

    const { data: results, error } = await this.client
      .from(table)
      .insert(recordsData)
      .select();

    if (error) {
      throw new Error(`Bulk create failed: ${error.message}`);
    }

    return results as T[];
  }

  async bulkUpdate<T>(table: string, updates: { id: string; data: Partial<T> }[]): Promise<T[]> {
    if (!this.client) throw new Error('Not connected to Supabase');

    const results: T[] = [];
    const now = new Date().toISOString();

    // Supabase doesn't support bulk updates directly, so we do them individually
    // For better performance, you might want to use a stored procedure
    for (const update of updates) {
      const updateData = {
        ...update.data,
        updated_at: now,
      };

      const { data: result, error } = await this.client
        .from(table)
        .update(updateData)
        .eq('id', update.id)
        .select()
        .single();

      if (error) {
        console.warn(`[SupabaseProvider] Failed to update record ${update.id}:`, error);
        continue;
      }

      results.push(result as T);
    }

    return results;
  }

  async bulkDelete(table: string, ids: string[]): Promise<number> {
    if (!this.client) throw new Error('Not connected to Supabase');

    const { error, count } = await this.client
      .from(table)
      .delete()
      .in('id', ids);

    if (error) {
      throw new Error(`Bulk delete failed: ${error.message}`);
    }

    return count || 0;
  }

  // Transaction Support
  async transaction<T>(callback: (provider: DatabaseProvider) => Promise<T>): Promise<T> {
    // Supabase doesn't support explicit transactions in the client
    // For complex operations, you would need to use stored procedures
    // For now, we'll execute the callback with the current provider
    console.warn('[SupabaseProvider] Transactions not fully supported, executing without transaction');
    return callback(this);
  }

  // Real-time Subscriptions
  async subscribe(table: string, callback: (event: RealtimeEvent) => void): Promise<() => void> {
    if (!this.client) throw new Error('Not connected to Supabase');

    const subscriptionId = uuidv4();

    const subscription = this.client
      .channel(`table_${table}_${subscriptionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          const event: RealtimeEvent = {
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table,
            record: payload.new || {},
            old_record: payload.old || undefined,
            schema: 'public',
            timestamp: new Date().toISOString(),
          };
          callback(event);
        }
      )
      .subscribe();

    const unsubscribe = () => {
      this.client?.removeChannel(subscription);
      this.subscriptions.delete(subscriptionId);
    };

    this.subscriptions.set(subscriptionId, unsubscribe);
    return unsubscribe;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    const unsubscribe = this.subscriptions.get(subscriptionId);
    if (unsubscribe) {
      unsubscribe();
    }
  }

  // Schema Operations
  async hasTable(tableName: string): Promise<boolean> {
    if (!this.client) throw new Error('Not connected to Supabase');

    try {
      const { error } = await this.client.from(tableName).select('*').limit(1);
      return !error || error.code !== '42P01'; // 42P01 = table doesn't exist
    } catch {
      return false;
    }
  }

  async createTable($1: unknown): Promise<void> {
    throw new Error('Table creation should be done via Supabase migrations or SQL editor');
  }

  async dropTable(tableName: string): Promise<void> {
    throw new Error('Table dropping should be done via Supabase migrations or SQL editor');
  }

  async addColumn($1: unknown): Promise<void> {
    throw new Error('Column addition should be done via Supabase migrations or SQL editor');
  }

  async dropColumn(tableName: string, columnName: string): Promise<void> {
    throw new Error('Column dropping should be done via Supabase migrations or SQL editor');
  }

  // Provider-specific methods
  getClient(): SupabaseClient | null {
    return this.client;
  }

  async runMigrations(migrationsPath: string): Promise<void> {
    console.log('[SupabaseProvider] Migrations should be run via Supabase CLI or dashboard');
    throw new Error('Use Supabase CLI or dashboard for migrations');
  }

  /**
   * Get Supabase-specific storage operations
   */
  getStorage() {
    if (!this.client) throw new Error('Not connected to Supabase');
    return this.client.storage;
  }

  /**
   * Get Supabase-specific auth operations
   */
  getAuth() {
    if (!this.client) throw new Error('Not connected to Supabase');
    return this.client.auth;
  }

  /**
   * Execute custom RPC function
   */
  async rpc(functionName: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.client) throw new Error('Not connected to Supabase');

    const { data, error } = await this.client.rpc(functionName, params);

    if (error) {
      throw new Error(`RPC call failed: ${error.message}`);
    }

    return data;
  }
}

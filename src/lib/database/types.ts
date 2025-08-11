/**
 * Database Abstraction Layer Types
 * Modular database system supporting multiple providers
 */

// Database Configuration
export interface DatabaseConfig {
  provider: 'sqlite' | 'supabase' | 'postgresql' | 'mysql';
  url?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  poolConfig?: {
    min?: number;
    max?: number;
    idleTimeoutMillis?: number;
    acquireTimeoutMillis?: number;
  };
  options?: Record<string, any>;
}

// Query Options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: { column: string; direction: 'ASC' | 'DESC' }[];
  select?: string[];
  include?: string[];
  where?: Record<string, any>;
}

// Real-time Event
export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, any>;
  old_record?: Record<string, any>;
  schema: string;
  timestamp: string;
}

// Database Provider Interface
export interface DatabaseProvider {
  // Connection Management
  connect(config: DatabaseConfig): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  ping(): Promise<boolean>;

  // Basic Query Operations
  query<T = any>(sql: string, params?: unknown[]): Promise<T[]>;
  queryFirst<T = any>(sql: string, params?: unknown[]): Promise<T | null>;
  execute(sql: string, params?: unknown[]): Promise<{ affectedRows: number; insertId?: any }>;

  // CRUD Operations
  findById<T>(table: string, id: string): Promise<T | null>;
  findAll<T>(table: string, options?: QueryOptions): Promise<T[]>;
  findBy<T>(table: string, criteria: Record<string, any>, options?: QueryOptions): Promise<T[]>;
  findOne<T>(table: string, criteria: Record<string, any>): Promise<T | null>;
  create<T>(table: string, data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<T>;
  delete(table: string, id: string): Promise<boolean>;
  count(table: string, criteria?: Record<string, any>): Promise<number>;

  // Bulk Operations
  bulkCreate<T>(table: string, data: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<T[]>;
  bulkUpdate<T>(table: string, updates: { id: string; data: Partial<T> }[]): Promise<T[]>;
  bulkDelete(table: string, ids: string[]): Promise<number>;

  // Transaction Support
  transaction<T>(callback: (provider: DatabaseProvider) => Promise<T>): Promise<T>;

  // Real-time (for supported providers)
  subscribe?(table: string, callback: (event: RealtimeEvent) => void): Promise<() => void>;
  unsubscribe?(subscriptionId: string): Promise<void>;

  // Schema Operations
  hasTable(tableName: string): Promise<boolean>;
  createTable(tableName: string, schema: TableSchema): Promise<void>;
  dropTable(tableName: string): Promise<void>;
  addColumn(tableName: string, column: ColumnDefinition): Promise<void>;
  dropColumn(tableName: string, columnName: string): Promise<void>;

  // Provider-specific
  getClient?(): any;
  runMigrations?(migrationsPath: string): Promise<void>;
}

// Schema Definitions
export interface TableSchema {
  columns: ColumnDefinition[];
  primaryKey?: string | string[];
  indexes?: IndexDefinition[];
  foreignKeys?: ForeignKeyDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: 'string' | 'text' | 'integer' | 'bigint' | 'decimal' | 'boolean' | 'datetime' | 'date' | 'json' | 'uuid';
  length?: number;
  nullable?: boolean;
  default?: any;
  unique?: boolean;
  autoIncrement?: boolean;
  references?: {
    table: string;
    column: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  };
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface ForeignKeyDefinition {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

// Application Entity Types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name?: string;
  user_type: 'customer' | 'operator' | 'artist' | 'admin';
  company_name?: string;
  phone?: string;
  location?: string;
  is_verified: boolean;
  is_active: boolean;
  last_login?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Formation {
  id: string;
  name: string;
  description?: string;
  category: string;
  thumbnail_url?: string;
  file_url?: string;
  drone_count: number;
  duration: number;
  price?: number;
  created_by: string;
  is_public: boolean;
  tags?: string;
  formation_data?: any;
  metadata?: Record<string, any>;
  source?: 'skystage' | 'upload' | 'manual';
  source_id?: string;
  sync_status?: 'pending' | 'synced' | 'error';
  last_synced?: string;
  download_count?: number;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  owner_id: string;
  subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'inactive' | 'trial' | 'expired';
  member_count?: number;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Show {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  event_date: string;
  duration: number;
  location_name?: string;
  location_address?: string;
  location_coordinates?: { lat: number; lng: number };
  client_id?: string;
  organization_id?: string;
  total_drones: number;
  estimated_cost?: number;
  actual_cost?: number;
  formations?: unknown[];
  crew?: unknown[];
  equipment?: unknown[];
  safety_clearance: boolean;
  weather_requirements?: string;
  special_requirements?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  organization_id?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  event_name?: string;
  event_date?: string;
  location?: string;
  budget_range?: string;
  message?: string;
  status: 'pending' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';
  quoted_price?: number;
  requirements?: any;
  created_at: string;
  updated_at: string;
}

export interface SyncJob {
  id: string;
  type: 'skystage_formations' | 'user_import' | 'organization_import' | 'data_migration';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  error_details?: unknown[];
  metadata?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FormationCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  formation_count?: number;
  is_active: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

export interface FormationTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  usage_count?: number;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  last_activity?: string;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id?: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Repository Pattern Interface
export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  findBy(criteria: Partial<T>, options?: QueryOptions): Promise<T[]>;
  findOne(criteria: Partial<T>): Promise<T | null>;
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  count(criteria?: Partial<T>): Promise<number>;
  exists(criteria: Partial<T>): Promise<boolean>;
  bulkCreate(data: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<T[]>;
  bulkUpdate(updates: { id: string; data: Partial<T> }[]): Promise<T[]>;
  bulkDelete(ids: string[]): Promise<number>;
}

// Migration Interface
export interface Migration {
  version: string;
  name: string;
  up(provider: DatabaseProvider): Promise<void>;
  down(provider: DatabaseProvider): Promise<void>;
}

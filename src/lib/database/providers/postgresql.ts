
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
 * PostgreSQL Database Provider
 * Implementation for PostgreSQL backend with connection pooling
 */

import { Pool, PoolClient } from 'pg';
import { DatabaseProvider, DatabaseConfig, QueryOptions, TableSchema, ColumnDefinition } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class PostgreSQLProvider implements DatabaseProvider {
  private pool: Pool | null = null;
  private config: DatabaseConfig | null = null;
  private connected = false;

  async connect(config: DatabaseConfig): Promise<void> {
    try {
      this.config = config;

      const poolConfig: unknown = {
        host: config.host || 'localhost',
        port: config.port || 5432,
        database: config.database || 'postgres',
        user: config.username || 'postgres',
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        min: config.poolConfig?.min || 2,
        max: config.poolConfig?.max || 10,
        idleTimeoutMillis: config.poolConfig?.idleTimeoutMillis || 30000,
        acquireTimeoutMillis: config.poolConfig?.acquireTimeoutMillis || 60000,
      };

      // If URL is provided, use it instead of individual connection params
      if (config.url) {
        poolConfig.connectionString = config.url;
      }

      this.pool = new Pool(poolConfig);

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      this.connected = true;
      console.log('[PostgreSQLProvider] Connected successfully');

      // Handle graceful shutdown
      process.on('exit', () => this.disconnect());
      process.on('SIGINT', () => this.disconnect());
      process.on('SIGTERM', () => this.disconnect());
    } catch (error: unknown) {
      this.connected = false;
      throw new Error(`Failed to connect to PostgreSQL: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
        this.pool = null;
        this.connected = false;
        console.log('[PostgreSQLProvider] Disconnected');
      } catch (error) {
        console.warn('[PostgreSQLProvider] Error during disconnect:', error);
      }
    }
  }

  isConnected(): boolean {
    return this.connected && this.pool !== null;
  }

  async ping(): Promise<boolean> {
    if (!this.pool) return false;

    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch {
      return false;
    }
  }

  async query<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (!this.pool) throw new Error('Not connected to PostgreSQL');

    try {
      const client = await this.pool.connect();
      const result = await client.query(sql, params);
      client.release();
      return result.rows as T[];
    } catch (error: unknown) {
      console.error('[PostgreSQLProvider] Query error:', error);
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  async queryFirst<T = any>(sql: string, params: unknown[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ affectedRows: number; insertId?: any }> {
    if (!this.pool) throw new Error('Not connected to PostgreSQL');

    try {
      const client = await this.pool.connect();
      const result = await client.query(sql, params);
      client.release();

      return {
        affectedRows: result.rowCount || 0,
        insertId: result.rows[0]?.id
      };
    } catch (error: unknown) {
      console.error('[PostgreSQLProvider] Execute error:', error);
      throw new Error(`Execute failed: ${error.message}`);
    }
  }

  // CRUD Operations
  async findById<T>(table: string, id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${table} WHERE id = $1`;
    return this.queryFirst<T>(sql, [id]);
  }

  async findAll<T>(table: string, options: QueryOptions = {}): Promise<T[]> {
    let sql = `SELECT ${options.select?.join(',') || '*'} FROM ${table}`;
    const params: unknown[] = [];
    let paramIndex = 1;

    // Apply where conditions
    if (options.where && Object.keys(options.where).length > 0) {
      const whereConditions = Object.entries(options.where).map(([key, value]) => {
        params.push(value);
        return `${key} = $${paramIndex++}`;
      });
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Apply ordering
    if (options.orderBy?.length) {
      const orderClauses = options.orderBy.map(order => `${order.column} ${order.direction}`);
      sql += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    // Apply pagination
    if (options.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }
    if (options.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    return this.query<T>(sql, params);
  }

  async findBy<T>(table: string, criteria: Record<string, any>, options: QueryOptions = {}): Promise<T[]> {
    return this.findAll<T>(table, { ...options, where: { ...options.where, ...criteria } });
  }

  async findOne<T>(table: string, criteria: Record<string, any>): Promise<T | null> {
    const results = await this.findBy<T>(table, criteria, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async create<T>(table: string, data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const now = new Date().toISOString();
    const recordData = {
      id: uuidv4(),
      ...data,
      created_at: now,
      updated_at: now,
    };

    const columns = Object.keys(recordData);
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    const values = Object.values(recordData);

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.query<T>(sql, values);

    if (result.length === 0) {
      throw new Error('Failed to create record');
    }

    return result[0];
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const setClause = Object.keys(updateData).map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = [...Object.values(updateData), id];

    const sql = `UPDATE ${table} SET ${setClause} WHERE id = $${values.length} RETURNING *`;
    const result = await this.query<T>(sql, values);

    if (result.length === 0) {
      throw new Error(`No record found with id: ${id}`);
    }

    return result[0];
  }

  async delete(table: string, id: string): Promise<boolean> {
    const sql = `DELETE FROM ${table} WHERE id = $1`;
    const result = await this.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  async count(table: string, criteria: Record<string, any> = {}): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${table}`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (Object.keys(criteria).length > 0) {
      const whereConditions = Object.entries(criteria).map(([key, value]) => {
        params.push(value);
        return `${key} = $${paramIndex++}`;
      });
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    const result = await this.queryFirst<{ count: string }>(sql, params);
    return parseInt(result?.count || '0');
  }

  // Bulk Operations
  async bulkCreate<T>(table: string, data: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<T[]> {
    if (!this.pool) throw new Error('Not connected to PostgreSQL');

    const now = new Date().toISOString();
    const recordsData = data.map(item => ({
      id: uuidv4(),
      ...item,
      created_at: now,
      updated_at: now,
    }));

    if (recordsData.length === 0) return [];

    const columns = Object.keys(recordsData[0]);
    const valuesClause = recordsData.map((_, recordIndex) => {
      const placeholders = columns.map((_, colIndex) => `$${recordIndex * columns.length + colIndex + 1}`);
      return `(${placeholders.join(', ')})`;
    }).join(', ');

    const values = recordsData.flatMap(record => Object.values(record));
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${valuesClause} RETURNING *`;

    return this.query<T>(sql, values);
  }

  async bulkUpdate<T>(table: string, updates: { id: string; data: Partial<T> }[]): Promise<T[]> {
    if (!this.pool) throw new Error('Not connected to PostgreSQL');

    const results: T[] = [];
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      for (const update of updates) {
        const updateData = {
          ...update.data,
          updated_at: new Date().toISOString(),
        };

        const setClause = Object.keys(updateData).map((key, index) => `${key} = $${index + 1}`).join(', ');
        const values = [...Object.values(updateData), update.id];

        const sql = `UPDATE ${table} SET ${setClause} WHERE id = $${values.length} RETURNING *`;
        const result = await client.query(sql, values);

        if (result.rows.length > 0) {
          results.push(result.rows[0] as T);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return results;
  }

  async bulkDelete(table: string, ids: string[]): Promise<number> {
    if (!this.pool) throw new Error('Not connected to PostgreSQL');

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
    const sql = `DELETE FROM ${table} WHERE id IN (${placeholders})`;

    const result = await this.execute(sql, ids);
    return result.affectedRows;
  }

  // Transaction Support
  async transaction<T>(callback: (provider: DatabaseProvider) => Promise<T>): Promise<T> {
    if (!this.pool) throw new Error('Not connected to PostgreSQL');

    const client = await this.pool.connect();
    const transactionProvider = new PostgreSQLTransactionProvider(client);

    try {
      await client.query('BEGIN');
      const result = await callback(transactionProvider);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Schema Operations
  async hasTable(tableName: string): Promise<boolean> {
    const sql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    `;
    const result = await this.queryFirst(sql, [tableName]);
    return !!result;
  }

  async createTable(tableName: string, schema: TableSchema): Promise<void> {
    const sql = this.buildCreateTableSQL(tableName, schema);
    await this.execute(sql);

    // Create indexes
    if (schema.indexes) {
      for (const index of schema.indexes) {
        const indexSQL = this.buildCreateIndexSQL(tableName, index);
        await this.execute(indexSQL);
      }
    }
  }

  async dropTable(tableName: string): Promise<void> {
    await this.execute(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
  }

  async addColumn(tableName: string, column: ColumnDefinition): Promise<void> {
    const columnSQL = this.buildColumnDefinition(column);
    await this.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnSQL}`);
  }

  async dropColumn(tableName: string, columnName: string): Promise<void> {
    await this.execute(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);
  }

  // Provider-specific methods
  getClient(): Pool | null {
    return this.pool;
  }

  async runMigrations(migrationsPath: string): Promise<void> {
    console.log('[PostgreSQLProvider] Running migrations from', migrationsPath);
    // Implementation for running PostgreSQL migrations
  }

  // SQL Building Helpers
  private buildCreateTableSQL(tableName: string, schema: TableSchema): string {
    const columns = schema.columns.map(col => this.buildColumnDefinition(col)).join(', ');

    let sql = `CREATE TABLE ${tableName} (${columns}`;

    if (schema.primaryKey) {
      const pk = Array.isArray(schema.primaryKey) ? schema.primaryKey.join(', ') : schema.primaryKey;
      sql += `, PRIMARY KEY (${pk})`;
    }

    if (schema.foreignKeys) {
      for (const fk of schema.foreignKeys) {
        sql += `, CONSTRAINT ${fk.name} FOREIGN KEY (${fk.columns.join(', ')}) `;
        sql += `REFERENCES ${fk.referencedTable} (${fk.referencedColumns.join(', ')})`;
        if (fk.onDelete) sql += ` ON DELETE ${fk.onDelete}`;
        if (fk.onUpdate) sql += ` ON UPDATE ${fk.onUpdate}`;
      }
    }

    sql += ')';
    return sql;
  }

  private buildColumnDefinition(column: ColumnDefinition): string {
    let sql = `${column.name} `;

    // Map types to PostgreSQL types
    switch (column.type) {
      case 'string':
        sql += `VARCHAR(${column.length || 255})`;
        break;
      case 'text':
        sql += 'TEXT';
        break;
      case 'integer':
        sql += 'INTEGER';
        break;
      case 'bigint':
        sql += 'BIGINT';
        break;
      case 'decimal':
        sql += `DECIMAL(${column.length || 10}, 2)`;
        break;
      case 'boolean':
        sql += 'BOOLEAN';
        break;
      case 'datetime':
        sql += 'TIMESTAMP WITH TIME ZONE';
        break;
      case 'date':
        sql += 'DATE';
        break;
      case 'json':
        sql += 'JSONB';
        break;
      case 'uuid':
        sql += 'UUID';
        break;
      default:
        sql += 'TEXT';
    }

    if (column.autoIncrement) {
      if (column.type === 'integer') {
        sql = `${column.name} SERIAL`;
      } else if (column.type === 'bigint') {
        sql = `${column.name} BIGSERIAL`;
      }
    }

    if (!column.nullable) {
      sql += ' NOT NULL';
    }

    if (column.default !== undefined) {
      if (typeof column.default === 'string') {
        sql += ` DEFAULT '${column.default}'`;
      } else {
        sql += ` DEFAULT ${column.default}`;
      }
    }

    if (column.unique) {
      sql += ' UNIQUE';
    }

    return sql;
  }

  private buildCreateIndexSQL($1: unknown): string {
    const unique = index.unique ? 'UNIQUE ' : '';
    const columns = index.columns.join(', ');
    const type = index.type ? ` USING ${index.type}` : '';
    return `CREATE ${unique}INDEX ${index.name} ON ${tableName}${type} (${columns})`;
  }
}

/**
 * Transaction Provider for PostgreSQL
 */
class PostgreSQLTransactionProvider implements DatabaseProvider {
  constructor(private client: PoolClient) {}

  async connect(): Promise<void> {
    throw new Error('Transaction provider is already connected');
  }

  async disconnect(): Promise<void> {
    // Don't disconnect the client in transaction
  }

  isConnected(): boolean {
    return true;
  }

  async ping(): Promise<boolean> {
    return true;
  }

  async query<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.client.query(sql, params);
    return result.rows as T[];
  }

  async queryFirst<T = any>(sql: string, params: unknown[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ affectedRows: number; insertId?: any }> {
    const result = await this.client.query(sql, params);
    return {
      affectedRows: result.rowCount || 0,
      insertId: result.rows[0]?.id
    };
  }

  // Implement other methods by delegating to the main provider logic
  async findById<T>(table: string, id: string): Promise<T | null> {
    return this.queryFirst(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  }

  // Add other CRUD methods as needed...
  async findAll<T>(): Promise<T[]> { throw new Error('Not implemented in transaction provider'); }
  async findBy<T>(): Promise<T[]> { throw new Error('Not implemented in transaction provider'); }
  async findOne<T>(): Promise<T | null> { throw new Error('Not implemented in transaction provider'); }
  async create<T>(): Promise<T> { throw new Error('Not implemented in transaction provider'); }
  async update<T>(): Promise<T> { throw new Error('Not implemented in transaction provider'); }
  async delete(): Promise<boolean> { throw new Error('Not implemented in transaction provider'); }
  async count(): Promise<number> { throw new Error('Not implemented in transaction provider'); }
  async bulkCreate<T>(): Promise<T[]> { throw new Error('Not implemented in transaction provider'); }
  async bulkUpdate<T>(): Promise<T[]> { throw new Error('Not implemented in transaction provider'); }
  async bulkDelete(): Promise<number> { throw new Error('Not implemented in transaction provider'); }
  async transaction<T>(): Promise<T> { throw new Error('Nested transactions not supported'); }
  async hasTable(): Promise<boolean> { throw new Error('Not implemented in transaction provider'); }
  async createTable(): Promise<void> { throw new Error('Not implemented in transaction provider'); }
  async dropTable(): Promise<void> { throw new Error('Not implemented in transaction provider'); }
  async addColumn(): Promise<void> { throw new Error('Not implemented in transaction provider'); }
  async dropColumn(): Promise<void> { throw new Error('Not implemented in transaction provider'); }
}

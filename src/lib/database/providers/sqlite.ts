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
 * SQLite Database Provider
 * Implementation for SQLite backend (legacy compatibility)
 */

import Database from 'better-sqlite3';
import { DatabaseProvider, DatabaseConfig, QueryOptions, TableSchema, ColumnDefinition } from '../types';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { promises as fs } from 'fs';

export class SQLiteProvider implements DatabaseProvider {
  private db: Database.Database | null = null;
  private config: DatabaseConfig | null = null;
  private connected = false;

  async connect(config: DatabaseConfig): Promise<void> {
    try {
      if (!config.url) {
        throw new Error('SQLite database path is required');
      }

      this.config = config;

      // Ensure directory exists
      const dbPath = path.resolve(config.url);
      const dbDir = path.dirname(dbPath);
      await fs.mkdir(dbDir, { recursive: true });

      this.db = new Database(dbPath);
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('journal_mode = WAL');

      // Test connection
      this.db.prepare('SELECT 1').get();

      this.connected = true;
      console.log('[SQLiteProvider] Connected successfully to', dbPath);

      // Handle graceful shutdown
      process.on('exit', () => this.disconnect());
      process.on('SIGINT', () => this.disconnect());
      process.on('SIGTERM', () => this.disconnect());
    } catch (error: unknown) {
      this.connected = false;
      throw new Error(`Failed to connect to SQLite: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
        this.connected = false;
        console.log('[SQLiteProvider] Disconnected');
      } catch (error) {
        console.warn('[SQLiteProvider] Error during disconnect:', error);
      }
    }
  }

  isConnected(): boolean {
    return this.connected && this.db !== null;
  }

  async ping(): Promise<boolean> {
    if (!this.db) return false;

    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }

  async query<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (!this.db) throw new Error('Not connected to SQLite');

    try {
      const stmt = this.db.prepare(sql);
      const results = stmt.all(params);
      return results as T[];
    } catch (error: unknown) {
      console.error('[SQLiteProvider] Query error:', error);
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  async queryFirst<T = any>(sql: string, params: unknown[] = []): Promise<T | null> {
    if (!this.db) throw new Error('Not connected to SQLite');

    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.get(params);
      return (result as T) || null;
    } catch (error: unknown) {
      console.error('[SQLiteProvider] QueryFirst error:', error);
      throw new Error(`QueryFirst failed: ${error.message}`);
    }
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ affectedRows: number; insertId?: any }> {
    if (!this.db) throw new Error('Not connected to SQLite');

    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(params);

      return {
        affectedRows: result.changes,
        insertId: result.lastInsertRowid
      };
    } catch (error: unknown) {
      console.error('[SQLiteProvider] Execute error:', error);
      throw new Error(`Execute failed: ${error.message}`);
    }
  }

  // CRUD Operations
  async findById<T>(table: string, id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${table} WHERE id = ?`;
    return this.queryFirst<T>(sql, [id]);
  }

  async findAll<T>(table: string, options: QueryOptions = {}): Promise<T[]> {
    let sql = `SELECT ${options.select?.join(',') || '*'} FROM ${table}`;
    const params: unknown[] = [];

    // Apply where conditions
    if (options.where && Object.keys(options.where).length > 0) {
      const whereConditions = Object.entries(options.where).map(([key, value]) => {
        // Convert boolean to integer for SQLite
        const sqlValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;
        params.push(sqlValue);
        return `${key} = ?`;
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
      sql += ` LIMIT ${options.limit}`;
    }
    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
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
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(recordData).map(value => {
      // Convert boolean values to integers for SQLite
      if (typeof value === 'boolean') {
        return value ? 1 : 0;
      }
      // Convert objects/arrays to JSON strings for SQLite
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value;
    });

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    await this.execute(sql, values);

    // Return the created record
    return this.findById<T>(table, recordData.id);
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData).map(value => {
      // Convert boolean values to integers for SQLite
      if (typeof value === 'boolean') {
        return value ? 1 : 0;
      }
      // Convert objects/arrays to JSON strings for SQLite
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value;
    }), id];

    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    const result = await this.execute(sql, values);

    if (result.affectedRows === 0) {
      throw new Error(`No record found with id: ${id}`);
    }

    // Return the updated record
    return this.findById<T>(table, id);
  }

  async delete(table: string, id: string): Promise<boolean> {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    const result = await this.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  async count(table: string, criteria: Record<string, any> = {}): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${table}`;
    const params: unknown[] = [];

    if (Object.keys(criteria).length > 0) {
      const whereConditions = Object.entries(criteria).map(([key, value]) => {
        params.push(value);
        return `${key} = ?`;
      });
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    const result = await this.queryFirst<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  // Bulk Operations
  async bulkCreate<T>(table: string, data: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<T[]> {
    if (!this.db) throw new Error('Not connected to SQLite');

    const now = new Date().toISOString();
    const recordsData = data.map(item => ({
      id: uuidv4(),
      ...item,
      created_at: now,
      updated_at: now,
    }));

    const columns = Object.keys(recordsData[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    const stmt = this.db.prepare(sql);
    const transaction = this.db.transaction((records: unknown[]) => {
      for (const record of records) {
        const values = Object.values(record).map(value => {
          // Convert boolean values to integers for SQLite
          if (typeof value === 'boolean') {
            return value ? 1 : 0;
          }
          // Convert objects/arrays to JSON strings for SQLite
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          return value;
        });
        stmt.run(values);
      }
    });

    transaction(recordsData);

    // Return the created records
    const ids = recordsData.map(record => record.id);
    return this.findBy<T>(table, {}, { where: { id: ids } });
  }

  async bulkUpdate<T>(table: string, updates: { id: string; data: Partial<T> }[]): Promise<T[]> {
    if (!this.db) throw new Error('Not connected to SQLite');

    const now = new Date().toISOString();
    const results: T[] = [];

    const transaction = this.db.transaction(() => {
      for (const update of updates) {
        const updateData = {
          ...update.data,
          updated_at: now,
        };

        const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updateData).map(value => {
          // Convert boolean values to integers for SQLite
          if (typeof value === 'boolean') {
            return value ? 1 : 0;
          }
          // Convert objects/arrays to JSON strings for SQLite
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          return value;
        }), update.id];

        const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
        const stmt = this.db!.prepare(sql);
        const result = stmt.run(values);

        if (result.changes > 0) {
          const updated = this.db!.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(update.id);
          if (updated) results.push(updated as T);
        }
      }
    });

    transaction();
    return results;
  }

  async bulkDelete(table: string, ids: string[]): Promise<number> {
    if (!this.db) throw new Error('Not connected to SQLite');

    const placeholders = ids.map(() => '?').join(', ');
    const sql = `DELETE FROM ${table} WHERE id IN (${placeholders})`;

    const result = await this.execute(sql, ids);
    return result.affectedRows;
  }

  // Transaction Support
  async transaction<T>(callback: (provider: DatabaseProvider) => Promise<T>): Promise<T> {
    if (!this.db) throw new Error('Not connected to SQLite');

    const transaction = this.db.transaction(async () => {
      return await callback(this);
    });

    return transaction();
  }

  // Schema Operations
  async hasTable(tableName: string): Promise<boolean> {
    const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`;
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
    await this.execute(`DROP TABLE IF EXISTS ${tableName}`);
  }

  async addColumn(tableName: string, column: ColumnDefinition): Promise<void> {
    const columnSQL = this.buildColumnDefinition(column);
    await this.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnSQL}`);
  }

  async dropColumn(tableName: string, columnName: string): Promise<void> {
    // SQLite doesn't support DROP COLUMN directly, need to recreate table
    throw new Error('SQLite does not support dropping columns directly. Table recreation required.');
  }

  // Provider-specific methods
  getClient(): Database.Database | null {
    return this.db;
  }

  async runMigrations(migrationsPath: string): Promise<void> {
    // Implementation for running SQLite migrations
    console.log('[SQLiteProvider] Running migrations from', migrationsPath);
    // This would load and execute migration files
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

    // Map types to SQLite types
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
        sql += 'INTEGER';
        break;
      case 'decimal':
        sql += 'REAL';
        break;
      case 'boolean':
        sql += 'INTEGER'; // SQLite uses INTEGER for boolean
        break;
      case 'datetime':
        sql += 'TEXT'; // SQLite stores datetime as TEXT
        break;
      case 'date':
        sql += 'TEXT';
        break;
      case 'json':
        sql += 'TEXT';
        break;
      case 'uuid':
        sql += 'TEXT';
        break;
      default:
        sql += 'TEXT';
    }

    if (column.autoIncrement) {
      sql += ' AUTOINCREMENT';
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

  private buildCreateIndexSQL(tableName: string, index: Index): string {
    const unique = index.unique ? 'UNIQUE ' : '';
    const columns = index.columns.join(', ');
    return `CREATE ${unique}INDEX ${index.name} ON ${tableName} (${columns})`;
  }
}

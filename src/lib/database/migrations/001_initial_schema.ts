/**
 * Initial Database Schema Migration
 * Creates all core tables for the SkyStage platform
 */

import { DatabaseProvider, Migration, TableSchema } from '../types';

export const initialSchemaMigration: Migration = {
  version: '001',
  name: 'initial_schema',

  async up(provider: DatabaseProvider): Promise<void> {
    console.log('[Migration 001] Creating initial schema...');

    // Users table
    const usersSchema: TableSchema = {
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'email', type: 'string', length: 255, nullable: false, unique: true },
        { name: 'password_hash', type: 'string', length: 255, nullable: false },
        { name: 'full_name', type: 'string', length: 255, nullable: true },
        { name: 'user_type', type: 'string', length: 50, nullable: false, default: 'customer' },
        { name: 'company_name', type: 'string', length: 255, nullable: true },
        { name: 'phone', type: 'string', length: 50, nullable: true },
        { name: 'location', type: 'string', length: 255, nullable: true },
        { name: 'avatar_url', type: 'string', length: 500, nullable: true },
        { name: 'is_verified', type: 'boolean', nullable: false, default: false },
        { name: 'is_active', type: 'boolean', nullable: false, default: true },
        { name: 'last_login', type: 'datetime', nullable: true },
        { name: 'preferences', type: 'json', nullable: true },
        { name: 'created_at', type: 'datetime', nullable: false },
        { name: 'updated_at', type: 'datetime', nullable: false },
      ],
      primaryKey: 'id',
      indexes: [
        { name: 'idx_users_email', columns: ['email'], unique: true },
        { name: 'idx_users_user_type', columns: ['user_type'] },
        { name: 'idx_users_is_active', columns: ['is_active'] },
      ],
    };

    await provider.createTable('users', usersSchema);

    // Organizations table
    const organizationsSchema: TableSchema = {
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'name', type: 'string', length: 255, nullable: false },
        { name: 'slug', type: 'string', length: 255, nullable: false, unique: true },
        { name: 'description', type: 'text', nullable: true },
        { name: 'logo_url', type: 'string', length: 500, nullable: true },
        { name: 'website', type: 'string', length: 500, nullable: true },
        { name: 'email', type: 'string', length: 255, nullable: true },
        { name: 'phone', type: 'string', length: 50, nullable: true },
        { name: 'address', type: 'string', length: 500, nullable: true },
        { name: 'city', type: 'string', length: 100, nullable: true },
        { name: 'state', type: 'string', length: 100, nullable: true },
        { name: 'country', type: 'string', length: 100, nullable: true },
        { name: 'owner_id', type: 'uuid', nullable: false },
        { name: 'subscription_plan', type: 'string', length: 50, nullable: false, default: 'free' },
        { name: 'subscription_status', type: 'string', length: 50, nullable: false, default: 'active' },
        { name: 'member_count', type: 'integer', nullable: true, default: 0 },
        { name: 'settings', type: 'json', nullable: true },
        { name: 'created_at', type: 'datetime', nullable: false },
        { name: 'updated_at', type: 'datetime', nullable: false },
      ],
      primaryKey: 'id',
      indexes: [
        { name: 'idx_organizations_slug', columns: ['slug'], unique: true },
        { name: 'idx_organizations_owner_id', columns: ['owner_id'] },
        { name: 'idx_organizations_subscription_plan', columns: ['subscription_plan'] },
      ],
      foreignKeys: [
        {
          name: 'fk_organizations_owner_id',
          columns: ['owner_id'],
          referencedTable: 'users',
          referencedColumns: ['id'],
          onDelete: 'CASCADE',
        },
      ],
    };

    await provider.createTable('organizations', organizationsSchema);

    // Formation Categories table
    const formationCategoriesSchema: TableSchema = {
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'name', type: 'string', length: 100, nullable: false },
        { name: 'slug', type: 'string', length: 100, nullable: false, unique: true },
        { name: 'description', type: 'text', nullable: true },
        { name: 'icon', type: 'string', length: 100, nullable: true },
        { name: 'color', type: 'string', length: 20, nullable: true },
        { name: 'formation_count', type: 'integer', nullable: true, default: 0 },
        { name: 'is_active', type: 'boolean', nullable: false, default: true },
        { name: 'sort_order', type: 'integer', nullable: true, default: 0 },
        { name: 'created_at', type: 'datetime', nullable: false },
        { name: 'updated_at', type: 'datetime', nullable: false },
      ],
      primaryKey: 'id',
      indexes: [
        { name: 'idx_formation_categories_slug', columns: ['slug'], unique: true },
        { name: 'idx_formation_categories_sort_order', columns: ['sort_order'] },
      ],
    };

    await provider.createTable('formation_categories', formationCategoriesSchema);

    // Formation Tags table
    const formationTagsSchema: TableSchema = {
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'name', type: 'string', length: 100, nullable: false },
        { name: 'slug', type: 'string', length: 100, nullable: false, unique: true },
        { name: 'color', type: 'string', length: 20, nullable: true },
        { name: 'usage_count', type: 'integer', nullable: true, default: 0 },
        { name: 'created_at', type: 'datetime', nullable: false },
        { name: 'updated_at', type: 'datetime', nullable: false },
      ],
      primaryKey: 'id',
      indexes: [
        { name: 'idx_formation_tags_slug', columns: ['slug'], unique: true },
        { name: 'idx_formation_tags_usage_count', columns: ['usage_count'] },
      ],
    };

    await provider.createTable('formation_tags', formationTagsSchema);

    // Formations table
    const formationsSchema: TableSchema = {
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'name', type: 'string', length: 255, nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'category', type: 'string', length: 100, nullable: false },
        { name: 'thumbnail_url', type: 'string', length: 500, nullable: true },
        { name: 'file_url', type: 'string', length: 500, nullable: true },
        { name: 'drone_count', type: 'integer', nullable: false },
        { name: 'duration', type: 'decimal', length: 10, nullable: false },
        { name: 'price', type: 'decimal', length: 10, nullable: true, default: 0 },
        { name: 'created_by', type: 'uuid', nullable: false },
        { name: 'is_public', type: 'boolean', nullable: false, default: true },
        { name: 'tags', type: 'text', nullable: true },
        { name: 'formation_data', type: 'json', nullable: true },
        { name: 'metadata', type: 'json', nullable: true },
        { name: 'source', type: 'string', length: 50, nullable: true },
        { name: 'source_id', type: 'string', length: 255, nullable: true },
        { name: 'sync_status', type: 'string', length: 50, nullable: true },
        { name: 'last_synced', type: 'datetime', nullable: true },
        { name: 'download_count', type: 'integer', nullable: true, default: 0 },
        { name: 'rating', type: 'decimal', length: 3, nullable: true },
        { name: 'created_at', type: 'datetime', nullable: false },
        { name: 'updated_at', type: 'datetime', nullable: false },
      ],
      primaryKey: 'id',
      indexes: [
        { name: 'idx_formations_category', columns: ['category'] },
        { name: 'idx_formations_created_by', columns: ['created_by'] },
        { name: 'idx_formations_is_public', columns: ['is_public'] },
        { name: 'idx_formations_source', columns: ['source'] },
        { name: 'idx_formations_drone_count', columns: ['drone_count'] },
        { name: 'idx_formations_rating', columns: ['rating'] },
      ],
      foreignKeys: [
        {
          name: 'fk_formations_created_by',
          columns: ['created_by'],
          referencedTable: 'users',
          referencedColumns: ['id'],
          onDelete: 'CASCADE',
        },
      ],
    };

    await provider.createTable('formations', formationsSchema);

    // Shows table
    const showsSchema: TableSchema = {
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'title', type: 'string', length: 255, nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'status', type: 'string', length: 50, nullable: false, default: 'draft' },
        { name: 'event_date', type: 'datetime', nullable: false },
        { name: 'duration', type: 'integer', nullable: false },
        { name: 'location_name', type: 'string', length: 255, nullable: true },
        { name: 'location_address', type: 'text', nullable: true },
        { name: 'location_coordinates', type: 'json', nullable: true },
        { name: 'client_id', type: 'uuid', nullable: true },
        { name: 'organization_id', type: 'uuid', nullable: true },
        { name: 'total_drones', type: 'integer', nullable: false },
        { name: 'estimated_cost', type: 'decimal', length: 10, nullable: true },
        { name: 'actual_cost', type: 'decimal', length: 10, nullable: true },
        { name: 'formations', type: 'json', nullable: true },
        { name: 'crew', type: 'json', nullable: true },
        { name: 'equipment', type: 'json', nullable: true },
        { name: 'safety_clearance', type: 'boolean', nullable: false, default: false },
        { name: 'weather_requirements', type: 'text', nullable: true },
        { name: 'special_requirements', type: 'text', nullable: true },
        { name: 'created_by', type: 'uuid', nullable: false },
        { name: 'created_at', type: 'datetime', nullable: false },
        { name: 'updated_at', type: 'datetime', nullable: false },
      ],
      primaryKey: 'id',
      indexes: [
        { name: 'idx_shows_status', columns: ['status'] },
        { name: 'idx_shows_event_date', columns: ['event_date'] },
        { name: 'idx_shows_client_id', columns: ['client_id'] },
        { name: 'idx_shows_organization_id', columns: ['organization_id'] },
        { name: 'idx_shows_created_by', columns: ['created_by'] },
      ],
      foreignKeys: [
        {
          name: 'fk_shows_client_id',
          columns: ['client_id'],
          referencedTable: 'users',
          referencedColumns: ['id'],
          onDelete: 'SET NULL',
        },
        {
          name: 'fk_shows_organization_id',
          columns: ['organization_id'],
          referencedTable: 'organizations',
          referencedColumns: ['id'],
          onDelete: 'SET NULL',
        },
        {
          name: 'fk_shows_created_by',
          columns: ['created_by'],
          referencedTable: 'users',
          referencedColumns: ['id'],
          onDelete: 'CASCADE',
        },
      ],
    };

    await provider.createTable('shows', showsSchema);

    // Bookings table
    const bookingsSchema: TableSchema = {
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'organization_id', type: 'uuid', nullable: true },
        { name: 'contact_name', type: 'string', length: 255, nullable: false },
        { name: 'contact_email', type: 'string', length: 255, nullable: false },
        { name: 'contact_phone', type: 'string', length: 50, nullable: true },
        { name: 'event_name', type: 'string', length: 255, nullable: true },
        { name: 'event_date', type: 'datetime', nullable: true },
        { name: 'location', type: 'string', length: 500, nullable: true },
        { name: 'budget_range', type: 'string', length: 100, nullable: true },
        { name: 'message', type: 'text', nullable: true },
        { name: 'status', type: 'string', length: 50, nullable: false, default: 'pending' },
        { name: 'quoted_price', type: 'decimal', length: 10, nullable: true },
        { name: 'requirements', type: 'json', nullable: true },
        { name: 'created_at', type: 'datetime', nullable: false },
        { name: 'updated_at', type: 'datetime', nullable: false },
      ],
      primaryKey: 'id',
      indexes: [
        { name: 'idx_bookings_user_id', columns: ['user_id'] },
        { name: 'idx_bookings_organization_id', columns: ['organization_id'] },
        { name: 'idx_bookings_status', columns: ['status'] },
        { name: 'idx_bookings_contact_email', columns: ['contact_email'] },
      ],
      foreignKeys: [
        {
          name: 'fk_bookings_user_id',
          columns: ['user_id'],
          referencedTable: 'users',
          referencedColumns: ['id'],
          onDelete: 'CASCADE',
        },
        {
          name: 'fk_bookings_organization_id',
          columns: ['organization_id'],
          referencedTable: 'organizations',
          referencedColumns: ['id'],
          onDelete: 'SET NULL',
        },
      ],
    };

    await provider.createTable('bookings', bookingsSchema);

    // Sync Jobs table
    const syncJobsSchema: TableSchema = {
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'type', type: 'string', length: 100, nullable: false },
        { name: 'status', type: 'string', length: 50, nullable: false, default: 'pending' },
        { name: 'progress', type: 'integer', nullable: false, default: 0 },
        { name: 'total_items', type: 'integer', nullable: false, default: 0 },
        { name: 'processed_items', type: 'integer', nullable: false, default: 0 },
        { name: 'successful_items', type: 'integer', nullable: false, default: 0 },
        { name: 'failed_items', type: 'integer', nullable: false, default: 0 },
        { name: 'error_details', type: 'json', nullable: true },
        { name: 'metadata', type: 'json', nullable: true },
        { name: 'started_at', type: 'datetime', nullable: true },
        { name: 'completed_at', type: 'datetime', nullable: true },
        { name: 'created_by', type: 'uuid', nullable: false },
        { name: 'created_at', type: 'datetime', nullable: false },
        { name: 'updated_at', type: 'datetime', nullable: false },
      ],
      primaryKey: 'id',
      indexes: [
        { name: 'idx_sync_jobs_type', columns: ['type'] },
        { name: 'idx_sync_jobs_status', columns: ['status'] },
        { name: 'idx_sync_jobs_created_by', columns: ['created_by'] },
        { name: 'idx_sync_jobs_created_at', columns: ['created_at'] },
      ],
      foreignKeys: [
        {
          name: 'fk_sync_jobs_created_by',
          columns: ['created_by'],
          referencedTable: 'users',
          referencedColumns: ['id'],
          onDelete: 'CASCADE',
        },
      ],
    };

    await provider.createTable('sync_jobs', syncJobsSchema);

    // User Sessions table
    const userSessionsSchema: TableSchema = {
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'session_token', type: 'string', length: 500, nullable: false, unique: true },
        { name: 'ip_address', type: 'string', length: 45, nullable: true },
        { name: 'user_agent', type: 'text', nullable: true },
        { name: 'expires_at', type: 'datetime', nullable: false },
        { name: 'last_activity', type: 'datetime', nullable: true },
        { name: 'created_at', type: 'datetime', nullable: false },
      ],
      primaryKey: 'id',
      indexes: [
        { name: 'idx_user_sessions_token', columns: ['session_token'], unique: true },
        { name: 'idx_user_sessions_user_id', columns: ['user_id'] },
        { name: 'idx_user_sessions_expires_at', columns: ['expires_at'] },
      ],
      foreignKeys: [
        {
          name: 'fk_user_sessions_user_id',
          columns: ['user_id'],
          referencedTable: 'users',
          referencedColumns: ['id'],
          onDelete: 'CASCADE',
        },
      ],
    };

    await provider.createTable('user_sessions', userSessionsSchema);

    // Analytics Events table
    const analyticsEventsSchema: TableSchema = {
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'event_type', type: 'string', length: 100, nullable: false },
        { name: 'entity_type', type: 'string', length: 100, nullable: false },
        { name: 'entity_id', type: 'uuid', nullable: true },
        { name: 'user_id', type: 'uuid', nullable: true },
        { name: 'session_id', type: 'uuid', nullable: true },
        { name: 'ip_address', type: 'string', length: 45, nullable: true },
        { name: 'user_agent', type: 'text', nullable: true },
        { name: 'metadata', type: 'json', nullable: true },
        { name: 'created_at', type: 'datetime', nullable: false },
        { name: 'updated_at', type: 'datetime', nullable: false },
      ],
      primaryKey: 'id',
      indexes: [
        { name: 'idx_analytics_events_type', columns: ['event_type'] },
        { name: 'idx_analytics_events_entity_type', columns: ['entity_type'] },
        { name: 'idx_analytics_events_user_id', columns: ['user_id'] },
        { name: 'idx_analytics_events_created_at', columns: ['created_at'] },
      ],
      foreignKeys: [
        {
          name: 'fk_analytics_events_user_id',
          columns: ['user_id'],
          referencedTable: 'users',
          referencedColumns: ['id'],
          onDelete: 'SET NULL',
        },
      ],
    };

    await provider.createTable('analytics_events', analyticsEventsSchema);

    console.log('[Migration 001] Initial schema created successfully');
  },

  async down(provider: DatabaseProvider): Promise<void> {
    console.log('[Migration 001] Rolling back initial schema...');

    const tables = [
      'analytics_events',
      'user_sessions',
      'sync_jobs',
      'bookings',
      'shows',
      'formations',
      'formation_tags',
      'formation_categories',
      'organizations',
      'users',
    ];

    for (const table of tables) {
      await provider.dropTable(table);
    }

    console.log('[Migration 001] Initial schema rolled back successfully');
  },
};

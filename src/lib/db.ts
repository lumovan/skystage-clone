
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
 * Database Client with Modular Provider Support
 * Updated to use the new database abstraction layer
 */

import {
  DatabaseProvider,
  User,
  Formation,
  Organization,
  Show,
  Booking,
  SyncJob,
  FormationCategory,
  FormationTag,
  UserSession,
  AnalyticsEvent,
  QueryOptions
} from './database/types';
import { getDatabase } from './database/factory';

/**
 * Get the current database provider instance
 */
function getDb(): DatabaseProvider {
  return getDatabase();
}

/**
 * User database operations
 */
export const userDb = {
  // Find user by email
  findByEmail: async (email: string): Promise<User | null> => {
    const db = getDb();
    return db.findOne<User>('users', { email });
  },

  // Find user by ID
  findById: async (id: string): Promise<User | null> => {
    const db = getDb();
    return db.findById<User>('users', id);
  },

  // Create new user
  create: async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> => {
    const db = getDb();
    return db.create<User>('users', userData);
  },

  // Update user
  update: async (id: string, updates: Partial<User>): Promise<User> => {
    const db = getDb();
    return db.update<User>('users', id, updates);
  },

  // Get all users with options
  getAll: async (options: QueryOptions = {}): Promise<User[]> => {
    const db = getDb();
    // Don't return password hashes in listings
    const safeOptions = {
      ...options,
      select: options.select || ['id', 'email', 'full_name', 'user_type', 'company_name', 'location', 'is_verified', 'is_active', 'created_at']
    };
    return db.findAll<User>('users', safeOptions);
  },

  // Get user count
  getCount: async (criteria: Partial<User> = {}): Promise<number> => {
    const db = getDb();
    return db.count('users', criteria);
  },

  // Bulk operations
  bulkUpdate: async (updates: { id: string; data: Partial<User> }[]): Promise<User[]> => {
    const db = getDb();
    return db.bulkUpdate<User>('users', updates);
  },

  // Check if user exists
  exists: async (criteria: Partial<User>): Promise<boolean> => {
    const count = await userDb.getCount(criteria);
    return count > 0;
  },

  // User authentication helpers
  findBySessionToken: async (token: string): Promise<User | null> => {
    const db = getDb();
    const session = await db.findOne<UserSession>('user_sessions', { session_token: token });
    if (!session || new Date(session.expires_at) < new Date()) {
      return null;
    }
    return userDb.findById(session.user_id);
  },

  // Update last login
  updateLastLogin: async (id: string): Promise<User> => {
    return userDb.update(id, { last_login: new Date().toISOString() });
  }
};

/**
 * Formation database operations
 */
export const formationDb = {
  // Get all formations with enhanced filtering
  getAll: async (options: QueryOptions = {}): Promise<Formation[]> => {
    const db = getDb();
    return db.findAll<Formation>('formations', {
      ...options,
      orderBy: options.orderBy || [{ column: 'created_at', direction: 'DESC' }]
    });
  },

  // Get formation by ID
  getById: async (id: string): Promise<Formation | null> => {
    const db = getDb();
    return db.findById<Formation>('formations', id);
  },

  // Create formation
  create: async (formationData: Omit<Formation, 'id' | 'created_at' | 'updated_at'>): Promise<Formation> => {
    const db = getDb();
    return db.create<Formation>('formations', formationData);
  },

  // Update formation
  update: async (id: string, updates: Partial<Formation>): Promise<Formation> => {
    const db = getDb();
    return db.update<Formation>('formations', id, updates);
  },

  // Delete formation
  delete: async (id: string): Promise<boolean> => {
    const db = getDb();
    return db.delete('formations', id);
  },

  // Get formations by category
  getByCategory: async (category: string, options: QueryOptions = {}): Promise<Formation[]> => {
    const db = getDb();
    return db.findBy<Formation>('formations', { category }, options);
  },

  // Get public formations
  getPublic: async (options: QueryOptions = {}): Promise<Formation[]> => {
    const db = getDb();
    return db.findBy<Formation>('formations', { is_public: true }, options);
  },

  // Get formations by user
  getByUser: async (userId: string, options: QueryOptions = {}): Promise<Formation[]> => {
    const db = getDb();
    return db.findBy<Formation>('formations', { created_by: userId }, options);
  },

  // Get categories with counts
  getCategories: async (): Promise<FormationCategory[]> => {
    const db = getDb();
    return db.findAll<FormationCategory>('formation_categories', {
      orderBy: [{ column: 'sort_order', direction: 'ASC' }]
    });
  },

  // Get count
  getCount: async (criteria: Partial<Formation> = {}): Promise<number> => {
    const db = getDb();
    return db.count('formations', criteria);
  },

  // Count alias for backward compatibility
  count: async (table: string): Promise<number> => {
    return formationDb.getCount();
  },

  // Search formations
  search: async (query: string, options: QueryOptions = {}): Promise<Formation[]> => {
    const db = getDb();
    // For SQL-based providers, we'd use LIKE queries
    // For now, we'll filter in application code
    const formations = await db.findAll<Formation>('formations', options);
    return formations.filter(f =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.description?.toLowerCase().includes(query.toLowerCase()) ||
      f.tags?.toLowerCase().includes(query.toLowerCase())
    );
  },

  // Bulk operations
  bulkCreate: async (formationsData: Omit<Formation, 'id' | 'created_at' | 'updated_at'>[]): Promise<Formation[]> => {
    const db = getDb();
    return db.bulkCreate<Formation>('formations', formationsData);
  },

  bulkDelete: async (ids: string[]): Promise<number> => {
    const db = getDb();
    return db.bulkDelete('formations', ids);
  },

  // Update download count
  incrementDownloadCount: async (id: string): Promise<Formation> => {
    const formation = await formationDb.getById(id);
    if (!formation) throw new Error('Formation not found');

    return formationDb.update(id, {
      download_count: (formation.download_count || 0) + 1
    });
  }
};

/**
 * Organization database operations
 */
export const organizationDb = {
  // Get all organizations
  getAll: async (options: QueryOptions = {}): Promise<Organization[]> => {
    const db = getDb();
    return db.findAll<Organization>('organizations', options);
  },

  // Get organization by ID
  getById: async (id: string): Promise<Organization | null> => {
    const db = getDb();
    return db.findById<Organization>('organizations', id);
  },

  // Get organization by slug
  getBySlug: async (slug: string): Promise<Organization | null> => {
    const db = getDb();
    return db.findOne<Organization>('organizations', { slug });
  },

  // Create organization
  create: async (orgData: Omit<Organization, 'id' | 'created_at' | 'updated_at'>): Promise<Organization> => {
    const db = getDb();
    return db.create<Organization>('organizations', orgData);
  },

  // Update organization
  update: async (id: string, updates: Partial<Organization>): Promise<Organization> => {
    const db = getDb();
    return db.update<Organization>('organizations', id, updates);
  },

  // Get organizations by owner
  getByOwner: async (ownerId: string): Promise<Organization[]> => {
    const db = getDb();
    return db.findBy<Organization>('organizations', { owner_id: ownerId });
  },

  // Get count
  getCount: async (): Promise<number> => {
    const db = getDb();
    return db.count('organizations');
  }
};

/**
 * Show database operations
 */
export const showDb = {
  // Get all shows
  getAll: async (options: QueryOptions = {}): Promise<Show[]> => {
    const db = getDb();
    return db.findAll<Show>('shows', {
      ...options,
      orderBy: options.orderBy || [{ column: 'event_date', direction: 'DESC' }]
    });
  },

  // Get show by ID
  getById: async (id: string): Promise<Show | null> => {
    const db = getDb();
    return db.findById<Show>('shows', id);
  },

  // Create show
  create: async (showData: Omit<Show, 'id' | 'created_at' | 'updated_at'>): Promise<Show> => {
    const db = getDb();
    return db.create<Show>('shows', showData);
  },

  // Update show
  update: async (id: string, updates: Partial<Show>): Promise<Show> => {
    const db = getDb();
    return db.update<Show>('shows', id, updates);
  },

  // Get shows by status
  getByStatus: async (status: string, options: QueryOptions = {}): Promise<Show[]> => {
    const db = getDb();
    return db.findBy<Show>('shows', { status }, options);
  },

  // Get shows by user
  getByUser: async (userId: string, options: QueryOptions = {}): Promise<Show[]> => {
    const db = getDb();
    return db.findBy<Show>('shows', { created_by: userId }, options);
  },

  // Get upcoming shows
  getUpcoming: async (options: QueryOptions = {}): Promise<Show[]> => {
    const db = getDb();
    const shows = await db.findAll<Show>('shows', options);
    const now = new Date().toISOString();
    return shows.filter(show => show.event_date > now);
  }
};

/**
 * Booking database operations
 */
export const bookingDb = {
  // Create booking
  create: async (bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> => {
    const db = getDb();
    return db.create<Booking>('bookings', bookingData);
  },

  // Get all bookings
  getAll: async (options: QueryOptions = {}): Promise<Booking[]> => {
    const db = getDb();
    return db.findAll<Booking>('bookings', {
      ...options,
      orderBy: options.orderBy || [{ column: 'created_at', direction: 'DESC' }]
    });
  },

  // Get bookings by user
  getByUserId: async (userId: string): Promise<Booking[]> => {
    const db = getDb();
    return db.findBy<Booking>('bookings', { user_id: userId });
  },

  // Update booking status
  updateStatus: async (id: string, status: string, quotedPrice?: number): Promise<Booking> => {
    const db = getDb();
    const updates: Partial<Booking> = { status };
    if (quotedPrice !== undefined) {
      updates.quoted_price = quotedPrice;
    }
    return db.update<Booking>('bookings', id, updates);
  },

  // Get bookings by status
  getByStatus: async (status: string, options: QueryOptions = {}): Promise<Booking[]> => {
    const db = getDb();
    return db.findBy<Booking>('bookings', { status }, options);
  },

  // Get count
  getCount: async (): Promise<number> => {
    const db = getDb();
    return db.count('bookings');
  },

  // Count alias for backward compatibility
  count: async (table: string): Promise<number> => {
    return bookingDb.getCount();
  }
};

/**
 * Sync Jobs database operations
 */
export const syncJobDb = {
  // Create sync job
  create: async (jobData: Omit<SyncJob, 'id' | 'created_at' | 'updated_at'>): Promise<SyncJob> => {
    const db = getDb();
    return db.create<SyncJob>('sync_jobs', jobData);
  },

  // Get all sync jobs
  getAll: async (options: QueryOptions = {}): Promise<SyncJob[]> => {
    const db = getDb();
    return db.findAll<SyncJob>('sync_jobs', {
      ...options,
      orderBy: options.orderBy || [{ column: 'created_at', direction: 'DESC' }]
    });
  },

  // Get sync job by ID
  getById: async (id: string): Promise<SyncJob | null> => {
    const db = getDb();
    return db.findById<SyncJob>('sync_jobs', id);
  },

  // Update sync job
  update: async (id: string, updates: Partial<SyncJob>): Promise<SyncJob> => {
    const db = getDb();
    return db.update<SyncJob>('sync_jobs', id, updates);
  },

  // Get jobs by status
  getByStatus: async (status: string): Promise<SyncJob[]> => {
    const db = getDb();
    return db.findBy<SyncJob>('sync_jobs', { status });
  },

  // Get recent jobs
  getRecent: async (limit: number = 10): Promise<SyncJob[]> => {
    const db = getDb();
    return db.findAll<SyncJob>('sync_jobs', {
      limit,
      orderBy: [{ column: 'created_at', direction: 'DESC' }]
    });
  },

  // Get count
  getCount: async (): Promise<number> => {
    const db = getDb();
    return db.count('sync_jobs');
  },

  // Count alias for backward compatibility
  count: async (table: string): Promise<number> => {
    return syncJobDb.getCount();
  }
};

/**
 * Analytics database operations
 */
export const analyticsDb = {
  // Record event
  recordEvent: async (eventData: Omit<AnalyticsEvent, 'id' | 'created_at'>): Promise<AnalyticsEvent> => {
    const db = getDb();
    return db.create<AnalyticsEvent>('analytics_events', eventData);
  },

  // Get events by type
  getByEventType: async (eventType: string, options: QueryOptions = {}): Promise<AnalyticsEvent[]> => {
    const db = getDb();
    return db.findBy<AnalyticsEvent>('analytics_events', { event_type: eventType }, options);
  },

  // Get events by user
  getByUser: async (userId: string, options: QueryOptions = {}): Promise<AnalyticsEvent[]> => {
    const db = getDb();
    return db.findBy<AnalyticsEvent>('analytics_events', { user_id: userId }, options);
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const db = getDb();

    try {
      // Get basic counts
      const [userCount, orgCount, formationCount, showCount, bookingCount] = await Promise.all([
        db.count('users'),
        db.count('organizations'),
        db.count('formations'),
        db.count('shows'),
        db.count('bookings')
      ]);

      // Get user stats by type
      const users = await db.findAll<User>('users');
      const usersByType = users.reduce((acc, user) => {
        acc[user.user_type] = (acc[user.user_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get booking stats by status
      const bookings = await db.findAll<Booking>('bookings');
      const bookingsByStatus = bookings.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get formation stats by category
      const formations = await db.findAll<Formation>('formations', { where: { is_public: true } });
      const formationsByCategory = formations.reduce((acc, formation) => {
        acc[formation.category] = (acc[formation.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get recent activity (simplified)
      const recentEvents = await db.findAll<AnalyticsEvent>('analytics_events', {
        limit: 10,
        orderBy: [{ column: 'created_at', direction: 'DESC' }]
      });

      return {
        totals: {
          users: userCount,
          organizations: orgCount,
          formations: formationCount,
          shows: showCount,
          bookings: bookingCount
        },
        users: Object.entries(usersByType).map(([user_type, count]) => ({ user_type, count })),
        bookings: Object.entries(bookingsByStatus).map(([status, count]) => ({ status, count })),
        formations: Object.entries(formationsByCategory).map(([category, count]) => ({ category, count })),
        recentActivity: recentEvents.map(event => ({
          event_type: event.event_type,
          entity_type: event.entity_type,
          created_at: event.created_at,
          count: 1
        }))
      };
    } catch (error) {
      console.warn('Error getting dashboard stats:', error);
      return {
        totals: { users: 0, organizations: 0, formations: 0, shows: 0, bookings: 0 },
        users: [],
        bookings: [],
        formations: [],
        recentActivity: []
      };
    }
  }
};

/**
 * Email subscription operations
 */
export const emailDb = {
  // Subscribe email (simplified - would need email_subscriptions table)
  subscribe: async (email: string, type = 'newsletter') => {
    // For now, just record as an analytics event
    return analyticsDb.recordEvent({
      event_type: 'email_subscribed',
      entity_type: 'email',
      metadata: { email, subscription_type: type }
    });
  },

  // Get all subscriptions (would need proper table)
  getAll: async () => {
    // Return empty array for now
    return [];
  },

  // Unsubscribe (would need proper table)
  unsubscribe: async (email: string) => {
    return analyticsDb.recordEvent({
      event_type: 'email_unsubscribed',
      entity_type: 'email',
      metadata: { email }
    });
  }
};

/**
 * Database health and utilities
 */
export const dbUtils = {
  // Check database connection
  healthCheck: async () => {
    try {
      const db = getDb();
      const isHealthy = await db.ping();
      return { status: isHealthy ? 'healthy' : 'unhealthy', provider: 'connected' };
    } catch (error: unknown) {
      return { status: 'error', error: error.message };
    }
  },

  // Get database statistics
  getStats: async () => {
    const db = getDb();
    return Promise.all([
      db.count('users'),
      db.count('organizations'),
      db.count('formations'),
      db.count('shows'),
      db.count('bookings'),
      db.count('sync_jobs'),
    ]).then(([users, organizations, formations, shows, bookings, syncJobs]) => ({
      users,
      organizations,
      formations,
      shows,
      bookings,
      syncJobs,
      total: users + organizations + formations + shows + bookings + syncJobs
    }));
  },

  // Transaction wrapper
  transaction: async <T>(callback: (provider: DatabaseProvider) => Promise<T>): Promise<T> => {
    const db = getDb();
    return db.transaction(callback);
  }
};

// Re-export the database provider for advanced usage
export { getDb };

// Default export with all operations
export default {
  getDb,
  userDb,
  formationDb,
  organizationDb,
  showDb,
  bookingDb,
  syncJobDb,
  analyticsDb,
  emailDb,
  dbUtils
};

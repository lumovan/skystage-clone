# SkyStage Database Architecture 🚀

Modern, modular database system supporting SQLite, Supabase, and PostgreSQL with real-time capabilities.

## 🎯 Quick Start

### Option 1: SQLite (Local Development)
```bash
# Set SQLite provider
echo "DATABASE_PROVIDER=sqlite" >> .env.local

# Initialize and seed database
npm run setup:sqlite

# Start development server
npm run dev
```

### Option 2: Supabase (Recommended for Production)
```bash
# 1. Create Supabase project at https://supabase.com
# 2. Get your project URL and API keys
# 3. Update .env.local with your credentials

# Set Supabase provider
echo "DATABASE_PROVIDER=supabase" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your-project-url" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" >> .env.local

# Run migration and seeding
npm run setup:supabase

# Start development server
npm run dev
```

## 🏗️ Architecture Overview

### Modular Database System
- **Multiple Providers**: SQLite, Supabase, PostgreSQL
- **Runtime Switching**: Change providers without code changes
- **Type Safety**: Full TypeScript support across all providers
- **Real-time**: Live updates with Supabase subscriptions
- **Transactions**: Cross-provider transaction support

### Database Providers

| Provider | Use Case | Features |
|----------|----------|----------|
| **SQLite** | Local development | Fast, simple, no setup required |
| **Supabase** | Production (recommended) | Real-time, scaling, auth integration |
| **PostgreSQL** | Enterprise | Direct control, advanced features |

## 📁 Project Structure

```
src/lib/database/
├── types.ts                 # Type definitions and interfaces
├── factory.ts              # Database factory and provider management
├── init.ts                 # Application initialization
├── providers/
│   ├── sqlite.ts           # SQLite implementation
│   ├── supabase.ts         # Supabase implementation
│   └── postgresql.ts       # PostgreSQL implementation
└── migrations/
    └── 001_initial_schema.ts # Database schema migration

scripts/
├── migrate-supabase.ts     # Supabase migration script
├── seed-supabase.ts        # Supabase seeding script
└── test-database.ts        # Database testing script
```

## 🔧 Configuration

### Environment Variables

```env
# Core Configuration
DATABASE_PROVIDER=supabase  # sqlite | supabase | postgresql

# Supabase (when using supabase provider)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PostgreSQL (when using postgresql provider)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=skystage
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password

# SQLite (when using sqlite provider)
DATABASE_URL=./data/skystage.db

# Connection Pooling
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000
```

## 🗄️ Database Schema

### Core Tables

```sql
-- Users with authentication and profile data
users (id, email, password_hash, full_name, user_type, ...)

-- Organizations for multi-tenant support
organizations (id, name, slug, owner_id, subscription_plan, ...)

-- Formation management
formations (id, name, description, category, drone_count, ...)
formation_categories (id, name, slug, description, ...)
formation_tags (id, name, slug, color, ...)

-- Show and booking management
shows (id, title, description, status, event_date, ...)
bookings (id, user_id, contact_name, event_name, status, ...)

-- Background job tracking
sync_jobs (id, type, status, progress, metadata, ...)

-- Analytics and sessions
analytics_events (id, event_type, entity_type, user_id, ...)
user_sessions (id, user_id, session_token, expires_at, ...)
```

## 🚀 Usage Examples

### Basic Database Operations

```typescript
import { userDb, formationDb, organizationDb } from '@/lib/db';

// Create user
const user = await userDb.create({
  email: 'user@example.com',
  password_hash: await hashPassword('password'),
  full_name: 'John Doe',
  user_type: 'customer',
  is_verified: false,
  is_active: true
});

// Find formations
const formations = await formationDb.getAll({
  limit: 10,
  where: { is_public: true },
  orderBy: [{ column: 'created_at', direction: 'DESC' }]
});

// Search formations
const searchResults = await formationDb.search('drone show', {
  limit: 20
});

// Bulk operations
const users = await userDb.bulkCreate([
  { email: 'user1@example.com', ... },
  { email: 'user2@example.com', ... }
]);
```

### Provider Management

```typescript
import {
  getDatabase,
  switchDatabaseProvider,
  checkDatabaseHealth
} from '@/lib/database/factory';

// Get current provider
const db = getDatabase();

// Switch providers at runtime
await switchDatabaseProvider('supabase');

// Health check
const health = await checkDatabaseHealth();
console.log(`Database status: ${health.status}`);
```

### Real-time Subscriptions (Supabase)

```typescript
import { getDatabase } from '@/lib/database/factory';

const db = getDatabase();

// Subscribe to table changes (Supabase only)
if (db.subscribe) {
  const unsubscribe = await db.subscribe('formations', (event) => {
    console.log('Formation changed:', event);
    // Handle real-time updates
  });

  // Cleanup
  // unsubscribe();
}
```

## 🧪 Testing

### Run Database Tests

```bash
# Test current database configuration
npm run db:test

# Check database health
npm run db:health

# Verify environment configuration
npm run check:env
```

### Test Results

The test suite verifies:
- ✅ Database connection and health
- ✅ CRUD operations for all entities
- ✅ Bulk operations and transactions
- ✅ Search and filtering
- ✅ Provider switching capabilities
- ✅ Performance and connection pooling

## 📈 Performance

### Connection Pooling

Automatic connection pooling for optimal performance:

```typescript
// Configured via environment variables
DB_POOL_MIN=2          // Minimum connections
DB_POOL_MAX=10         // Maximum connections
DB_POOL_IDLE_TIMEOUT=30000    // Close idle connections
DB_POOL_ACQUIRE_TIMEOUT=60000 // Connection timeout
```

### Query Optimization

- **Indexed queries**: All foreign keys and common search fields
- **Pagination**: Built-in limit/offset support
- **Bulk operations**: Optimized for large datasets
- **Connection reuse**: Efficient connection management

## 🔄 Migration Guide

### From Legacy SQLite

```bash
# 1. Backup current data
cp ./data/skystage.db ./data/skystage.db.backup

# 2. Test new system with SQLite
DATABASE_PROVIDER=sqlite npm run db:test

# 3. Migrate to Supabase
DATABASE_PROVIDER=supabase npm run setup:supabase

# 4. Update environment
echo "DATABASE_PROVIDER=supabase" >> .env.local
```

### Between Providers

```bash
# Switch from SQLite to Supabase
npm run setup:supabase
echo "DATABASE_PROVIDER=supabase" >> .env.local

# Switch from Supabase to PostgreSQL
echo "DATABASE_PROVIDER=postgresql" >> .env.local
# Configure POSTGRES_* variables
```

## 🛡️ Security

### Row Level Security (Supabase)

Automatic RLS policies for:
- **Users**: Can only access own data
- **Organizations**: Owner and member access
- **Formations**: Public or creator access
- **Shows**: Creator and client access

### Authentication Integration

```typescript
import { requireAuth } from '@/lib/auth';

// Protect API routes
const user = await requireAuth(request);

// User-scoped queries
const userFormations = await formationDb.getByUser(user.id);
```

## 🔧 Troubleshooting

### Common Issues

#### "Database not initialized"
```bash
# Check if database is running
npm run db:health

# Re-initialize
npm run db:migrate:supabase  # or setup:sqlite
```

#### "Connection failed"
```bash
# Verify environment variables
npm run check:env

# Test connection
npm run db:test
```

#### "Table doesn't exist"
```bash
# Run migrations
npm run db:migrate:supabase

# Verify tables created
npm run db:health
```

### Debug Mode

```env
DEBUG=true
NODE_ENV=development
```

## 📊 Monitoring

### Health Endpoints

- **Health Check**: `GET /api/admin/database/health`
- **Statistics**: Database connection and query stats
- **Real-time**: Live connection monitoring

### Analytics

Built-in event tracking for:
- User actions (login, registration)
- Formation operations (create, download, sync)
- System events (sync jobs, errors)
- Performance metrics

## 🚀 Deployment

### Production Checklist

- [ ] **Environment**: Set `NODE_ENV=production`
- [ ] **Provider**: Use `supabase` or `postgresql`
- [ ] **Security**: Configure RLS policies
- [ ] **Monitoring**: Set up health checks
- [ ] **Backups**: Configure automatic backups
- [ ] **Scaling**: Configure connection pools

### Docker Deployment

```dockerfile
# Environment variables for database
ENV DATABASE_PROVIDER=supabase
ENV NEXT_PUBLIC_SUPABASE_URL=your-url
ENV SUPABASE_SERVICE_ROLE_KEY=your-key

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/api/admin/database/health || exit 1
```

## 🎉 Benefits

### For Developers
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Flexibility**: Switch providers easily
- ✅ **Testing**: Comprehensive test suite
- ✅ **DX**: Great developer experience

### For Production
- ✅ **Scalability**: Handle enterprise workloads
- ✅ **Real-time**: Live updates across clients
- ✅ **Security**: Built-in RLS and auth
- ✅ **Monitoring**: Health checks and analytics

### For Users
- ✅ **Performance**: Fast queries and real-time updates
- ✅ **Reliability**: Connection pooling and error handling
- ✅ **Consistency**: ACID transactions across providers

---

**🚁 Ready to power your drone show platform with enterprise-grade database architecture!**

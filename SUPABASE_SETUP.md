# SkyStage Supabase Migration Guide 🚀

Complete guide to migrate from SQLite to Supabase with our modular database architecture.

## 📋 Prerequisites

- Node.js 18+ and npm/bun installed
- A Supabase account (free tier available)
- Basic understanding of SQL and database concepts

## 🎯 Step 1: Create Supabase Project

### 1.1 Sign up and Create Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New project"
3. Choose your organization (or create one)
4. Fill in project details:
   - **Name**: `skystage-platform` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development

### 1.2 Get Project Credentials

After project creation, go to **Settings > API**:

- **Project URL**: `https://your-project.supabase.co`
- **Project API Keys**:
  - `anon` key (public)
  - `service_role` key (secret)

## 🔧 Step 2: Configure Environment

### 2.1 Update .env.local

Copy the following template and replace with your actual Supabase credentials:

```env
# Database Configuration
DATABASE_PROVIDER=supabase

# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here
SUPABASE_DB_PASSWORD=your-database-password

# Database Pool Configuration
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000

# Keep other existing environment variables...
```

### 2.2 Environment Variables Explained

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your project's API URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key for client-side | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key for server-side operations | ✅ |
| `SUPABASE_JWT_SECRET` | JWT signing secret (optional) | ❌ |
| `SUPABASE_DB_PASSWORD` | Database password for direct connections | ❌ |

## 🏗️ Step 3: Run Database Migration

### 3.1 Install Dependencies

```bash
# Using npm
npm install

# Using bun (recommended)
bun install
```

### 3.2 Run Migration Script

```bash
# This will create all tables, indexes, and RLS policies
npm run db:migrate:supabase

# Or with bun
bun run db:migrate:supabase
```

### 3.3 Seed Sample Data (Optional)

```bash
# This will populate the database with sample data for development
npm run db:seed:supabase

# Or with bun
bun run db:seed:supabase
```

## ✅ Step 4: Verify Setup

### 4.1 Check Database Health

Start the development server and check the health endpoint:

```bash
npm run dev
# Visit: http://localhost:3000/api/admin/database/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "health": {
      "status": "healthy",
      "connected": true,
      "provider": "supabase"
    }
  }
}
```

### 4.2 Verify Tables in Supabase Dashboard

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the following tables:
   - `users`
   - `organizations`
   - `formations`
   - `formation_categories`
   - `formation_tags`
   - `shows`
   - `bookings`
   - `sync_jobs`
   - `user_sessions`
   - `analytics_events`

### 4.3 Test Authentication

Try logging in with the default admin account:
- **Email**: `admin@skystage.com`
- **Password**: `admin123`

## 🔄 Step 5: Switch Database Providers

Our modular architecture supports switching between providers at runtime:

### 5.1 Available Providers

- **sqlite** - Local SQLite database (development)
- **supabase** - Supabase cloud database (recommended)
- **postgresql** - Direct PostgreSQL connection (advanced)

### 5.2 Switch Providers

Simply change the `DATABASE_PROVIDER` in your `.env.local`:

```env
# Use Supabase (recommended)
DATABASE_PROVIDER=supabase

# Use SQLite (local development)
DATABASE_PROVIDER=sqlite

# Use PostgreSQL (direct connection)
DATABASE_PROVIDER=postgresql
```

## 🎨 Step 6: Enable Real-time Features

### 6.1 Configure Real-time

Supabase provides real-time subscriptions. Update your `.env.local`:

```env
# Real-time Features
ENABLE_REALTIME=true
REALTIME_CHANNEL_PREFIX=skystage
REALTIME_HEARTBEAT_INTERVAL=30000
```

### 6.2 Real-time Capabilities

With Supabase, you get:
- ✅ **Live formation sync progress**
- ✅ **Real-time admin dashboard updates**
- ✅ **Live user activity monitoring**
- ✅ **System health status updates**

## 🔍 Step 7: Monitoring and Analytics

### 7.1 Database Monitoring

- **Supabase Dashboard**: Monitor performance, queries, and usage
- **Health Endpoint**: `/api/admin/database/health`
- **Analytics**: Built-in event tracking

### 7.2 Performance Optimization

```env
# Connection Pooling
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=60000

# Query Caching
ENABLE_QUERY_CACHE=true
CACHE_TTL=3600
```

## 🛠️ Troubleshooting

### Common Issues

#### ❌ "Connection failed"
- **Solution**: Check your `NEXT_PUBLIC_SUPABASE_URL` and API keys
- **Verify**: Project is not paused in Supabase dashboard

#### ❌ "Migration failed: permission denied"
- **Solution**: Ensure you're using the `service_role` key, not the `anon` key
- **Check**: RLS policies are properly configured

#### ❌ "Table already exists"
- **Solution**: This is normal on re-runs. Migration script handles existing tables
- **Action**: Continue with seeding if needed

#### ❌ "Real-time not working"
- **Solution**: Check that RLS policies allow your operations
- **Verify**: User is properly authenticated

### Debug Mode

Enable detailed logging:

```env
DEBUG=true
NODE_ENV=development
```

### Reset Database

If you need to start fresh:

1. Go to **Settings > General** in Supabase dashboard
2. Click "Reset Database" (⚠️ This deletes all data!)
3. Re-run migration: `npm run db:migrate:supabase`

## 🚀 Step 8: Deploy to Production

### 8.1 Production Environment

```env
# Production settings
NODE_ENV=production
DATABASE_PROVIDER=supabase

# Security
JWT_SECRET=your-super-secure-production-jwt-secret
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Performance
DB_POOL_MAX=50
ENABLE_QUERY_CACHE=true
```

### 8.2 Supabase Production Checklist

- [ ] Enable **Row Level Security** on all tables
- [ ] Review and tighten **RLS policies**
- [ ] Set up **Database backups**
- [ ] Configure **SSL/TLS** properly
- [ ] Monitor **Usage and billing**
- [ ] Set up **Alerts** for high usage

## 📊 Benefits of Supabase Migration

### 🔥 Performance Improvements
- **Connection pooling**: Handle 10x more concurrent users
- **Real-time updates**: Instant UI updates across all clients
- **Optimized queries**: Built-in query optimization
- **Global CDN**: Fast response times worldwide

### 🛡️ Security Enhancements
- **Row Level Security**: Database-level access control
- **Built-in authentication**: OAuth, magic links, and more
- **Automatic SSL**: All connections encrypted
- **SOC 2 compliance**: Enterprise-grade security

### 🔧 Developer Experience
- **SQL Editor**: Write and test queries in the browser
- **Real-time logs**: Debug database operations live
- **Migration history**: Track all database changes
- **Visual schema editor**: Manage tables visually

### 📈 Scalability
- **Auto-scaling**: Handle traffic spikes automatically
- **Global replication**: Multi-region deployments
- **Read replicas**: Distribute read load
- **Connection pooling**: Efficient resource usage

## 🎉 Success!

Your SkyStage platform is now powered by Supabase!

### Next Steps

1. **Test all features** to ensure everything works
2. **Set up monitoring** and alerts
3. **Configure backups** for production
4. **Optimize performance** based on usage patterns
5. **Implement real-time features** for better UX

### Support

- **Documentation**: [docs.supabase.com](https://docs.supabase.com)
- **Community**: [github.com/supabase/supabase](https://github.com/supabase/supabase)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)

---

**🚁 Ready to launch your drone show platform with enterprise-grade infrastructure!**

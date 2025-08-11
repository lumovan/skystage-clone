/**
 * Database initialization script for SkyStage platform
 * This script creates all necessary tables and initial data
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(path.join(dataDir, 'skystage.db'));

console.log('🗄️  Initializing SkyStage database...');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    user_type TEXT CHECK(user_type IN ('customer', 'operator', 'artist', 'admin')) DEFAULT 'customer',
    company_name TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create formations table
db.exec(`
  CREATE TABLE IF NOT EXISTS formations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    thumbnail_url TEXT,
    file_url TEXT,
    drone_count INTEGER NOT NULL,
    duration REAL NOT NULL,
    rating REAL DEFAULT 0.0,
    downloads INTEGER DEFAULT 0,
    price REAL DEFAULT 0.0,
    created_by TEXT NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    tags TEXT, -- JSON array as string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

// Create bookings table
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    event_name TEXT,
    event_date DATE,
    location TEXT,
    budget_range TEXT,
    message TEXT,
    status TEXT CHECK(status IN ('pending', 'quoted', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
    quoted_price REAL,
    operator_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
  )
`);

// Create shows table
db.exec(`
  CREATE TABLE IF NOT EXISTS shows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    formations TEXT, -- JSON array as string
    music_url TEXT,
    total_duration REAL NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    thumbnail_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

// Create formation_favorites table
db.exec(`
  CREATE TABLE IF NOT EXISTS formation_favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    formation_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, formation_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (formation_id) REFERENCES formations(id)
  )
`);

// Create analytics table
db.exec(`
  CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    user_id TEXT,
    metadata TEXT, -- JSON object as string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create payments table
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT,
    user_id TEXT NOT NULL,
    stripe_payment_id TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK(status IN ('pending', 'succeeded', 'failed', 'cancelled')) DEFAULT 'pending',
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create email_subscriptions table
db.exec(`
  CREATE TABLE IF NOT EXISTS email_subscriptions (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_type TEXT DEFAULT 'newsletter',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create initial admin user
function createAdminUser() {
  const adminPassword = 'admin123'; // Change this in production!
  const hashedPassword = bcrypt.hashSync(adminPassword, 10);

  const insertAdmin = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, full_name, user_type, is_verified, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertAdmin.run(
    'admin-001',
    'admin@skystage.local',
    hashedPassword,
    'SkyStage Administrator',
    'admin',
    1,
    1
  );

  console.log('👨‍💼 Created admin user: admin@skystage.local / admin123');
}

// Create sample formations
function createSampleFormations() {
  const formations = [
    {
      id: 'formation-001',
      name: 'Beating Heart',
      description: 'A beautiful pulsating heart formation perfect for romantic events',
      category: 'Love',
      drone_count: 100,
      duration: 47.92,
      rating: 4.8,
      downloads: 1250,
      price: 49.99,
      created_by: 'admin-001',
      tags: '["romantic", "wedding", "proposal", "heart"]'
    },
    {
      id: 'formation-002',
      name: 'Starry Night',
      description: 'Inspired by Van Gogh\'s masterpiece, this formation creates swirling stars',
      category: 'Epic',
      drone_count: 255,
      duration: 10.38,
      rating: 4.9,
      downloads: 890,
      price: 79.99,
      created_by: 'admin-001',
      tags: '["artistic", "epic", "stars", "night"]'
    },
    {
      id: 'formation-003',
      name: 'Wedding Rings',
      description: 'Interlocking rings formation symbolizing eternal love',
      category: 'Wedding',
      drone_count: 75,
      duration: 32.5,
      rating: 4.7,
      downloads: 650,
      price: 39.99,
      created_by: 'admin-001',
      tags: '["wedding", "rings", "marriage", "ceremony"]'
    }
  ];

  const insertFormation = db.prepare(`
    INSERT OR IGNORE INTO formations
    (id, name, description, category, drone_count, duration, rating, downloads, price, created_by, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  formations.forEach(formation => {
    insertFormation.run(
      formation.id,
      formation.name,
      formation.description,
      formation.category,
      formation.drone_count,
      formation.duration,
      formation.rating,
      formation.downloads,
      formation.price,
      formation.created_by,
      formation.tags
    );
  });

  console.log('🎨 Created sample formations');
}

// Create indexes for better performance
function createIndexes() {
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_formations_category ON formations(category)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_formations_created_by ON formations(created_by)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at)');

  console.log('📊 Created database indexes');
}

// Run initialization
function initialize() {
  try {
    createAdminUser();
    createSampleFormations();
    createIndexes();

    console.log('✅ Database initialized successfully!');
    console.log('');
    console.log('🚀 Admin Login Credentials:');
    console.log('   Email: admin@skystage.local');
    console.log('   Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the admin password in production!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

initialize();

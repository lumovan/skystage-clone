
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


#!/usr/bin/env tsx

/**
 * Supabase Database Seeding Script
 * Populates the database with sample data for development and testing
 */

import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import { databaseFactory } from '../src/lib/database/factory';
import { DatabaseConfig } from '../src/lib/database/types';

// Load environment variables
config({ path: '.env.local' });

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Configure Supabase connection
    const dbConfig: DatabaseConfig = {
      provider: 'supabase',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      options: {
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        jwtSecret: process.env.SUPABASE_JWT_SECRET,
      }
    };

    console.log('📡 Connecting to Supabase...');
    const provider = await databaseFactory.initialize(dbConfig);

    console.log('✅ Connected to Supabase successfully');

    // Check if database is already seeded
    const existingUsers = await provider.count('users');
    if (existingUsers > 0) {
      console.log(`⚠️  Database already has ${existingUsers} users. Skipping seeding.`);
      console.log('💡 To force re-seeding, clear the database first.');
      process.exit(0);
    }

    // Seed users
    console.log('👥 Creating users...');
    const users = await seedUsers(provider);

    // Seed organizations
    console.log('🏢 Creating organizations...');
    const organizations = await seedOrganizations(provider, users);

    // Seed formation tags
    console.log('🏷️  Creating formation tags...');
    await seedFormationTags(provider);

    // Seed formations
    console.log('✈️  Creating formations...');
    const formations = await seedFormations(provider, users);

    // Seed shows
    console.log('🎭 Creating shows...');
    await seedShows(provider, users, organizations, formations);

    // Seed bookings
    console.log('📅 Creating bookings...');
    await seedBookings(provider, users, organizations);

    // Create analytics events
    console.log('📊 Creating sample analytics events...');
    await seedAnalyticsEvents(provider, users, formations);

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Sample data created:');
    console.log(`- ${users.length} users (including admin)`);
    console.log(`- ${organizations.length} organizations`);
    console.log(`- 8 formation categories`);
    console.log(`- 12 formation tags`);
    console.log(`- ${formations.length} sample formations`);
    console.log('- Sample shows and bookings');
    console.log('');
    console.log('Default admin credentials:');
    console.log('Email: admin@skystage.com');
    console.log('Password: admin123');

  } catch ($1: unknown) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await databaseFactory.closeAll();
  }
}

async function seedUsers($1: unknown) {
  const users = [
    {
      email: 'admin@skystage.com',
      password: 'admin123',
      full_name: 'SkyStage Admin',
      user_type: 'admin',
      is_verified: true,
      is_active: true,
    },
    {
      email: 'operator@skystage.com',
      password: 'operator123',
      full_name: 'John Smith',
      user_type: 'operator',
      company_name: 'DroneWorks Studios',
      location: 'Los Angeles, CA',
      phone: '+1 555-0123',
      is_verified: true,
      is_active: true,
    },
    {
      email: 'artist@skystage.com',
      password: 'artist123',
      full_name: 'Sarah Johnson',
      user_type: 'artist',
      company_name: 'SkyArt Collective',
      location: 'San Francisco, CA',
      phone: '+1 555-0456',
      is_verified: true,
      is_active: true,
    },
    {
      email: 'customer@skystage.com',
      password: 'customer123',
      full_name: 'Mike Wilson',
      user_type: 'customer',
      company_name: 'EventCorp',
      location: 'New York, NY',
      phone: '+1 555-0789',
      is_verified: true,
      is_active: true,
    },
    {
      email: 'demo@skystage.com',
      password: 'demo123',
      full_name: 'Demo User',
      user_type: 'customer',
      location: 'Demo City',
      is_verified: false,
      is_active: true,
    }
  ];

  const createdUsers = [];

  for (const userData of users) {
    try {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      const { password, ...userDataWithoutPassword } = userData;

      const user = await provider.create('users', {
        ...userDataWithoutPassword,
        password_hash: passwordHash,
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        }
      });

      createdUsers.push(user);
      console.log(`  ✅ User '${user.email}' created`);
    } catch ($1: unknown) {
      console.error(`  ❌ Failed to create user '${userData.email}':`, error.message);
    }
  }

  return createdUsers;
}

async function seedOrganizations(provider: any, users: unknown[]) {
  const operator = users.find(u => u.user_type === 'operator');
  const artist = users.find(u => u.user_type === 'artist');

  if (!operator || !artist) {
    console.log('  ⚠️  Skipping organizations - required users not found');
    return [];
  }

  const organizations = [
    {
      name: 'DroneWorks Studios',
      slug: 'droneworks-studios',
      description: 'Professional drone light show production company specializing in large-scale events',
      website: 'https://droneworks.com',
      email: 'contact@droneworks.com',
      phone: '+1 555-0123',
      address: '123 Drone Street',
      city: 'Los Angeles',
      state: 'CA',
      country: 'United States',
      owner_id: operator.id,
      subscription_plan: 'pro',
      subscription_status: 'active',
      member_count: 15,
      settings: {
        timezone: 'America/Los_Angeles',
        default_drone_count: 100,
        max_show_duration: 1800
      }
    },
    {
      name: 'SkyArt Collective',
      slug: 'skyart-collective',
      description: 'Artist collective specializing in creative aerial formations and artistic expressions',
      website: 'https://skyart.co',
      email: 'hello@skyart.co',
      phone: '+1 555-0456',
      address: '456 Art Avenue',
      city: 'San Francisco',
      state: 'CA',
      country: 'United States',
      owner_id: artist.id,
      subscription_plan: 'basic',
      subscription_status: 'active',
      member_count: 8,
      settings: {
        timezone: 'America/Los_Angeles',
        default_drone_count: 50,
        max_show_duration: 1200
      }
    },
    {
      name: 'TechDrones Inc',
      slug: 'techdrones-inc',
      description: 'Technology-focused drone entertainment for corporate events and product launches',
      website: 'https://techdrones.com',
      email: 'info@techdrones.com',
      address: '789 Tech Boulevard',
      city: 'Austin',
      state: 'TX',
      country: 'United States',
      owner_id: operator.id,
      subscription_plan: 'enterprise',
      subscription_status: 'active',
      member_count: 25,
      settings: {
        timezone: 'America/Chicago',
        default_drone_count: 200,
        max_show_duration: 2400
      }
    }
  ];

  const createdOrganizations = [];

  for (const orgData of organizations) {
    try {
      const organization = await provider.create('organizations', orgData);
      createdOrganizations.push(organization);
      console.log(`  ✅ Organization '${organization.name}' created`);
    } catch ($1: unknown) {
      console.error(`  ❌ Failed to create organization '${orgData.name}':`, error.message);
    }
  }

  return createdOrganizations;
}

async function seedFormationTags($1: unknown) {
  const tags = [
    { name: 'Holiday', slug: 'holiday', color: '#F59E0B' },
    { name: 'Wedding', slug: 'wedding', color: '#EC4899' },
    { name: 'Corporate', slug: 'corporate', color: '#3B82F6' },
    { name: 'Festival', slug: 'festival', color: '#8B5CF6' },
    { name: 'Outdoor', slug: 'outdoor', color: '#10B981' },
    { name: 'Indoor', slug: 'indoor', color: '#6B7280' },
    { name: 'Large Scale', slug: 'large-scale', color: '#EF4444' },
    { name: 'Small Scale', slug: 'small-scale', color: '#F97316' },
    { name: 'Music Sync', slug: 'music-sync', color: '#8B5CF6' },
    { name: 'Interactive', slug: 'interactive', color: '#06B6D4' },
    { name: 'Narrative', slug: 'narrative', color: '#84CC16' },
    { name: 'Abstract', slug: 'abstract', color: '#A855F7' }
  ];

  for (const tagData of tags) {
    try {
      await provider.create('formation_tags', {
        ...tagData,
        usage_count: Math.floor(Math.random() * 50) + 1
      });
      console.log(`  ✅ Tag '${tagData.name}' created`);
    } catch ($1: unknown) {
      console.error(`  ❌ Failed to create tag '${tagData.name}':`, error.message);
    }
  }
}

async function seedFormations(provider: any, users: unknown[]) {
  const operator = users.find(u => u.user_type === 'operator');
  const artist = users.find(u => u.user_type === 'artist');
  const admin = users.find(u => u.user_type === 'admin');

  if (!operator || !artist || !admin) {
    console.log('  ⚠️  Skipping formations - required users not found');
    return [];
  }

  const formations = [
    {
      name: 'New Year Countdown',
      description: 'Spectacular countdown formation with numbers and fireworks effects',
      category: 'celebration',
      drone_count: 500,
      duration: 180,
      price: 25000,
      created_by: operator.id,
      is_public: true,
      tags: 'holiday,large-scale,outdoor,music-sync',
      source: 'manual',
      rating: 4.8,
      download_count: 156
    },
    {
      name: 'Corporate Logo Display',
      description: 'Professional logo formation for corporate events and product launches',
      category: 'corporate',
      drone_count: 150,
      duration: 120,
      price: 8000,
      created_by: operator.id,
      is_public: true,
      tags: 'corporate,small-scale,indoor',
      source: 'manual',
      rating: 4.5,
      download_count: 89
    },
    {
      name: 'Wedding Hearts',
      description: 'Romantic heart-shaped formations perfect for wedding celebrations',
      category: 'celebration',
      drone_count: 100,
      duration: 90,
      price: 5000,
      created_by: artist.id,
      is_public: true,
      tags: 'wedding,small-scale,outdoor,romantic',
      source: 'manual',
      rating: 4.9,
      download_count: 234
    },
    {
      name: 'Abstract Flow',
      description: 'Flowing abstract patterns with smooth transitions and color gradients',
      category: 'abstract',
      drone_count: 200,
      duration: 240,
      price: 12000,
      created_by: artist.id,
      is_public: true,
      tags: 'abstract,music-sync,artistic',
      source: 'manual',
      rating: 4.7,
      download_count: 67
    },
    {
      name: 'Sports Stadium Opening',
      description: 'Dynamic formations for sports events and stadium entertainment',
      category: 'sports',
      drone_count: 300,
      duration: 200,
      price: 18000,
      created_by: admin.id,
      is_public: true,
      tags: 'sports,large-scale,outdoor,energetic',
      source: 'manual',
      rating: 4.6,
      download_count: 123
    },
    {
      name: 'Nature Harmony',
      description: 'Nature-inspired formations featuring trees, flowers, and wildlife',
      category: 'nature',
      drone_count: 180,
      duration: 160,
      price: 10000,
      created_by: artist.id,
      is_public: true,
      tags: 'nature,outdoor,peaceful,organic',
      source: 'manual',
      rating: 4.8,
      download_count: 78
    },
    {
      name: 'Tech Innovation Showcase',
      description: 'Futuristic formations showcasing technology and innovation themes',
      category: 'technology',
      drone_count: 250,
      duration: 180,
      price: 15000,
      created_by: operator.id,
      is_public: true,
      tags: 'technology,corporate,futuristic,interactive',
      source: 'manual',
      rating: 4.4,
      download_count: 45
    },
    {
      name: 'Festival Finale',
      description: 'Grand finale formation perfect for music festivals and large gatherings',
      category: 'entertainment',
      drone_count: 400,
      duration: 300,
      price: 22000,
      created_by: admin.id,
      is_public: true,
      tags: 'festival,large-scale,outdoor,music-sync,finale',
      source: 'manual',
      rating: 4.9,
      download_count: 189
    }
  ];

  const createdFormations = [];

  for (const formationData of formations) {
    try {
      const formation = await provider.create('formations', {
        ...formationData,
        formation_data: {
          frames: generateSampleFrames(formationData.drone_count, formationData.duration),
          fps: 24,
          coordinate_system: 'xyz'
        },
        metadata: {
          difficulty: Math.floor(Math.random() * 5) + 1,
          music_file: 'sample_music.mp3',
          weather_requirements: 'Wind speed < 15mph, No precipitation',
          equipment_needed: ['Ground Control Station', 'Backup Batteries', 'Weather Station']
        }
      });

      createdFormations.push(formation);
      console.log(`  ✅ Formation '${formation.name}' created`);
    } catch ($1: unknown) {
      console.error(`  ❌ Failed to create formation '${formationData.name}':`, error.message);
    }
  }

  return createdFormations;
}

function generateSampleFrames(droneCount: number, duration: number) {
  const frames = [];
  const frameCount = Math.ceil(duration / 4); // One frame every 4 seconds

  for (let f = 0; f < frameCount; f++) {
    const time = (f / frameCount) * duration;
    const positions = [];

    for (let d = 0; d < droneCount; d++) {
      const angle = (d / droneCount) * Math.PI * 2;
      const radius = 10 + Math.sin(time * 0.1) * 5;
      const height = Math.sin(time * 0.05 + d * 0.01) * 8;

      positions.push({
        x: Math.cos(angle) * radius + Math.sin(time * 0.02 + d * 0.1) * 2,
        y: Math.sin(angle) * radius + Math.cos(time * 0.03 + d * 0.1) * 2,
        z: height + 15,
        color: `hsl(${(time * 10 + d * 137.5) % 360}, 70%, 60%)`,
        brightness: 0.8 + Math.sin(time * 0.5 + d * 0.2) * 0.2
      });
    }

    frames.push({ time, positions });
  }

  return frames;
}

async function seedShows(provider: any, users: unknown[], organizations: unknown[], formations: unknown[]) {
  const operator = users.find(u => u.user_type === 'operator');
  const customer = users.find(u => u.user_type === 'customer');
  const organization = organizations[0];

  if (!operator || !customer || !organization || formations.length === 0) {
    console.log('  ⚠️  Skipping shows - required data not found');
    return;
  }

  const shows = [
    {
      title: 'New Year Celebration Spectacular',
      description: 'Grand drone light show for New Year celebration with 500 drones',
      status: 'scheduled',
      event_date: new Date('2024-12-31T23:45:00Z').toISOString(),
      duration: 15,
      location_name: 'Central Park',
      location_address: 'New York, NY 10019',
      location_coordinates: { lat: 40.7829, lng: -73.9654 },
      client_id: customer.id,
      organization_id: organization.id,
      total_drones: 500,
      estimated_cost: 75000,
      formations: [formations[0]?.id],
      crew: [
        { id: operator.id, name: operator.full_name, role: 'Flight Director' },
        { id: 'crew2', name: 'Sarah Chen', role: 'Safety Officer' }
      ],
      safety_clearance: true,
      weather_requirements: 'Wind speed < 15mph, No precipitation',
      created_by: operator.id
    },
    {
      title: 'Corporate Anniversary Show',
      description: 'Elegant drone formation for company 50th anniversary',
      status: 'completed',
      event_date: new Date('2024-11-15T19:00:00Z').toISOString(),
      duration: 8,
      location_name: 'Company Headquarters',
      location_address: 'San Francisco, CA 94105',
      client_id: customer.id,
      organization_id: organization.id,
      total_drones: 150,
      estimated_cost: 25000,
      actual_cost: 23500,
      formations: [formations[1]?.id],
      safety_clearance: true,
      created_by: operator.id
    }
  ];

  for (const showData of shows) {
    try {
      await provider.create('shows', showData);
      console.log(`  ✅ Show '${showData.title}' created`);
    } catch ($1: unknown) {
      console.error(`  ❌ Failed to create show '${showData.title}':`, error.message);
    }
  }
}

async function seedBookings(provider: any, users: unknown[], organizations: unknown[]) {
  const customers = users.filter(u => u.user_type === 'customer');
  const organization = organizations[0];

  if (customers.length === 0 || !organization) {
    console.log('  ⚠️  Skipping bookings - required data not found');
    return;
  }

  const bookings = [
    {
      user_id: customers[0].id,
      organization_id: organization.id,
      contact_name: customers[0].full_name,
      contact_email: customers[0].email,
      contact_phone: customers[0].phone,
      event_name: 'Summer Music Festival',
      event_date: new Date('2024-07-15T20:00:00Z').toISOString(),
      location: 'Golden Gate Park, San Francisco',
      budget_range: '$20,000 - $50,000',
      message: 'Looking for a spectacular drone show for our summer music festival finale.',
      status: 'quoted',
      quoted_price: 35000,
      requirements: {
        duration: 12,
        drone_count: 200,
        music_sync: true,
        special_effects: ['pyrotechnics', 'lasers']
      }
    },
    {
      user_id: customers[0].id,
      contact_name: 'Jennifer Smith',
      contact_email: 'jennifer@events.com',
      contact_phone: '+1 555-0999',
      event_name: 'Product Launch Event',
      event_date: new Date('2024-06-20T18:30:00Z').toISOString(),
      location: 'Convention Center, Las Vegas',
      budget_range: '$10,000 - $25,000',
      message: 'Corporate product launch requiring professional drone display with logo formation.',
      status: 'pending'
    }
  ];

  for (const bookingData of bookings) {
    try {
      await provider.create('bookings', bookingData);
      console.log(`  ✅ Booking for '${bookingData.event_name}' created`);
    } catch ($1: unknown) {
      console.error(`  ❌ Failed to create booking for '${bookingData.event_name}':`, error.message);
    }
  }
}

async function seedAnalyticsEvents(provider: any, users: unknown[], formations: unknown[]) {
  const events = [
    'formation_viewed',
    'formation_downloaded',
    'formation_exported',
    'user_login',
    'user_registration',
    'booking_created',
    'show_created',
    'organization_created'
  ];

  const entities = ['formation', 'user', 'booking', 'show', 'organization'];

  // Create 100 sample analytics events
  for (let i = 0; i < 100; i++) {
    try {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomFormation = formations[Math.floor(Math.random() * formations.length)];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      const randomEntity = entities[Math.floor(Math.random() * entities.length)];

      // Create event within the last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() - daysAgo);

      await provider.create('analytics_events', {
        event_type: randomEvent,
        entity_type: randomEntity,
        entity_id: randomFormation?.id || randomUser.id,
        user_id: randomUser.id,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (compatible; SampleBot/1.0)',
        metadata: {
          browser: 'Chrome',
          platform: 'Web',
          session_duration: Math.floor(Math.random() * 1800) + 300
        },
        created_at: eventDate.toISOString()
      });
    } catch ($1: unknown) {
      // Silently continue on analytics event creation errors
    }
  }

  console.log('  ✅ Sample analytics events created');
}

// Run seeding if script is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };

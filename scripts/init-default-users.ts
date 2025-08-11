#!/usr/bin/env tsx

/**
 * Initialize default users for development and testing
 * Creates admin and demo customer accounts
 */

import { ensureDatabaseConnection } from '../src/lib/database/init';
import { userDb } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function initDefaultUsers() {
  console.log('🔧 Initializing default users...');

  try {
    // Initialize database connection
    await ensureDatabaseConnection();
    console.log('✅ Database connected');

    // Check if admin already exists
    const existingAdmin = await userDb.findByEmail('admin@skystage.local');

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
    } else {
      // Create admin user
      const adminPasswordHash = await hashPassword('admin123');

      await userDb.create({
        email: 'admin@skystage.local',
        password_hash: adminPasswordHash,
        full_name: 'System Administrator',
        user_type: 'admin',
        is_verified: true,
        is_active: true,
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        }
      });

      console.log('✅ Admin user created successfully');
      console.log('   Email: admin@skystage.local');
      console.log('   Password: admin123');
    }

    // Check if demo customer already exists
    const existingDemo = await userDb.findByEmail('demo@skystage.local');

    if (existingDemo) {
      console.log('✅ Demo customer already exists');
    } else {
      // Create demo customer user
      const demoPasswordHash = await hashPassword('demo123');

      await userDb.create({
        email: 'demo@skystage.local',
        password_hash: demoPasswordHash,
        full_name: 'Demo Customer',
        user_type: 'customer',
        company_name: 'Demo Company',
        phone: '+1-555-0123',
        location: 'San Francisco, CA',
        is_verified: true,
        is_active: true,
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        }
      });

      console.log('✅ Demo customer created successfully');
      console.log('   Email: demo@skystage.local');
      console.log('   Password: demo123');
    }

    // Check if test operator already exists
    const existingOperator = await userDb.findByEmail('operator@skystage.local');

    if (existingOperator) {
      console.log('✅ Test operator already exists');
    } else {
      // Create test operator user
      const operatorPasswordHash = await hashPassword('operator123');

      await userDb.create({
        email: 'operator@skystage.local',
        password_hash: operatorPasswordHash,
        full_name: 'Test Operator',
        user_type: 'operator',
        company_name: 'Drone Operations Inc.',
        phone: '+1-555-0456',
        location: 'Los Angeles, CA',
        is_verified: true,
        is_active: true,
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        }
      });

      console.log('✅ Test operator created successfully');
      console.log('   Email: operator@skystage.local');
      console.log('   Password: operator123');
    }

    console.log('\n🎉 Default users initialization complete!');
    console.log('\n📝 Available test accounts:');
    console.log('   Admin: admin@skystage.local / admin123');
    console.log('   Customer: demo@skystage.local / demo123');
    console.log('   Operator: operator@skystage.local / operator123');
    console.log('\n⚠️  Remember to change these passwords in production!');

  } catch (error) {
    console.error('❌ Error initializing default users:', error);
    process.exit(1);
  }
}

// Run the initialization
initDefaultUsers().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

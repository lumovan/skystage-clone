#!/usr/bin/env node

import { userDb } from '../src/lib/db';
import { initializeAppDatabase } from '../src/lib/database/init';
import bcrypt from 'bcryptjs';

async function checkAndFixUsers() {
  console.log('🔍 Checking and fixing user accounts...\n');

  try {
    // Initialize database
    await initializeAppDatabase();
    console.log('✅ Database connected\n');

    // Check existing users
    console.log('📋 Checking existing users...');
    const existingUsers = await userDb.getAll();
    console.log(`Found ${existingUsers.length} users in database\n`);

    if (existingUsers.length > 0) {
      console.log('Existing users:');
      existingUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.user_type})`);
      });
      console.log();
    }

    // Define default users
    const defaultUsers = [
      {
        email: 'admin@skystage.com',
        password: 'admin123',
        full_name: 'Admin User',
        user_type: 'admin' as const,
        company_name: 'SkyStage Admin',
        location: 'Global'
      },
      {
        email: 'demo@skystage.com',
        password: 'demo123',
        full_name: 'Demo User',
        user_type: 'customer' as const,
        company_name: 'Demo Company',
        location: 'USA'
      },
      {
        email: 'operator@skystage.com',
        password: 'operator123',
        full_name: 'Operator User',
        user_type: 'operator' as const,
        company_name: 'Drone Operations Inc',
        location: 'California'
      }
    ];

    // Create or update users
    for (const userData of defaultUsers) {
      const existingUser = await userDb.findByEmail(userData.email);

      if (existingUser) {
        // Update password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await userDb.update(existingUser.id, {
          password_hash: hashedPassword,
          is_verified: true,
          is_active: true
        });
        console.log(`✅ Updated user: ${userData.email} with password: ${userData.password}`);
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await userDb.create({
          email: userData.email,
          password_hash: hashedPassword,
          full_name: userData.full_name,
          user_type: userData.user_type,
          company_name: userData.company_name,
          location: userData.location,
          phone: '',
          is_verified: true,
          is_active: true
        });
        console.log(`✅ Created user: ${userData.email} with password: ${userData.password}`);
      }
    }

    console.log('\n🎉 User accounts fixed successfully!');
    console.log('\n📝 Available login credentials:');
    console.log('👤 Admin: admin@skystage.com / admin123');
    console.log('👤 Demo: demo@skystage.com / demo123');
    console.log('👤 Operator: operator@skystage.com / operator123');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAndFixUsers();

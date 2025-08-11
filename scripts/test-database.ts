#!/usr/bin/env tsx

/**
 * Database Test Script
 * Tests the modular database system and verifies all components work correctly
 */

import { config } from 'dotenv';
import { initializeDatabase, getDatabaseStats, checkDatabaseHealth, closeDatabaseConnections } from '../src/lib/database/factory';
import { userDb, formationDb, organizationDb, dbUtils } from '../src/lib/db';
import { DatabaseConfig } from '../src/lib/database/types';

// Load environment variables
config({ path: '.env.local' });

// Test results tracking
interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  duration: number;
}

const testResults: TestResult[] = [];

// Helper function to run tests
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();

  try {
    console.log(`🧪 Running: ${name}...`);
    await testFn();

    const duration = Date.now() - startTime;
    testResults.push({
      name,
      status: 'passed',
      message: 'Test completed successfully',
      duration
    });

    console.log(`✅ ${name} - Passed (${duration}ms)`);
  } catch ($1: unknown) {
    const duration = Date.now() - startTime;
    testResults.push({
      name,
      status: 'failed',
      message: error.message,
      duration
    });

    console.log(`❌ ${name} - Failed: ${error.message} (${duration}ms)`);
  }
}

async function testDatabaseConnection() {
  const provider = process.env.DATABASE_PROVIDER || 'sqlite';
  console.log(`Testing ${provider} database connection...`);

  // Test basic connection
  const health = await checkDatabaseHealth();
  if (health.status !== 'healthy') {
    throw new Error(`Database unhealthy: ${health.status}`);
  }

  // Test stats
  const stats = getDatabaseStats();
  if (!stats.connected) {
    throw new Error('Database not connected according to stats');
  }

  console.log(`Connected to ${stats.provider} database`);
}

async function testUserOperations() {
  // Test user creation
  const testUser = await userDb.create({
    email: `test-${Date.now()}@example.com`,
    password_hash: 'hashed-password-123',
    full_name: 'Test User',
    user_type: 'customer',
    is_verified: false,
    is_active: true
  });

  if (!testUser.id) {
    throw new Error('User creation failed - no ID returned');
  }

  // Test user retrieval
  const retrievedUser = await userDb.findById(testUser.id);
  if (!retrievedUser || retrievedUser.email !== testUser.email) {
    throw new Error('User retrieval failed');
  }

  // Test user update
  const updatedUser = await userDb.update(testUser.id, {
    full_name: 'Updated Test User',
    is_verified: true
  });

  if (updatedUser.full_name !== 'Updated Test User' || !updatedUser.is_verified) {
    throw new Error('User update failed');
  }

  // Test user search
  const userByEmail = await userDb.findByEmail(testUser.email);
  if (!userByEmail || userByEmail.id !== testUser.id) {
    throw new Error('User search by email failed');
  }

  console.log(`User operations test completed for user: ${testUser.id}`);
}

async function testFormationOperations() {
  // Create a test user first
  const testUser = await userDb.create({
    email: `formation-test-${Date.now()}@example.com`,
    password_hash: 'hashed-password-123',
    full_name: 'Formation Test User',
    user_type: 'artist',
    is_verified: true,
    is_active: true
  });

  // Test formation creation
  const testFormation = await formationDb.create({
    name: `Test Formation ${Date.now()}`,
    description: 'A test formation for database testing',
    category: 'test',
    drone_count: 50,
    duration: 120,
    price: 1000,
    created_by: testUser.id,
    is_public: true,
    tags: 'test,database,verification',
    source: 'manual'
  });

  if (!testFormation.id) {
    throw new Error('Formation creation failed - no ID returned');
  }

  // Test formation retrieval
  const retrievedFormation = await formationDb.getById(testFormation.id);
  if (!retrievedFormation || retrievedFormation.name !== testFormation.name) {
    throw new Error('Formation retrieval failed');
  }

  // Test formation update
  const updatedFormation = await formationDb.update(testFormation.id, {
    name: 'Updated Test Formation',
    price: 1500,
    drone_count: 75
  });

  if (updatedFormation.name !== 'Updated Test Formation' || updatedFormation.price !== 1500) {
    throw new Error('Formation update failed');
  }

  // Test formation search
  const searchResults = await formationDb.search('test', { limit: 10 });
  const foundFormation = searchResults.find(f => f.id === testFormation.id);
  if (!foundFormation) {
    throw new Error('Formation search failed');
  }

  // Test formation by category
  const categoryFormations = await formationDb.getByCategory('test');
  const foundByCategory = categoryFormations.find(f => f.id === testFormation.id);
  if (!foundByCategory) {
    throw new Error('Formation category search failed');
  }

  console.log(`Formation operations test completed for formation: ${testFormation.id}`);
}

async function testOrganizationOperations() {
  // Create a test user first
  const testUser = await userDb.create({
    email: `org-test-${Date.now()}@example.com`,
    password_hash: 'hashed-password-123',
    full_name: 'Organization Test User',
    user_type: 'operator',
    is_verified: true,
    is_active: true
  });

  // Test organization creation
  const testOrg = await organizationDb.create({
    name: `Test Organization ${Date.now()}`,
    slug: `test-org-${Date.now()}`,
    description: 'A test organization for database testing',
    owner_id: testUser.id,
    subscription_plan: 'basic',
    subscription_status: 'active',
    member_count: 1
  });

  if (!testOrg.id) {
    throw new Error('Organization creation failed - no ID returned');
  }

  // Test organization retrieval
  const retrievedOrg = await organizationDb.getById(testOrg.id);
  if (!retrievedOrg || retrievedOrg.name !== testOrg.name) {
    throw new Error('Organization retrieval failed');
  }

  // Test organization by slug
  const orgBySlug = await organizationDb.getBySlug(testOrg.slug);
  if (!orgBySlug || orgBySlug.id !== testOrg.id) {
    throw new Error('Organization slug search failed');
  }

  // Test organization by owner
  const orgsByOwner = await organizationDb.getByOwner(testUser.id);
  const foundByOwner = orgsByOwner.find(o => o.id === testOrg.id);
  if (!foundByOwner) {
    throw new Error('Organization owner search failed');
  }

  console.log(`Organization operations test completed for org: ${testOrg.id}`);
}

async function testBulkOperations() {
  // Create test users
  const testUsers = [];
  for (let i = 0; i < 3; i++) {
    testUsers.push({
      email: `bulk-test-${i}-${Date.now()}@example.com`,
      password_hash: 'hashed-password-123',
      full_name: `Bulk Test User ${i}`,
      user_type: 'customer' as const,
      is_verified: false,
      is_active: true
    });
  }

  // Test bulk user creation
  const createdUsers = await userDb.bulkCreate(testUsers);
  if (createdUsers.length !== testUsers.length) {
    throw new Error(`Bulk create failed - expected ${testUsers.length}, got ${createdUsers.length}`);
  }

  // Test bulk user update
  const updateData = createdUsers.map(user => ({
    id: user.id,
    data: { is_verified: true }
  }));

  const updatedUsers = await userDb.bulkUpdate(updateData);
  if (updatedUsers.length !== createdUsers.length) {
    throw new Error('Bulk update failed');
  }

  // Verify updates
  for (const user of updatedUsers) {
    if (!user.is_verified) {
      throw new Error('Bulk update verification failed');
    }
  }

  console.log(`Bulk operations test completed for ${createdUsers.length} users`);
}

async function testDatabaseStats() {
  const stats = await dbUtils.getStats();

  if (typeof stats.users !== 'number' || stats.users < 0) {
    throw new Error('Invalid user count in stats');
  }

  if (typeof stats.formations !== 'number' || stats.formations < 0) {
    throw new Error('Invalid formation count in stats');
  }

  if (typeof stats.organizations !== 'number' || stats.organizations < 0) {
    throw new Error('Invalid organization count in stats');
  }

  console.log(`Database stats: ${stats.users} users, ${stats.formations} formations, ${stats.organizations} organizations`);
}

async function testProviderSwitching() {
  const currentProvider = process.env.DATABASE_PROVIDER || 'sqlite';
  console.log(`Current provider: ${currentProvider}`);

  // Test that we can get basic stats from current provider
  const health = await checkDatabaseHealth();
  if (health.status !== 'healthy') {
    throw new Error('Provider switching test failed - database not healthy');
  }

  // Test that the factory is working
  const stats = getDatabaseStats();
  if (stats.provider !== currentProvider) {
    throw new Error(`Provider mismatch - expected ${currentProvider}, got ${stats.provider}`);
  }

  console.log(`Provider switching test completed for ${currentProvider}`);
}

async function runAllTests() {
  console.log('🚀 Starting Database Test Suite');
  console.log('==========================================\n');

  try {
    // Initialize database
    console.log('📡 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully\n');

    // Run all tests
    await runTest('Database Connection', testDatabaseConnection);
    await runTest('User Operations', testUserOperations);
    await runTest('Formation Operations', testFormationOperations);
    await runTest('Organization Operations', testOrganizationOperations);
    await runTest('Bulk Operations', testBulkOperations);
    await runTest('Database Stats', testDatabaseStats);
    await runTest('Provider Switching', testProviderSwitching);

  } catch ($1: unknown) {
    console.error('❌ Database initialization failed:', error.message);
    testResults.push({
      name: 'Database Initialization',
      status: 'failed',
      message: error.message,
      duration: 0
    });
  } finally {
    // Close connections
    await closeDatabaseConnections();
    console.log('\n📡 Database connections closed');
  }

  // Print test summary
  console.log('\n==========================================');
  console.log('🧪 Test Summary');
  console.log('==========================================');

  const passed = testResults.filter(t => t.status === 'passed').length;
  const failed = testResults.filter(t => t.status === 'failed').length;
  const skipped = testResults.filter(t => t.status === 'skipped').length;

  console.log(`Total Tests: ${testResults.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.filter(t => t.status === 'failed').forEach(test => {
      console.log(`  - ${test.name}: ${test.message}`);
    });
  }

  const totalDuration = testResults.reduce((sum, test) => sum + test.duration, 0);
  console.log(`\n⏱️  Total Duration: ${totalDuration}ms`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on($1: unknown) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on($1: unknown) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run tests - check if we're being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runAllTests();
}

export { runAllTests };

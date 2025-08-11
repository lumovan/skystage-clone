import { formationDb } from '../src/lib/db';
import { initializeAppDatabase } from '../src/lib/database/init';

async function checkFormations() {
  try {
    console.log('🔍 Initializing database...\n');
    await initializeAppDatabase();

    console.log('🔍 Checking current formations in database...\n');

    const formations = await formationDb.getAll();
    console.log(`📊 Found ${formations.length} formations in database\n`);

    if (formations.length > 0) {
      console.log('📋 Current formations:');
      formations.forEach((formation, index) => {
        console.log(`${index + 1}. ${formation.name} (${formation.drone_count} drones, ${formation.duration}s) - ${formation.category}`);
      });
    } else {
      console.log('❌ No formations found in database');
    }

    console.log('\n✅ Formation check complete');

  } catch (error) {
    console.error('❌ Error checking formations:', error);
    process.exit(1);
  }
}

checkFormations();

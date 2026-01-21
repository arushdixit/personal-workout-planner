import 'fake-indexeddb/auto';
import { db } from '../src/lib/db';

async function clearExercises() {
  try {
    const exerciseCount = await db.exercises.count();
    console.log(`Found ${exerciseCount} exercises in database`);
    
    await db.exercises.clear();
    console.log('✓ Successfully cleared all exercises');
  } catch (error) {
    console.error('Error clearing exercises:', error);
    process.exit(1);
  }
}

clearExercises();
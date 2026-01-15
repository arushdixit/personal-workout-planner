import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface Exercise {
  name: string;
  category: string;
  equipment: string[];
  primary_muscles: string[];
  secondary_muscles: string[];
  instructions: string[];
  description?: string;
  video?: string;
}

interface EnrichedExercise extends Exercise {
  beginner_friendly_instructions?: string[];
  form_cues?: string[];
  common_mistakes?: string[];
  injury_prevention_tips?: string[];
  difficulty?: string;
}

interface BatchOutput {
  name: string;
  beginner_friendly_instructions: string[];
  form_cues: string[];
  common_mistakes: string[];
  injury_prevention_tips: string[];
}

// Load the original exercemus data
const exercemusFile = JSON.parse(
  readFileSync('src/lib/exercemus-data.json', 'utf-8')
);

const originalData: Exercise[] = exercemusFile.exercises || [];

console.log(`📖 Loaded ${originalData.length} exercises from exercemus-data.json`);

// Collect all batch outputs
const batchOutputs: Map<string, BatchOutput> = new Map();

const files = readdirSync('.');
const batchFiles = files.filter(f => f.match(/^batch_\d+_output\.json$/));

console.log(`📦 Found ${batchFiles.length} batch output files`);

for (const file of batchFiles) {
  const batchData: BatchOutput[] = JSON.parse(readFileSync(file, 'utf-8'));

  for (const exercise of batchData) {
    batchOutputs.set(exercise.name, exercise);
  }
}

console.log(`✅ Loaded enrichment data for ${batchOutputs.size} exercises`);

// Merge the data
const enrichedData: EnrichedExercise[] = originalData.map(exercise => {
  const enrichment = batchOutputs.get(exercise.name);

  if (enrichment) {
    return {
      ...exercise,
      beginner_friendly_instructions: enrichment.beginner_friendly_instructions,
      form_cues: enrichment.form_cues,
      common_mistakes: enrichment.common_mistakes,
      injury_prevention_tips: enrichment.injury_prevention_tips,
    };
  }

  return exercise;
});

// Count enriched exercises
const enrichedCount = enrichedData.filter(e => e.beginner_friendly_instructions).length;

console.log(`\n📊 Enrichment Summary:`);
console.log(`   Total exercises: ${enrichedData.length}`);
console.log(`   Enriched: ${enrichedCount} (${((enrichedCount / enrichedData.length) * 100).toFixed(1)}%)`);
console.log(`   Not enriched: ${enrichedData.length - enrichedCount}`);

// Create output with same structure as original
const outputData = {
  categories: exercemusFile.categories,
  equipment: exercemusFile.equipment,
  exercises: enrichedData,
};

// Write the enriched data
writeFileSync(
  'claude-enriched-exercemus-data.json',
  JSON.stringify(outputData, null, 2),
  'utf-8'
);

console.log(`\n✅ Created claude-enriched-exercemus-data.json`);
console.log(`   Size: ${(JSON.stringify(outputData).length / 1024 / 1024).toFixed(2)} MB`);

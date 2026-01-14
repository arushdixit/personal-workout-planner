import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_OPENROUTER_API_KEY;
const MODEL = process.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';

if (!API_KEY) {
    console.error('VITE_OPENROUTER_API_KEY not found in .env');
    process.exit(1);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function checkKeyStatus() {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/key', {
            headers: { 'Authorization': `Bearer ${API_KEY}` },
        });
        const data: any = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error checking key status:', error);
        return null;
    }
}

interface Exercise {
    name: string;
    category?: string;
    description?: string;
    equipment?: string[];
    instructions?: string[];
    primary_muscles?: string[];
    [key: string]: any;
}

async function enrichBatch(exercises: Exercise[]) {
    const exerciseContext = exercises.map(ex => ({
        name: ex.name,
        category: ex.category,
        muscles: ex.primary_muscles?.join(', '),
        equipment: ex.equipment?.join(', '),
        instructions: ex.instructions?.join(' ')
    }));

    const prompt = `You are a science-based fitness expert like Jeff Nippard. Enrich the following ${exercises.length} exercises. 
Make instructions clear, actionable, and science-based. Focus on safety and injury prevention.

Exercises to enrich:
${JSON.stringify(exerciseContext, null, 2)}

For EACH exercise, you MUST return an object in the final array with:
- "name": (Must match the input name exactly)
- "beginner_friendly_instructions": 3-4 very simple, clear steps.
- "form_cues": 3 short cues to remember during the exercise.
- "common_mistakes": 2-3 mistakes to avoid.
- "injury_prevention_tips": 1-2 tips to stay safe.
- "tempo_recommendation": Optimal tempo (e.g., "3-0-1-0") or "" if not applicable.

Return ONLY a valid JSON array containing exactly ${exercises.length} objects.`;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
            }),
        });

        if (response.status === 429) {
            console.warn('Rate limited (429). Waiting 60 seconds...');
            await sleep(60000);
            return enrichBatch(exercises);
        }

        const data: any = await response.json();
        if (!data.choices || !data.choices[0]) {
            console.error('Invalid response from API:', JSON.stringify(data));
            return [];
        }

        const content = data.choices[0].message.content;
        const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();

        try {
            const parsed = JSON.parse(jsonStr);
            const items = Array.isArray(parsed) ? parsed : (parsed.exercises || []);
            return items;
        } catch (e) {
            console.error('Error parsing JSON content:', e);
            return [];
        }
    } catch (error) {
        console.error('Error enriching batch:', error);
        return [];
    }
}

async function main() {
    const CHECKPOINT_FILE = 'enrich_checkpoint.json';
    let enrichedResults: any[] = [];

    if (fs.existsSync(CHECKPOINT_FILE)) {
        enrichedResults = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
    }

    const status = await checkKeyStatus();
    console.log('--- API STATUS ---');
    console.log(`Daily Usage: ${status?.usage_daily} credits`);
    console.log('------------------');

    const rawData = JSON.parse(fs.readFileSync('src/lib/exercemus-data.json', 'utf-8'));
    const classification = JSON.parse(fs.readFileSync('exercise_classification.json', 'utf-8'));

    const alreadyEnrichedNames = new Set(enrichedResults.map(r => r.name));

    // Process EVERYTHING (already filtered for Strength/Stretching in previous step)
    const exercisesToEnrich = rawData.exercises.filter((ex: Exercise) => !alreadyEnrichedNames.has(ex.name));

    if (exercisesToEnrich.length === 0) {
        console.log('Database already fully enriched.');
    } else {
        console.log(`Starting FULL enrichment for ${exercisesToEnrich.length} exercises...`);

        const BATCH_SIZE = 50;
        for (let i = 0; i < exercisesToEnrich.length; i += BATCH_SIZE) {
            const batch = exercisesToEnrich.slice(i, i + BATCH_SIZE);
            console.log(`Processing Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(exercisesToEnrich.length / BATCH_SIZE)}...`);

            const batchResults = await enrichBatch(batch);
            if (Array.isArray(batchResults)) {
                enrichedResults.push(...batchResults);
                fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(enrichedResults, null, 2));
                console.log(`Progress: ${enrichedResults.length}/${rawData.exercises.length}`);
            }

            if (i + BATCH_SIZE < exercisesToEnrich.length) {
                await sleep(10000);
            }
        }
    }

    // Final merge with difficulty level
    const finalData = {
        ...rawData,
        exercises: rawData.exercises.map((ex: Exercise) => {
            const enriched = enrichedResults.find(r => r.name === ex.name);
            const classInfo = classification.find((c: any) => c.name === ex.name);

            if (enriched) {
                return {
                    ...ex,
                    ...enriched,
                    difficulty: classInfo?.difficulty || 'Intermediate'
                };
            }
            return ex;
        })
    };

    fs.writeFileSync('src/lib/enriched-exercemus-data.json', JSON.stringify(finalData, null, 2));
    console.log(`SUCCESS! Total Enriched: ${enrichedResults.length}. File: src/lib/enriched-exercemus-data.json`);
}

main();

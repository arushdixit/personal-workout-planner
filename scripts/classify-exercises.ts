import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_OPENROUTER_API_KEY;
const MODEL = process.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';

if (!API_KEY) {
    console.error('VITE_OPENROUTER_API_KEY not found in .env');
    process.exit(1);
}

async function classifyBatch(names: string[]) {
    const prompt = `Classify the following exercises into difficulty levels: "Beginner", "Intermediate", or "Advanced". 
Focus on identifying exercises that are safe and easy for someone new to the gym to perform with minimal risk of injury.

Exercises:
${names.join('\n')}

Format your response as a JSON array EXACTLY:
[
  {"name": "Exercise Name", "difficulty": "Beginner"},
  ...
]`;

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
                // We'll avoid response_format: { type: 'json_object' } if it forces a root object
            }),
        });

        const data: any = await response.json();
        if (!data.choices || !data.choices[0]) {
            console.error('Invalid response from API:', JSON.stringify(data));
            return [];
        }

        const content = data.choices[0].message.content;
        // Clean markdown code blocks if present
        const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();

        try {
            const parsed = JSON.parse(jsonStr);
            const items = Array.isArray(parsed) ? parsed : (parsed.exercises || parsed.classifications || []);
            console.log(`Received ${items.length} items from batch`);
            return items;
        } catch (e) {
            console.error('Error parsing JSON content:', e);
            console.log('Raw content was:', content);
            return [];
        }
    } catch (error) {
        console.error('Error classifying batch:', error);
        return [];
    }
}

async function main() {
    const names = fs.readFileSync('exercise_names.txt', 'utf-8').split('\n').filter(Boolean);
    const results: any[] = [];
    const BATCH_SIZE = 100;

    for (let i = 0; i < names.length; i += BATCH_SIZE) {
        const batch = names.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${i / BATCH_SIZE + 1} (${batch.length} exercises)...`);
        const batchResults = await classifyBatch(batch);
        if (Array.isArray(batchResults)) {
            results.push(...batchResults);
        } else {
            console.error('batchResults is not an array:', batchResults);
        }
    }

    fs.writeFileSync('exercise_classification.json', JSON.stringify(results, null, 2));
    console.log(`Classification complete! Total results: ${results.length}. Saved to exercise_classification.json`);
}

main();

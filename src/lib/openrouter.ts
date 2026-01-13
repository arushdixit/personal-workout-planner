// OpenRouter API integration for AI-assisted exercise lookup

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ExerciseSuggestion {
    primaryMuscles: string[];
    secondaryMuscles: string[];
    equipment: string;
    repRange: string;
    formCues: string;
}

export async function lookupExercise(exerciseName: string): Promise<ExerciseSuggestion | null> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const model = import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    if (!apiKey || apiKey === 'your_api_key_here') {
        console.warn('OpenRouter API key not configured');
        return null;
    }

    const systemPrompt = `You are a fitness expert. Given an exercise name, provide detailed information about it.
Return ONLY a valid JSON object with no markdown or extra text, using this exact structure:
{
  "primaryMuscles": ["array of primary muscle groups targeted"],
  "secondaryMuscles": ["array of secondary muscle groups"],
  "equipment": "one of: Barbell, Dumbbell, Cable, Machine, Bodyweight, EZ Bar, Kettlebell, Other",
  "repRange": "recommended rep range like 8-12",
  "formCues": "key form tips, max 100 characters"
}

Valid muscle groups: abs, adductors, biceps, calves, chest, deltoids, forearm, gluteal, hamstring, lower-back, neck, obliques, quadriceps, trapezius, triceps, upper-back, tibialis`;

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Pro-Lifts Fitness',
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Exercise: ${exerciseName}` },
                ],
                temperature: 0.3,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            console.error('OpenRouter API error:', response.status);
            return null;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.error('No content in OpenRouter response');
            return null;
        }

        // Parse the JSON response
        const parsed = JSON.parse(content.trim());
        return {
            primaryMuscles: parsed.primaryMuscles || [],
            secondaryMuscles: parsed.secondaryMuscles || [],
            equipment: parsed.equipment || 'Other',
            repRange: parsed.repRange || '8-12',
            formCues: parsed.formCues || '',
        };
    } catch (error) {
        console.error('Failed to lookup exercise:', error);
        return null;
    }
}

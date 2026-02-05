// OpenRouter API integration via secure Supabase Edge Function
import { supabase } from './supabaseClient';

interface ExerciseSuggestion {
    primaryMuscles: string[];
    secondaryMuscles: string[];
    equipment: string;
    repRange: string;
    formCues: string;
}

export async function lookupExercise(exerciseName: string): Promise<ExerciseSuggestion | null> {
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
        const { data, error } = await supabase.functions.invoke('ai-coach', {
            body: {
                messages: [{ role: 'user', content: `Exercise: ${exerciseName}` }],
                systemPrompt,
                model: import.meta.env.VITE_OPENROUTER_MODEL,
                temperature: 0.3
            }
        });

        if (error || !data?.choices || data.choices.length === 0) {
            console.error('Exercise lookup failed via Edge Function:', error);
            return null;
        }

        const content = data.choices[0].message?.content;
        if (!content) return null;

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

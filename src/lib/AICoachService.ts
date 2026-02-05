import { db, UserProfile, Exercise, WorkoutSession, WorkoutSet } from './db';
import { supabase } from './supabaseClient';

export interface CoachContext {
    user: UserProfile;
    sessionInfo?: {
        routineName: string;
        totalExercises: number;
        elapsedTime?: string;
        exercisesProgress?: { name: string; completedCount: number; totalSets: number }[];
    };
    currentExercise?: {
        name: string;
        sets: WorkoutSet[];
        personalNotes?: string;
    };
    recentHistory: {
        last5Sessions: any[];
        relevantFeedback: string[];
    };
}

export interface CoachMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function getCoachResponse(messages: CoachMessage[], context: CoachContext): Promise<string | null> {
    const sessionContext = context.sessionInfo ? `
ACTIVE WORKOUT SESSION:
- Routine: ${context.sessionInfo.routineName}
- Progress: ${context.sessionInfo.exercisesProgress?.map(ex => `[${ex.completedCount}/${ex.totalSets}] ${ex.name}`).join(', ') || 'Just started'}
- Total Exercises: ${context.sessionInfo.totalExercises}
` : '';

    const exerciseContext = context.currentExercise ? `
CURRENT EXERCISE: ${context.currentExercise.name}
- Sets performed so far: ${context.currentExercise.sets.length}
- Recent Set Data: ${JSON.stringify(context.currentExercise.sets)}
- User's Personal Cues: ${context.currentExercise.personalNotes || 'None'}
` : 'The user is resting or between exercises.';

    const systemPrompt = `You are "Pro-Coach", a high-performance fitness coach for the Pro-Lifts app. 
Your tone is professional, encouraging, and emphasizes safety.

USER PROFILE:
- Name: ${context.user.name}
- Biological Context: ${context.user.gender}, ${context.user.age} yrs
- Stats: ${context.user.height}cm, ${context.user.weight}kg
${sessionContext}
${exerciseContext}

RELEVANT HISTORY (Injury/Pain Notes from past 20 sessions):
${context.recentHistory.relevantFeedback.join('\n') || 'No major issues reported recently.'}

PHASE: Active Workout. The user is currently training.

GUIDELINES:
1. Simplify terminology. Instead of RPE, talk about "Reps in Reserve" or "How close to failure".
2. Prioritize safety. If the user mentions pain, suggest alternatives or form adjustments immediately.
3. Be concise. Users are in the middle of a workout.
4. If you lack data to make a recommendation, ask for it politely.
5. Address the user by name occasionally.
`;

    try {
        const { data, error } = await supabase.functions.invoke('ai-coach', {
            body: {
                messages,
                systemPrompt,
                model: import.meta.env.VITE_OPENROUTER_MODEL,
                temperature: 0.7
            }
        });

        if (error) {
            console.error('AICoach: Edge Function error:', error);
            return "I'm having trouble connecting to my brain right now. Please try again in a moment.";
        }

        if (!data?.choices || data.choices.length === 0) {
            console.warn('AICoach: API returned no choices');
            return "I thought of something, but it slipped my mind. Can you repeat that?";
        }

        return data.choices[0].message?.content || null;
    } catch (error) {
        console.error('AICoach: Fetch failed:', error);
        return "Connection lost. I'm here, but I can't hear you clearly. Check your internet.";
    }
}

export async function aggregateCoachContext(
    userId: number,
    exerciseId?: number,
    sessionInfo?: { routineName: string; totalExercises: number }
): Promise<CoachContext | null> {
    const user = await db.users.get(userId);
    if (!user) return null;

    let currentExerciseData;
    if (exerciseId) {
        const exercise = await db.exercises.get(exerciseId);
        if (exercise) {
            currentExerciseData = {
                name: exercise.name,
                sets: [],
                personalNotes: exercise.personalNotes
            };
        }
    }

    const sessions = await db.workout_sessions
        .where('userId')
        .equals(userId)
        .reverse()
        .limit(20)
        .toArray();

    const relevantFeedback: string[] = [];
    sessions.forEach(s => {
        s.exercises.forEach(ex => {
            ex.sets.forEach(set => {
                if (set.feedback?.toLowerCase().includes('pain') ||
                    set.feedback?.toLowerCase().includes('hurt') ||
                    set.feedback?.toLowerCase().includes('tight')) {
                    relevantFeedback.push(`${s.date} [${ex.exerciseName}]: ${set.feedback}`);
                }
            });
        });
    });

    return {
        user,
        sessionInfo,
        currentExercise: currentExerciseData,
        recentHistory: {
            last5Sessions: sessions.slice(0, 5),
            relevantFeedback: relevantFeedback.slice(0, 10)
        }
    };
}

export async function getPerformanceInsights(context: CoachContext): Promise<{ winning: string; warning: string; insight: string } | null> {
    const systemPrompt = `You are "Pro-Coach Analyst". Analyze the user's last 30 days of training.
Based on their stats, volume trends, and feedback, provide exactly 3 sections:
1. WINNING: One positive trend or consistency win.
2. WARNING: One potential risk (skipped days, reported pain, stalling).
3. INSIGHT: One actionable advice (swap exercise, change rep range, etc.).

Keep it brief and encouraging. Use beginner-friendly language.
Return ONLY a valid JSON object:
{
  "winning": "...",
  "warning": "...",
  "insight": "..."
}`;

    try {
        const { data, error } = await supabase.functions.invoke('ai-coach', {
            body: {
                messages: [{ role: 'user', content: "Analyze my progress and give me my 'Coach's Corner' update." }],
                systemPrompt,
                model: import.meta.env.VITE_OPENROUTER_MODEL,
                temperature: 0.5,
                response_format: { type: "json_object" }
            }
        });

        if (error || !data?.choices || data.choices.length === 0) return null;

        const rawContent = data.choices[0].message?.content;
        if (!rawContent) return null;

        const content = JSON.parse(rawContent);
        return {
            winning: content.winning || "Keep showing up!",
            warning: content.warning || "No major issues detected.",
            insight: content.insight || "Consistency is key."
        };
    } catch (error) {
        console.error('Failed to get performance insights:', error);
        return null;
    }
}

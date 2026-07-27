import { db, Exercise, EquipmentType, MuscleGroup } from './db';

const EXERCEMUS_MUSCLE_MAP: Record<string, MuscleGroup> = {
    'abs': 'abs',
    'hamstrings': 'hamstrings',
    'calves': 'calves',
    'adductors': 'adductors',
    'biceps': 'biceps',
    'brachialis': 'biceps',
    'quads': 'quadriceps',
    'shoulders': 'deltoids',
    'chest': 'chest',
    'middle back': 'lats',
    'lats': 'lats',
    'triceps': 'triceps',
    'lower back': 'lower-back',
    'traps': 'traps',
    'abductors': 'glutes',
    'glutes': 'glutes',
    'neck': 'neck',
    'obliques': 'obliques',
    'forearms': 'forearm',
    'tibialis': 'tibialis',
};

const EXERCEMUS_EQUIPMENT_MAP: Record<string, EquipmentType> = {
    'none': 'Bodyweight',
    'ez curl bar': 'EZ Bar',
    'barbell': 'Barbell',
    'dumbbell': 'Dumbbell',
    'machine': 'Machine',
    'cable': 'Cable',
    'kettlebell': 'Kettlebell',
    'bodyweight': 'Bodyweight',
    'pull-up bar': 'Other',
};

function mapMuscles(muscles: string[]): MuscleGroup[] {
    const mapped = muscles
        .map(m => EXERCEMUS_MUSCLE_MAP[m.toLowerCase()] || 'Other')
        .filter(m => m !== 'Other') as MuscleGroup[];
    return Array.from(new Set(mapped));
}

function mapEquipment(exercemusEquip: string[]): EquipmentType {
    for (const eq of exercemusEquip) {
        const mapped = EXERCEMUS_EQUIPMENT_MAP[eq.toLowerCase()];
        if (mapped) return mapped;
    }
    return 'Other';
}

// Lock to prevent concurrent imports
let importInProgress: Promise<void> | null = null;

export async function importExercemusData() {
    // Only run in browser environment
    if (typeof window === 'undefined') {
        console.log('Skipping Exercemus import in non-browser environment');
        return;
    }

    // Check if IndexedDB is available
    if (!window.indexedDB) {
        console.error('IndexedDB is not available in this browser');
        return;
    }

    // If an import is already in progress, wait for it to complete
    if (importInProgress) {
        console.log('Import already in progress, waiting...');
        await importInProgress;
        return;
    }

    // Set the lock IMMEDIATELY before any async operations
    importInProgress = (async () => {
        try {
            console.log('Checking for Exercemus data...');

            // Version of the enriched data - increment this when JSON or custom seeding is updated
            const DATA_VERSION = 7; 

            // Function to seed essential exercise variations and migrate existing routine names
            const runEssentialSeedingAndMigration = async () => {
                const existingMapping = new Map<string, { id: number; inLibrary?: boolean; personalNotes?: string }>();
                const allExisting = await db.exercises.toArray();
                allExisting.forEach(ex => {
                    if (ex.id !== undefined) {
                        existingMapping.set(ex.name.toLowerCase(), {
                            id: ex.id,
                            inLibrary: ex.inLibrary,
                            personalNotes: ex.personalNotes
                        });
                    }
                });

                const NAME_RENAMES: Record<string, string> = {
                    'full range of motion lat pull down': 'Lat Pulldown',
                    'full range of motion lat pulldown': 'Lat Pulldown',
                    'lat pull down': 'Lat Pulldown',
                    'machine shoulder military press': 'Machine Shoulder Press',
                    'military press machine': 'Machine Shoulder Press',
                };

                const ESSENTIAL_EXERCISES: Partial<Exercise>[] = [
                    {
                        name: 'Dumbbell Bench Press',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['triceps', 'deltoids'],
                        equipment: 'Dumbbell',
                        tutorialUrl: 'https://www.youtube.com/embed/VmB1G1K7v94',
                        repRange: '8-12',
                        beginnerFriendlyInstructions: [
                            'Lie flat on the bench holding dumbbells directly over your chest with palms facing forward.',
                            'Lower dumbbells slowly toward mid-chest level until your elbows form a 90-degree angle.',
                            'Press dumbbells straight back up, squeezing your chest at the top.'
                        ],
                        commonMistakes: ['Flaring elbows wide to 90 degrees', 'Bouncing weights off chest'],
                    },
                    {
                        name: 'Dumbbell Incline Bench Press',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['triceps', 'deltoids'],
                        equipment: 'Dumbbell',
                        tutorialUrl: 'https://www.youtube.com/embed/8iPEnn-ltC8',
                        repRange: '8-12',
                        beginnerFriendlyInstructions: [
                            'Set bench angle to 30-45 degrees. Kick dumbbells up to shoulder level as you lie back.',
                            'Lower dumbbells under control toward upper chest.',
                            'Press dumbbells overhead until arms extend, focusing on squeezing upper chest.'
                        ],
                        commonMistakes: ['Setting bench angle too high (shifts load to shoulders)', 'Arching lower back excessively'],
                    },
                    {
                        name: 'Barbell Bench Press',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['triceps', 'deltoids'],
                        equipment: 'Barbell',
                        tutorialUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg',
                        repRange: '6-10',
                        beginnerFriendlyInstructions: [
                            'Grip bar slightly wider than shoulder width. Unrack bar and lower under control to mid-chest.',
                            'Press bar back up, driving through your feet.'
                        ],
                        commonMistakes: ['Flaring elbows out', 'Lifting hips off the bench'],
                    },
                    {
                        name: 'Barbell Incline Bench Press',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['triceps', 'deltoids'],
                        equipment: 'Barbell',
                        tutorialUrl: 'https://www.youtube.com/embed/SrqOu55lrYU',
                        repRange: '6-10',
                        beginnerFriendlyInstructions: [
                            'Set bench to 30-45 degree incline. Unrack bar and lower to upper chest.',
                            'Press bar back up over shoulders under control.'
                        ],
                        commonMistakes: ['Bouncing bar off collarbone', 'Setting bench angle too steep'],
                    },
                    {
                        name: 'Machine Bench Press',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['triceps', 'deltoids'],
                        equipment: 'Machine',
                        tutorialUrl: 'https://www.youtube.com/embed/xUm0BiZCWlQ',
                        repRange: '8-12',
                        beginnerFriendlyInstructions: [
                            'Adjust seat height so handles line up with mid-chest.',
                            'Press handles forward until arms extend, then return slowly for a full stretch.'
                        ],
                        commonMistakes: ['Slamming weight stack', 'Shrugging shoulders during press'],
                    },
                    {
                        name: 'Machine Incline Bench Press',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['triceps', 'deltoids'],
                        equipment: 'Machine',
                        tutorialUrl: 'https://www.youtube.com/embed/4Y2ZdHCOXok',
                        repRange: '8-12',
                        beginnerFriendlyInstructions: [
                            'Adjust seat height so handles align with upper chest.',
                            'Press handles upward along the machine track, focusing on upper chest.'
                        ],
                        commonMistakes: ['Partial range of motion', 'Rounding shoulders forward'],
                    },
                    {
                        name: 'Dumbbell Shoulder Press',
                        primaryMuscles: ['deltoids'],
                        secondaryMuscles: ['triceps', 'traps'],
                        equipment: 'Dumbbell',
                        tutorialUrl: 'https://www.youtube.com/embed/qEwKCR5JCog',
                        repRange: '8-12',
                        beginnerFriendlyInstructions: [
                            'Sit upright with back support. Hold dumbbells at ear height with elbows tucked slightly forward.',
                            'Press dumbbells overhead until arms extend above shoulders.'
                        ],
                        commonMistakes: ['Arching lower back', 'Flaring elbows straight out to sides'],
                    },
                    {
                        name: 'Barbell Shoulder Press',
                        primaryMuscles: ['deltoids'],
                        secondaryMuscles: ['triceps', 'traps'],
                        equipment: 'Barbell',
                        tutorialUrl: 'https://www.youtube.com/embed/2yjwXTZQDDI',
                        repRange: '6-10',
                        beginnerFriendlyInstructions: [
                            'Rest bar on upper chest with grip just outside shoulders.',
                            'Press bar straight overhead, tucking chin back as bar passes face.'
                        ],
                        commonMistakes: ['Leaning back excessively', 'Pressing bar out in front'],
                    },
                    {
                        name: 'Machine Shoulder Press',
                        primaryMuscles: ['deltoids'],
                        secondaryMuscles: ['triceps', 'traps'],
                        equipment: 'Machine',
                        tutorialUrl: 'https://www.youtube.com/embed/WvLMauqrnK8',
                        repRange: '8-12',
                        beginnerFriendlyInstructions: [
                            'Adjust seat so handles are at ear/shoulder level.',
                            'Press handles overhead under control, then lower slowly.'
                        ],
                        commonMistakes: ['Shrugging shoulders', 'Dropping handles too fast'],
                    },
                    {
                        name: 'Dumbbell Flyes',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['deltoids'],
                        equipment: 'Dumbbell',
                        tutorialUrl: 'https://www.youtube.com/embed/eozdVDA78K0',
                        repRange: '10-15',
                        beginnerFriendlyInstructions: [
                            'Lie flat on bench holding dumbbells over chest with elbows slightly bent.',
                            'Lower arms out to sides in wide arc until chest stretches, then hug arms back together.'
                        ],
                        commonMistakes: ['Bending elbows too much turning it into a press', 'Overstretching shoulders'],
                    },
                    {
                        name: 'Cable Flyes',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['deltoids'],
                        equipment: 'Cable',
                        tutorialUrl: 'https://www.youtube.com/embed/Iwe6AmxVf7o',
                        repRange: '10-15',
                        beginnerFriendlyInstructions: [
                            'Set pulleys at chest level. Step forward and hug handles together in wide arc.',
                            'Squeeze chest at middle, then return out to sides under control.'
                        ],
                        commonMistakes: ['Swinging torso for momentum', 'Bending elbows during rep'],
                    },
                    {
                        name: 'Triceps Pushdown',
                        primaryMuscles: ['triceps'],
                        secondaryMuscles: ['forearm'],
                        equipment: 'Cable',
                        tutorialUrl: 'https://www.youtube.com/embed/2-LAMcpzODU',
                        repRange: '10-15',
                        beginnerFriendlyInstructions: [
                            'Pin upper arms to sides of torso. Extend forearms straight down until arms lock out.',
                            'Flex triceps hard at bottom, then return forearms to 90 degrees.'
                        ],
                        commonMistakes: ['Moving upper arms back and forth', 'Leaning body onto cable'],
                    },
                    {
                        name: 'Triceps Overhead Extension (Rope)',
                        primaryMuscles: ['triceps'],
                        secondaryMuscles: ['forearm'],
                        equipment: 'Cable',
                        tutorialUrl: 'https://www.youtube.com/embed/ns-RGsbYepl',
                        repRange: '10-15',
                        beginnerFriendlyInstructions: [
                            'Attach rope to cable, turn around facing away from cable stack.',
                            'Extend forearms overhead until arms lock out, spreading rope ends apart.'
                        ],
                        commonMistakes: ['Flaring elbows out', 'Arching lower back'],
                    },
                    {
                        name: 'Triceps Overhead Extension (Dumbbell)',
                        primaryMuscles: ['triceps'],
                        secondaryMuscles: ['forearm'],
                        equipment: 'Dumbbell',
                        tutorialUrl: 'https://www.youtube.com/embed/_gsUck-766E',
                        repRange: '10-15',
                        beginnerFriendlyInstructions: [
                            'Sit upright holding top head of dumbbell with both hands overhead.',
                            'Lower dumbbell behind head by bending elbows, then press back up overhead.'
                        ],
                        commonMistakes: ['Flaring elbows wide', 'Dropping dumbbell too low behind neck'],
                    },
                    {
                        name: 'Lat Pulldown',
                        primaryMuscles: ['lats'],
                        secondaryMuscles: ['biceps', 'traps'],
                        equipment: 'Cable',
                        tutorialUrl: 'https://www.youtube.com/embed/CAwf7n6Luuc',
                        repRange: '8-12',
                        beginnerFriendlyInstructions: [
                            'Grip bar wider than shoulder width. Pull bar down toward upper chest driving elbows down.',
                            'Slowly extend arms back up until lats fully stretch.'
                        ],
                        commonMistakes: ['Leaning back too far', 'Pulling bar behind neck'],
                    },
                    {
                        name: 'Side Lateral Raise',
                        primaryMuscles: ['deltoids'],
                        secondaryMuscles: ['traps'],
                        equipment: 'Dumbbell',
                        tutorialUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo',
                        repRange: '12-15',
                        beginnerFriendlyInstructions: [
                            'Stand tall with dumbbells at sides. Raise arms out to sides until parallel to floor.',
                            'Lead with elbows and lower slowly under control.'
                        ],
                        commonMistakes: ['Swinging body', 'Raising hands higher than elbows'],
                    },
                    {
                        name: 'Seated Cable Rows',
                        primaryMuscles: ['lats'],
                        secondaryMuscles: ['biceps', 'traps'],
                        equipment: 'Cable',
                        tutorialUrl: 'https://www.youtube.com/embed/GZbfZ033fBo',
                        repRange: '8-12',
                        beginnerFriendlyInstructions: [
                            'Sit with knees slightly bent. Pull handle to lower abdomen squeezing shoulder blades.',
                            'Return forward slowly feeling lats stretch.'
                        ],
                        commonMistakes: ['Rocking torso back and forth', 'Rounding lower back'],
                    },
                    {
                        name: 'Dumbbell Bicep Curl',
                        primaryMuscles: ['biceps'],
                        secondaryMuscles: ['forearm'],
                        equipment: 'Dumbbell',
                        tutorialUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo',
                        repRange: '10-12',
                        beginnerFriendlyInstructions: [
                            'Hold dumbbells at sides with palms forward. Curl up keeping upper arms stationary.',
                            'Lower slowly until arms fully extend.'
                        ],
                        commonMistakes: ['Swinging hips', 'Moving elbows forward'],
                    },
                    {
                        name: 'Face Pull',
                        primaryMuscles: ['deltoids'],
                        secondaryMuscles: ['traps'],
                        equipment: 'Cable',
                        tutorialUrl: 'https://www.youtube.com/embed/eIq5CB9WXac',
                        repRange: '12-15',
                        beginnerFriendlyInstructions: [
                            'Attach rope to upper pulley. Pull rope toward eyes/forehead, spreading rope apart.',
                            'Pause 1 second squeezing rear delts, then return forward slowly.'
                        ],
                        commonMistakes: ['Pulling to chest instead of face', 'Using too much weight'],
                    },
                    {
                        name: 'Hammer Curl',
                        primaryMuscles: ['biceps'],
                        secondaryMuscles: ['forearm'],
                        equipment: 'Dumbbell',
                        tutorialUrl: 'https://www.youtube.com/embed/zC3nLlEvin4',
                        repRange: '10-12',
                        beginnerFriendlyInstructions: [
                            'Hold dumbbells with palms facing each other (neutral grip).',
                            'Curl up keeping thumbs pointing toward ceiling, then lower under control.'
                        ],
                        commonMistakes: ['Swinging shoulders', 'Rotating palms upward'],
                    }
                ];

                const customToPut: Exercise[] = [];
                ESSENTIAL_EXERCISES.forEach(item => {
                    if (!item.name) return;
                    const nameLower = item.name.toLowerCase();
                    const existing = existingMapping.get(nameLower);
                    customToPut.push({
                        ...(existing ? { id: existing.id } : {}),
                        name: item.name,
                        primaryMuscles: (item.primaryMuscles as MuscleGroup[]) || ['chest'],
                        secondaryMuscles: (item.secondaryMuscles as MuscleGroup[]) || [],
                        equipment: item.equipment || 'Dumbbell',
                        source: 'exercemus',
                        category: 'strength',
                        description: `${item.name} exercise tutorial and tracking`,
                        instructions: item.beginnerFriendlyInstructions || [],
                        tips: [],
                        aliases: [],
                        tempo: '2-0-2-0',
                        difficulty: 'Intermediate',
                        beginnerFriendlyInstructions: item.beginnerFriendlyInstructions || [],
                        formCuesArray: [],
                        formCues: '',
                        commonMistakes: item.commonMistakes || [],
                        injuryPreventionTips: [],
                        variationOf: [],
                        tutorialUrl: item.tutorialUrl || '',
                        dataVersion: DATA_VERSION,
                        inLibrary: true,
                        personalNotes: existing?.personalNotes || '',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    });
                });

                if (customToPut.length > 0) {
                    await db.exercises.bulkPut(customToPut);
                }

                // Also rename exercises in user's saved routines
                try {
                    const routines = await db.routines.toArray();
                    for (const routine of routines) {
                        let updated = false;
                        const updatedExercises = routine.exercises.map(ex => {
                            const nameLower = (ex.exerciseName || '').toLowerCase();
                            if (NAME_RENAMES[nameLower]) {
                                updated = true;
                                return { ...ex, exerciseName: NAME_RENAMES[nameLower] };
                            }
                            return ex;
                        });
                        if (updated && routine.id) {
                            await db.routines.update(routine.id, { exercises: updatedExercises });
                        }
                    }
                } catch (err) {
                    console.error('Failed to migrate routine exercise names:', err);
                }
            };

            // ALWAYS execute essential seeding and migration on app launch
            await runEssentialSeedingAndMigration();

            const existingCount = await db.exercises.where('source').equals('exercemus').count();
            const sample = await db.exercises.where('source').equals('exercemus').first();
            const currentVersion = sample?.dataVersion || 0;
            const needsRefresh = !sample || currentVersion < DATA_VERSION || existingCount < 500;

            if (existingCount > 0 && !needsRefresh) {
                console.log('Exercemus data already imported and up to date.');
                return;
            }

            // Capture existing metadata AND IDs to stabilize references
            const existingMapping = new Map<string, { id: number; inLibrary?: boolean; personalNotes?: string }>();
            const allExisting = await db.exercises.toArray();
            allExisting.forEach(ex => {
                if (ex.id !== undefined) {
                    existingMapping.set(ex.name.toLowerCase(), {
                        id: ex.id,
                        inLibrary: ex.inLibrary,
                        personalNotes: ex.personalNotes
                    });
                }
            });

            console.log('Fetching /data/enriched-exercises.json...');
            const baseUrl = typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null' && !window.location.origin.includes('undefined')
                ? window.location.origin
                : 'http://localhost:10000';
            const response = await fetch(`${baseUrl}/data/enriched-exercises.json`).catch(() => null);
            if (!response || !response.ok) {
                console.warn('Could not fetch enriched exercises JSON, skipping import');
                return;
            }
            const data = await response.json();

            if (!data || !data.exercises) {
                console.error('Invalid Exercemus data format:', data);
                return;
            }

            const NAME_RENAMES: Record<string, string> = {
                'full range of motion lat pull down': 'Lat Pulldown',
                'full range of motion lat pulldown': 'Lat Pulldown',
                'lat pull down': 'Lat Pulldown',
                'machine shoulder military press': 'Machine Shoulder Press',
                'military press machine': 'Machine Shoulder Press',
            };

            const exercisesToInsert: Exercise[] = data.exercises.map((ex: any) => {
                const originalName = ex.name || '';
                const normalizedName = NAME_RENAMES[originalName.toLowerCase()] || originalName;
                const nameLower = normalizedName.toLowerCase();
                const existing = existingMapping.get(nameLower);

                return {
                    ...(existing ? { id: existing.id } : {}), // Preserve the ID if it already exists!
                    name: normalizedName,
                    primaryMuscles: mapMuscles(ex.primary_muscles || []),
                    secondaryMuscles: mapMuscles(ex.secondary_muscles || []),
                    equipment: mapEquipment(ex.equipment || []),
                    source: 'exercemus',
                    category: ex.category || 'strength',
                    description: ex.description || '',
                    instructions: ex.instructions || [],
                    tips: ex.tips || [],
                    aliases: ex.aliases || [],
                    tempo: ex.tempo_recommendation || ex.tempo || '',
                    difficulty: ex.difficulty || 'Intermediate',
                    beginnerFriendlyInstructions: ex.beginner_friendly_instructions || [],
                    formCuesArray: ex.form_cues || [],
                    formCues: (ex.form_cues || []).join(', '),
                    commonMistakes: ex.common_mistakes || [],
                    injuryPreventionTips: ex.injury_prevention_tips || [],
                    variationOf: ex.variation_on || ex.variations_on || [],
                    tutorialUrl: ex.video || '',
                    dataVersion: DATA_VERSION, // Track which version of data this is
                    inLibrary: existing?.inLibrary || false,
                    personalNotes: existing?.personalNotes || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
            });

            // Filter out exercises with no name or no primary muscles
            const validExercises = exercisesToInsert.filter(ex => ex.name && ex.primaryMuscles.length > 0);

            // Add essential custom exercises (variations requested by user)
            const ESSENTIAL_EXERCISES: Partial<Exercise>[] = [
                {
                    name: 'Dumbbell Bench Press',
                    primaryMuscles: ['chest'],
                    secondaryMuscles: ['triceps', 'deltoids'],
                    equipment: 'Dumbbell',
                    tutorialUrl: 'https://www.youtube.com/embed/VmB1G1K7v94',
                    repRange: '8-12',
                    beginnerFriendlyInstructions: [
                        'Lie flat on the bench holding dumbbells directly over your chest with palms facing forward.',
                        'Lower dumbbells slowly toward mid-chest level until your elbows form a 90-degree angle.',
                        'Press dumbbells straight back up, squeezing your chest at the top.'
                    ],
                    commonMistakes: ['Flaring elbows wide to 90 degrees', 'Bouncing weights off chest'],
                },
                {
                    name: 'Dumbbell Incline Bench Press',
                    primaryMuscles: ['chest'],
                    secondaryMuscles: ['triceps', 'deltoids'],
                    equipment: 'Dumbbell',
                    tutorialUrl: 'https://www.youtube.com/embed/8iPEnn-ltC8',
                    repRange: '8-12',
                    beginnerFriendlyInstructions: [
                        'Set bench angle to 30-45 degrees. Kick dumbbells up to shoulder level as you lie back.',
                        'Lower dumbbells under control toward upper chest.',
                        'Press dumbbells overhead until arms extend, focusing on squeezing upper chest.'
                    ],
                    commonMistakes: ['Setting bench angle too high (shifts load to shoulders)', 'Arching lower back excessively'],
                },
                {
                    name: 'Barbell Bench Press',
                    primaryMuscles: ['chest'],
                    secondaryMuscles: ['triceps', 'deltoids'],
                    equipment: 'Barbell',
                    tutorialUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg',
                    repRange: '6-10',
                    beginnerFriendlyInstructions: [
                        'Grip bar slightly wider than shoulder width. Unrack bar and lower under control to mid-chest.',
                        'Press bar back up, driving through your feet.'
                    ],
                    commonMistakes: ['Flaring elbows out', 'Lifting hips off the bench'],
                },
                {
                    name: 'Barbell Incline Bench Press',
                    primaryMuscles: ['chest'],
                    secondaryMuscles: ['triceps', 'deltoids'],
                    equipment: 'Barbell',
                    tutorialUrl: 'https://www.youtube.com/embed/SrqOu55lrYU',
                    repRange: '6-10',
                    beginnerFriendlyInstructions: [
                        'Set bench to 30-45 degree incline. Unrack bar and lower to upper chest.',
                        'Press bar back up over shoulders under control.'
                    ],
                    commonMistakes: ['Bouncing bar off collarbone', 'Setting bench angle too steep'],
                },
                {
                    name: 'Machine Bench Press',
                    primaryMuscles: ['chest'],
                    secondaryMuscles: ['triceps', 'deltoids'],
                    equipment: 'Machine',
                    tutorialUrl: 'https://www.youtube.com/embed/xUm0BiZCWlQ',
                    repRange: '8-12',
                    beginnerFriendlyInstructions: [
                        'Adjust seat height so handles line up with mid-chest.',
                        'Press handles forward until arms extend, then return slowly for a full stretch.'
                    ],
                    commonMistakes: ['Slamming weight stack', 'Shrugging shoulders during press'],
                },
                {
                    name: 'Machine Incline Bench Press',
                    primaryMuscles: ['chest'],
                    secondaryMuscles: ['triceps', 'deltoids'],
                    equipment: 'Machine',
                    tutorialUrl: 'https://www.youtube.com/embed/4Y2ZdHCOXok',
                    repRange: '8-12',
                    beginnerFriendlyInstructions: [
                        'Adjust seat height so handles align with upper chest.',
                        'Press handles upward along the machine track, focusing on upper chest.'
                    ],
                    commonMistakes: ['Partial range of motion', 'Rounding shoulders forward'],
                },
                {
                    name: 'Dumbbell Shoulder Press',
                    primaryMuscles: ['deltoids'],
                    secondaryMuscles: ['triceps', 'traps'],
                    equipment: 'Dumbbell',
                    tutorialUrl: 'https://www.youtube.com/embed/qEwKCR5JCog',
                    repRange: '8-12',
                    beginnerFriendlyInstructions: [
                        'Sit upright with back support. Hold dumbbells at ear height with elbows tucked slightly forward.',
                        'Press dumbbells overhead until arms extend above shoulders.'
                    ],
                    commonMistakes: ['Arching lower back', 'Flaring elbows straight out to sides'],
                },
                {
                    name: 'Barbell Shoulder Press',
                    primaryMuscles: ['deltoids'],
                    secondaryMuscles: ['triceps', 'traps'],
                    equipment: 'Barbell',
                    tutorialUrl: 'https://www.youtube.com/embed/2yjwXTZQDDI',
                    repRange: '6-10',
                    beginnerFriendlyInstructions: [
                        'Rest bar on upper chest with grip just outside shoulders.',
                        'Press bar straight overhead, tucking chin back as bar passes face.'
                    ],
                    commonMistakes: ['Leaning back excessively', 'Pressing bar out in front'],
                },
                {
                    name: 'Machine Shoulder Press',
                    primaryMuscles: ['deltoids'],
                    secondaryMuscles: ['triceps', 'traps'],
                    equipment: 'Machine',
                    tutorialUrl: 'https://www.youtube.com/embed/WvLMauqrnK8',
                    repRange: '8-12',
                    beginnerFriendlyInstructions: [
                        'Adjust seat so handles are at ear/shoulder level.',
                        'Press handles overhead under control, then lower slowly.'
                    ],
                    commonMistakes: ['Shrugging shoulders', 'Dropping handles too fast'],
                },
                {
                    name: 'Dumbbell Flyes',
                    primaryMuscles: ['chest'],
                    secondaryMuscles: ['deltoids'],
                    equipment: 'Dumbbell',
                    tutorialUrl: 'https://www.youtube.com/embed/eozdVDA78K0',
                    repRange: '10-15',
                    beginnerFriendlyInstructions: [
                        'Lie flat on bench holding dumbbells over chest with elbows slightly bent.',
                        'Lower arms out to sides in wide arc until chest stretches, then hug arms back together.'
                    ],
                    commonMistakes: ['Bending elbows too much turning it into a press', 'Overstretching shoulders'],
                },
                {
                    name: 'Cable Flyes',
                    primaryMuscles: ['chest'],
                    secondaryMuscles: ['deltoids'],
                    equipment: 'Cable',
                    tutorialUrl: 'https://www.youtube.com/embed/Iwe6AmxVf7o',
                    repRange: '10-15',
                    beginnerFriendlyInstructions: [
                        'Set pulleys at chest level. Step forward and hug handles together in wide arc.',
                        'Squeeze chest at middle, then return out to sides under control.'
                    ],
                    commonMistakes: ['Swinging torso for momentum', 'Bending elbows during rep'],
                },
                {
                    name: 'Triceps Pushdown',
                    primaryMuscles: ['triceps'],
                    secondaryMuscles: ['forearm'],
                    equipment: 'Cable',
                    tutorialUrl: 'https://www.youtube.com/embed/2-LAMcpzODU',
                    repRange: '10-15',
                    beginnerFriendlyInstructions: [
                        'Pin upper arms to sides of torso. Extend forearms straight down until arms lock out.',
                        'Flex triceps hard at bottom, then return forearms to 90 degrees.'
                    ],
                    commonMistakes: ['Moving upper arms back and forth', 'Leaning body onto cable'],
                },
                {
                    name: 'Triceps Overhead Extension (Rope)',
                    primaryMuscles: ['triceps'],
                    secondaryMuscles: ['forearm'],
                    equipment: 'Cable',
                    tutorialUrl: 'https://www.youtube.com/embed/ns-RGsbYepl',
                    repRange: '10-15',
                    beginnerFriendlyInstructions: [
                        'Attach rope to cable, turn around facing away from cable stack.',
                        'Extend forearms overhead until arms lock out, spreading rope ends apart.'
                    ],
                    commonMistakes: ['Flaring elbows out', 'Arching lower back'],
                },
                {
                    name: 'Triceps Overhead Extension (Dumbbell)',
                    primaryMuscles: ['triceps'],
                    secondaryMuscles: ['forearm'],
                    equipment: 'Dumbbell',
                    tutorialUrl: 'https://www.youtube.com/embed/_gsUck-766E',
                    repRange: '10-15',
                    beginnerFriendlyInstructions: [
                        'Sit upright holding top head of dumbbell with both hands overhead.',
                        'Lower dumbbell behind head by bending elbows, then press back up overhead.'
                    ],
                    commonMistakes: ['Flaring elbows wide', 'Dropping dumbbell too low behind neck'],
                },
                {
                    name: 'Lat Pulldown',
                    primaryMuscles: ['lats'],
                    secondaryMuscles: ['biceps', 'traps'],
                    equipment: 'Cable',
                    tutorialUrl: 'https://www.youtube.com/embed/CAwf7n6Luuc',
                    repRange: '8-12',
                    beginnerFriendlyInstructions: [
                        'Grip bar wider than shoulder width. Pull bar down toward upper chest driving elbows down.',
                        'Slowly extend arms back up until lats fully stretch.'
                    ],
                    commonMistakes: ['Leaning back too far', 'Pulling bar behind neck'],
                },
                {
                    name: 'Side Lateral Raise',
                    primaryMuscles: ['deltoids'],
                    secondaryMuscles: ['traps'],
                    equipment: 'Dumbbell',
                    tutorialUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo',
                    repRange: '12-15',
                    beginnerFriendlyInstructions: [
                        'Stand tall with dumbbells at sides. Raise arms out to sides until parallel to floor.',
                        'Lead with elbows and lower slowly under control.'
                    ],
                    commonMistakes: ['Swinging body', 'Raising hands higher than elbows'],
                },
                {
                    name: 'Seated Cable Rows',
                    primaryMuscles: ['lats'],
                    secondaryMuscles: ['biceps', 'traps'],
                    equipment: 'Cable',
                    tutorialUrl: 'https://www.youtube.com/embed/GZbfZ033fBo',
                    repRange: '8-12',
                    beginnerFriendlyInstructions: [
                        'Sit with knees slightly bent. Pull handle to lower abdomen squeezing shoulder blades.',
                        'Return forward slowly feeling lats stretch.'
                    ],
                    commonMistakes: ['Rocking torso back and forth', 'Rounding lower back'],
                },
                {
                    name: 'Dumbbell Bicep Curl',
                    primaryMuscles: ['biceps'],
                    secondaryMuscles: ['forearm'],
                    equipment: 'Dumbbell',
                    tutorialUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo',
                    repRange: '10-12',
                    beginnerFriendlyInstructions: [
                        'Hold dumbbells at sides with palms forward. Curl up keeping upper arms stationary.',
                        'Lower slowly until arms fully extend.'
                    ],
                    commonMistakes: ['Swinging hips', 'Moving elbows forward'],
                },
                {
                    name: 'Face Pull',
                    primaryMuscles: ['deltoids'],
                    secondaryMuscles: ['traps'],
                    equipment: 'Cable',
                    tutorialUrl: 'https://www.youtube.com/embed/eIq5CB9WXac',
                    repRange: '12-15',
                    beginnerFriendlyInstructions: [
                        'Attach rope to upper pulley. Pull rope toward eyes/forehead, spreading rope apart.',
                        'Pause 1 second squeezing rear delts, then return forward slowly.'
                    ],
                    commonMistakes: ['Pulling to chest instead of face', 'Using too much weight'],
                },
                {
                    name: 'Hammer Curl',
                    primaryMuscles: ['biceps'],
                    secondaryMuscles: ['forearm'],
                    equipment: 'Dumbbell',
                    tutorialUrl: 'https://www.youtube.com/embed/zC3nLlEvin4',
                    repRange: '10-12',
                    beginnerFriendlyInstructions: [
                        'Hold dumbbells with palms facing each other (neutral grip).',
                        'Curl up keeping thumbs pointing toward ceiling, then lower under control.'
                    ],
                    commonMistakes: ['Swinging shoulders', 'Rotating palms upward'],
                }
            ];

            ESSENTIAL_EXERCISES.forEach(item => {
                if (!item.name) return;
                const nameLower = item.name.toLowerCase();
                const existing = existingMapping.get(nameLower);
                validExercises.push({
                    ...(existing ? { id: existing.id } : {}),
                    name: item.name,
                    primaryMuscles: (item.primaryMuscles as MuscleGroup[]) || ['chest'],
                    secondaryMuscles: (item.secondaryMuscles as MuscleGroup[]) || [],
                    equipment: item.equipment || 'Dumbbell',
                    source: 'exercemus',
                    category: 'strength',
                    description: `${item.name} exercise tutorial and tracking`,
                    instructions: item.beginnerFriendlyInstructions || [],
                    tips: [],
                    aliases: [],
                    tempo: '2-0-2-0',
                    difficulty: 'Intermediate',
                    beginnerFriendlyInstructions: item.beginnerFriendlyInstructions || [],
                    formCuesArray: [],
                    formCues: '',
                    commonMistakes: item.commonMistakes || [],
                    injuryPreventionTips: [],
                    variationOf: [],
                    tutorialUrl: item.tutorialUrl || '',
                    dataVersion: DATA_VERSION,
                    inLibrary: true,
                    personalNotes: existing?.personalNotes || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            });

            console.log(`Syncing ${validExercises.length} enriched exercises from Exercemus (preserving IDs)...`);

            // Insert/Update in chunks
            const chunkSize = 100;
            let insertedCount = 0;
            for (let i = 0; i < validExercises.length; i += chunkSize) {
                const chunk = validExercises.slice(i, i + chunkSize);
                await db.exercises.bulkPut(chunk); // bulkPut handles both add and update
                insertedCount += chunk.length;
                console.log(`Progress: ${insertedCount}/${validExercises.length} exercises synced`);
            }

            // Migrate exercise names in user's saved routines
            try {
                const routines = await db.routines.toArray();
                for (const routine of routines) {
                    let updated = false;
                    const updatedExercises = routine.exercises.map(ex => {
                        const nameLower = (ex.exerciseName || '').toLowerCase();
                        if (NAME_RENAMES[nameLower]) {
                            updated = true;
                            return { ...ex, exerciseName: NAME_RENAMES[nameLower] };
                        }
                        return ex;
                    });
                    if (updated && routine.id) {
                        await db.routines.update(routine.id, { exercises: updatedExercises });
                    }
                }
            } catch (err) {
                console.error('Failed to migrate routine exercise names:', err);
            }

            console.log('Exercemus enrichment import complete.');
        } catch (error) {
            console.error('CRITICAL: Failed to import Exercemus data:', error);
        } finally {
            // Clear the lock when done
            importInProgress = null;
        }
    })();

    // Wait for the import to complete
    await importInProgress;
}

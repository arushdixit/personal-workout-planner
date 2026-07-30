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

const GLOBAL_NAME_RENAMES: Record<string, string> = {
    // Lat pulldown variations in JSON / DB
    'full range-of-motion lat pulldown': 'Lat Pulldown',
    'full range of motion lat pull down': 'Lat Pulldown',
    'full range of motion lat pulldown': 'Lat Pulldown',
    'full range-of-motion lat pull down': 'Lat Pulldown',
    'lat pull down': 'Lat Pulldown',

    // Shoulder press variations in JSON / DB
    'machine shoulder (military) press': 'Machine Shoulder Press',
    'machine shoulder military press': 'Machine Shoulder Press',
    'military press machine': 'Machine Shoulder Press',

    // Incline bench press in JSON / DB
    'hammer grip incline db bench press': 'Dumbbell Incline Bench Press',
    'incline dumbbell bench press': 'Dumbbell Incline Bench Press',

    // Machine press in JSON / DB
    'leverage chest press': 'Machine Bench Press',
    'leverage incline chest press': 'Machine Incline Bench Press',

    // Cable flyes in JSON / DB
    'flat bench cable flyes': 'Cable Flyes',
    'incline cable flye': 'Cable Flyes',
    'cable chest fly': 'Cable Flyes',

    // Tricep overhead in JSON / DB
    'cable rope overhead triceps extension': 'Triceps Overhead Extension (Rope)',
    'dumbbell one-arm triceps extension': 'Triceps Overhead Extension (Dumbbell)',
    'standing dumbbell triceps extension': 'Triceps Overhead Extension (Dumbbell)',
};

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
            const DATA_VERSION = 15; 

            // Function to seed essential exercise variations and migrate existing routine names
            const runEssentialSeedingAndMigration = async () => {
                // Clean up old duplicates and rename existing entries in db.exercises
                try {
                    const allExercises = await db.exercises.toArray();
                    for (const ex of allExercises) {
                        if (!ex.id || !ex.name) continue;
                        const nameLower = ex.name.toLowerCase();
                        if (GLOBAL_NAME_RENAMES[nameLower]) {
                            const targetName = GLOBAL_NAME_RENAMES[nameLower];
                            const canonical = allExercises.find(e => e.name.toLowerCase() === targetName.toLowerCase() && e.id !== ex.id);
                            if (canonical) {
                                // Delete duplicate old entry
                                await db.exercises.delete(ex.id);
                            } else {
                                // Update name to target
                                await db.exercises.update(ex.id, { name: targetName });
                            }
                        }
                    }
                } catch (err) {
                    console.error('Failed to clean up duplicate exercises:', err);
                }

                const existingMapping = new Map<string, { id: number; inLibrary?: boolean; personalNotes?: string }>();
                const updatedAllExisting = await db.exercises.toArray();
                updatedAllExisting.forEach(ex => {
                    if (ex.id !== undefined) {
                        existingMapping.set(ex.name.toLowerCase(), {
                            id: ex.id,
                            inLibrary: ex.inLibrary,
                            personalNotes: ex.personalNotes
                        });
                    }
                });

                const ESSENTIAL_EXERCISES: Partial<Exercise>[] = [
                    {
                        name: 'Lat Pulldown',
                        primaryMuscles: ['lats'],
                        secondaryMuscles: ['biceps', 'traps'],
                        equipment: 'Cable',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '8-12',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/CAwf7n6Luuc',
                        description: 'Primary compound pull movement for building lat width, upper back density, and pulling strength.',
                        beginnerFriendlyInstructions: [
                            'Adjust the thigh pad on the pulldown machine so your legs are snugly wedged in with feet flat on the floor - imagine locking yourself under a heavy table.',
                            'Reach up and grip the bar slightly wider than shoulder-width using an overhand grip - think of making a wide V with your arms.',
                            'Sit back down, puff your chest up toward the bar like a proud superhero, and pull your shoulder blades down.',
                            'Pull the bar down smoothly to your upper chest/collarbone while driving your elbows straight down toward your back pockets.',
                            'Pause for 1 second at the bottom, then slowly let the bar rise back overhead over 3 seconds until your arms fully extend for a deep lat stretch.'
                        ],
                        formCuesArray: [
                            'Drive with your elbows, not your hands - pretend your hands are just hooks holding the bar',
                            'Keep your chest up and collarbones wide throughout the entire movement',
                            'Depress shoulder blades down first before bending your elbows',
                            'Avoid leaning back more than 15-20 degrees to keep tension squarely on your lats'
                        ],
                        commonMistakes: [
                            'Leaning back excessively into a row - shifts work from lats to lower back and rear delts',
                            'Pulling the bar behind your neck - places severe strain on rotator cuffs and cervical spine',
                            'Using torso momentum/swinging - reduces lat muscle tension and increases injury risk',
                            'Partial reps - failing to let the bar ascend high enough for a full overhead lat stretch'
                        ],
                        injuryPreventionTips: [
                            'Never pull the bar behind your neck; always pull to upper chest/collarbone level',
                            'If you experience shoulder pinching, switch to a neutral-grip (palms facing each other) attachment'
                        ]
                    },
                    {
                        name: 'Machine Shoulder Press',
                        primaryMuscles: ['deltoids'],
                        secondaryMuscles: ['triceps', 'traps'],
                        equipment: 'Machine',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '8-12',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/Wqq43dKW1TU',
                        description: 'Controlled overhead press machine for safely building shoulder mass and vertical pushing power.',
                        beginnerFriendlyInstructions: [
                            'Adjust seat height so the machine handles align beside your ear/chin height when seated.',
                            'Sit back firmly with your spine pressed against the backrest and feet planted on the floor.',
                            'Grip handles overhand and tuck your elbows 45 degrees forward - imagine holding up a shield.',
                            'Press handles straight overhead smoothly until arms extend fully without locking out elbows.',
                            'Lower handles slowly over 3 seconds back to ear height - do not let the weight stack slam.'
                        ],
                        formCuesArray: [
                            'Keep your core tight and ribs down to avoid overarching your lower back',
                            'Push through your palms, keeping wrists stacked directly over elbows',
                            'Maintain a slight forward elbow angle to protect shoulder joints in the scapular plane',
                            'Exhale as you press up, inhale as you lower under control'
                        ],
                        commonMistakes: [
                            'Setting seat too low or high - causes unnatural shoulder joint angles and wrist strain',
                            'Flaring elbows 90 degrees out - puts shoulder impingement risk on the acromion joint',
                            'Arching lower back off pad - turns shoulder press into an incline chest press',
                            'Slamming weight stack - loses muscle tension and causes joint shock'
                        ],
                        injuryPreventionTips: [
                            'Keep elbows slightly in front of your body (scapular plane) at all times',
                            'Avoid locking out elbows aggressively at the top of the press'
                        ]
                    },
                    {
                        name: 'Dumbbell Bench Press',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['triceps', 'deltoids'],
                        equipment: 'Dumbbell',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '8-12',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/VmB1G1K7v94',
                        description: 'Premier chest builder offering full range of motion and joint-friendly freedom.',
                        beginnerFriendlyInstructions: [
                            'Sit at the edge of flat bench holding dumbbells upright on your thighs.',
                            'Lie back smoothly while kicking your knees up to pop dumbbells into chest position.',
                            'Squeeze shoulder blades together like holding a pencil between your shoulders.',
                            'Lower dumbbells slowly toward lower chest level with elbows at a 45-60 degree angle.',
                            'Press dumbbells straight back up in a gentle arc, bringing them together at top without clacking.'
                        ],
                        formCuesArray: [
                            'Tuck shoulder blades into back pockets for a solid foundation',
                            'Keep wrists stacked directly over elbows throughout the arc',
                            'Maintain 45 degree elbow angle relative to torso',
                            'Squeeze chest muscles hard at peak contraction'
                        ],
                        commonMistakes: [
                            'Flaring elbows 90 degrees out - causes severe anterior shoulder stress',
                            'Clacking dumbbells together at top - loses tension on chest',
                            'Lifting feet or glutes off bench - instability reduces pressing power',
                            'Dropping dumbbells quickly - high risk of shoulder tears'
                        ],
                        injuryPreventionTips: [
                            'Always use knee-kick method to get heavy dumbbells into position safely',
                            'If shoulder hurts, reduce depth slightly so elbows stop at bench level'
                        ]
                    },
                    {
                        name: 'Barbell Incline Bench Press',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['triceps', 'deltoids'],
                        equipment: 'Barbell',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '6-10',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/SrqOu55lrYU',
                        description: 'Upper chest mass builder for upper pec density and clavicular chest development.',
                        beginnerFriendlyInstructions: [
                            'Set bench incline to 30-45 degrees. Lie back with eyes directly under bar.',
                            'Grip bar slightly wider than shoulder-width, plant feet firmly on floor.',
                            'Unrack bar and hold over collarbones with arms locked.',
                            'Lower bar under 3-second control until it softly touches upper chest.',
                            'Drive bar back up toward ceiling over your upper chest.'
                        ],
                        formCuesArray: [
                            'Touch upper chest lightly - do not bounce off collarbone',
                            'Drive feet firmly into the floor for leg drive stability',
                            'Keep forearms vertical under the bar at all times',
                            'Focus on pushing your body away from bar into bench'
                        ],
                        commonMistakes: [
                            'Setting bench angle higher than 45 degrees - turns movement into shoulder press',
                            'Bouncing bar off chest - risks sternum injury and removes muscle work',
                            'Flaring elbows wide - strains shoulders',
                            'Uneven pressing - one arm locking out before the other'
                        ],
                        injuryPreventionTips: [
                            'Use safety spotter arms or a human spotter when pressing heavy weight',
                            'Never use a thumbless (suicide) grip on barbell presses'
                        ]
                    },
                    {
                        name: 'Cable Flyes',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['deltoids'],
                        equipment: 'Cable',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '10-15',
                        tempo: '2-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/taI4XduLpTk',
                        description: 'Constant-tension isolation movement for inner chest squeeze and outer chest stretch.',
                        beginnerFriendlyInstructions: [
                            'Set cable pulleys at chest level and grab both handles.',
                            'Step forward with one foot staggered for balance like preparing to walk.',
                            'Bend elbows slightly - imagine hugging a giant oak tree.',
                            'Bring hands together in front of your chest until knuckles almost touch.',
                            'Slowly allow cables to pull arms back out to sides feeling deep chest stretch.'
                        ],
                        formCuesArray: [
                            'Keep elbow angle fixed throughout entire set - do not press',
                            'Squeeze inner chest hard at point of contact',
                            'Maintain tall posture with shoulders back and down',
                            'Control the negative stretch over 2-3 seconds'
                        ],
                        commonMistakes: [
                            'Bending and straightening elbows - turns flye into a cable press',
                            'Using body momentum/swinging - reduces chest activation',
                            'Overextending shoulders behind torso - risks shoulder joint strain',
                            'Letting shoulders roll forward at center - takes tension off chest'
                        ],
                        injuryPreventionTips: [
                            'Do not allow cables to pull elbows behind shoulder plane',
                            'Use lighter weight and focus on maximum chest contraction and stretch'
                        ]
                    },
                    {
                        name: 'Triceps Pushdown',
                        primaryMuscles: ['triceps'],
                        secondaryMuscles: ['forearm'],
                        equipment: 'Cable',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '10-15',
                        tempo: '2-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/2-LAMcpzODU',
                        description: 'Staple triceps isolation exercise targeting the lateral and medial heads.',
                        beginnerFriendlyInstructions: [
                            'Attach rope to high cable pulley and hold handles with palms facing each other.',
                            'Glue your upper arms to the sides of your ribs - pretend holding newspapers under armpits.',
                            'Push hands straight down toward floor until your arms are completely straight.',
                            'Spread rope ends apart at bottom to extra flex triceps.',
                            'Slowly let hands come back up to chest height while upper arms stay motionless.'
                        ],
                        formCuesArray: [
                            'Glued upper arms are key - zero shoulder movement allowed',
                            'Lock out elbows fully at bottom with 1-second peak flex',
                            'Control the return stroke - do not let cable pull hands up fast',
                            'Keep core braced and spine neutral'
                        ],
                        commonMistakes: [
                            'Moving upper arms forward and back - turns triceps exercise into a lat pulldown',
                            'Leaning body over attachment - uses bodyweight instead of triceps',
                            'Flaring elbows wide - reduces long head tricep work',
                            'Partial extension - failing to straighten arms completely at bottom'
                        ],
                        injuryPreventionTips: [
                            'Keep wrists neutral - do not bend wrists backward at bottom lockout',
                            'Avoid using excessive weight that forces shoulder movement'
                        ]
                    },
                    {
                        name: 'Triceps Overhead Extension (Rope)',
                        primaryMuscles: ['triceps'],
                        secondaryMuscles: ['forearm'],
                        equipment: 'Cable',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '10-15',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/GygQhlSf91k',
                        description: 'Overhead triceps movement specifically targeting the long head of the triceps.',
                        beginnerFriendlyInstructions: [
                            'Attach rope to cable, step forward and face away from cable machine.',
                            'Raise hands overhead so rope sits behind your head with elbows pointing forward.',
                            'Stagger your feet like a runner starting stance for strong balance.',
                            'Press rope up and forward until arms fully straighten overhead.',
                            'Slowly lower hands back behind head until you feel deep stretch in back of arms.'
                        ],
                        formCuesArray: [
                            'Point elbows forward, not out to sides',
                            'Emphasize the deep stretch at bottom of rep',
                            'Spread rope ends apart at lockout for peak tricep contraction',
                            'Keep core braced to protect lower back'
                        ],
                        commonMistakes: [
                            'Flaring elbows wide to sides - shifts load off triceps onto shoulders',
                            'Arching lower back under heavy weight - causes lower back strain',
                            'Cutting range of motion short - misses long-head stretch benefit',
                            'Swinging torso - reduces isolation'
                        ],
                        injuryPreventionTips: [
                            'Keep core tight to prevent spinal arching during overhead extension',
                            'If elbow joint clicks, adjust pulley height or switch to dumbbell overhead extension'
                        ]
                    },
                    {
                        name: 'Side Lateral Raise',
                        primaryMuscles: ['deltoids'],
                        secondaryMuscles: ['traps'],
                        equipment: 'Dumbbell',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '12-15',
                        tempo: '2-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo',
                        description: 'Isolation exercise targeting side (lateral) deltoids for shoulder width.',
                        beginnerFriendlyInstructions: [
                            'Stand tall holding dumbbells at sides, feet shoulder-width apart.',
                            'Put a soft bend in your elbows like holding arms out in soft circle.',
                            'Raise dumbbells out to sides until hands reach shoulder height.',
                            'Think about pouring out two water bottles at top of movement.',
                            'Lower dumbbells slowly back down to thighs over 2 seconds.'
                        ],
                        formCuesArray: [
                            'Lead with elbows, not hands',
                            'Keep traps relaxed - do not shrug shoulders toward ears',
                            'Tilt pinkies slightly upward at peak height',
                            'Stop at shoulder height - no need to raise higher'
                        ],
                        commonMistakes: [
                            'Swinging body or hopping knees - uses momentum instead of side delts',
                            'Shrugging traps up - takes work off lateral deltoid',
                            'Raising hands higher than elbows - reduces side delt activation',
                            'Using too heavy weight - leads to poor form and front delt takeover'
                        ],
                        injuryPreventionTips: [
                            'Keep dumbbells slightly in front of body plane (scapular plane)',
                            'Do not use heavy weights that force torso swinging'
                        ]
                    },
                    {
                        name: 'Seated Cable Rows',
                        primaryMuscles: ['lats'],
                        secondaryMuscles: ['biceps', 'traps'],
                        equipment: 'Cable',
                        category: 'strength',
                        difficulty: 'Intermediate',
                        repRange: '8-12',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/7o2oolbmzeI',
                        description: 'Horizontal pull movement for mid-back thickness, lats, and posture strength.',
                        beginnerFriendlyInstructions: [
                            'Sit at row station with feet on footrests and knees soft/slightly bent.',
                            'Reach forward to grab handle and sit tall with proud chest.',
                            'Pull handle toward belly button while driving elbows straight back past ribs.',
                            'Pinch shoulder blades together like squeezing an orange between them.',
                            'Slowly let arms stretch back forward over 3 seconds without rounding lower back.'
                        ],
                        formCuesArray: [
                            'Drive elbows straight back past torso',
                            'Pull to belly button, not upper chest',
                            'Squeeze shoulder blades together at end of row',
                            'Keep spine tall and neutral throughout rep'
                        ],
                        commonMistakes: [
                            'Rocking torso excessively back and forth - uses lower back momentum',
                            'Rounding lower back at stretch - risks spinal disc injury',
                            'Shrugging shoulders up - shifts work to upper traps',
                            'Short reps - failing to let arms fully extend for lat stretch'
                        ],
                        injuryPreventionTips: [
                            'Never round lower back when reaching forward for stretch',
                            'Keep knees slightly bent throughout set to protect hamstrings and lower back'
                        ]
                    },
                    {
                        name: 'Face Pull',
                        primaryMuscles: ['deltoids'],
                        secondaryMuscles: ['traps'],
                        equipment: 'Cable',
                        category: 'strength',
                        difficulty: 'Intermediate',
                        repRange: '12-15',
                        tempo: '2-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/rep-qVOkqgk',
                        description: 'Essential bulletproofing exercise for rear delts, rotator cuff, and posture alignment.',
                        beginnerFriendlyInstructions: [
                            'Set rope on cable machine at eye/upper chest level.',
                            'Hold rope handles with thumbs pointing back toward yourself.',
                            'Step back until cable is taut and stand in strong staggered stance.',
                            'Pull rope directly toward your forehead while pulling hands apart.',
                            'At end of pull, hit a double bicep pose with hands beside ears, then return slowly.'
                        ],
                        formCuesArray: [
                            'Pull to forehead/eyes, not chest',
                            'Rotate hands back past ears at end of pull (external rotation)',
                            'Keep elbows high throughout movement',
                            'Squeeze rear delts and upper back hard at peak'
                        ],
                        commonMistakes: [
                            'Pulling to chest or neck - turns exercise into upright row',
                            'Dropping elbows low - misses rear delt and rotator cuff target',
                            'Using too much weight - leads to body leaning and swinging',
                            'No external rotation - failing to pull hands back past ears'
                        ],
                        injuryPreventionTips: [
                            'Use light to moderate weight - face pull is a posture and shoulder health exercise',
                            'Focus on high quality 1-second hold on every rep'
                        ]
                    },
                    {
                        name: 'Dumbbell Bicep Curl',
                        primaryMuscles: ['biceps'],
                        secondaryMuscles: ['forearm'],
                        equipment: 'Dumbbell',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '10-12',
                        tempo: '2-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/ICAXJVmOJik',
                        description: 'Classic isolation movement for bicep peak and arm hypertrophy.',
                        beginnerFriendlyInstructions: [
                            'Stand tall with dumbbells hanging at sides, palms facing forward.',
                            'Glue upper arms to sides of your torso like they are hinged on a post.',
                            'Curl dumbbells up toward your shoulders by bending elbows only.',
                            'Squeeze biceps hard at top like showing off your muscles.',
                            'Slowly lower dumbbells back down until arms are completely straight.'
                        ],
                        formCuesArray: [
                            'Keep upper arms fixed against sides',
                            'Fully extend arms at bottom - no half reps',
                            'Supinate (turn palms up) as dumbbells ascend',
                            'Avoid hip rock or torso swinging'
                        ],
                        commonMistakes: [
                            'Swinging hips for momentum - takes tension off biceps',
                            'Moving elbows forward during curl - uses front deltoids instead of biceps',
                            'Cutting bottom short - misses full bicep stretch',
                            'Curling wrists inward - causes wrist strain'
                        ],
                        injuryPreventionTips: [
                            'Keep wrists straight and neutral throughout curl',
                            'Do not swing back to lift heavy weights'
                        ]
                    },
                    {
                        name: 'Hammer Curl',
                        primaryMuscles: ['biceps'],
                        secondaryMuscles: ['forearm'],
                        equipment: 'Dumbbell',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '10-12',
                        tempo: '2-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/zC3nLlEvin4',
                        description: 'Neutral-grip bicep curl targeting brachialis and forearm brachioradialis.',
                        beginnerFriendlyInstructions: [
                            'Hold dumbbells at sides with palms facing each other like holding two hammers.',
                            'Keep upper arms stationary against your ribs.',
                            'Curl dumbbells up toward shoulders while keeping thumbs pointing up.',
                            'Squeeze side of upper arms and forearms at peak.',
                            'Lower under control back to straight arms.'
                        ],
                        formCuesArray: [
                            'Maintain neutral grip (palms facing each other) entire rep',
                            'Keep upper arms locked in place',
                            'Full extension at bottom of every rep',
                            'Brace core to prevent swinging'
                        ],
                        commonMistakes: [
                            'Rotating palms upward - turns hammer curl into standard bicep curl',
                            'Swinging body to lift weight',
                            'Flaring elbows outward'
                        ],
                        injuryPreventionTips: [
                            'Avoid wrist strain by holding dumbbells with firm neutral grip'
                        ]
                    },
                    {
                        name: 'EZ-Bar Curl',
                        primaryMuscles: ['biceps'],
                        secondaryMuscles: ['forearm'],
                        equipment: 'EZ Bar',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '10-12',
                        tempo: '2-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/zG2xJ0Q5QtI',
                        description: 'Angled barbell curl providing ergonomic wrist comfort for heavy bicep loading.',
                        beginnerFriendlyInstructions: [
                            'Grip angled ridges of EZ-bar with palms facing slightly inward.',
                            'Stand upright with shoulders back and upper arms pinned to ribs.',
                            'Curl bar up toward chest smoothly.',
                            'Squeeze biceps hard at top of movement.',
                            'Lower bar back down slowly until arms are straight.'
                        ],
                        formCuesArray: [
                            'Use angled bar grips to reduce wrist strain',
                            'Keep elbows stationary at sides',
                            'Full range of motion top to bottom'
                        ],
                        commonMistakes: [
                            'Swinging torso backward',
                            'Lifting elbows forward to cheat weight up'
                        ],
                        injuryPreventionTips: [
                            'The EZ-bar angle protects wrist joints compared to straight barbell'
                        ]
                    },
                    {
                        name: 'Dumbbell Squat',
                        primaryMuscles: ['quadriceps'],
                        secondaryMuscles: ['glutes', 'hamstrings'],
                        equipment: 'Dumbbell',
                        category: 'strength',
                        difficulty: 'Intermediate',
                        repRange: '10-12',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/MeIiIdhvXT4',
                        description: 'Fundamental leg compound exercise for quad mass, glute strength, and core stability.',
                        beginnerFriendlyInstructions: [
                            'Stand with feet shoulder-width apart, holding dumbbells firmly at sides.',
                            'Keep chest up proud like reading logo on your shirt in a mirror.',
                            'Sit back and down like sitting into a low chair.',
                            'Push knees out slightly so they stay in line with toes.',
                            'Push floor away through heels to stand back up straight.'
                        ],
                        formCuesArray: [
                            'Keep chest up and spine neutral',
                            'Push knees outward over toes',
                            'Break parallel depth if mobility permits',
                            'Drive through full foot/heels'
                        ],
                        commonMistakes: [
                            'Knees caving inward (valgus collapse)',
                            'Rounding lower back at bottom',
                            'Heels lifting off ground'
                        ],
                        injuryPreventionTips: [
                            'Keep weight over mid-foot and heels to protect knees'
                        ]
                    },
                    {
                        name: 'Romanian Deadlift',
                        primaryMuscles: ['hamstrings'],
                        secondaryMuscles: ['glutes', 'lower-back'],
                        equipment: 'Barbell',
                        category: 'strength',
                        difficulty: 'Intermediate',
                        repRange: '8-12',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/JCXUYuzwNrM',
                        description: 'Essential hip-hinge builder for posterior chain, hamstrings, and glute tie-ins.',
                        beginnerFriendlyInstructions: [
                            'Hold weight against thighs with feet hip-width apart.',
                            'Unlock knees slightly - keep knees at this soft angle the whole set.',
                            'Push your hips straight back like trying to touch a wall behind you with your glutes.',
                            'Slide weight down close along your shins until hamstrings stretch deep.',
                            'Drive hips forward to stand tall and squeeze glutes at top.'
                        ],
                        formCuesArray: [
                            'Hinge at hips, do not squat',
                            'Keep bar touching or shaving legs',
                            'Flat spine from head to tailbone',
                            'Squeeze glutes hard at lockout'
                        ],
                        commonMistakes: [
                            'Rounding spine - dangerous for lumbar discs',
                            'Bending knees too much - turns movement into conventional squat',
                            'Letting bar drift away from legs - increases lower back torque'
                        ],
                        injuryPreventionTips: [
                            'Never let lower back round; stop descent when hamstrings max out stretch'
                        ]
                    },
                    {
                        name: 'Leg Extensions',
                        primaryMuscles: ['quadriceps'],
                        secondaryMuscles: [],
                        equipment: 'Machine',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '12-15',
                        tempo: '2-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/YyvSfVjQeL0',
                        description: 'Pure isolation for quad rectus femoris and teardrop definition.',
                        beginnerFriendlyInstructions: [
                            'Adjust backrest so knees sit right against edge of seat.',
                            'Place pad against front of lower ankles.',
                            'Grip handles beside seat to pull yourself down firmly.',
                            'Kick legs up until knees straighten, squeezing quads.',
                            'Lower pad slowly back down over 2 seconds.'
                        ],
                        formCuesArray: [
                            'Align knee joint with machine rotation axis',
                            'Flex quads hard at top peak lockout',
                            'Keep hips pressed firmly into seat'
                        ],
                        commonMistakes: [
                            'Lifting hips off seat',
                            'Kicking legs up fast with momentum'
                        ],
                        injuryPreventionTips: [
                            'Do not slam weight at bottom'
                        ]
                    },
                    {
                        name: 'Lying Leg Curls',
                        primaryMuscles: ['hamstrings'],
                        secondaryMuscles: ['calves'],
                        equipment: 'Machine',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '10-15',
                        tempo: '2-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/1Tq3QdYUuHs',
                        description: 'Hamstring isolation exercise for hamstring flexion strength and knee stability.',
                        beginnerFriendlyInstructions: [
                            'Lie face down on bench with pad behind lower calves.',
                            'Hold handles under bench and press hips flat into pad.',
                            'Curl heels up toward glutes as far as possible.',
                            'Squeeze hamstrings hard at top.',
                            'Lower legs back down slowly.'
                        ],
                        formCuesArray: [
                            'Keep hips pressed into pad - do not arch lower back',
                            'Full range of motion'
                        ],
                        commonMistakes: [
                            'Lifting hips up off bench to cheat'
                        ],
                        injuryPreventionTips: [
                            'Control the negative phase to protect hamstring tendons'
                        ]
                    },
                    {
                        name: 'Standing Dumbbell Calf Raise',
                        primaryMuscles: ['calves'],
                        secondaryMuscles: [],
                        equipment: 'Dumbbell',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '15-20',
                        tempo: '2-2-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/ORT4oJ_R8Qs',
                        description: 'Gastrocnemius calf builder utilizing deep stretch and tiptoe peak contraction.',
                        beginnerFriendlyInstructions: [
                            'Stand with balls of feet on step edge and heels hanging over.',
                            'Lower heels down below step level for deep calf stretch.',
                            'Drive up high onto tiptoes like standing on tiptoes to reach top shelf.',
                            'Hold top peak contraction for 1 second.'
                        ],
                        formCuesArray: [
                            'Emphasize full bottom stretch and top peak tiptoe contraction'
                        ],
                        commonMistakes: [
                            'Bouncing fast on reps without stretch or pause'
                        ],
                        injuryPreventionTips: [
                            'Never bounce at bottom of calf stretch to protect Achilles tendon'
                        ]
                    },
                    {
                        name: 'Barbell Hip Thrust',
                        primaryMuscles: ['glutes'],
                        secondaryMuscles: ['hamstrings', 'quadriceps'],
                        equipment: 'Barbell',
                        category: 'strength',
                        difficulty: 'Intermediate',
                        repRange: '10-15',
                        tempo: '2-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/LM8xhLYDplc',
                        description: 'Highest EMG glute activation compound movement for glute growth and lockout power.',
                        beginnerFriendlyInstructions: [
                            'Sit on floor with upper back against sturdy bench.',
                            'Place padded barbell directly over hip crease.',
                            'Plant feet flat, shoulder-width apart.',
                            'Drive through heels to lift hips until body is flat like a table.',
                            'Squeeze glutes hard at top while keeping chin tucked forward.'
                        ],
                        formCuesArray: [
                            'Drive through heels',
                            'Tuck chin slightly forward to avoid lower back arching',
                            'Squeeze glutes hard at top table position'
                        ],
                        commonMistakes: [
                            'Arching lower back instead of driving hips',
                            'Placing feet too far out or too close'
                        ],
                        injuryPreventionTips: [
                            'Always use a thick barbell pad to cushion hip bones'
                        ]
                    },
                    {
                        name: 'Crunches',
                        primaryMuscles: ['abs'],
                        secondaryMuscles: ['obliques'],
                        equipment: 'Bodyweight',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '15-20',
                        tempo: '2-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/NGRKFMKhF8s',
                        description: 'Classic abdominal isolation for upper rectus abdominis flex.',
                        beginnerFriendlyInstructions: [
                            'Lie flat on back with knees bent and feet flat on floor.',
                            'Place fingertips lightly behind ears with elbows pointing out.',
                            'Press lower back into floor and curl shoulders up toward knees.',
                            'Exhale all air at top like blowing out candles.',
                            'Lower back down slowly.'
                        ],
                        formCuesArray: [
                            'Pull ribs toward hips',
                            'Do not pull neck with hands',
                            'Keep lower back pressed flat into floor'
                        ],
                        commonMistakes: [
                            'Yanking neck forward with hands',
                            'Using momentum instead of controlled ab contraction'
                        ],
                        injuryPreventionTips: [
                            'Cross arms over chest if neck feels strained'
                        ]
                    },
                    {
                        name: 'Dumbbell Incline Bench Press',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['triceps', 'deltoids'],
                        equipment: 'Dumbbell',
                        category: 'strength',
                        difficulty: 'Intermediate',
                        repRange: '8-12',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/8iPEnn-ltC8',
                        description: 'Incline dumbbell press for upper chest development and balanced arm stabilization.',
                        beginnerFriendlyInstructions: [
                            'Set bench angle to 30-45 degrees. Kick dumbbells up to shoulder level as you lie back.',
                            'Lower dumbbells under control toward upper chest.',
                            'Press dumbbells overhead until arms extend, focusing on squeezing upper chest.'
                        ],
                        formCuesArray: [
                            'Tuck shoulder blades into bench',
                            'Press in soft arch over upper chest'
                        ],
                        commonMistakes: ['Setting bench angle too high (shifts load to shoulders)', 'Arching lower back excessively'],
                        injuryPreventionTips: ['Use knee kick to position dumbbells safely']
                    },
                    {
                        name: 'Barbell Bench Press',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['triceps', 'deltoids'],
                        equipment: 'Barbell',
                        category: 'strength',
                        difficulty: 'Intermediate',
                        repRange: '6-10',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg',
                        description: 'The classic compound chest exercise for overall pushing power and upper body strength.',
                        beginnerFriendlyInstructions: [
                            'Grip bar slightly wider than shoulder width. Unrack bar and lower under control to mid-chest.',
                            'Press bar back up, driving through your feet.'
                        ],
                        formCuesArray: ['Touch sternum lightly', 'Drive through heels'],
                        commonMistakes: ['Flaring elbows out', 'Lifting hips off the bench'],
                        injuryPreventionTips: ['Use spotter or safety bars']
                    },
                    {
                        name: 'Machine Bench Press',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['triceps', 'deltoids'],
                        equipment: 'Machine',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '8-12',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/xUm0BiZCWlQ',
                        description: 'Guided horizontal chest press for targeted muscle activation and safe heavy pressing.',
                        beginnerFriendlyInstructions: [
                            'Adjust seat height so handles line up with mid-chest.',
                            'Press handles forward until arms extend, then return slowly for a full stretch.'
                        ],
                        formCuesArray: ['Keep chest up', 'Control negative stretch'],
                        commonMistakes: ['Slamming weight stack', 'Shrugging shoulders during press'],
                        injuryPreventionTips: ['Adjust seat correctly before pressing']
                    },
                    {
                        name: 'Machine Incline Bench Press',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['triceps', 'deltoids'],
                        equipment: 'Machine',
                        category: 'strength',
                        difficulty: 'Beginner',
                        repRange: '8-12',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/SrqOu55lrYU',
                        description: 'Guided incline chest press targeting the upper chest fibers.',
                        beginnerFriendlyInstructions: [
                            'Adjust seat height so handles align with upper chest.',
                            'Press handles upward along the machine track, focusing on upper chest.'
                        ],
                        formCuesArray: ['Squeeze upper pecs', 'Keep shoulders down'],
                        commonMistakes: ['Partial range of motion', 'Rounding shoulders forward'],
                        injuryPreventionTips: ['Do not let handles slam at bottom']
                    },
                    {
                        name: 'Dumbbell Shoulder Press',
                        primaryMuscles: ['deltoids'],
                        secondaryMuscles: ['triceps', 'traps'],
                        equipment: 'Dumbbell',
                        category: 'strength',
                        difficulty: 'Intermediate',
                        repRange: '8-12',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/qEwKCR5JCog',
                        description: 'Freeweight overhead press for shoulder roundness and stabilizer strength.',
                        beginnerFriendlyInstructions: [
                            'Sit upright with back support. Hold dumbbells at ear height with elbows tucked slightly forward.',
                            'Press dumbbells overhead until arms extend above shoulders.'
                        ],
                        formCuesArray: ['Keep core braced', 'Press overhead in line with ears'],
                        commonMistakes: ['Arching lower back', 'Flaring elbows straight out to sides'],
                        injuryPreventionTips: ['Keep elbows tucked 45 degrees forward']
                    },
                    {
                        name: 'Barbell Shoulder Press',
                        primaryMuscles: ['deltoids'],
                        secondaryMuscles: ['triceps', 'traps'],
                        equipment: 'Barbell',
                        category: 'strength',
                        difficulty: 'Intermediate',
                        repRange: '6-10',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/2yjwXTZQDDI',
                        description: 'Heavy vertical compound overhead press.',
                        beginnerFriendlyInstructions: [
                            'Rest bar on upper chest with grip just outside shoulders.',
                            'Press bar straight overhead, tucking chin back as bar passes face.'
                        ],
                        formCuesArray: ['Brace core', 'Lock out over shoulders'],
                        commonMistakes: ['Leaning back excessively', 'Pressing bar out in front'],
                        injuryPreventionTips: ['Squeeze glutes and core to stabilize spine']
                    },
                    {
                        name: 'Dumbbell Flyes',
                        primaryMuscles: ['chest'],
                        secondaryMuscles: ['deltoids'],
                        equipment: 'Dumbbell',
                        category: 'strength',
                        difficulty: 'Intermediate',
                        repRange: '10-15',
                        tempo: '2-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/eozdVDA78K0',
                        description: 'Freeweight chest isolation for deep chest stretch.',
                        beginnerFriendlyInstructions: [
                            'Lie flat on bench holding dumbbells over chest with elbows slightly bent.',
                            'Lower arms out to sides in wide arc until chest stretches, then hug arms back together.'
                        ],
                        formCuesArray: ['Maintain fixed elbow bend', 'Hug arms together at top'],
                        commonMistakes: ['Bending elbows too much turning it into a press', 'Overstretching shoulders'],
                        injuryPreventionTips: ['Stop descent when elbows reach bench height']
                    },
                    {
                        name: 'Triceps Overhead Extension (Dumbbell)',
                        primaryMuscles: ['triceps'],
                        secondaryMuscles: ['forearm'],
                        equipment: 'Dumbbell',
                        category: 'strength',
                        difficulty: 'Intermediate',
                        repRange: '10-15',
                        tempo: '3-1-1-0',
                        tutorialUrl: 'https://www.youtube.com/embed/-Vyt2QdsR7E',
                        description: 'Overhead dumbbell extension for long head triceps stretch.',
                        beginnerFriendlyInstructions: [
                            'Sit upright holding top head of dumbbell with both hands overhead.',
                            'Lower dumbbell behind head by bending elbows, then press back up overhead.'
                        ],
                        formCuesArray: ['Keep elbows pointing forward', 'Deep stretch behind neck'],
                        commonMistakes: ['Flaring elbows wide', 'Dropping dumbbell too low behind neck'],
                        injuryPreventionTips: ['Hold dumbbell cup firmly with both hands']
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
                        difficulty: 'Beginner',
                        beginnerFriendlyInstructions: item.beginnerFriendlyInstructions || [],
                        formCuesArray: item.formCuesArray || [],
                        formCues: (item.formCuesArray || []).join(', '),
                        commonMistakes: item.commonMistakes || [],
                        injuryPreventionTips: item.injuryPreventionTips || [],
                        variationOf: [],
                        tutorialUrl: item.tutorialUrl || '',
                        dataVersion: DATA_VERSION,
                        inLibrary: existing?.inLibrary || false,
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
                            if (GLOBAL_NAME_RENAMES[nameLower]) {
                                updated = true;
                                return { ...ex, exerciseName: GLOBAL_NAME_RENAMES[nameLower] };
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

            const exercisesToInsert: Exercise[] = data.exercises.map((ex: any) => {
                const originalName = ex.name || '';
                const normalizedName = GLOBAL_NAME_RENAMES[originalName.toLowerCase()] || originalName;
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
                    tutorialUrl: 'https://www.youtube.com/embed/Wqq43dKW1TU',
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
                    tutorialUrl: 'https://www.youtube.com/embed/taI4XduLpTk',
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
                    tutorialUrl: 'https://www.youtube.com/embed/GygQhlSf91k',
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
                    tutorialUrl: 'https://www.youtube.com/embed/-Vyt2QdsR7E',
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
                    tutorialUrl: 'https://www.youtube.com/embed/7o2oolbmzeI',
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
                    tutorialUrl: 'https://www.youtube.com/embed/ICAXJVmOJik',
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
                    tutorialUrl: 'https://www.youtube.com/embed/rep-qVOkqgk',
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

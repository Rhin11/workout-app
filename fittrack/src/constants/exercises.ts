import {
  buildMuscleTagMap,
  MUSCLE_GROUPS,
  type MuscleGroup,
  type MuscleGroupFilter,
} from './exerciseMuscles';

export const EXERCISE_CATEGORIES = [
  'All',
  'Barbell',
  'Olympic',
  'CrossFit',
  'Dumbbell',
  'Cable',
  'Machines',
  'Smith Machine',
  'Kettlebell',
  'Bodyweight',
] as const;

export { MUSCLE_GROUPS, type MuscleGroup, type MuscleGroupFilter };

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];
export type ExerciseCategoryFilter = Exclude<ExerciseCategory, 'All'>;

export interface ExerciseDefinition {
  name: string;
  category: ExerciseCategoryFilter;
  muscles: MuscleGroupFilter[];
  /** Gym popularity, higher = more commonly performed. Drives default sort order. */
  popularity: number;
  aliases?: string[];
}

const muscleTagMap = buildMuscleTagMap();

/**
 * Gym popularity by exercise name (higher = more popular). Single source of truth —
 * tweak here to adjust ordering. Unlisted exercises default to 0 and fall back to
 * alphabetical, keeping staple compounds above niche/accessory movements.
 */
const POPULARITY: Record<string, number> = {
  // Overall staples
  'Back Squat': 100,
  'Bench Press': 99,
  Deadlift: 98,
  'Incline Bench Press': 96,
  'Barbell Overhead Press': 95,
  'Barbell Row': 94,
  'Pull-Up': 93,
  'Romanian Deadlift': 92,
  'Dumbbell Bench Press': 91,
  'Lat Pulldown': 90,
  'Leg Press': 89,
  'Front Squat': 88,
  'Hip Thrust': 86,
  'Cable Row': 86,
  'Dumbbell Shoulder Press': 86,
  'Seated Cable Row': 85,
  'Leg Extension': 85,
  'Dumbbell Lateral Raise': 85,
  'Barbell Curl': 85,
  'Cable Tricep Pushdown': 85,
  'Bulgarian Split Squat': 84,
  'Incline Dumbbell Press': 84,
  'Chin-Up': 84,
  'Lying Leg Curl': 84,
  'Dumbbell Curl': 84,
  'T-Bar Row': 83,
  Dip: 82,
  'Hammer Curl': 82,
  'Rope Tricep Pushdown': 82,
  Plank: 82,
  'Close-Grip Bench Press': 81,
  'Cable Fly': 80,
  'Push-Up': 80,
  'Dumbbell Row': 80,
  'Walking Lunge': 80,
  'Arnold Press': 80,
  'Cable Face Pull': 80,
  'Skull Crushers': 80,
  'Seated Calf Raise Machine': 80,
  'Seated Leg Curl': 80,
  'Hanging Leg Raise': 80,
  'Barbell Shrug': 80,
  Thruster: 80,
  'Kettlebell Swing': 80,
  // Strong staples
  'Pendlay Row': 78,
  'Goblet Squat': 78,
  'Cable Lateral Raise': 78,
  'Standing Calf Raise Machine': 78,
  'Cable Crunch': 78,
  'Dumbbell Shrug': 78,
  'Power Clean': 78,
  Burpee: 78,
  'Sumo Deadlift': 77,
  'Hack Squat': 76,
  'Ab Wheel Rollout': 76,
  'Cable Curl': 76,
  'Stiff-Leg Deadlift': 76,
  'EZ-Bar Curl': 75,
  'Push Press': 74,
  'Cable Crossover': 74,
  'Overhead Dumbbell Extension': 74,
  'Sit-Up': 74,
  'Box Jump': 74,
  'Clean & Jerk': 74,
  'Good Morning': 72,
  'Chest Press Machine': 72,
  'Dumbbell Tricep Extension': 72,
  'Incline Dumbbell Curl': 72,
  'Russian Twist': 72,
  Snatch: 72,
  Clean: 72,
  'Preacher Curl Machine': 70,
  'Pec Deck': 70,
  'Inverted Row': 70,
  'Cable Pull-Through': 70,
  'Leg Press Calf Raise': 70,
  'Cable Shrug': 70,
  'Crunch': 70,
  'Overhead Squat': 68,
  'Concentration Curl': 68,
  'Nordic Curl': 68,
  'Glute Kickback Machine': 66,
  'Cable Pallof Press': 66,
  'Pistol Squat': 66,
  'Turkish Get-Up': 64,
  'Bodyweight Calf Raise': 62,
};

function inferMuscles(name: string): MuscleGroupFilter[] {
  const n = name.toLowerCase();
  if (n.includes('calf')) return ['Calves'];
  if (n.includes('curl') && !n.includes('leg curl')) return ['Biceps'];
  if (n.includes('tricep') || n.includes('pushdown') || n.includes('skull')) return ['Triceps'];
  if (n.includes('shrug')) return ['Traps'];
  if (n.includes('crunch') || n.includes('plank') || n.includes('sit-up') || n.includes('sit up'))
    return ['Core'];
  if (n.includes('fly') || n.includes('pec') || (n.includes('bench') && !n.includes('step')))
    return ['Chest', 'Triceps', 'Shoulders'];
  if (n.includes('pulldown') || n.includes('pull-up') || n.includes('pull up') || n.includes('row'))
    return ['Back'];
  if (n.includes('lateral raise') || n.includes('overhead press') || n.includes('shoulder press'))
    return ['Shoulders'];
  if (n.includes('leg extension') || n.includes('squat') || n.includes('lunge'))
    return ['Quads'];
  if (n.includes('leg curl') || n.includes('rdl') || n.includes('romanian'))
    return ['Hamstrings'];
  if (n.includes('hip thrust') || n.includes('glute') || n.includes('kickback')) return ['Glutes'];
  if (n.includes('deadlift')) return ['Back', 'Hamstrings', 'Glutes'];
  return ['Full Body'];
}

function tagMuscles(
  exercise: Omit<ExerciseDefinition, 'muscles' | 'popularity'>,
): ExerciseDefinition {
  return {
    ...exercise,
    muscles: muscleTagMap.get(exercise.name) ?? inferMuscles(exercise.name),
    popularity: POPULARITY[exercise.name] ?? 0,
  };
}

function exercises(category: ExerciseCategoryFilter, names: string[]): ExerciseDefinition[] {
  return names.map((name) => tagMuscles({ name, category }));
}

const BARBELL = exercises('Barbell', [
  'Back Squat',
  'Front Squat',
  'Pause Squat',
  'Tempo Squat',
  'Box Squat',
  'Pin Squat',
  'Anderson Squat',
  'Safety Bar Squat',
  'Zercher Squat',
  'Bench Press',
  'Incline Bench Press',
  'Decline Bench Press',
  'Close-Grip Bench Press',
  'Wide-Grip Bench Press',
  'Floor Press',
  'Spoto Press',
  'Deadlift',
  'Sumo Deadlift',
  'Romanian Deadlift',
  'Stiff-Leg Deadlift',
  'Deficit Deadlift',
  'Block Pull',
  'Rack Pull',
  'Barbell Row',
  'Pendlay Row',
  'Yates Row',
  'T-Bar Row',
  'Barbell Overhead Press',
  'Push Press',
  'Behind-the-Neck Press',
  'Barbell Curl',
  'EZ-Bar Curl',
  'Skull Crushers',
  'Barbell Tricep Extension',
  'Good Morning',
  'Hip Thrust',
  'Barbell Glute Bridge',
  'Barbell Lunge',
  'Walking Barbell Lunge',
  'Reverse Barbell Lunge',
  'Barbell Step-Up',
  'Barbell Shrug',
  'Barbell Calf Raise',
  'Landmine Press',
  'Landmine Row',
  'Landmine Rotation',
  'Barbell Rollout',
  'Barbell Hack Squat',
  'Jefferson Deadlift',
  'Barbell Split Squat',
]);

const OLYMPIC = exercises('Olympic', [
  'Snatch',
  'Power Snatch',
  'Muscle Snatch',
  'Hang Snatch',
  'Hang Power Snatch',
  'Block Snatch',
  'Squat Snatch',
  'Snatch Balance',
  'Snatch Pull',
  'Snatch High Pull',
  'Snatch Deadlift',
  'Clean',
  'Power Clean',
  'Hang Clean',
  'Hang Power Clean',
  'Block Clean',
  'Squat Clean',
  'Clean Pull',
  'Clean High Pull',
  'Clean Deadlift',
  'Clean & Jerk',
  'Split Jerk',
  'Push Jerk',
  'Power Jerk',
  'Jerk',
  'Jerk Dip Squat',
  'Overhead Squat',
  'Snatch Grip Deadlift',
  'Snatch Grip Romanian Deadlift',
  'Tall Clean',
  'Tall Snatch',
  'No-Feet Snatch',
  'No-Feet Clean',
  'Pause Snatch',
  'Pause Clean',
  'Segment Snatch',
  'Segment Clean',
]);

const CROSSFIT = exercises('CrossFit', [
  'Thruster',
  'Wall Ball',
  'Burpee',
  'Bar-Facing Burpee',
  'Box Jump',
  'Box Jump Over',
  'Box Step-Up',
  'Box Step-Over',
  'Toes-to-Bar',
  'Kipping Pull-Up',
  'Strict Pull-Up',
  'Chest-to-Bar Pull-Up',
  'Butterfly Pull-Up',
  'Muscle-Up',
  'Ring Muscle-Up',
  'Bar Muscle-Up',
  'Handstand Push-Up',
  'Strict Handstand Push-Up',
  'Handstand Walk',
  'Rope Climb',
  'Legless Rope Climb',
  'Double Under',
  'Single Under',
  'Devil Press',
  'Man Maker',
  'Turkish Get-Up',
  'Farmer Carry',
  'Overhead Carry',
  'Front Rack Carry',
  'Sled Push',
  'Sled Pull',
  'Assault Bike',
  'Row Erg',
  'Ski Erg',
  'Echo Bike',
  'Air Squat',
  'Pistol Squat',
  'GHD Sit-Up',
  'GHD Hip Extension',
  'GHD Back Extension',
  'Sandbag Clean',
  'Sandbag Carry',
  'Sandbag Over Shoulder',
  'D-Ball Clean',
  'D-Ball Carry',
  'Medicine Ball Clean',
  'Medicine Ball Slam',
  'Ball Slam',
  'Wall Walk',
  'Ring Row',
  'Ring Dip',
  'L-Sit',
  'V-Up',
  'Sit-Up',
  'Bear Complex',
  'Cluster',
  'Overhead Walking Lunge',
  'Dumbbell Snatch',
  'Alternating Dumbbell Snatch',
  'Dumbbell Box Step-Up',
  'Dumbbell Devil Press',
  'Kettlebell Swing',
  'American Kettlebell Swing',
  'Russian Kettlebell Swing',
  'Kettlebell Snatch',
  'Kettlebell Clean',
  'Kettlebell Thruster',
  'Burpee Box Jump Over',
  'Burpee Pull-Up',
  'Burpee Over Bar',
  'Running',
  'Shuttle Run',
  'Sprint',
  'Swimming',
  'Bike Erg',
]);

const DUMBBELL = exercises('Dumbbell', [
  'Dumbbell Bench Press',
  'Incline Dumbbell Press',
  'Decline Dumbbell Press',
  'Dumbbell Fly',
  'Incline Dumbbell Fly',
  'Dumbbell Pullover',
  'Dumbbell Row',
  'Single-Arm Dumbbell Row',
  'Renegade Row',
  'Chest-Supported Dumbbell Row',
  'Dumbbell Shoulder Press',
  'Arnold Press',
  'Seated Dumbbell Press',
  'Dumbbell Lateral Raise',
  'Dumbbell Front Raise',
  'Dumbbell Rear Delt Fly',
  'Dumbbell Shrug',
  'Dumbbell Curl',
  'Hammer Curl',
  'Incline Dumbbell Curl',
  'Concentration Curl',
  'Dumbbell Tricep Extension',
  'Overhead Dumbbell Extension',
  'Dumbbell Kickback',
  'Goblet Squat',
  'Dumbbell Lunges',
  'Walking Dumbbell Lunge',
  'Reverse Dumbbell Lunge',
  'Bulgarian Split Squat',
  'Dumbbell Romanian Deadlift',
  'Dumbbell Stiff-Leg Deadlift',
  'Dumbbell Step-Up',
  'Dumbbell Thruster',
  'Dumbbell Snatch',
  'Dumbbell Clean',
  'Dumbbell Floor Press',
  'Dumbbell Hex Press',
  'Crush Grip Dumbbell Press',
  'Dumbbell Hip Thrust',
  'Dumbbell Glute Bridge',
  'Dumbbell Calf Raise',
  'Dumbbell Wood Chop',
  'Dumbbell Side Bend',
  'Dumbbell Pullover Row',
  'Dumbbell Bench Step-Up',
  'Dumbbell Sumo Squat',
  'Dumbbell Split Squat',
]);

const CABLE = exercises('Cable', [
  'Cable Crossover',
  'Low Cable Crossover',
  'High Cable Crossover',
  'Cable Fly',
  'Incline Cable Fly',
  'Decline Cable Fly',
  'Cable Bench Press',
  'Single-Arm Cable Press',
  'Cable Row',
  'Seated Cable Row',
  'Single-Arm Cable Row',
  'Wide-Grip Cable Row',
  'Close-Grip Cable Row',
  'Lat Pulldown',
  'Wide-Grip Lat Pulldown',
  'Close-Grip Lat Pulldown',
  'Neutral-Grip Lat Pulldown',
  'Straight-Arm Pulldown',
  'Cable Pullover',
  'Cable Curl',
  'Rope Hammer Curl',
  'Bayesian Cable Curl',
  'Cable Tricep Pushdown',
  'Rope Tricep Pushdown',
  'Reverse-Grip Tricep Pushdown',
  'Overhead Cable Extension',
  'Cable Lateral Raise',
  'Cable Front Raise',
  'Cable Rear Delt Fly',
  'Cable Face Pull',
  'Cable Wood Chop',
  'Cable Crunch',
  'Kneeling Cable Crunch',
  'Cable Pull-Through',
  'Cable Kickback',
  'Cable Glute Kickback',
  'Standing Cable Leg Curl',
  'Cable Hip Abduction',
  'Cable Hip Adduction',
  'Cable Shrug',
  'Cable Upright Row',
  'Cable Bicep Curl',
  'Cable Overhead Tricep Extension',
  'Cable Internal Rotation',
  'Cable External Rotation',
  'Cable Pallof Press',
  'Cable Deadlift',
  'Cable Squat',
  'Cable Lunge',
  'Cable Row to Hip',
  'Cable High Row',
  'Cable Low Row',
]);

const MACHINES = exercises('Machines', [
  'Leg Press',
  'Hack Squat',
  'Belt Squat',
  'Pendulum Squat',
  'Leg Extension',
  'Lying Leg Curl',
  'Seated Leg Curl',
  'Standing Leg Curl',
  'Hip Abductor Machine',
  'Hip Adductor Machine',
  'Chest Press Machine',
  'Incline Chest Press Machine',
  'Decline Chest Press Machine',
  'Pec Deck',
  'Machine Fly',
  'Shoulder Press Machine',
  'Lateral Raise Machine',
  'Rear Delt Machine',
  'Lat Pulldown Machine',
  'Seated Row Machine',
  'Chest-Supported Row Machine',
  'T-Bar Row Machine',
  'Assisted Pull-Up Machine',
  'Assisted Dip Machine',
  'Preacher Curl Machine',
  'Tricep Dip Machine',
  'Seated Calf Raise Machine',
  'Standing Calf Raise Machine',
  'Donkey Calf Raise Machine',
  'Glute Kickback Machine',
  'Glute Bridge Machine',
  'Reverse Hyper',
  'Ab Crunch Machine',
  'Torso Rotation Machine',
  'Back Extension Machine',
  'Hip Thrust Machine',
  'Smith Machine Calf Raise',
  'Leg Press Calf Raise',
  'Sissy Squat Machine',
  'Nordic Curl Machine',
  'Adductor Machine',
  'Abductor Machine',
  'Rotary Torso Machine',
  'Multi-Hip Machine',
  'Pullover Machine',
  'Converging Chest Press',
  'Diverging Lat Pulldown',
  'Iso-Lateral Row',
  'Iso-Lateral Press',
  'Hammer Strength Bench Press',
  'Hammer Strength Incline Press',
  'Hammer Strength Row',
  'Hammer Strength Shoulder Press',
]);

const SMITH_MACHINE = exercises('Smith Machine', [
  'Smith Bench Press',
  'Smith Incline Press',
  'Smith Decline Press',
  'Smith Close-Grip Press',
  'Smith Squat',
  'Smith Front Squat',
  'Smith Deadlift',
  'Smith Romanian Deadlift',
  'Smith Row',
  'Smith Overhead Press',
  'Smith Behind-the-Neck Press',
  'Smith Split Squat',
  'Smith Bulgarian Split Squat',
  'Smith Lunges',
  'Smith Reverse Lunges',
  'Smith Calf Raise',
  'Smith Hip Thrust',
  'Smith Shrugs',
  'Smith Upright Row',
  'Smith Good Morning',
  'Smith Glute Bridge',
  'Smith Step-Up',
  'Smith Floor Press',
  'Smith JM Press',
]);

const KETTLEBELL = exercises('Kettlebell', [
  'Kettlebell Swing',
  'American Kettlebell Swing',
  'Russian Kettlebell Swing',
  'Kettlebell Clean',
  'Kettlebell Snatch',
  'Kettlebell Press',
  'Kettlebell Push Press',
  'Kettlebell Jerk',
  'Kettlebell Row',
  'Kettlebell Deadlift',
  'Kettlebell Sumo Deadlift',
  'Kettlebell Goblet Squat',
  'Kettlebell Front Squat',
  'Kettlebell Thruster',
  'Kettlebell Turkish Get-Up',
  'Kettlebell Windmill',
  'Kettlebell Figure 8',
  'Kettlebell Halo',
  'Kettlebell Lunge',
  'Kettlebell Reverse Lunge',
  'Kettlebell Step-Up',
  'Kettlebell Farmer Carry',
  'Kettlebell Rack Carry',
  'Kettlebell Bottoms-Up Press',
  'Kettlebell Floor Press',
  'Kettlebell Pullover',
  'Kettlebell Curl',
  'Kettlebell Tricep Extension',
  'Kettlebell Shrug',
  'Kettlebell High Pull',
  'Kettlebell Clean & Press',
  'Double Kettlebell Clean',
  'Double Kettlebell Press',
  'Double Kettlebell Front Squat',
  'Double Kettlebell Swing',
  'Kettlebell Suitcase Deadlift',
  'Kettlebell Cossack Squat',
]);

const BODYWEIGHT = exercises('Bodyweight', [
  'Pull-Up',
  'Chin-Up',
  'Neutral-Grip Pull-Up',
  'Wide-Grip Pull-Up',
  'Commando Pull-Up',
  'Dip',
  'Ring Dip',
  'Bench Dip',
  'Push-Up',
  'Diamond Push-Up',
  'Pike Push-Up',
  'Decline Push-Up',
  'Incline Push-Up',
  'Archer Push-Up',
  'Clap Push-Up',
  'Plank',
  'Side Plank',
  'Hollow Hold',
  'Hollow Rock',
  'Superman',
  'Glute Bridge',
  'Single-Leg Glute Bridge',
  'Nordic Curl',
  'Bodyweight Calf Raise',
  'Walking Lunge',
  'Reverse Lunge',
  'Jump Squat',
  'Jump Lunge',
  'Bear Crawl',
  'Crab Walk',
  'Inverted Row',
  'Australian Pull-Up',
  'Hanging Leg Raise',
  'Hanging Knee Raise',
  'Captain\'s Chair Leg Raise',
  'Ab Wheel Rollout',
  'Sit-Up',
  'Crunch',
  'Bicycle Crunch',
  'Russian Twist',
  'Mountain Climber',
  'Burpee (Bodyweight)',
  'Air Squat',
  'Bodyweight Squat',
  'Pistol Squat',
  'Shrimp Squat',
  'Cossack Squat',
  'Wall Sit',
  'Step-Up',
  'Box Squat (Bodyweight)',
  'Handstand Hold',
  'L-Sit Hold',
  'Dragon Flag',
  'Muscle-Up (Bodyweight)',
  'Front Lever',
  'Back Lever',
  'Human Flag',
  'Planche Hold',
  'Crow Pose',
]);

export const EXERCISES: ExerciseDefinition[] = [
  ...BARBELL,
  ...OLYMPIC,
  ...CROSSFIT,
  ...DUMBBELL,
  ...CABLE,
  ...MACHINES,
  ...SMITH_MACHINE,
  ...KETTLEBELL,
  ...BODYWEIGHT,
];

export const POPULAR_LIFTS = [
  'Back Squat',
  'Bench Press',
  'Deadlift',
  'Snatch',
  'Clean & Jerk',
  'Thruster',
  'Lat Pulldown',
  'Cable Row',
  'Leg Press',
  'Dumbbell Bench Press',
  'Pull-Up',
  'Kettlebell Swing',
];

const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .replace(/[''()]/g, '')
    .replace(/[-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function exerciseHaystack(exercise: ExerciseDefinition) {
  return normalizeSearch(
    [exercise.name, exercise.category, ...exercise.muscles, ...(exercise.aliases ?? [])].join(' '),
  );
}

function searchScore(exercise: ExerciseDefinition, query: string): number {
  const q = normalizeSearch(query);
  if (!q) return 1;

  const name = normalizeSearch(exercise.name);
  const haystack = exerciseHaystack(exercise);
  const compactName = name.replace(/\s/g, '');
  const compactQ = q.replace(/\s/g, '');
  const tokens = q.split(' ').filter(Boolean);

  if (name === q) return 100;
  if (name.startsWith(q)) return 95;
  if (compactName.startsWith(compactQ)) return 92;
  if (name.includes(q)) return 85;
  if (compactName.includes(compactQ)) return 82;

  if (tokens.length > 1 && tokens.every((token) => haystack.includes(token))) return 75;

  const muscleHit = exercise.muscles.some((m) => normalizeSearch(m).includes(q));
  if (muscleHit) return 70;

  const categoryHit = normalizeSearch(exercise.category).includes(q);
  if (categoryHit) return 65;

  if (tokens.length === 1 && tokens[0].length >= 3) {
    const token = tokens[0];
    const words = name.split(' ');
    if (words.some((word) => word.startsWith(token))) return 60;
  }

  return 0;
}

/** Stable popularity sort: higher popularity first, ties broken alphabetically. */
function byPopularity(a: ExerciseDefinition, b: ExerciseDefinition): number {
  return b.popularity - a.popularity || a.name.localeCompare(b.name);
}

export function searchExercises(
  query: string,
  options: {
    category?: ExerciseCategory;
    muscle?: MuscleGroup;
  } = {},
): ExerciseDefinition[] {
  const trimmed = query.trim();
  const searching = trimmed.length > 0;

  // When typing a search, look across the full library — don't trap results behind filters.
  const category = searching ? 'All' : (options.category ?? 'All');
  const muscle = searching ? 'All' : (options.muscle ?? 'All');

  const base = EXERCISES.filter((exercise) => {
    if (category !== 'All' && exercise.category !== category) return false;
    if (muscle !== 'All' && !exercise.muscles.includes(muscle)) return false;
    return true;
  });

  if (!searching) return base.sort(byPopularity);

  return base
    .map((exercise) => ({ exercise, score: searchScore(exercise, trimmed) }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.exercise.popularity - a.exercise.popularity ||
        a.exercise.name.localeCompare(b.exercise.name),
    )
    .map(({ exercise }) => exercise);
}

export function getExercisesByMuscle(muscle: MuscleGroupFilter): ExerciseDefinition[] {
  return EXERCISES.filter((e) => e.muscles.includes(muscle)).sort(byPopularity);
}

export function getExercisesByCategory(category: ExerciseCategoryFilter): ExerciseDefinition[] {
  return EXERCISES.filter((e) => e.category === category).sort(byPopularity);
}

export const EXERCISE_COUNT = EXERCISES.length;

export function getMusclesForExercise(name: string): MuscleGroupFilter[] {
  const match = EXERCISES.find((e) => e.name.toLowerCase() === name.toLowerCase());
  const muscles = match?.muscles ?? inferMuscles(name);
  const specific = muscles.filter((m) => m !== 'Full Body');
  return specific.length > 0 ? specific : muscles;
}

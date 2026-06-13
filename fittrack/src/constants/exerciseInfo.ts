import { getMusclesForExercise, type MuscleGroupFilter } from './exercises';

export interface ExerciseInfo {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string;
}

type MuscleSplit = { primary: MuscleGroupFilter[]; secondary: MuscleGroupFilter[] };

const MUSCLE_SPLITS: Record<string, MuscleSplit> = {
  'Bench Press': { primary: ['Chest'], secondary: ['Triceps', 'Shoulders'] },
  'Incline Bench Press': { primary: ['Chest'], secondary: ['Shoulders', 'Triceps'] },
  'Decline Bench Press': { primary: ['Chest'], secondary: ['Triceps'] },
  'Close-Grip Bench Press': { primary: ['Triceps'], secondary: ['Chest'] },
  'Dumbbell Bench Press': { primary: ['Chest'], secondary: ['Triceps', 'Shoulders'] },
  'Back Squat': { primary: ['Quads', 'Glutes'], secondary: ['Core', 'Hamstrings'] },
  'Front Squat': { primary: ['Quads'], secondary: ['Core', 'Glutes'] },
  Deadlift: { primary: ['Hamstrings', 'Glutes'], secondary: ['Back', 'Traps', 'Forearms'] },
  'Romanian Deadlift': { primary: ['Hamstrings', 'Glutes'], secondary: ['Back', 'Forearms'] },
  'Sumo Deadlift': { primary: ['Glutes', 'Quads'], secondary: ['Back', 'Hamstrings', 'Traps'] },
  'Barbell Overhead Press': { primary: ['Shoulders'], secondary: ['Triceps', 'Core', 'Traps'] },
  'Barbell Row': { primary: ['Back'], secondary: ['Biceps', 'Forearms', 'Traps'] },
  'Lat Pulldown': { primary: ['Back'], secondary: ['Biceps', 'Forearms'] },
  'Pull-Up': { primary: ['Back'], secondary: ['Biceps', 'Forearms'] },
  'Chin-Up': { primary: ['Back', 'Biceps'], secondary: ['Forearms'] },
  'Cable Row': { primary: ['Back'], secondary: ['Biceps', 'Forearms'] },
  'Leg Press': { primary: ['Quads'], secondary: ['Glutes'] },
  'Leg Extension': { primary: ['Quads'], secondary: [] },
  'Lying Leg Curl': { primary: ['Hamstrings'], secondary: [] },
  'Hip Thrust': { primary: ['Glutes'], secondary: ['Hamstrings', 'Core'] },
  'Barbell Curl': { primary: ['Biceps'], secondary: ['Forearms'] },
  'Cable Tricep Pushdown': { primary: ['Triceps'], secondary: [] },
  'Dumbbell Lateral Raise': { primary: ['Shoulders'], secondary: [] },
  'Face Pull': { primary: ['Shoulders', 'Back'], secondary: ['Traps'] },
  'Cable Face Pull': { primary: ['Shoulders', 'Back'], secondary: ['Traps'] },
  Thruster: { primary: ['Quads', 'Shoulders'], secondary: ['Glutes', 'Triceps', 'Core'] },
  'Kettlebell Swing': { primary: ['Glutes', 'Hamstrings'], secondary: ['Core', 'Shoulders'] },
};

const INSTRUCTIONS: Record<string, string> = {
  'Bench Press':
    'Lie flat with eyes under the bar, feet planted, and shoulder blades pinched down. Unrack with straight wrists, lower the bar to mid-chest with control, then drive through your chest and triceps to lock out without flaring elbows excessively.',
  'Incline Bench Press':
    'Set the bench to 30–45°. Keep shoulders back, lower the bar to the upper chest, and press up and slightly back while keeping glutes on the pad.',
  'Back Squat':
    'Bar on upper traps, brace your core, and sit hips back and down. Keep knees tracking over toes, chest up, and drive through mid-foot to stand. Aim for thighs at least parallel if mobility allows.',
  'Front Squat':
    'Rest the bar on front delts with elbows high. Stay upright, break at hips and knees together, and drive up keeping the torso tall. Core bracing is critical.',
  Deadlift:
    'Hinge to the bar with shins near vertical, flat back, and lats engaged. Push the floor away, keep the bar close to your legs, and stand tall by squeezing glutes—do not hyperextend at the top.',
  'Romanian Deadlift':
    'Soft knee bend, hinge hips back while keeping a flat back. Lower until you feel a strong hamstring stretch, then drive hips forward to stand. Keep the bar close to your thighs.',
  'Barbell Overhead Press':
    'Grip just outside shoulders, brace core and glutes. Press the bar in a straight line overhead, moving your head back slightly then through once the bar passes. Lock out with biceps by ears.',
  'Barbell Row':
    'Hinge forward with a flat back, pull the bar to your lower ribs by driving elbows back. Squeeze shoulder blades at the top and lower with control—avoid jerking with momentum.',
  'Lat Pulldown':
    'Grip the bar, lean back slightly, and pull to upper chest by driving elbows down and back. Pause briefly, then return with control until arms are extended without shrugging.',
  'Pull-Up':
    'Hang with shoulders engaged (not fully relaxed). Pull chest toward the bar by driving elbows down and back. Lower under control to full extension each rep.',
  'Cable Row':
    'Sit tall with a neutral spine. Pull the handle to your torso, squeeze shoulder blades, then extend arms without rounding your back forward.',
  'Leg Press':
    'Feet shoulder-width on the platform, lower until knees bend roughly 90° without hips curling off the pad. Press through mid-foot to extend legs—do not lock knees violently.',
  'Barbell Curl':
    'Stand tall, elbows pinned at your sides. Curl without swinging your hips, squeeze at the top, and lower slowly. Keep wrists neutral.',
  'Cable Tricep Pushdown':
    'Elbows fixed at your sides, push the attachment down until arms are fully extended. Control the return and avoid letting elbows drift forward.',
  'Dumbbell Lateral Raise':
    'Slight bend in elbows, raise dumbbells to shoulder height leading with elbows—not hands. Lower slowly without shrugging traps up.',
  'Hip Thrust':
    'Upper back on a bench, feet flat. Drive through heels to lift hips until torso is parallel to the floor. Squeeze glutes hard at the top and avoid overarching your lower back.',
  'Kettlebell Swing':
    'Hinge (not squat) to load hamstrings, then explosively drive hips forward to swing the bell to chest height. Arms stay relaxed; power comes from the hips.',
  Thruster:
    'Front rack squat to full depth, then drive up and use leg momentum to press the bar overhead in one fluid motion. Keep core tight through the transition.',
};

function splitMusclesByPattern(name: string, muscles: MuscleGroupFilter[]): MuscleSplit {
  const n = name.toLowerCase();

  if (n.includes('curl') && !n.includes('leg curl')) return { primary: ['Biceps'], secondary: ['Forearms'] };
  if (n.includes('tricep') || n.includes('pushdown') || n.includes('skull'))
    return { primary: ['Triceps'], secondary: [] };
  if (n.includes('lateral raise') || n.includes('front raise'))
    return { primary: ['Shoulders'], secondary: [] };
  if (n.includes('rear delt') || n.includes('face pull'))
    return { primary: ['Shoulders'], secondary: ['Back', 'Traps'] };
  if (n.includes('shrug')) return { primary: ['Traps'], secondary: ['Forearms'] };
  if (n.includes('leg curl') || n.includes('nordic'))
    return { primary: ['Hamstrings'], secondary: [] };
  if (n.includes('leg extension') || n.includes('sissy squat'))
    return { primary: ['Quads'], secondary: [] };
  if (n.includes('calf')) return { primary: ['Calves'], secondary: [] };
  if (n.includes('crunch') || n.includes('plank') || n.includes('sit-up') || n.includes('sit up'))
    return { primary: ['Core'], secondary: [] };
  if (n.includes('fly') || n.includes('pec deck'))
    return { primary: ['Chest'], secondary: ['Shoulders'] };
  if (n.includes('bench') && !n.includes('step'))
    return { primary: ['Chest'], secondary: ['Triceps', 'Shoulders'] };
  if (n.includes('pulldown') || n.includes('pull-up') || n.includes('pull up') || n.includes('chin-up'))
    return { primary: ['Back'], secondary: ['Biceps', 'Forearms'] };
  if (n.includes('row')) return { primary: ['Back'], secondary: ['Biceps', 'Forearms'] };
  if (n.includes('overhead press') || n.includes('shoulder press') || n.includes('arnold press'))
    return { primary: ['Shoulders'], secondary: ['Triceps', 'Traps'] };
  if (n.includes('squat') || n.includes('lunge') || n.includes('leg press'))
    return { primary: ['Quads'], secondary: ['Glutes', 'Core'] };
  if (n.includes('rdl') || n.includes('romanian') || n.includes('stiff-leg'))
    return { primary: ['Hamstrings', 'Glutes'], secondary: ['Back'] };
  if (n.includes('deadlift')) return { primary: ['Back', 'Hamstrings'], secondary: ['Glutes', 'Traps'] };
  if (n.includes('hip thrust') || n.includes('glute bridge') || n.includes('kickback'))
    return { primary: ['Glutes'], secondary: ['Hamstrings', 'Core'] };
  if (n.includes('dip') || n.includes('push-up') || n.includes('push up'))
    return { primary: ['Chest', 'Triceps'], secondary: ['Shoulders', 'Core'] };

  const filtered = muscles.filter((m) => m !== 'Full Body');
  if (filtered.length === 0) return { primary: ['Full Body'], secondary: [] };
  if (filtered.length === 1) return { primary: filtered, secondary: [] };
  return { primary: [filtered[0]], secondary: filtered.slice(1) };
}

function instructionsByPattern(name: string): string {
  const n = name.toLowerCase();

  if (n.includes('bench') && !n.includes('step'))
    return INSTRUCTIONS['Bench Press'];
  if (n.includes('incline') && (n.includes('press') || n.includes('bench')))
    return INSTRUCTIONS['Incline Bench Press'];
  if (n.includes('squat') && !n.includes('jump'))
    return n.includes('front') ? INSTRUCTIONS['Front Squat'] : INSTRUCTIONS['Back Squat'];
  if (n.includes('romanian') || n.includes('rdl')) return INSTRUCTIONS['Romanian Deadlift'];
  if (n.includes('deadlift')) return INSTRUCTIONS.Deadlift;
  if (n.includes('overhead press') || n.includes('shoulder press'))
    return INSTRUCTIONS['Barbell Overhead Press'];
  if (n.includes('row') && !n.includes('erg')) return INSTRUCTIONS['Barbell Row'];
  if (n.includes('pulldown')) return INSTRUCTIONS['Lat Pulldown'];
  if (n.includes('pull-up') || n.includes('pull up')) return INSTRUCTIONS['Pull-Up'];
  if (n.includes('curl') && !n.includes('leg curl')) return INSTRUCTIONS['Barbell Curl'];
  if (n.includes('pushdown') || n.includes('tricep extension'))
    return INSTRUCTIONS['Cable Tricep Pushdown'];
  if (n.includes('lateral raise')) return INSTRUCTIONS['Dumbbell Lateral Raise'];
  if (n.includes('leg press')) return INSTRUCTIONS['Leg Press'];
  if (n.includes('hip thrust')) return INSTRUCTIONS['Hip Thrust'];
  if (n.includes('swing')) return INSTRUCTIONS['Kettlebell Swing'];
  if (n.includes('thruster')) return INSTRUCTIONS.Thruster;

  if (n.includes('fly'))
    return 'With a slight bend in elbows, open arms in a wide arc until you feel a chest stretch, then squeeze pecs to bring arms back together without clanking weights.';
  if (n.includes('leg curl'))
    return 'Keep hips pressed into the pad. Curl heels toward glutes, pause at peak contraction, and lower under control without letting the stack slam.';
  if (n.includes('leg extension'))
    return 'Sit with knees aligned to the machine axis. Extend legs until straight, squeeze quads at the top, and lower slowly without swinging.';
  if (n.includes('calf'))
    return 'Place balls of feet on the edge, lower heels for a full stretch, then rise to maximum height and pause briefly at the top.';
  if (n.includes('lunge') || n.includes('split squat'))
    return 'Step into a staggered stance, lower back knee toward the floor with front shin mostly vertical, and drive through the front heel to stand. Keep torso upright.';
  if (n.includes('dip'))
    return 'Lower until upper arms are about parallel to the floor, lean slightly forward for chest emphasis or stay upright for triceps, then press back to lockout.';
  if (n.includes('push-up') || n.includes('push up'))
    return 'Hands under shoulders, body in a straight line from head to heels. Lower chest toward the floor, then press up while keeping core tight and hips level.';

  return 'Set up with control, brace your core, and use a full pain-free range of motion. Lower or stretch under control, then lift with intent—avoid bouncing, jerking, or using momentum.';
}

function findExactKey(name: string): string | undefined {
  const lower = name.toLowerCase();
  return Object.keys(MUSCLE_SPLITS).find((key) => key.toLowerCase() === lower);
}

export function getExerciseInfo(name: string): ExerciseInfo {
  const key = findExactKey(name);
  const muscles = getMusclesForExercise(name);
  const split = key ? MUSCLE_SPLITS[key] : splitMusclesByPattern(name, muscles);
  const instructions = INSTRUCTIONS[key ?? ''] ?? instructionsByPattern(name);

  return {
    primaryMuscles: split.primary,
    secondaryMuscles: split.secondary,
    instructions,
  };
}

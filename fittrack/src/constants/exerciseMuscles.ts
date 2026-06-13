export const MUSCLE_GROUPS = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Traps',
  'Forearms',
  'Full Body',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
export type MuscleGroupFilter = Exclude<MuscleGroup, 'All'>;

/** Maps each muscle group to exercise names. Exercises can appear in multiple groups. */
export const EXERCISES_BY_MUSCLE: Record<MuscleGroupFilter, string[]> = {
  Chest: [
    'Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Close-Grip Bench Press',
    'Wide-Grip Bench Press', 'Floor Press', 'Spoto Press', 'Landmine Press',
    'Smith Bench Press', 'Smith Incline Press', 'Smith Decline Press', 'Smith Close-Grip Press',
    'Smith Floor Press', 'Smith JM Press',
    'Dumbbell Bench Press', 'Incline Dumbbell Press', 'Decline Dumbbell Press',
    'Dumbbell Fly', 'Incline Dumbbell Fly', 'Dumbbell Floor Press', 'Dumbbell Hex Press',
    'Crush Grip Dumbbell Press', 'Dumbbell Pullover',
    'Cable Crossover', 'Low Cable Crossover', 'High Cable Crossover', 'Cable Fly',
    'Incline Cable Fly', 'Decline Cable Fly', 'Cable Bench Press', 'Single-Arm Cable Press',
    'Cable Pullover',
    'Chest Press Machine', 'Incline Chest Press Machine', 'Decline Chest Press Machine',
    'Pec Deck', 'Machine Fly', 'Converging Chest Press', 'Pullover Machine',
    'Hammer Strength Bench Press', 'Hammer Strength Incline Press', 'Iso-Lateral Press',
    'Push-Up', 'Decline Push-Up', 'Incline Push-Up', 'Archer Push-Up', 'Clap Push-Up',
    'Diamond Push-Up', 'Dip', 'Ring Dip', 'Bench Dip', 'Assisted Dip Machine', 'Tricep Dip Machine',
    'Kettlebell Floor Press', 'Wall Ball', 'Thruster', 'Man Maker', 'Devil Press',
    'Dumbbell Devil Press', 'Burpee', 'Burpee (Bodyweight)', 'Bear Complex', 'Cluster',
  ],

  Back: [
    'Deadlift', 'Sumo Deadlift', 'Romanian Deadlift', 'Stiff-Leg Deadlift', 'Deficit Deadlift',
    'Block Pull', 'Rack Pull', 'Jefferson Deadlift', 'Snatch Grip Deadlift',
    'Snatch Grip Romanian Deadlift', 'Good Morning', 'Smith Good Morning',
    'Barbell Row', 'Pendlay Row', 'Yates Row', 'T-Bar Row', 'Landmine Row',
    'Dumbbell Row', 'Single-Arm Dumbbell Row', 'Renegade Row', 'Chest-Supported Dumbbell Row',
    'Dumbbell Pullover Row',
    'Cable Row', 'Seated Cable Row', 'Single-Arm Cable Row', 'Wide-Grip Cable Row',
    'Close-Grip Cable Row', 'Cable Row to Hip', 'Cable High Row', 'Cable Low Row',
    'Lat Pulldown', 'Wide-Grip Lat Pulldown', 'Close-Grip Lat Pulldown', 'Neutral-Grip Lat Pulldown',
    'Straight-Arm Pulldown', 'Diverging Lat Pulldown', 'Lat Pulldown Machine',
    'Seated Row Machine', 'Chest-Supported Row Machine', 'T-Bar Row Machine', 'Iso-Lateral Row',
    'Hammer Strength Row', 'Smith Row',
    'Pull-Up', 'Chin-Up', 'Neutral-Grip Pull-Up', 'Wide-Grip Pull-Up', 'Commando Pull-Up',
    'Kipping Pull-Up', 'Strict Pull-Up', 'Chest-to-Bar Pull-Up', 'Butterfly Pull-Up',
    'Assisted Pull-Up Machine', 'Inverted Row', 'Australian Pull-Up', 'Ring Row',
    'Muscle-Up', 'Ring Muscle-Up', 'Bar Muscle-Up', 'Muscle-Up (Bodyweight)', 'Burpee Pull-Up',
    'Cable Face Pull', 'Cable Pullover', 'Dumbbell Pullover', 'Pullover Machine',
    'Reverse Hyper', 'Back Extension Machine', 'GHD Back Extension', 'Superman',
    'Snatch Pull', 'Snatch High Pull', 'Clean Pull', 'Clean High Pull', 'Kettlebell High Pull',
    'Cable Deadlift', 'Kettlebell Deadlift', 'Kettlebell Sumo Deadlift', 'Kettlebell Suitcase Deadlift',
    'Smith Deadlift', 'Smith Romanian Deadlift', 'Cable Pull-Through',
    'Rope Climb', 'Legless Rope Climb', 'Row Erg', 'Human Flag', 'Front Lever', 'Back Lever',
  ],

  Shoulders: [
    'Bench Press', 'Incline Bench Press', 'Decline Bench Press',
    'Dumbbell Bench Press', 'Incline Dumbbell Press', 'Decline Dumbbell Press',
    'Barbell Overhead Press', 'Push Press', 'Behind-the-Neck Press', 'Landmine Press',
    'Smith Overhead Press', 'Smith Behind-the-Neck Press', 'Smith Upright Row',
    'Dumbbell Shoulder Press', 'Arnold Press', 'Seated Dumbbell Press',
    'Dumbbell Lateral Raise', 'Dumbbell Front Raise', 'Dumbbell Rear Delt Fly',
    'Cable Lateral Raise', 'Cable Front Raise', 'Cable Rear Delt Fly', 'Cable Face Pull',
    'Cable Upright Row', 'Cable External Rotation', 'Cable Internal Rotation',
    'Shoulder Press Machine', 'Lateral Raise Machine', 'Rear Delt Machine',
    'Hammer Strength Shoulder Press', 'Kettlebell Press', 'Kettlebell Push Press',
    'Kettlebell Jerk', 'Kettlebell Bottoms-Up Press', 'Kettlebell Windmill',
    'Pike Push-Up', 'Handstand Push-Up', 'Strict Handstand Push-Up', 'Handstand Walk',
    'Handstand Hold', 'Push Press', 'Split Jerk', 'Push Jerk', 'Power Jerk', 'Jerk',
    'Overhead Squat', 'Overhead Carry', 'Overhead Walking Lunge', 'Turkish Get-Up',
    'Kettlebell Turkish Get-Up', 'Kettlebell Halo', 'Wall Walk', 'Planche Hold',
    'Barbell Shrug', 'Dumbbell Shrug', 'Cable Shrug', 'Smith Shrugs',
    'Kettlebell Shrug', 'Farmer Carry', 'Kettlebell Farmer Carry', 'Front Rack Carry',
    'Kettlebell Rack Carry', 'Sandbag Over Shoulder',
  ],

  Biceps: [
    'Barbell Curl', 'EZ-Bar Curl', 'Dumbbell Curl', 'Hammer Curl', 'Incline Dumbbell Curl',
    'Concentration Curl', 'Cable Curl', 'Rope Hammer Curl', 'Bayesian Cable Curl',
    'Cable Bicep Curl', 'Preacher Curl Machine', 'Kettlebell Curl',
    'Chin-Up', 'Neutral-Grip Pull-Up', 'Inverted Row', 'Australian Pull-Up',
    'Ring Row', 'Cable Row', 'Dumbbell Row',
  ],

  Triceps: [
    'Bench Press', 'Incline Bench Press', 'Decline Bench Press',
    'Dumbbell Bench Press', 'Incline Dumbbell Press', 'Decline Dumbbell Press',
    'Close-Grip Bench Press', 'Skull Crushers', 'Barbell Tricep Extension', 'Floor Press',
    'Smith Close-Grip Press', 'Smith JM Press', 'Smith Floor Press',
    'Dumbbell Tricep Extension', 'Overhead Dumbbell Extension', 'Dumbbell Kickback',
    'Cable Tricep Pushdown', 'Rope Tricep Pushdown', 'Reverse-Grip Tricep Pushdown',
    'Overhead Cable Extension', 'Cable Overhead Tricep Extension',
    'Kettlebell Tricep Extension', 'Tricep Dip Machine', 'Assisted Dip Machine',
    'Dip', 'Ring Dip', 'Bench Dip', 'Diamond Push-Up', 'Push-Up',
    'Handstand Push-Up', 'Strict Handstand Push-Up',
  ],

  Quads: [
    'Back Squat', 'Front Squat', 'Pause Squat', 'Tempo Squat', 'Box Squat', 'Pin Squat',
    'Anderson Squat', 'Safety Bar Squat', 'Zercher Squat', 'Barbell Hack Squat',
    'Barbell Lunge', 'Walking Barbell Lunge', 'Reverse Barbell Lunge', 'Barbell Step-Up',
    'Barbell Split Squat',
    'Smith Squat', 'Smith Front Squat', 'Smith Split Squat', 'Smith Bulgarian Split Squat',
    'Smith Lunges', 'Smith Reverse Lunges', 'Smith Step-Up',
    'Goblet Squat', 'Dumbbell Lunges', 'Walking Dumbbell Lunge', 'Reverse Dumbbell Lunge',
    'Bulgarian Split Squat', 'Dumbbell Step-Up', 'Dumbbell Split Squat', 'Dumbbell Sumo Squat',
    'Dumbbell Bench Step-Up',
    'Leg Press', 'Hack Squat', 'Belt Squat', 'Pendulum Squat', 'Leg Extension',
    'Sissy Squat Machine', 'Hip Thrust Machine',
    'Kettlebell Goblet Squat', 'Kettlebell Front Squat', 'Double Kettlebell Front Squat',
    'Kettlebell Lunge', 'Kettlebell Reverse Lunge', 'Kettlebell Step-Up', 'Kettlebell Cossack Squat',
    'Cable Squat', 'Cable Lunge',
    'Air Squat', 'Bodyweight Squat', 'Pistol Squat', 'Shrimp Squat', 'Cossack Squat',
    'Walking Lunge', 'Reverse Lunge', 'Jump Squat', 'Jump Lunge', 'Wall Sit', 'Step-Up',
    'Box Squat (Bodyweight)', 'Box Step-Up', 'Box Step-Over', 'Dumbbell Box Step-Up',
    'Overhead Squat', 'Jerk Dip Squat', 'Thruster', 'Wall Ball', 'Kettlebell Thruster',
    'Dumbbell Thruster', 'Front Rack Carry',
  ],

  Hamstrings: [
    'Romanian Deadlift', 'Stiff-Leg Deadlift', 'Snatch Grip Romanian Deadlift',
    'Good Morning', 'Smith Good Morning', 'Smith Romanian Deadlift',
    'Dumbbell Romanian Deadlift', 'Dumbbell Stiff-Leg Deadlift',
    'Lying Leg Curl', 'Seated Leg Curl', 'Standing Leg Curl', 'Standing Cable Leg Curl',
    'Nordic Curl', 'Nordic Curl Machine', 'GHD Hip Extension',
    'Cable Pull-Through', 'Reverse Hyper',
    'Kettlebell Swing', 'American Kettlebell Swing', 'Russian Kettlebell Swing',
    'Double Kettlebell Swing', 'Ball Slam', 'Medicine Ball Slam',
  ],

  Glutes: [
    'Hip Thrust', 'Barbell Glute Bridge', 'Smith Hip Thrust', 'Smith Glute Bridge',
    'Dumbbell Hip Thrust', 'Dumbbell Glute Bridge', 'Glute Bridge', 'Single-Leg Glute Bridge',
    'Glute Kickback Machine', 'Glute Bridge Machine', 'Hip Thrust Machine',
    'Cable Kickback', 'Cable Glute Kickback', 'Cable Pull-Through',
    'Romanian Deadlift', 'Sumo Deadlift', 'Jefferson Deadlift',
    'Bulgarian Split Squat', 'Barbell Split Squat', 'Smith Bulgarian Split Squat',
    'Smith Split Squat', 'Dumbbell Split Squat', 'Kettlebell Swing',
    'American Kettlebell Swing', 'Russian Kettlebell Swing', 'Double Kettlebell Swing',
    'Box Step-Up', 'Step-Up', 'Barbell Step-Up', 'Smith Step-Up', 'Dumbbell Step-Up',
    'Kettlebell Step-Up', 'Walking Lunge', 'Reverse Lunge', 'Barbell Lunge',
    'Hip Abductor Machine', 'Hip Adductor Machine', 'Cable Hip Abduction', 'Cable Hip Adduction',
    'Adductor Machine', 'Abductor Machine', 'Multi-Hip Machine',
    'GHD Hip Extension', 'Back Squat', 'Front Squat', 'Deadlift',
  ],

  Calves: [
    'Barbell Calf Raise', 'Smith Calf Raise', 'Dumbbell Calf Raise',
    'Seated Calf Raise Machine', 'Standing Calf Raise Machine', 'Donkey Calf Raise Machine',
    'Smith Machine Calf Raise', 'Leg Press Calf Raise', 'Bodyweight Calf Raise',
    'Box Jump', 'Box Jump Over', 'Jump Squat', 'Double Under', 'Sprint',
  ],

  Core: [
    'Barbell Rollout', 'Ab Wheel Rollout', 'Cable Crunch', 'Kneeling Cable Crunch',
    'Cable Wood Chop', 'Cable Pallof Press', 'Landmine Rotation',
    'Dumbbell Wood Chop', 'Dumbbell Side Bend',
    'Ab Crunch Machine', 'Torso Rotation Machine', 'Rotary Torso Machine',
    'GHD Sit-Up', 'Sit-Up', 'Crunch', 'Bicycle Crunch', 'Russian Twist',
    'Toes-to-Bar', 'Hanging Leg Raise', 'Hanging Knee Raise', "Captain's Chair Leg Raise",
    'L-Sit', 'L-Sit Hold', 'V-Up', 'Hollow Hold', 'Hollow Rock', 'Dragon Flag',
    'Plank', 'Side Plank', 'Mountain Climber', 'Burpee', 'Burpee (Bodyweight)',
    'Turkish Get-Up', 'Kettlebell Turkish Get-Up', 'Kettlebell Windmill',
    'Wall Walk', 'Handstand Walk', 'Pallof Press',
  ],

  Traps: [
    'Barbell Shrug', 'Dumbbell Shrug', 'Cable Shrug', 'Smith Shrugs', 'Kettlebell Shrug',
    'Farmer Carry', 'Kettlebell Farmer Carry', 'Kettlebell Suitcase Deadlift',
    'Cable Upright Row', 'Smith Upright Row',
    'Snatch High Pull', 'Clean High Pull', 'Kettlebell High Pull',
    'Deadlift', 'Rack Pull', 'Block Pull',
  ],

  Forearms: [
    'Barbell Curl', 'EZ-Bar Curl', 'Hammer Curl', 'Rope Hammer Curl', 'Bayesian Cable Curl',
    'Farmer Carry', 'Kettlebell Farmer Carry', 'Kettlebell Suitcase Deadlift',
    'Kettlebell Bottoms-Up Press', 'Renegade Row', 'Rope Climb', 'Legless Rope Climb',
  ],

  'Full Body': [
    'Snatch', 'Power Snatch', 'Muscle Snatch', 'Hang Snatch', 'Hang Power Snatch',
    'Block Snatch', 'Squat Snatch', 'Snatch Balance', 'Snatch Deadlift',
    'Clean', 'Power Clean', 'Hang Clean', 'Hang Power Clean', 'Block Clean', 'Squat Clean',
    'Clean Deadlift', 'Clean & Jerk', 'Tall Clean', 'Tall Snatch',
    'No-Feet Snatch', 'No-Feet Clean', 'Pause Snatch', 'Pause Clean',
    'Segment Snatch', 'Segment Clean',
    'Thruster', 'Man Maker', 'Devil Press', 'Dumbbell Devil Press', 'Bear Complex', 'Cluster',
    'Burpee', 'Bar-Facing Burpee', 'Burpee Box Jump Over', 'Burpee Over Bar',
    'Wall Ball', 'Medicine Ball Clean', 'Medicine Ball Slam', 'Ball Slam',
    'Sandbag Clean', 'Sandbag Carry', 'D-Ball Clean', 'D-Ball Carry',
    'Turkish Get-Up', 'Kettlebell Turkish Get-Up',
    'Kettlebell Clean', 'Kettlebell Snatch', 'Double Kettlebell Clean',
    'Kettlebell Clean & Press', 'Kettlebell Thruster', 'Dumbbell Snatch', 'Dumbbell Clean',
    'Alternating Dumbbell Snatch', 'Dumbbell Thruster',
    'Assault Bike', 'Row Erg', 'Ski Erg', 'Echo Bike', 'Bike Erg',
    'Running', 'Shuttle Run', 'Sprint', 'Swimming',
    'Sled Push', 'Sled Pull', 'Box Jump', 'Box Jump Over',
    'Muscle-Up', 'Ring Muscle-Up', 'Bar Muscle-Up', 'Muscle-Up (Bodyweight)',
    'Overhead Carry', 'Front Rack Carry', 'Farmer Carry',
    'Kettlebell Swing', 'American Kettlebell Swing', 'Russian Kettlebell Swing',
    'Double Kettlebell Swing', 'Kettlebell Figure 8',
    'Deadlift', 'Back Squat', 'Front Squat', 'Bench Press',
  ],
};

export function buildMuscleTagMap(): Map<string, MuscleGroupFilter[]> {
  const map = new Map<string, MuscleGroupFilter[]>();
  for (const [muscle, names] of Object.entries(EXERCISES_BY_MUSCLE) as [
    MuscleGroupFilter,
    string[],
  ][]) {
    for (const name of names) {
      const existing = map.get(name) ?? [];
      if (!existing.includes(muscle)) existing.push(muscle);
      map.set(name, existing);
    }
  }
  return map;
}

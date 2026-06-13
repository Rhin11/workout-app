export interface WorkoutModel {
  id: string;
  userId: string;
  name: string;
  date: Date;
}

export interface ExerciseModel {
  id: string;
  workoutId: string;
  name: string;
}

export interface SetModel {
  id: string;
  exerciseId: string;
  reps: number;
  weight: number;
  unit: string;
}

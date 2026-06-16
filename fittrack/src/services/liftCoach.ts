import { api } from './api';

export async function askLiftCoach(exerciseName: string, userQuestion: string): Promise<string> {
  const res = await api.post(
    '/api/lift-coach',
    { exerciseName, userQuestion },
    { timeout: 30000 },
  );
  return res.data.reply as string;
}

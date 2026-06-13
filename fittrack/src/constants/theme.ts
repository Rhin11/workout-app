export const colors = {
  primary: '#6C63FF',
  background: '#0F0F14',
  card: '#1C1C26',
  border: '#2A2A38',
  text: '#FFFFFF',
  textSecondary: '#9090A0',
  error: '#FF5A5A',
  success: '#4CAF50',

  // Feature colors
  calories: '#9C5CF7',
  protein: '#4A8CFF',
  carbs: '#F7A325',
  fat: '#FF6B6B',
} as const;

export type ColorKey = keyof typeof colors;

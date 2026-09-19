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
  water: '#38BDF8',

  // IWF / Olympic plate colors (lbs mapped to the matching kg bumper)
  plateRed: '#C41E3A',
  plateBlue: '#1E4BA8',
  plateYellow: '#F5C400',
  plateGreen: '#1B8F3A',
  plateWhite: '#F4F4F4',
  plateBlack: '#1C1C1C',
  plateSilver: '#C9CDD1',
  barSteel: '#8B8B96',
} as const;

export type ColorKey = keyof typeof colors;

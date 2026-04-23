// /hooks/useHaptics.js
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const useHaptics = () => {
  const tap = () => Haptics.impact({ style: ImpactStyle.Light });
  const medium = () => Haptics.impact({ style: ImpactStyle.Medium });
  const heavy = () => Haptics.impact({ style: ImpactStyle.Heavy });

  return { tap, medium, heavy };
};
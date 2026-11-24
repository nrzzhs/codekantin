import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/** Gaya goyang kiri-kanan ±6 px dua kali setiap kali `pemicu` bertambah (mis. saat galat). */
export function useGoyang(pemicu: number) {
  const kurangiGerak = useReducedMotion();
  const x = useSharedValue(0);

  useEffect(() => {
    if (pemicu === 0 || kurangiGerak) return;
    const t = (v: number) => withTiming(v, { duration: 55 });
    x.set(withSequence(t(6), t(-6), t(6), t(-6), t(0)));
  }, [pemicu, kurangiGerak, x]);

  return useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
}

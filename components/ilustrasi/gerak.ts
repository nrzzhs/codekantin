import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Opsi = {
  /** Nilai awal ayunan. Bawaan 0. */
  dari?: number;
  /** Jeda sebelum mulai (ms), untuk gerakan bergantian. */
  jeda?: number;
  /** Nilai saat "kurangi gerakan" aktif. Bawaan 0. */
  diam?: number;
};

/**
 * Nilai yang berayun bolak-balik dari `dari` ke `ke` terus-menerus.
 * Satu siklus penuh = 2 × `setengah` ms. Berhenti di `diam` kalau "kurangi gerakan" aktif.
 */
export function useAyun(ke: number, setengah: number, { dari = 0, jeda = 0, diam = 0 }: Opsi = {}) {
  const kurangiGerak = useReducedMotion();
  const nilai = useSharedValue(kurangiGerak ? diam : dari);

  useEffect(() => {
    if (kurangiGerak) {
      cancelAnimation(nilai);
      nilai.set(diam);
      return;
    }
    nilai.set(dari);
    nilai.set(
      withDelay(
        jeda,
        withRepeat(withTiming(ke, { duration: setengah, easing: Easing.inOut(Easing.ease) }), -1, true),
      ),
    );
    return () => cancelAnimation(nilai);
  }, [kurangiGerak, nilai, dari, ke, setengah, jeda, diam]);

  return nilai;
}

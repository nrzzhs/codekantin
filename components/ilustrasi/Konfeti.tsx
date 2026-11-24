import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const WARNA_BAWAAN = ['#FCD34D', '#F9A8D4', '#5EEAD4'];

type Props = {
  /** Tinggi area jatuh dalam px. */
  tinggi: number;
  jumlah?: number;
  /** true: jatuh terus-menerus (pelan). false: sekali jatuh lalu hilang. */
  ulang?: boolean;
  warna?: string[];
};

type Keping = { x: number; ukuran: number; warna: string; jeda: number; durasi: number; putar: number };

/** Konfeti kecil yang jatuh. Tidak tampil sama sekali kalau "kurangi gerakan" aktif. */
export default function Konfeti({ tinggi, jumlah = 14, ulang = true, warna = WARNA_BAWAAN }: Props) {
  const kurangiGerak = useReducedMotion();
  // Nilai acak dibuat sekali saja per pemasangan
  const [keping] = useState<Keping[]>(() =>
    Array.from({ length: jumlah }, (_, i) => ({
      x: (i + 0.5) * (100 / jumlah) + (Math.random() - 0.5) * (60 / jumlah),
      ukuran: 6 + Math.random() * 4,
      warna: warna[i % warna.length],
      jeda: Math.random() * (ulang ? 3000 : 250),
      durasi: (ulang ? 3200 : 1100) + Math.random() * (ulang ? 1800 : 500),
      putar: (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360),
    })),
  );

  if (kurangiGerak) return null;

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.wadah]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {keping.map((k, i) => (
        <KepingKonfeti key={i} k={k} tinggi={tinggi} ulang={ulang} />
      ))}
    </View>
  );
}

function KepingKonfeti({ k, tinggi, ulang }: { k: Keping; tinggi: number; ulang: boolean }) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.set(
      withDelay(
        k.jeda,
        withRepeat(withTiming(1, { duration: k.durasi, easing: Easing.linear }), ulang ? -1 : 1, false),
      ),
    );
    return () => cancelAnimation(p);
  }, [p, k.jeda, k.durasi, ulang]);

  const gaya = useAnimatedStyle(() => {
    const v = p.get();
    return {
      opacity: ulang ? (v < 0.9 ? 1 : (1 - v) * 10) : v < 0.6 ? 1 : (1 - v) / 0.4,
      transform: [
        { translateY: -14 + v * (tinggi + 14) * (ulang ? 1 : 0.6) },
        { rotate: `${v * k.putar}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.keping,
        { left: `${k.x}%`, width: k.ukuran, height: k.ukuran * 0.55, backgroundColor: k.warna },
        gaya,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wadah: { overflow: 'hidden' },
  keping: { position: 'absolute', top: 0, borderRadius: 2 },
});

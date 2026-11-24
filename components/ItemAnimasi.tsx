import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, Keyframe, LinearTransition, useReducedMotion } from 'react-native-reanimated';

type Props = {
  gaya: 'antrean' | 'tumpukan';
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

// Antrean: pelanggan baru berjalan masuk dari kanan, sedikit melewati tempatnya lalu kembali
const MASUK_ANTREAN = new Keyframe({
  0: { opacity: 0, transform: [{ translateX: 60 }] },
  30: { opacity: 1 },
  75: { transform: [{ translateX: -5 }], easing: Easing.out(Easing.quad) },
  100: { opacity: 1, transform: [{ translateX: 0 }] },
}).duration(450);

// Antrean: pelanggan yang dilayani bergeser ke arah kasir (kiri) sambil memudar
const KELUAR_ANTREAN = new Keyframe({
  0: { opacity: 1, transform: [{ translateX: 0 }] },
  100: { opacity: 0, transform: [{ translateX: -40 }], easing: Easing.in(Easing.quad) },
}).duration(320);

// Tumpukan: piring jatuh dari 70 px di atas lalu memantul
const MASUK_TUMPUKAN = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -70 }] },
  20: { opacity: 1 },
  60: { transform: [{ translateY: 4 }], easing: Easing.in(Easing.quad) },
  80: { transform: [{ translateY: -3 }], easing: Easing.out(Easing.quad) },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
}).duration(480);

// Tumpukan: piring yang di-pop terangkat sambil memudar
const KELUAR_TUMPUKAN = new Keyframe({
  0: { opacity: 1, transform: [{ translateY: 0 }] },
  100: { opacity: 0, transform: [{ translateY: -40 }], easing: Easing.out(Easing.quad) },
}).duration(320);

export default function ItemAnimasi({ gaya, style, children }: Props) {
  const kurangGerak = useReducedMotion();

  // Pengaturan "hapus animasi" di HP: tampil langsung tanpa gerak
  if (kurangGerak) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  const antrean = gaya === 'antrean';

  return (
    <Animated.View
      entering={antrean ? MASUK_ANTREAN : MASUK_TUMPUKAN}
      exiting={antrean ? KELUAR_ANTREAN : KELUAR_TUMPUKAN}
      layout={LinearTransition.duration(250)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

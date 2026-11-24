import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const PressableAnimasi = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Skala saat ditekan. Bawaan 0,98. */
  skala?: number;
};

/** Pressable yang sedikit mengecil saat ditekan (tanpa animasi kalau "kurangi gerakan" aktif). */
export default function TekanSkala({ style, skala = 0.98, onPressIn, onPressOut, ...sisa }: Props) {
  const kurangiGerak = useReducedMotion();
  const s = useSharedValue(1);
  const gaya = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));

  function ubah(nilai: number) {
    if (kurangiGerak) return;
    s.set(withTiming(nilai, { duration: nilai < 1 ? 80 : 140 }));
  }

  return (
    <PressableAnimasi
      {...sisa}
      onPressIn={(e) => {
        ubah(skala);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        ubah(1);
        onPressOut?.(e);
      }}
      style={[style, gaya]}
    />
  );
}

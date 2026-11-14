import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  SlideInRight,
  SlideOutLeft,
  useReducedMotion,
} from 'react-native-reanimated';

type Props = {
  gaya: 'antrean' | 'tumpukan';
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export default function ItemAnimasi({ gaya, style, children }: Props) {
  const kurangGerak = useReducedMotion();

  // Pengaturan "hapus animasi" di HP: tampil langsung tanpa gerak
  if (kurangGerak) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  const masuk = gaya === 'antrean' ? SlideInRight.duration(320) : FadeInDown.duration(320);
  const keluar = gaya === 'antrean' ? SlideOutLeft.duration(280) : FadeOutUp.duration(280);

  return (
    <Animated.View
      entering={masuk}
      exiting={keluar}
      layout={LinearTransition.duration(250)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import Svg from 'react-native-svg';

/**
 * Bingkai ilustrasi berlapis: tiap bagian yang bergerak digambar di lapisan SVG
 * sendiri (ukuran & viewBox sama), lalu digerakkan lewat style Reanimated.
 * Disembunyikan dari pembaca layar karena labelnya sudah ada di kartu/tombol.
 */
export function Bingkai({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <View
      style={style}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {children}
    </View>
  );
}

/** Satu lapisan SVG selebar bingkai. `gaya` opsional untuk animasi. */
export function Lapisan({
  viewBox,
  gaya,
  asal,
  children,
}: {
  viewBox: string;
  gaya?: StyleProp<AnimatedStyle<ViewStyle>>;
  /** transformOrigin, mis. '50% 80%' */
  asal?: string;
  children: ReactNode;
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, asal ? { transformOrigin: asal } : null, gaya]}
    >
      <Svg width="100%" height="100%" viewBox={viewBox}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/** Ukuran standar ilustrasi kartu modul: 150 × 100, mengecil kalau ruangnya sempit. */
export const gayaIlustrasiKartu: ViewStyle = { width: '100%', maxWidth: 150, aspectRatio: 1.5 };

import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';
import { useAyun } from './gerak';

type Props = { lebar?: number; tinggi?: number };

const VIEWBOX = '0 0 160 130';

/** Topi koki yang bergoyang −4° ↔ 4° (dari tahap1-2/ilustrasi/topi-koki.svg). */
export default function TopiKoki({ lebar = 160, tinggi = 130 }: Props) {
  const sudut = useAyun(4, 1200, { dari: -4 });
  const gayaTopi = useAnimatedStyle(() => ({ transform: [{ rotate: `${sudut.get()}deg` }] }));

  return (
    <View
      style={{ width: lebar, height: tinggi }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={lebar} height={tinggi} viewBox={VIEWBOX} style={StyleSheet.absoluteFill}>
        <Ellipse cx={80} cy={122} rx={52} ry={7} fill="#F1E7DC" />
      </Svg>
      {/* Poros goyangan di tengah bawah topi: (80, 100) dari 160 × 130 */}
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 76.9%' }, gayaTopi]}>
        <Svg width={lebar} height={tinggi} viewBox={VIEWBOX}>
          <Path
            d="M44 62a22 22 0 0 1 20-34 24 24 0 0 1 32 0 22 22 0 0 1 20 34z"
            fill="#FFFFFF"
            stroke="#1F1A17"
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <Rect x={48} y={60} width={64} height={40} rx={6} fill="#FFFFFF" stroke="#1F1A17" strokeWidth={4} />
          <Path d="M48 86h64" stroke="#C2410C" strokeWidth={8} />
          <Path d="M68 40v18M92 40v18" stroke="#F1E7DC" strokeWidth={4} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

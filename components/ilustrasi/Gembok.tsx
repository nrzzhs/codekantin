import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useAyun } from './gerak';

type Props = { ukuran?: number };

const VIEWBOX = '0 0 120 120';

/** Gembok dengan kunci yang berputar 0° ↔ −12° (dari tahap1-2/ilustrasi/gembok.svg). */
export default function Gembok({ ukuran = 100 }: Props) {
  const sudut = useAyun(-12, 1100);
  const gayaKunci = useAnimatedStyle(() => ({ transform: [{ rotate: `${sudut.get()}deg` }] }));

  return (
    <View
      style={{ width: ukuran, height: ukuran }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={ukuran} height={ukuran} viewBox={VIEWBOX} style={StyleSheet.absoluteFill}>
        <Rect x={30} y={52} width={60} height={48} rx={12} fill="#FFFFFF" stroke="#1F1A17" strokeWidth={4} />
        <Path
          d="M44 52V40a16 16 0 0 1 32 0v4"
          fill="none"
          stroke="#1F1A17"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <Circle cx={60} cy={72} r={6} fill="#C2410C" />
        <Path d="M60 78v8" stroke="#C2410C" strokeWidth={4} strokeLinecap="round" />
      </Svg>
      {/* Poros putaran di pusat cincin kunci: (92, 34) dari 120 × 120 */}
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '76.67% 28.33%' }, gayaKunci]}>
        <Svg width={ukuran} height={ukuran} viewBox={VIEWBOX}>
          <Circle cx={92} cy={34} r={10} fill="none" stroke="#0369A1" strokeWidth={4} />
          <Path
            d="M84 42 70 56m6-6 5 5m-9 1 4 4"
            fill="none"
            stroke="#0369A1"
            strokeWidth={4}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { useAyun } from './gerak';
import { Bingkai, Lapisan } from './lapisan';

const VB = '0 0 120 120';

type Props = {
  ukuran?: number;
  /** Naikkan angka ini untuk membuat Koki Piri melompat (mis. setiap kali diketuk). */
  lompatan?: number;
  /** Tinggi lompatan dalam px. Bawaan 18. */
  tinggiLompat?: number;
  /**
   * 'senang' (bawaan): senyum. 'tertawa': mulut tertawa. 'gembira': mulut tertawa + mata
   * melengkung. 'kaget': mulut terbuka dan tetes keringat.
   */
  ekspresi?: 'senang' | 'tertawa' | 'gembira' | 'kaget';
};

/**
 * Maskot "Koki Piri": piring berwajah bertopi koki. Melayang terus, berkedip,
 * dan melompat sambil miring saat `lompatan` bertambah. Diam kalau "kurangi gerakan" aktif.
 */
export default function KokiPiri({
  ukuran = 104,
  lompatan = 0,
  tinggiLompat = 18,
  ekspresi = 'senang',
}: Props) {
  const kurangiGerak = useReducedMotion();
  const kaget = ekspresi === 'kaget';
  const gembira = ekspresi === 'gembira';
  const tertawa = ekspresi === 'tertawa' || gembira;
  const layang = useAyun(-5, 1200);
  const loncat = useSharedValue(0);
  const miring = useSharedValue(0);
  const kedip = useSharedValue(1);

  // Berkedip kira-kira setiap 3,6 detik
  useEffect(() => {
    if (kurangiGerak) {
      cancelAnimation(kedip);
      kedip.set(1);
      return;
    }
    kedip.set(
      withRepeat(
        withSequence(
          withDelay(3450, withTiming(0.1, { duration: 75 })),
          withTiming(1, { duration: 75 }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(kedip);
  }, [kurangiGerak, kedip]);

  // Lompat (bawaan 18 px) sambil miring bergantian, mendarat dengan pegas (±600 ms)
  useEffect(() => {
    if (lompatan === 0 || kurangiGerak) return;
    const sudut = (8 * tinggiLompat) / 18;
    const arah = lompatan % 2 === 0 ? -sudut : sudut;
    const pegas = { damping: 9, stiffness: 180 };
    loncat.set(withSequence(withTiming(-tinggiLompat, { duration: 180 }), withSpring(0, pegas)));
    miring.set(withSequence(withTiming(arah, { duration: 180 }), withSpring(0, pegas)));
  }, [lompatan, tinggiLompat, kurangiGerak, loncat, miring]);

  const gayaTubuh = useAnimatedStyle(() => ({
    transform: [{ translateY: layang.get() + loncat.get() }, { rotate: `${miring.get()}deg` }],
  }));
  const gayaMata = useAnimatedStyle(() => ({ transform: [{ scaleY: kedip.get() }] }));

  return (
    <Bingkai style={{ width: ukuran, height: ukuran }}>
      <Lapisan viewBox={VB}>
        <Ellipse cx={60} cy={114} rx={30} ry={5} fill="#000000" fillOpacity={0.35} />
      </Lapisan>

      {/* Tubuh (melayang, melompat, miring dari dasar piring) */}
      <Lapisan viewBox={VB} gaya={gayaTubuh} asal="50% 93%">
        {/* Wajah piring */}
        <Circle cx={60} cy={74} r={38} fill="#FFF6EA" stroke="#0B6FB8" strokeWidth={6} />
        <Circle cx={60} cy={74} r={28} fill="none" stroke="#0B6FB8" strokeWidth={2} strokeOpacity={0.25} />
        {/* Pipi */}
        <Ellipse cx={40} cy={82} rx={6} ry={3.5} fill="#FDBA8C" />
        <Ellipse cx={80} cy={82} rx={6} ry={3.5} fill="#FDBA8C" />
        {kaget ? (
          <>
            {/* Mulut terbuka + tetes keringat */}
            <Ellipse cx={60} cy={86} rx={6} ry={7} fill="#1F1A17" />
            <Path d="M92 44c4 6 4 10 0 12-4-2-4-6 0-12z" fill="#7DD3FC" />
          </>
        ) : tertawa ? (
          <>
            {/* Mulut tertawa: terbuka lebar dengan lidah */}
            <Path d="M49 80h22q0 13-11 13t-11-13z" fill="#1F1A17" strokeLinejoin="round" />
            <Ellipse cx={60} cy={89} rx={5} ry={2.5} fill="#F87171" />
          </>
        ) : (
          <Path d="M51 82q9 9 18 0" fill="none" stroke="#1F1A17" strokeWidth={3} strokeLinecap="round" />
        )}
        {/* Topi koki (di atas wajah agar pita topinya terlihat) */}
        <Path
          d="M38 40a14 14 0 0 1 12-22 16 16 0 0 1 20 0 14 14 0 0 1 12 22z"
          fill="#FFFFFF"
          stroke="#1F1A17"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <Rect x={40} y={36} width={40} height={12} rx={3} fill="#FFFFFF" stroke="#1F1A17" strokeWidth={3} />
        {/* Sendok kecil */}
        <Line x1={92} y1={60} x2={100} y2={50} stroke="#F28C18" strokeWidth={4} strokeLinecap="round" />
        <Circle cx={96} cy={66} r={6} fill="#F28C18" />
      </Lapisan>

      {/* Mata: ikut gerak tubuh, lalu berkedip (scaleY) di garis mata y = 70 */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transformOrigin: '50% 93%' }, gayaTubuh]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { transformOrigin: '50% 58.33%' }, gayaMata]}
        >
          <Svg width="100%" height="100%" viewBox={VB}>
            {gembira ? (
              // Mata melengkung senang
              <Path
                d="M44 70q4-6 8 0M68 70q4-6 8 0"
                fill="none"
                stroke="#1F1A17"
                strokeWidth={3}
                strokeLinecap="round"
              />
            ) : (
              <>
                <Ellipse cx={48} cy={70} rx={4} ry={5} fill="#1F1A17" />
                <Ellipse cx={72} cy={70} rx={4} ry={5} fill="#1F1A17" />
                <Circle cx={49.5} cy={68} r={1.4} fill="#FFFFFF" />
                <Circle cx={73.5} cy={68} r={1.4} fill="#FFFFFF" />
              </>
            )}
          </Svg>
        </Animated.View>
      </Animated.View>
    </Bingkai>
  );
}

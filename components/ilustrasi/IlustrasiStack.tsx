import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ellipse, Path, Rect } from 'react-native-svg';
import { Bingkai, Lapisan, gayaIlustrasiKartu } from './lapisan';

const VB = '0 0 150 100';
const TINGGI_JATUH = 46;

/** Tumpukan piring: piring teratas jatuh, memantul, diam sebentar, lalu memudar (siklus 2,6 dtk). */
export default function IlustrasiStack() {
  const kurangiGerak = useReducedMotion();
  const turun = useSharedValue(0);
  const tampak = useSharedValue(1);

  useEffect(() => {
    if (kurangiGerak) {
      cancelAnimation(turun);
      cancelAnimation(tampak);
      turun.set(0);
      tampak.set(1);
      return;
    }
    // Jatuh 400 + pantul 120 + 120 + diam/pudar 1960 = 2600 ms
    turun.set(-TINGGI_JATUH);
    turun.set(
      withRepeat(
        withSequence(
          withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) }),
          withTiming(-6, { duration: 120, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 120, easing: Easing.in(Easing.quad) }),
          withDelay(1960, withTiming(-TINGGI_JATUH, { duration: 0 })),
        ),
        -1,
      ),
    );
    // Terlihat 1840 ms, memudar 500 ms, kosong 260 ms = 2600 ms
    tampak.set(1);
    tampak.set(
      withRepeat(
        withSequence(
          withDelay(1840, withTiming(0, { duration: 500 })),
          withDelay(260, withTiming(1, { duration: 0 })),
        ),
        -1,
      ),
    );
    return () => {
      cancelAnimation(turun);
      cancelAnimation(tampak);
    };
  }, [kurangiGerak, turun, tampak]);

  const gayaPiring = useAnimatedStyle(() => ({
    opacity: tampak.get(),
    transform: [{ translateY: turun.get() }],
  }));

  return (
    <Bingkai style={gayaIlustrasiKartu}>
      <Lapisan viewBox={VB}>
        <Rect x={30} y={88} width={90} height={8} rx={2} fill="#9A3412" />
        <Ellipse cx={75} cy={80} rx={40} ry={8} fill="#FFFFFF" stroke="#C2410C" strokeWidth={3} />
        <Ellipse cx={75} cy={68} rx={40} ry={8} fill="#FFFFFF" stroke="#C2410C" strokeWidth={3} />
        {/* Panah bawah kecil: piring masuk dari atas (push) */}
        <Path d="M134 8v16" stroke="#C2410C" strokeWidth={3} strokeLinecap="round" />
        <Path
          d="M128 19l6 7 6-7"
          fill="none"
          stroke="#C2410C"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Lapisan>
      <Lapisan viewBox={VB} gaya={gayaPiring}>
        <Ellipse cx={75} cy={56} rx={40} ry={8} fill="#FED7AA" stroke="#C2410C" strokeWidth={3} />
      </Lapisan>
    </Bingkai>
  );
}

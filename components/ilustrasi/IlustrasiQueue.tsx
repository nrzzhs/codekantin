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
  type SharedValue,
} from 'react-native-reanimated';
import { Circle, Rect } from 'react-native-svg';
import { useAyun } from './gerak';
import { Bingkai, Lapisan, gayaIlustrasiKartu } from './lapisan';

const VB = '0 0 150 100';

const PELANGGAN = [
  { x: 60, baju: '#0369A1' },
  { x: 88, baju: '#38BDF8' },
  { x: 116, baju: '#7DD3FC' },
];

/** Antrean di kasir: pelanggan melangkah di tempat, koin naik dari kasir. */
export default function IlustrasiQueue() {
  const l0 = useAyun(-4, 350);
  const l1 = useAyun(-4, 350, { jeda: 150 });
  const l2 = useAyun(-4, 350, { jeda: 300 });
  const langkah = [l0, l1, l2];

  // Koin: 0 → 1 dalam 1 dtk (naik & memudar), lalu diam 1 dtk tak terlihat; siklus 2 dtk
  const kurangiGerak = useReducedMotion();
  const koin = useSharedValue(0);
  useEffect(() => {
    if (kurangiGerak) {
      cancelAnimation(koin);
      koin.set(0);
      return;
    }
    koin.set(0);
    koin.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }),
          withDelay(1000, withTiming(0, { duration: 0 })),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(koin);
  }, [kurangiGerak, koin]);
  const gayaKoin = useAnimatedStyle(() => ({
    opacity: 1 - koin.get(),
    transform: [{ translateY: -22 * koin.get() }],
  }));

  return (
    <Bingkai style={gayaIlustrasiKartu}>
      <Lapisan viewBox={VB}>
        <Rect x={0} y={84} width={150} height={16} fill="#BAE6FD" />
        <Rect x={8} y={46} width={34} height={38} rx={6} fill="#0369A1" />
        <Rect x={14} y={52} width={22} height={9} fill="#E0F2FE" />
      </Lapisan>
      <Lapisan viewBox={VB} gaya={gayaKoin}>
        <Circle cx={25} cy={36} r={6} fill="#FCD34D" stroke="#C2410C" strokeWidth={1.5} />
      </Lapisan>
      {PELANGGAN.map((p, i) => (
        <Pelanggan key={p.x} x={p.x} baju={p.baju} geser={langkah[i]} />
      ))}
    </Bingkai>
  );
}

function Pelanggan({ x, baju, geser }: { x: number; baju: string; geser: SharedValue<number> }) {
  const gaya = useAnimatedStyle(() => ({ transform: [{ translateY: geser.get() }] }));
  return (
    <Lapisan viewBox={VB} gaya={gaya}>
      <Circle cx={x} cy={52} r={8} fill="#F6C9A8" />
      <Rect x={x - 10} y={61} width={20} height={23} rx={9} fill={baju} />
    </Lapisan>
  );
}

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useAyun } from './gerak';
import { font } from '../../lib/tema';

type Props = { lebar: number; tinggi?: number };

// Gambar asli 390 × 180. Dipotong dari atas (xMidYMax slice) agar tanah selalu selebar layar.
const VIEWBOX = '0 0 390 180';
const RASIO = 'xMidYMax slice';

/**
 * Antrean pelanggan di kasir (queue) dan tumpukan piring (stack), dari
 * tahap1-2/ilustrasi/ilustrasi-login.svg. Pelanggan naik-turun bergantian, piring
 * teratas naik-turun; semua diam kalau "kurangi gerakan" aktif.
 */
export default function IlustrasiLogin({ lebar, tinggi = Math.round(lebar * 0.4) }: Props) {
  const rear = useAyun(-3, 700);
  const tengah = useAyun(-3, 700, { jeda: 200 });
  const front = useAyun(-3, 700, { jeda: 400 });
  const piring = useAyun(-4, 900);

  const lapisan = (isi: ReactNode) => (
    <Svg width={lebar} height={tinggi} viewBox={VIEWBOX} preserveAspectRatio={RASIO}>
      {isi}
    </Svg>
  );

  return (
    <View
      style={{ width: lebar, height: tinggi }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={StyleSheet.absoluteFill}>
        {lapisan(
          <>
            <Rect x={0} y={150} width={390} height={30} fill="#F1E7DC" />
            <Rect x={20} y={52} width={40} height={18} rx={9} fill="#FFFFFF" />
            <Label x={40} warna="#0369A1">REAR</Label>
            <Rect x={108} y={52} width={46} height={18} rx={9} fill="#0369A1" />
            <Label x={131} warna="#FFFFFF">FRONT</Label>
            <Rect x={288} y={40} width={36} height={18} rx={9} fill="#C2410C" />
            <Label x={306} y={53} warna="#FFFFFF">TOP</Label>
            <Rect x={166} y={104} width={62} height={46} rx={10} fill="#FFFFFF" stroke="#0369A1" strokeWidth={3} />
            <Rect x={178} y={114} width={38} height={12} rx={3} fill="#E0F2FE" />
            <Circle cx={186} cy={138} r={3} fill="#0369A1" />
            <Circle cx={197} cy={138} r={3} fill="#0369A1" />
            <Circle cx={208} cy={138} r={3} fill="#0369A1" />
            <Path d="M306 62 L306 78" stroke="#C2410C" strokeWidth={3} strokeLinecap="round" />
            <Path
              d="M300 73 L306 80 L312 73"
              fill="none"
              stroke="#C2410C"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Ellipse cx={306} cy={142} rx={50} ry={10} fill="#FFFFFF" stroke="#C2410C" strokeWidth={3} />
            <Ellipse cx={306} cy={128} rx={50} ry={10} fill="#FFFFFF" stroke="#C2410C" strokeWidth={3} />
            <Ellipse cx={306} cy={114} rx={50} ry={10} fill="#FFFFFF" stroke="#C2410C" strokeWidth={3} />
          </>,
        )}
      </View>

      <Lapisan geser={rear}>
        {lapisan(<Pelanggan cx={40} kulit="#F6C9A8" baju="#7DD3FC" />)}
      </Lapisan>
      <Lapisan geser={tengah}>
        {lapisan(<Pelanggan cx={86} kulit="#E8B48C" baju="#38BDF8" />)}
      </Lapisan>
      <Lapisan geser={front}>
        {lapisan(<Pelanggan cx={131} kulit="#F6C9A8" baju="#0369A1" />)}
      </Lapisan>
      <Lapisan geser={piring}>
        {lapisan(<Ellipse cx={306} cy={100} rx={50} ry={10} fill="#FFEDD5" stroke="#C2410C" strokeWidth={3} />)}
      </Lapisan>
    </View>
  );
}

function Lapisan({ geser, children }: { geser: SharedValue<number>; children: ReactNode }) {
  const gaya = useAnimatedStyle(() => ({ transform: [{ translateY: geser.get() }] }));
  return <Animated.View style={[StyleSheet.absoluteFill, gaya]}>{children}</Animated.View>;
}

function Pelanggan({ cx, kulit, baju }: { cx: number; kulit: string; baju: string }) {
  return (
    <>
      <Circle cx={cx} cy={92} r={12} fill={kulit} />
      <Rect x={cx - 16} y={106} width={32} height={44} rx={14} fill={baju} />
    </>
  );
}

function Label({ x, y = 65, warna, children }: { x: number; y?: number; warna: string; children: string }) {
  return (
    <SvgText x={x} y={y} textAnchor="middle" fontFamily={font.judul} fontSize={10} fill={warna}>
      {children}
    </SvgText>
  );
}

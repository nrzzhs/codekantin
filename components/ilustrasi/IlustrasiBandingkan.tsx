import { useAnimatedStyle } from 'react-native-reanimated';
import { G, Rect, Text as SvgText } from 'react-native-svg';
import { useAyun } from './gerak';
import { Bingkai, Lapisan, gayaIlustrasiKartu } from './lapisan';
import { font } from '../../lib/tema';

const VB = '0 0 150 100';
const BIRU = '#0369A1';
const ORANYE = '#C2410C';
const ORANYE_TUA = '#9A3412';

/** Queue (kotak berjajar) vs Stack (pil bertumpuk); kedua kelompok naik bergantian. */
export default function IlustrasiBandingkan() {
  const kiri = useAyun(-6, 1000);
  const kanan = useAyun(-6, 1000, { jeda: 1000 });
  const gayaKiri = useAnimatedStyle(() => ({ transform: [{ translateY: kiri.get() }] }));
  const gayaKanan = useAnimatedStyle(() => ({ transform: [{ translateY: kanan.get() }] }));

  return (
    <Bingkai style={gayaIlustrasiKartu}>
      <Lapisan viewBox={VB}>
        <SvgText x={89} y={58} textAnchor="middle" fontFamily={font.judul} fontSize={14} fill="#166534">
          vs
        </SvgText>
      </Lapisan>

      {/* Q: tiga kotak berjajar, yang terdepan terisi */}
      <Lapisan viewBox={VB} gaya={gayaKiri}>
        <Teks x={40} y={38} ukuran={14} warna={BIRU}>
          Q
        </Teks>
        {[1, 2, 3].map((n, i) => {
          const x = 6 + i * 24;
          const depan = i === 0;
          return (
            <G key={n}>
              <Rect
                x={x}
                y={46}
                width={20}
                height={20}
                rx={5}
                fill={depan ? BIRU : '#FFFFFF'}
                stroke={BIRU}
                strokeWidth={1.5}
              />
              <Teks x={x + 10} y={60} ukuran={11} warna={depan ? '#FFFFFF' : BIRU}>
                {String(n)}
              </Teks>
            </G>
          );
        })}
      </Lapisan>

      {/* S: tiga pil bertumpuk, yang teratas terisi */}
      <Lapisan viewBox={VB} gaya={gayaKanan}>
        <Teks x={121} y={22} ukuran={14} warna={ORANYE_TUA}>
          S
        </Teks>
        {[3, 2, 1].map((n, i) => {
          const y = 28 + i * 16;
          const atas = i === 0;
          return (
            <G key={n}>
              <Rect
                x={104}
                y={y}
                width={34}
                height={14}
                rx={7}
                fill={atas ? ORANYE : '#FFFFFF'}
                stroke={ORANYE}
                strokeWidth={1.5}
              />
              <Teks x={121} y={y + 11} ukuran={10} warna={atas ? '#FFFFFF' : ORANYE_TUA}>
                {String(n)}
              </Teks>
            </G>
          );
        })}
      </Lapisan>
    </Bingkai>
  );
}

function Teks({
  x,
  y,
  ukuran,
  warna,
  children,
}: {
  x: number;
  y: number;
  ukuran: number;
  warna: string;
  children: string;
}) {
  return (
    <SvgText x={x} y={y} textAnchor="middle" fontFamily={font.judul} fontSize={ukuran} fill={warna}>
      {children}
    </SvgText>
  );
}

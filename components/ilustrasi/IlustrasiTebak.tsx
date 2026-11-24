import { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Path, Rect, Text as SvgText } from 'react-native-svg';
import { useAyun } from './gerak';
import { Bingkai, Lapisan, gayaIlustrasiKartu } from './lapisan';
import { font } from '../../lib/tema';

const VB = '0 0 150 100';

const BINTANG = [
  { x: 30, y: 30, s: 7, warna: '#FCD34D' },
  { x: 122, y: 26, s: 6, warna: '#FCD34D' },
  { x: 120, y: 72, s: 6, warna: '#F9A8D4' },
];

/** Bintang empat sudut berpusat di (x, y). */
function jalurBintang(x: number, y: number, s: number) {
  return `M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`;
}

/** Kartu tanda tanya yang bergoyang dari dasarnya, dikelilingi bintang yang berkelip. */
export default function IlustrasiTebak() {
  const sudut = useAyun(6, 800, { dari: -6 });
  const gayaKartu = useAnimatedStyle(() => ({ transform: [{ rotate: `${sudut.get()}deg` }] }));

  const k0 = useAyun(0.2, 500, { dari: 1, diam: 1 });
  const k1 = useAyun(0.2, 500, { dari: 1, jeda: 330, diam: 1 });
  const k2 = useAyun(0.2, 500, { dari: 1, jeda: 660, diam: 1 });
  const kelip = [k0, k1, k2];

  return (
    <Bingkai style={gayaIlustrasiKartu}>
      {BINTANG.map((b, i) => (
        <Bintang key={i} d={jalurBintang(b.x, b.y, b.s)} warna={b.warna} nyala={kelip[i]} />
      ))}
      {/* Poros goyangan di tengah dasar kartu: (75, 82) */}
      <Lapisan viewBox={VB} gaya={gayaKartu} asal="50% 82%">
        <Rect x={52} y={20} width={46} height={62} rx={10} fill="#6D28D9" />
        <Rect x={57} y={25} width={36} height={52} rx={7} fill="#8B5CF6" />
        <SvgText x={75} y={63} textAnchor="middle" fontFamily={font.judul} fontSize={34} fill="#FFFFFF">
          ?
        </SvgText>
      </Lapisan>
    </Bingkai>
  );
}

function Bintang({ d, warna, nyala }: { d: string; warna: string; nyala: SharedValue<number> }) {
  const gaya = useAnimatedStyle(() => ({ opacity: nyala.get() }));
  return (
    <Lapisan viewBox={VB} gaya={gaya}>
      <Path d={d} fill={warna} />
    </Lapisan>
  );
}

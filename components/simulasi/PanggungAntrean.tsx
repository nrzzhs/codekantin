import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect, Text as SvgText } from 'react-native-svg';
import ItemAnimasi from '../ItemAnimasi';
import { useAyun } from '../ilustrasi/gerak';
import { Bingkai, Lapisan } from '../ilustrasi/lapisan';
import { useGoyang } from './goyang';
import { pisahNama } from './nama';
import { font } from '../../lib/tema';

type Props = {
  /** FRONT → REAR */
  isi: string[];
  kapasitas: number;
  /** Naikkan untuk menggoyang panggung (overflow/underflow). */
  goyang: number;
};

const BIRU = '#0369A1';

// Kulit, baju (nuansa biru), dan rambut berganti berdasarkan nomor pelanggan
const PALET = [
  { kulit: '#F6C9A8', baju: '#0369A1', rambut: '#1F1A17' },
  { kulit: '#E8B48C', baju: '#38BDF8', rambut: '#7C2D12' },
  { kulit: '#FCD9B8', baju: '#0EA5E9', rambut: '#3F3F46' },
  { kulit: '#C68B59', baju: '#7DD3FC', rambut: '#1E293B' },
];

/** Panggung antrean: kasir di kiri, lima tempat antre dari FRONT ke REAR. */
export default function PanggungAntrean({ isi, kapasitas, goyang }: Props) {
  const gayaGoyang = useGoyang(goyang);
  const kosong = Math.max(0, kapasitas - isi.length);

  return (
    <Animated.View style={[styles.panggung, gayaGoyang]}>
      <View style={styles.lantai} />
      <View style={styles.pilUkuran} accessible accessibilityLabel={`${isi.length} dari ${kapasitas} terisi`}>
        <Text style={styles.pilUkuranTeks}>
          {isi.length}/{kapasitas}
        </Text>
      </View>

      <View style={styles.baris}>
        <Kasir />
        {isi.map((elemen, i) => (
          <ItemAnimasi key={elemen} gaya="antrean" style={styles.slot}>
            <SlotPelanggan elemen={elemen} posisi={i} jumlah={isi.length} />
          </ItemAnimasi>
        ))}
        {Array.from({ length: kosong }, (_, i) => {
          const posisi = isi.length + i;
          return (
            <View
              key={`kosong-${posisi}`}
              style={styles.slot}
              accessible
              accessibilityLabel={`Posisi ${posisi + 1}: kosong`}
            >
              <View style={styles.label} />
              <View style={styles.badan}>
                <View style={styles.tapak} />
              </View>
              <View style={styles.namaKosong} />
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

function SlotPelanggan({ elemen, posisi, jumlah }: { elemen: string; posisi: number; jumlah: number }) {
  const { nama, nomor } = pisahNama(elemen);
  const depan = posisi === 0;
  const belakang = posisi === jumlah - 1;
  const penanda = depan && belakang ? 'F/R' : depan ? 'FRONT' : belakang ? 'REAR' : null;
  const keterangan = depan && belakang ? ', FRONT dan REAR' : depan ? ', FRONT' : belakang ? ', REAR' : '';

  return (
    <View
      style={styles.isiSlot}
      accessible
      accessibilityLabel={`Posisi ${posisi + 1}: ${elemen}${keterangan}`}
    >
      <View style={styles.label}>
        {penanda && (
          <View style={[styles.penanda, depan ? styles.penandaDepan : styles.penandaBelakang]}>
            <Text style={[styles.penandaTeks, { color: depan ? '#FFFFFF' : BIRU }]}>{penanda}</Text>
          </View>
        )}
      </View>
      <View style={styles.badan}>
        <Pelanggan nomor={nomor ?? posisi + 1} posisi={posisi} />
      </View>
      <View style={[styles.pilNama, depan && styles.pilNamaDepan]}>
        <Text style={[styles.namaTeks, { color: depan ? '#FFFFFF' : BIRU }]} numberOfLines={1}>
          {nama}
        </Text>
      </View>
    </View>
  );
}

/** Karakter pelanggan 44 × 64 yang bergoyang naik-turun bergantian per slot. */
function Pelanggan({ nomor, posisi }: { nomor: number; posisi: number }) {
  const p = PALET[(Math.max(1, nomor) - 1) % PALET.length];
  const naik = useAyun(-3, 450, { jeda: posisi * 150 });
  const gaya = useAnimatedStyle(() => ({ transform: [{ translateY: naik.get() }] }));

  return (
    <Animated.View style={gaya} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={44} height={64} viewBox="0 0 44 64">
        <Path d="M6 64V48c0-9 7-15 16-15s16 6 16 15v16z" fill={p.baju} />
        <Circle cx={22} cy={20} r={14} fill={p.kulit} />
        <Path d="M9 16c2-9 24-11 26 0-6-4-20-4-26 0z" fill={p.rambut} />
        <Circle cx={17} cy={21} r={2} fill="#1F1A17" />
        <Circle cx={27} cy={21} r={2} fill="#1F1A17" />
        <Ellipse cx={13} cy={26} rx={3} ry={2} fill="#FDBA8C" />
        <Ellipse cx={31} cy={26} rx={3} ry={2} fill="#FDBA8C" />
        <Path d="M18 27q4 3 8 0" fill="none" stroke="#1F1A17" strokeWidth={1.5} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

const VB_KASIR = '0 0 58 90';

/** Meja kasir 58 × 90 dengan lonceng yang bergoyang. */
function Kasir() {
  const sudut = useAyun(10, 500, { dari: -10 });
  const gayaLonceng = useAnimatedStyle(() => ({ transform: [{ rotate: `${sudut.get()}deg` }] }));

  return (
    <Bingkai style={styles.kasir}>
      <Lapisan viewBox={VB_KASIR}>
        <Rect x={4} y={34} width={50} height={56} rx={8} fill={BIRU} />
        <Rect x={10} y={40} width={38} height={14} rx={3} fill="#E0F2FE" />
        <SvgText
          x={29}
          y={50.5}
          textAnchor="middle"
          fontFamily={font.kodeTebal}
          fontSize={9}
          fill={BIRU}
        >
          KASIR
        </SvgText>
        {[0, 1, 2].flatMap((k) =>
          [0, 1].map((b) => (
            <Rect
              key={`${k}-${b}`}
              x={12 + k * 13}
              y={62 + b * 10}
              width={8}
              height={6}
              rx={1.5}
              fill="#E0F2FE"
            />
          )),
        )}
      </Lapisan>
      {/* Poros goyang lonceng di pegangannya: (29, 8) */}
      <Lapisan viewBox={VB_KASIR} gaya={gayaLonceng} asal="50% 9%">
        <Circle cx={29} cy={10} r={2.5} fill="#FCD34D" stroke="#C2410C" strokeWidth={1.5} />
        <Path d="M19 28a10 10 0 0 1 20 0z" fill="#FCD34D" stroke="#C2410C" strokeWidth={2} strokeLinejoin="round" />
        <Rect x={17} y={28} width={24} height={3} rx={1.5} fill="#C2410C" />
      </Lapisan>
    </Bingkai>
  );
}

const styles = StyleSheet.create({
  panggung: {
    height: 214,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    overflow: 'hidden',
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  lantai: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 46, backgroundColor: '#BAE6FD' },
  pilUkuran: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pilUkuranTeks: { fontFamily: font.judul, fontSize: 12, color: BIRU },
  baris: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingBottom: 14 },
  kasir: { width: 58, height: 90, marginBottom: 22 },

  slot: { flex: 1, alignItems: 'center', gap: 4 },
  isiSlot: { alignItems: 'center', gap: 4, alignSelf: 'stretch' },
  label: { height: 18, justifyContent: 'center' },
  penanda: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  penandaDepan: { backgroundColor: BIRU },
  penandaBelakang: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: BIRU, paddingVertical: 1 },
  penandaTeks: { fontFamily: font.judul, fontSize: 9 },
  badan: { width: 44, height: 64, alignItems: 'center', justifyContent: 'flex-end' },
  tapak: {
    width: 36,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#7DB8DA',
  },
  pilNama: {
    maxWidth: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pilNamaDepan: { backgroundColor: BIRU },
  namaTeks: { fontFamily: font.judul, fontSize: 11 },
  namaKosong: { height: 19 },
});

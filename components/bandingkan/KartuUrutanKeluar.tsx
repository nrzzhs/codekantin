import { StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Makanan from '../ilustrasi/Makanan';
import Kartu from '../ui/Kartu';
import { MUNCUL_POP, uraikanBahan } from './bahan';
import { font, warna } from '../../lib/tema';

type Props = {
  /** Elemen yang sudah keluar, berurutan. */
  queue: string[];
  stack: string[];
};

/** Kartu "URUTAN KELUAR": chip Queue dan Stack yang muncul satu per satu. */
export default function KartuUrutanKeluar({ queue, stack }: Props) {
  return (
    <Kartu style={styles.kartu}>
      <Text style={styles.label} accessibilityRole="header">
        URUTAN KELUAR
      </Text>
      <Baris nama="Queue" warnaTeks="#0369A1" latar="#E0F2FE" isi={queue} />
      <Baris nama="Stack" warnaTeks="#9A3412" latar="#FFEDD5" isi={stack} />
    </Kartu>
  );
}

function Baris({
  nama,
  warnaTeks,
  latar,
  isi,
}: {
  nama: string;
  warnaTeks: string;
  latar: string;
  isi: string[];
}) {
  const kurangiGerak = useReducedMotion();
  const label = isi.map((x) => uraikanBahan(x).label);
  return (
    <View
      style={styles.baris}
      accessible
      accessibilityLabel={`${nama} keluar: ${label.length ? label.join(', ') : 'belum ada'}`}
    >
      <Text style={[styles.nama, { color: warnaTeks }]}>{nama}</Text>
      {isi.map((x, i) => {
        const { jenis } = uraikanBahan(x);
        return (
          <Animated.View
            key={`${nama}-${i}`}
            entering={kurangiGerak ? undefined : MUNCUL_POP}
            style={[styles.chip, { backgroundColor: latar }]}
          >
            {jenis && <Makanan jenis={jenis} ukuran={14} />}
            <Text style={[styles.chipTeks, { color: warnaTeks }]}>{label[i]}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: { gap: 10, borderRadius: 22 },
  label: { fontFamily: font.judul, fontSize: 12, letterSpacing: 0.8, color: warna.teksRedup },
  baris: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  nama: { width: 48, fontFamily: font.judul, fontSize: 12 },
  chip: {
    height: 30,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  chipTeks: { fontFamily: font.judul, fontSize: 12 },
});

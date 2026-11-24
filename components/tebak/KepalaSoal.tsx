import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useAyun } from '../ilustrasi/gerak';
import { font, warna } from '../../lib/tema';

type Props = {
  /** 0-based */
  indeks: number;
  total: number;
  chip: { teks: string; latar: string; warna: string };
  dariGuru: boolean;
};

/** Progress bersegmen (soal sekarang berkedip pelan), nomor soal, dan chip jenis soal. */
export default function KepalaSoal({ indeks, total, chip, dariGuru }: Props) {
  const kedip = useAyun(0.45, 700, { dari: 1, diam: 1 });
  const gayaKedip = useAnimatedStyle(() => ({ opacity: kedip.get() }));

  return (
    <View style={styles.wadah}>
      <View style={styles.barisProgres} accessible accessibilityLabel={`Soal ${indeks + 1} dari ${total}`}>
        <View style={styles.segmen}>
          {Array.from({ length: total }, (_, i) =>
            i === indeks ? (
              <Animated.View key={i} style={[styles.potong, { backgroundColor: '#A78BFA' }, gayaKedip]} />
            ) : (
              <View
                key={i}
                style={[styles.potong, { backgroundColor: i < indeks ? warna.ungu : warna.unguMuda }]}
              />
            ),
          )}
        </View>
        <Text style={styles.nomor}>
          {indeks + 1}/{total}
        </Text>
      </View>

      <View style={styles.barisChip}>
        <View style={[styles.chip, { backgroundColor: chip.latar }]}>
          <Text style={[styles.chipTeks, { color: chip.warna }]}>{chip.teks}</Text>
        </View>
        {dariGuru && (
          <View style={[styles.chip, { backgroundColor: warna.garis }]}>
            <Text style={[styles.chipKecil, { color: warna.teksRedup }]}>dari guru</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wadah: { gap: 12 },
  barisProgres: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  segmen: { flex: 1, flexDirection: 'row', gap: 5 },
  potong: { flex: 1, height: 10, borderRadius: 999 },
  nomor: { fontFamily: font.judul, fontSize: 14, color: warna.ungu },
  barisChip: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipTeks: { fontFamily: font.judul, fontSize: 11 },
  chipKecil: { fontFamily: font.tebal, fontSize: 11 },
});

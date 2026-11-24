import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { font, warna } from '../../lib/tema';
import { WARNA_SIMULASI, type JenisSimulasi } from './nama';

type Props = {
  judul: string;
  chip: string;
  jenis: JenisSimulasi;
  onReset: () => void;
};

/** Ikon modul, judul, chip jenis struktur data, dan tombol reset berikon. */
export default function HeaderSimulasi({ judul, chip, jenis, onReset }: Props) {
  const w = WARNA_SIMULASI[jenis];
  const antrean = jenis === 'antrean';

  return (
    <View style={styles.baris}>
      <View style={[styles.kotakIkon, { backgroundColor: w.muda }]}>
        <Ionicons name={antrean ? 'people-outline' : 'layers-outline'} size={26} color={w.aksen} />
      </View>
      <View style={styles.kolom}>
        <Text style={styles.judul} accessibilityRole="header" numberOfLines={1}>
          {judul}
        </Text>
        <View style={[styles.chip, { backgroundColor: w.muda }]}>
          <Text style={[styles.chipTeks, { color: w.teks }]}>{chip}</Text>
        </View>
      </View>
      <Pressable
        onPress={onReset}
        style={({ pressed }) => [styles.reset, pressed && styles.resetTekan]}
        accessibilityRole="button"
        accessibilityLabel={antrean ? 'Reset antrean' : 'Reset tumpukan'}
      >
        <Ionicons name="refresh" size={20} color={warna.teksRedup} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  baris: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kotakIkon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  kolom: { flex: 1, alignItems: 'flex-start', gap: 4 },
  judul: { fontFamily: font.judul, fontSize: 22, color: warna.teks },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  chipTeks: { fontFamily: font.judul, fontSize: 11 },
  reset: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: warna.garis,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetTekan: { backgroundColor: warna.kotakKode },
});

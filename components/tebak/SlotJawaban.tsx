import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Keyframe, useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';
import { useAyun } from '../ilustrasi/gerak';
import { GambarToken } from './TokenPilihan';
import type { JenisStruktur } from '../../logic/simulasi';
import { font, warna } from '../../lib/tema';

type Props = {
  struktur: JenisStruktur;
  /** 0-based */
  urutan: number;
  /** Nilai di slot, atau null kalau kosong. */
  isi: string | null;
  /** Nama lengkap untuk ditampilkan, mis. "Piring 3". */
  namaIsi: string | null;
  /** Indeks nilai di daftar pilihan (untuk warna pelanggan). */
  urutanPilihan: number;
  status: 'benar' | 'salah' | null;
  tunggal: boolean;
  nonaktif: boolean;
  onPress: () => void;
};

// Token "mendarat" di slot: 0,4 → 1,1 → 1
const MENDARAT = new Keyframe({
  0: { transform: [{ scale: 0.4 }], opacity: 0 },
  60: { transform: [{ scale: 1.1 }], opacity: 1 },
  100: { transform: [{ scale: 1 }], opacity: 1 },
}).duration(320);

const WARNA_TERISI: Record<JenisStruktur, { garis: string; latar: string }> = {
  stack: { garis: '#C2410C', latar: '#FFF7ED' },
  queue: { garis: '#0369A1', latar: '#F0F9FF' },
};

/** Slot jawaban "Keluar ke-n". Ketuk slot yang terisi untuk membatalkan. */
export default function SlotJawaban({
  struktur,
  urutan,
  isi,
  namaIsi,
  urutanPilihan,
  status,
  tunggal,
  nonaktif,
  onPress,
}: Props) {
  const kurangiGerak = useReducedMotion();
  const kedip = useAyun(0.5, 900, { dari: 1, diam: 1 });
  const gayaKedip = useAnimatedStyle(() => ({ opacity: kedip.get() }));
  const n = urutan + 1;

  const gaya =
    status === 'benar'
      ? { borderColor: warna.hijau, backgroundColor: '#F0FDF4' }
      : status === 'salah'
        ? { borderColor: '#B91C1C', backgroundColor: '#FEF2F2' }
        : isi !== null
          ? { borderColor: WARNA_TERISI[struktur].garis, backgroundColor: WARNA_TERISI[struktur].latar }
          : { borderColor: '#C9BBAE', backgroundColor: '#FFFFFF' };

  const keteranganStatus = status === 'benar' ? ', benar' : status === 'salah' ? ', salah' : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={nonaktif || isi === null}
      style={[styles.slot, { height: tunggal ? 96 : 80 }, gaya]}
      accessibilityRole="button"
      accessibilityLabel={`Keluar ke-${n}: ${namaIsi ?? 'kosong'}${keteranganStatus}`}
      accessibilityHint={isi !== null && !nonaktif ? 'Ketuk untuk membatalkan' : undefined}
      accessibilityState={{ disabled: nonaktif || isi === null }}
    >
      {isi === null ? (
        <Animated.View style={[styles.kosong, gayaKedip]}>
          <Text style={styles.label}>Keluar ke-{n}</Text>
          <Text style={styles.petunjuk}>ketuk pilihan di bawah</Text>
        </Animated.View>
      ) : (
        <View style={styles.terisi}>
          <Animated.View key={isi} entering={kurangiGerak ? undefined : MENDARAT}>
            <GambarToken struktur={struktur} nilai={isi} urutan={urutanPilihan} ukuran={52} />
          </Animated.View>
          <View style={styles.kolom}>
            <Text style={styles.label}>Keluar ke-{n}</Text>
            <Text style={styles.nama} numberOfLines={1}>
              {namaIsi}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    borderRadius: 22,
    borderWidth: 3,
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  kosong: { alignItems: 'center', gap: 2 },
  label: { fontFamily: font.tebal, fontSize: 12, color: warna.teksRedup },
  petunjuk: { fontFamily: font.tebal, fontSize: 15, color: warna.teksRedup },
  terisi: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kolom: { flex: 1, gap: 2 },
  nama: { fontFamily: font.judul, fontSize: 18, color: warna.teks },
});

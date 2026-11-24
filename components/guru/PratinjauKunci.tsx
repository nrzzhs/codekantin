import { StyleSheet, Text, View } from 'react-native';
import Animated, { Keyframe, useReducedMotion } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Struktur } from './perintah';
import { font, warna } from '../../lib/tema';

type Props = {
  struktur: Struktur;
  /** null kalau perintah belum valid sehingga kunci belum bisa dihitung. */
  keluar: string[] | null;
  isiAkhir: string[] | null;
};

const POP = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.4 }] },
  60: { opacity: 1, transform: [{ scale: 1.1 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(280);

const GARIS: Record<Struktur, string> = { stack: '#C2410C', queue: '#0369A1' };

/** Kartu gelap "KUNCI JAWABAN OTOMATIS": urutan keluar dan isi akhir. */
export default function PratinjauKunci({ struktur, keluar, isiAkhir }: Props) {
  const kurangiGerak = useReducedMotion();
  const stack = struktur === 'stack';

  return (
    <View style={styles.kartu}>
      <View style={styles.judulBaris}>
        <Ionicons name="key-outline" size={16} color="#5EEAD4" />
        <Text style={styles.judul} accessibilityRole="header">
          KUNCI JAWABAN OTOMATIS
        </Text>
      </View>

      <View
        style={styles.baris}
        accessible
        accessibilityLabel={`Urutan keluar: ${keluar && keluar.length ? keluar.join(', ') : 'belum ada'}`}
      >
        <Text style={styles.label}>Keluar</Text>
        <View style={styles.chipBaris}>
          {keluar && keluar.length > 0 ? (
            keluar.map((x, i) => (
              <Animated.View
                key={`${i}-${x}`}
                entering={kurangiGerak ? undefined : POP}
                style={styles.chipKeluar}
              >
                <Text style={styles.chipKeluarTeks}>
                  {i + 1}. {x}
                </Text>
              </Animated.View>
            ))
          ) : (
            <Text style={styles.redup}>belum ada (tambahkan pop/dequeue)</Text>
          )}
        </View>
      </View>

      <View
        style={styles.baris}
        accessible
        accessibilityLabel={`Isi akhir: ${
          isiAkhir === null ? 'belum bisa dihitung' : isiAkhir.length ? isiAkhir.join(', ') : 'kosong'
        }`}
      >
        <Text style={styles.label}>Isi akhir</Text>
        <View style={styles.chipBaris}>
          {isiAkhir === null ? (
            <Text style={styles.redup}>belum bisa dihitung</Text>
          ) : isiAkhir.length === 0 ? (
            <Text style={styles.redup}>kosong</Text>
          ) : (
            isiAkhir.map((x, i) => {
              const pertama = i === 0;
              const terakhir = i === isiAkhir.length - 1;
              const tag = stack ? (terakhir ? 'TOP' : null) : [pertama && 'F', terakhir && 'R'].filter(Boolean).join('/') || null;
              return (
                <View
                  key={`${i}-${x}`}
                  style={[styles.chipIsi, stack ? styles.pil : styles.kotak, { borderColor: GARIS[struktur] }]}
                >
                  <Text style={styles.chipIsiTeks}>{x}</Text>
                  {tag && <Text style={styles.tag}>{tag}</Text>}
                </View>
              );
            })
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: { backgroundColor: warna.gelap, borderRadius: 22, padding: 16, gap: 12 },
  judulBaris: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  judul: { fontFamily: font.judul, fontSize: 12, letterSpacing: 0.6, color: '#5EEAD4' },
  baris: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  label: { width: 64, fontFamily: font.tebal, fontSize: 12, color: '#CBD5E1', paddingTop: 5 },
  chipBaris: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  chipKeluar: { backgroundColor: '#B91C1C', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chipKeluarTeks: { fontFamily: font.kodeTebal, fontSize: 12, color: '#FFFFFF' },
  redup: { fontFamily: font.isi, fontSize: 12, color: '#94A3B8', paddingTop: 5 },
  chipIsi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pil: { borderRadius: 999 },
  kotak: { borderRadius: 6 },
  chipIsiTeks: { fontFamily: font.kodeTebal, fontSize: 12, color: '#FCD34D' },
  tag: { fontFamily: font.judul, fontSize: 9, color: '#5EEAD4' },
});

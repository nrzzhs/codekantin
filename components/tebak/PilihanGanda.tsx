import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { SoalPilihanGanda } from '../../data/soal';
import { font, warna } from '../../lib/tema';

type Props = {
  soal: SoalPilihanGanda;
  dipilih: string | null;
  diperiksa: boolean;
  onPilih: (id: string) => void;
};

const MAKS_2_KOLOM = 28;

/** Ikon pertanyaan dipilih dari isinya; selain Stack/Queue memakai tanda tanya. */
function ikonSoal(pertanyaan: string): ComponentProps<typeof Ionicons>['name'] {
  if (/stack|push|pop/i.test(pertanyaan)) return 'layers-outline';
  if (/queue|antrean|enqueue|dequeue/i.test(pertanyaan)) return 'people-outline';
  return 'help-circle-outline';
}

type Keadaan = 'normal' | 'dipilih' | 'benar' | 'salah';

const GAYA: Record<Keadaan, { latar: string; garis: string; huruf: string; teksHuruf: string }> = {
  normal: { latar: '#FFFFFF', garis: warna.garis, huruf: warna.garis, teksHuruf: warna.teks },
  dipilih: { latar: '#F5F3FF', garis: warna.ungu, huruf: warna.ungu, teksHuruf: '#FFFFFF' },
  benar: { latar: '#F0FDF4', garis: warna.hijau, huruf: warna.hijau, teksHuruf: '#FFFFFF' },
  salah: { latar: '#FEF2F2', garis: '#B91C1C', huruf: '#B91C1C', teksHuruf: '#FFFFFF' },
};

/** Kartu pertanyaan + pilihan dalam grid 2×2 (1 kolom kalau ada pilihan yang panjang). */
export default function PilihanGanda({ soal, dipilih, diperiksa, onPilih }: Props) {
  const satuKolom = soal.pilihan.some((p) => p.teks.length > MAKS_2_KOLOM);

  return (
    <View style={styles.wadah}>
      <View style={styles.kartuTanya}>
        <View style={styles.kotakIkon}>
          <Ionicons name={ikonSoal(soal.pertanyaan)} size={30} color={warna.ungu} />
        </View>
        <Text style={styles.pertanyaan} accessibilityRole="header">
          {soal.pertanyaan}
        </Text>
      </View>

      <View style={styles.grid} accessibilityRole="radiogroup">
        {soal.pilihan.map((p, i) => {
          const huruf = String.fromCharCode(65 + i);
          const terpilih = dipilih === p.id;
          const keadaan: Keadaan =
            diperiksa && p.id === soal.benar
              ? 'benar'
              : diperiksa && terpilih
                ? 'salah'
                : terpilih
                  ? 'dipilih'
                  : 'normal';
          const g = GAYA[keadaan];
          const ket = keadaan === 'benar' ? ', jawaban benar' : keadaan === 'salah' ? ', salah' : '';
          return (
            <Pressable
              key={p.id}
              onPress={() => onPilih(p.id)}
              disabled={diperiksa}
              style={[styles.sel, satuKolom ? styles.selPenuh : styles.selSetengah]}
              accessibilityRole="radio"
              accessibilityState={{ checked: terpilih, disabled: diperiksa }}
              accessibilityLabel={`${huruf}. ${p.teks}${ket}`}
            >
              {({ pressed }) => (
                <>
                  <View style={[styles.bayangan, { backgroundColor: g.garis }]} />
                  <View
                    style={[
                      styles.muka,
                      { backgroundColor: g.latar, borderColor: g.garis },
                      pressed && !diperiksa && styles.mukaTekan,
                    ]}
                  >
                    <View style={[styles.huruf, { backgroundColor: g.huruf }]}>
                      <Text style={[styles.hurufTeks, { color: g.teksHuruf }]}>{huruf}</Text>
                    </View>
                    <Text style={styles.teks}>{p.teks}</Text>
                  </View>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const TURUN = 4;

const styles = StyleSheet.create({
  wadah: { gap: 14 },
  kartuTanya: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: warna.garis,
    padding: 14,
  },
  kotakIkon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: warna.unguMuda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pertanyaan: { flex: 1, fontFamily: font.judul, fontSize: 19, lineHeight: 26, color: warna.teks },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sel: { minHeight: 104 + TURUN, paddingBottom: TURUN },
  selSetengah: { width: '48.5%', flexGrow: 1, flexBasis: '45%' },
  selPenuh: { width: '100%', minHeight: 72 + TURUN },
  bayangan: { position: 'absolute', left: 0, right: 0, top: TURUN, bottom: 0, borderRadius: 20 },
  muka: { flex: 1, borderRadius: 20, borderWidth: 3, padding: 12, gap: 10 },
  mukaTekan: { transform: [{ translateY: TURUN - 1 }] },
  huruf: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hurufTeks: { fontFamily: font.judul, fontSize: 14 },
  teks: { fontFamily: font.judul, fontSize: 15, lineHeight: 21, color: warna.teks },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, warna } from '../../lib/tema';

const KELAS = ['X', 'XI', 'XII'];

type Props = {
  nilai: string;
  onUbah: (nilai: string) => void;
  /** Nilai lama di luar X/XI/XII (mis. dari data lama) yang tetap ditampilkan sebagai pilihan. */
  nilaiLain: string | null;
};

/** Pilihan kelas X / XI / XII. Mengetuk pilihan yang sudah terpilih akan membatalkannya. */
export default function PilihanKelas({ nilai, onUbah, nilaiLain }: Props) {
  const pilihan = nilaiLain ? [...KELAS, nilaiLain] : KELAS;
  const terpilih = nilai.trim();

  return (
    <View style={styles.wadah}>
      <Text style={styles.label} importantForAccessibility="no" accessibilityElementsHidden>
        Kelas
      </Text>
      <View style={styles.baris} accessibilityRole="radiogroup" accessibilityLabel="Kelas">
        {pilihan.map((k) => {
          const aktif = terpilih === k;
          return (
            <Pressable
              key={k}
              onPress={() => onUbah(aktif ? '' : k)}
              style={({ pressed }) => [
                styles.tombol,
                aktif && styles.tombolAktif,
                pressed && !aktif && styles.tombolTekan,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: aktif }}
              accessibilityLabel={`Kelas ${k}`}
              accessibilityHint={aktif ? 'Ketuk lagi untuk membatalkan' : undefined}
            >
              <Text style={[styles.teks, aktif && styles.teksAktif]} numberOfLines={1}>
                {k}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wadah: { gap: 6 },
  label: { fontFamily: font.tebal, fontSize: 13, color: warna.teks },
  baris: { flexDirection: 'row', gap: 10 },
  tombol: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: warna.garis,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tombolAktif: { backgroundColor: warna.biru, borderColor: warna.biru },
  tombolTekan: { backgroundColor: warna.kotakKode },
  teks: { fontFamily: font.judul, fontSize: 16, color: warna.teks },
  teksAktif: { color: '#FFFFFF' },
});

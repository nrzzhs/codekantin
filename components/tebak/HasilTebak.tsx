import { useEffect, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Keyframe, useReducedMotion } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import KokiPiri from '../ilustrasi/KokiPiri';
import Konfeti from '../ilustrasi/Konfeti';
import { font, warna } from '../../lib/tema';

// Bintang muncul: 0 → 1,2 → 1
const MUNCUL = new Keyframe({
  0: { transform: [{ scale: 0 }] },
  60: { transform: [{ scale: 1.2 }] },
  100: { transform: [{ scale: 1 }] },
}).duration(360);

/** Kartu juara ungu: konfeti, Koki Piri gembira, skor, dan bintang sebanyak jawaban benar. */
export function KartuJuara({ benar, total }: { benar: number; total: number }) {
  const kurangiGerak = useReducedMotion();
  return (
    <View style={styles.juara}>
      <Konfeti tinggi={360} jumlah={16} />
      <KokiPiri ukuran={110} ekspresi="gembira" />
      <Text style={styles.juaraLabel}>HASIL TANTANGAN</Text>
      <View accessible accessibilityRole="text" accessibilityLabel={`${benar} dari ${total} benar`} style={styles.skorWadah}>
        <Text style={styles.skor}>
          {benar}/{total}
        </Text>
        <View style={styles.bintang}>
          {Array.from({ length: total }, (_, i) =>
            i < benar ? (
              <Animated.View
                key={i}
                entering={kurangiGerak ? undefined : MUNCUL.delay(300 + i * 150)}
              >
                <Ionicons name="star" size={30} color="#FCD34D" />
              </Animated.View>
            ) : (
              <Ionicons key={i} name="star" size={30} color="#8B5CF6" />
            ),
          )}
        </View>
      </View>
    </View>
  );
}

/** Angka yang naik dari 0 ke `target` (±800 ms). Langsung tampil kalau "kurangi gerakan" aktif. */
function useAngkaNaik(target: number, durasi = 800) {
  const kurangiGerak = useReducedMotion();
  const [nilai, setNilai] = useState(kurangiGerak ? target : 0);

  useEffect(() => {
    if (kurangiGerak) {
      const id = requestAnimationFrame(() => setNilai(target));
      return () => cancelAnimationFrame(id);
    }
    const mulai = Date.now();
    let id = 0;
    const langkah = () => {
      const t = Math.min(1, (Date.now() - mulai) / durasi);
      setNilai(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) id = requestAnimationFrame(langkah);
    };
    id = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(id);
  }, [target, durasi, kurangiGerak]);

  return nilai;
}

type KotakHadiahProps = {
  nilai: number;
  label: string;
  warnaAngka: string;
  ikon?: ComponentProps<typeof Ionicons>['name'];
  warnaIkon?: string;
};

/** Kotak hadiah (XP atau poin) dengan angka yang naik dari 0. */
export function KotakHadiah({ nilai, label, warnaAngka, ikon, warnaIkon }: KotakHadiahProps) {
  const tampil = useAngkaNaik(nilai);
  return (
    <View style={styles.hadiah} accessible accessibilityLabel={`Tambah ${nilai} ${label}`}>
      <View style={styles.hadiahAtas}>
        {ikon && <Ionicons name={ikon} size={20} color={warnaIkon ?? warnaAngka} />}
        <Text style={[styles.hadiahAngka, { color: warnaAngka }]}>+{tampil}</Text>
      </View>
      <Text style={styles.hadiahLabel}>{label}</Text>
    </View>
  );
}

/** Kartu kecil diagnosis miskonsepsi. */
export function KartuDiagnosis({ judul, teks }: { judul: string; teks: string }) {
  return (
    <View style={styles.diagnosis}>
      <View style={styles.kotakCari}>
        <Ionicons name="search" size={20} color="#C2410C" />
      </View>
      <View style={styles.kolom}>
        <Text style={styles.diagnosisJudul}>{judul}</Text>
        <Text style={styles.diagnosisTeks}>{teks}</Text>
      </View>
    </View>
  );
}

/** Kartu diagnosis tanpa miskonsepsi (hijau kalau semua benar). */
export function KartuTanpaMiskonsepsi({ teks, sempurna }: { teks: string; sempurna: boolean }) {
  return (
    <View style={[styles.diagnosis, sempurna && styles.diagnosisHijau]}>
      <View style={[styles.kotakCari, sempurna && { backgroundColor: '#FFFFFF' }]}>
        <Ionicons
          name={sempurna ? 'checkmark-circle' : 'search'}
          size={20}
          color={sempurna ? warna.hijau : '#C2410C'}
        />
      </View>
      <Text style={[styles.kolom, styles.diagnosisJudul, sempurna && { color: warna.hijauTua }]}>{teks}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  juara: {
    backgroundColor: warna.ungu,
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  juaraLabel: { fontFamily: font.judul, fontSize: 13, letterSpacing: 1, color: warna.unguMuda, marginTop: 4 },
  skorWadah: { alignItems: 'center', gap: 6 },
  skor: { fontFamily: font.judul, fontSize: 44, lineHeight: 52, color: '#FFFFFF' },
  bintang: { flexDirection: 'row', gap: 6 },

  hadiah: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: warna.garis,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 2,
  },
  hadiahAtas: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hadiahAngka: { fontFamily: font.judul, fontSize: 20 },
  hadiahLabel: { fontFamily: font.semi, fontSize: 12, color: warna.teksRedup },

  diagnosis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: warna.garis,
    padding: 12,
  },
  diagnosisHijau: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  kotakCari: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kolom: { flex: 1, gap: 2 },
  diagnosisJudul: { fontFamily: font.judul, fontSize: 14, color: warna.teks },
  diagnosisTeks: { fontFamily: font.isi, fontSize: 13, lineHeight: 19, color: warna.teksRedup },
});

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import KokiPiri from '../ilustrasi/KokiPiri';
import Konfeti from '../ilustrasi/Konfeti';
import Tombol from '../ui/Tombol';
import type { InfoMiskonsepsi } from '../../data/miskonsepsi';
import type { JenisStruktur, Langkah } from '../../logic/simulasi';
import { font, warna } from '../../lib/tema';

type Props = {
  benar: boolean;
  /** Baris jawaban benar, mis. "Urutan keluar yang benar: Piring 3 → Piring 2". */
  ringkas: string;
  xp: number;
  /** Soal prediksi: jejak langkah dan isi akhir. */
  simulasi?: { struktur: JenisStruktur; petunjuk: string; langkah: Langkah[]; akhir: string };
  /** Soal pilihan ganda: penjelasan. */
  penjelasan?: string;
  /** Miskonsepsi yang terdeteksi (hanya kalau salah). */
  kesalahan: InfoMiskonsepsi | null;
  /** Saran umum kalau salah tapi tidak ada miskonsepsi khusus. */
  saranUmum?: string;
  labelTombol: string;
  tombolNonaktif: boolean;
  onLanjut: () => void;
};

/** Lembar umpan balik yang meluncur dari bawah, di atas soal yang sudah diwarnai benar/salah. */
export default function LembarUmpanBalik({
  benar,
  ringkas,
  xp,
  simulasi,
  penjelasan,
  kesalahan,
  saranUmum,
  labelTombol,
  tombolNonaktif,
  onLanjut,
}: Props) {
  const kurangiGerak = useReducedMotion();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [buka, setBuka] = useState(false);
  const latar = benar ? '#F0FDF4' : '#FEF2F2';

  return (
    <Animated.View
      style={styles.latarGelap}
      entering={kurangiGerak ? undefined : FadeIn.duration(200)}
      accessibilityViewIsModal
    >
      <Animated.View
        entering={kurangiGerak ? undefined : SlideInDown.springify().damping(18).stiffness(180)}
        style={[styles.lembar, { maxHeight: height * 0.78, backgroundColor: latar }]}
      >
        {benar && <Konfeti tinggi={160} jumlah={16} ulang={false} />}
        <View style={styles.pegangan} />

        <ScrollView contentContainerStyle={styles.isi} bounces={false}>
          {/* Hasil sudah diumumkan lewat announceForAccessibility saat jawaban dicek */}
          <View style={styles.atas} accessible>
            <KokiPiri ukuran={64} ekspresi={benar ? 'tertawa' : 'kaget'} />
            <View style={styles.kolomJudul}>
              <Text style={[styles.judul, { color: benar ? warna.hijau : '#B91C1C' }]}>
                {benar ? 'Benar sekali!' : 'Belum tepat'}
              </Text>
              <Text style={styles.ringkas}>{ringkas}</Text>
            </View>
            {benar && (
              <View style={styles.pilXp}>
                <Text style={styles.pilXpTeks}>+{xp} XP</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={() => setBuka((b) => !b)}
            style={styles.lipat}
            accessibilityRole="button"
            accessibilityState={{ expanded: buka }}
            accessibilityLabel="Penjelasan Koki"
          >
            <Ionicons name="bulb-outline" size={20} color={warna.ungu} />
            <Text style={styles.lipatTeks}>Penjelasan Koki</Text>
            <Ionicons name={buka ? 'chevron-up' : 'chevron-down'} size={20} color={warna.teksRedup} />
          </Pressable>

          {buka && (
            <Animated.View entering={kurangiGerak ? undefined : FadeIn.duration(200)} style={styles.kotakPutih}>
              {simulasi ? (
                <JejakLangkah {...simulasi} />
              ) : (
                <Text style={styles.penjelasan}>{penjelasan}</Text>
              )}
            </Animated.View>
          )}

          {!benar && (kesalahan || saranUmum) && (
            <View style={styles.kesalahan}>
              <View style={styles.kesalahanAtas}>
                <Ionicons name="warning-outline" size={20} color="#C2410C" />
                <Text style={styles.kesalahanJudul}>
                  {kesalahan ? `Kesalahan umum: ${kesalahan.judul}` : 'Tips'}
                </Text>
              </View>
              {kesalahan ? (
                <>
                  <Text style={styles.kesalahanTeks}>{kesalahan.penjelasan}</Text>
                  <Text style={styles.kesalahanTeks}>Tips: {kesalahan.perbaikan}</Text>
                </>
              ) : (
                <Text style={styles.kesalahanTeks}>{saranUmum}</Text>
              )}
            </View>
          )}
        </ScrollView>

        <View style={[styles.kaki, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Tombol
            label={labelTombol}
            varian={benar ? 'utama' : 'tebak'}
            onPress={onLanjut}
            nonaktif={tombolNonaktif}
            tinggi={56}
            sudut={20}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

/** Jejak visual: satu baris per perintah, berisi isi struktur setelah langkah itu. */
function JejakLangkah({
  struktur,
  petunjuk,
  langkah,
  akhir,
}: {
  struktur: JenisStruktur;
  petunjuk: string;
  langkah: Langkah[];
  akhir: string;
}) {
  const stack = struktur === 'stack';
  return (
    <View style={styles.jejak}>
      <Text style={styles.petunjuk}>{petunjuk}</Text>
      {langkah.map((l, i) => (
        <View
          key={`l-${i}`}
          style={styles.barisJejak}
          accessible
          accessibilityLabel={`Langkah ${i + 1}: ${l.perintah}. Isi: ${
            l.isi.length ? l.isi.join(', ') : 'kosong'
          }${l.keluar !== null ? `. Keluar ${l.keluar}` : ''}`}
        >
          <View style={styles.noJejak}>
            <Text style={styles.noJejakTeks}>{i + 1}</Text>
          </View>
          <Text style={styles.perintah}>{l.perintah}</Text>
          <View style={styles.chipBaris}>
            {l.isi.length === 0 ? (
              <Text style={styles.kosong}>kosong</Text>
            ) : (
              l.isi.map((x, j) => {
                const ujung = j === l.isi.length - 1; // TOP (stack) atau REAR (queue)
                return (
                  <View
                    key={`${x}-${j}`}
                    style={[
                      stack ? styles.chipPiring : styles.chipKotak,
                      ujung && { backgroundColor: stack ? '#FFEDD5' : '#E0F2FE' },
                    ]}
                  >
                    <Text style={[styles.chipTeks, { color: stack ? '#9A3412' : '#0369A1' }]}>{x}</Text>
                  </View>
                );
              })
            )}
            {l.keluar !== null && <Text style={styles.keluar}>keluar {l.keluar}</Text>}
          </View>
        </View>
      ))}
      <Text style={styles.akhir}>{akhir}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  latarGelap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
  },
  lembar: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  pegangan: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#C9BBAE',
    marginTop: 10,
  },
  isi: { padding: 20, paddingTop: 14, gap: 14 },
  atas: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kolomJudul: { flex: 1, gap: 2 },
  judul: { fontFamily: font.judul, fontSize: 22 },
  ringkas: { fontFamily: font.tebal, fontSize: 14, lineHeight: 20, color: warna.teks },
  pilXp: { backgroundColor: warna.hijau, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pilXpTeks: { fontFamily: font.judul, fontSize: 13, color: '#FFFFFF' },

  lipat: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: warna.garis,
  },
  lipatTeks: { flex: 1, fontFamily: font.judul, fontSize: 15, color: warna.teks },
  kotakPutih: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14 },
  penjelasan: { fontFamily: font.isi, fontSize: 14, lineHeight: 21, color: warna.teks },

  kesalahan: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FED7AA',
    padding: 14,
    gap: 6,
  },
  kesalahanAtas: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kesalahanJudul: { flex: 1, fontFamily: font.judul, fontSize: 13, color: '#9A3412' },
  kesalahanTeks: { fontFamily: font.isi, fontSize: 13, lineHeight: 19, color: warna.teks },

  kaki: { paddingHorizontal: 20, paddingTop: 8 },

  jejak: { gap: 8 },
  petunjuk: { fontFamily: font.semi, fontSize: 12, color: warna.teksRedup },
  barisJejak: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  noJejak: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: warna.unguMuda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noJejakTeks: { fontFamily: font.judul, fontSize: 11, color: warna.ungu },
  perintah: { width: 92, fontFamily: font.kode, fontSize: 12, color: warna.teks },
  chipBaris: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  chipPiring: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#C2410C',
    paddingHorizontal: 7,
    paddingVertical: 1,
    backgroundColor: '#FFFFFF',
  },
  chipKotak: {
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#0369A1',
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#FFFFFF',
  },
  chipTeks: { fontFamily: font.judul, fontSize: 11 },
  kosong: { fontFamily: font.isi, fontSize: 11, color: warna.teksRedup },
  keluar: { fontFamily: font.judul, fontSize: 11, color: '#B91C1C', marginLeft: 4 },
  akhir: { fontFamily: font.tebal, fontSize: 13, color: warna.teks, marginTop: 4 },
});

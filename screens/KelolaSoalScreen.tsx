import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { font, warna } from '../lib/tema';
import { ambilSoalSaya, hapusSoal, setAktif } from '../lib/bankSoal';
import { hitungRingkasan, ringkasSoal, saring } from '../logic/formSoal';
import type { BarisKelola, FilterSoal } from '../logic/formSoal';
import { useBankSoal } from '../context/BankSoalContext';
import { SpinnerPiring } from '../components/Loading';
import KeadaanKosong from '../components/ui/KeadaanKosong';
import Tombol from '../components/ui/Tombol';
import KokiPiri from '../components/ilustrasi/KokiPiri';
import KartuSoalGuru from '../components/guru/KartuSoalGuru';

type Props = { userId: string };

const FILTER: { id: FilterSoal; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'aktif', label: 'Aktif' },
  { id: 'nonaktif', label: 'Nonaktif' },
];

export default function KelolaSoalScreen({ userId }: Props) {
  const navigation = useNavigation<any>();
  const { muatUlang } = useBankSoal();

  const [daftar, setDaftar] = useState<BarisKelola[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [filter, setFilter] = useState<FilterSoal>('semua');
  const [sibuk, setSibuk] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    setGalat(null);
    try {
      setDaftar(await ambilSoalSaya(userId));
    } catch (e: any) {
      setGalat(e?.message ?? 'Gagal memuat soal.');
    } finally {
      setMemuat(false);
    }
  }, [userId]);

  // Muat ulang setiap kali tab ini dibuka (termasuk setelah menyimpan di form)
  useFocusEffect(
    useCallback(() => {
      muat();
    }, [muat]),
  );

  async function ubahAktif(b: BarisKelola, nilai: boolean) {
    if (sibuk) return;
    setSibuk(b.id);
    setDaftar((d) => d && d.map((x) => (x.id === b.id ? { ...x, aktif: nilai } : x)));
    try {
      await setAktif(b.id, nilai);
      void muatUlang();
    } catch (e: any) {
      setDaftar((d) => d && d.map((x) => (x.id === b.id ? { ...x, aktif: !nilai } : x)));
      Alert.alert('Gagal mengubah status', e?.message ?? 'Coba lagi.');
    } finally {
      setSibuk(null);
    }
  }

  function konfirmasiHapus(b: BarisKelola) {
    Alert.alert(
      'Hapus soal?',
      'Soal yang dihapus tidak bisa dikembalikan. Sesi siswa yang sedang berjalan tidak terpengaruh.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            if (sibuk) return;
            setSibuk(b.id);
            try {
              await hapusSoal(b.id);
              setDaftar((d) => d && d.filter((x) => x.id !== b.id));
              void muatUlang();
            } catch (e: any) {
              Alert.alert('Gagal menghapus', e?.message ?? 'Coba lagi.');
            } finally {
              setSibuk(null);
            }
          },
        },
      ],
    );
  }

  const semua = daftar ?? [];
  const ringkas = hitungRingkasan(semua);
  const tampil = saring(semua, filter);
  const jumlahFilter: Record<FilterSoal, number> = {
    semua: ringkas.total,
    aktif: ringkas.aktif,
    nonaktif: ringkas.nonaktif,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.isi}
        refreshControl={
          <RefreshControl
            refreshing={memuat && daftar !== null}
            onRefresh={muat}
            colors={[warna.hijau]}
            tintColor={warna.hijau}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.kotakIkon}>
            <Ionicons name="document-text-outline" size={26} color={warna.hijauTua} />
          </View>
          <View style={styles.headerKolom}>
            <Text style={styles.judul} accessibilityRole="header">
              Bank Soal
            </Text>
            <View style={styles.chipGuru}>
              <Text style={styles.chipGuruTeks}>MODE GURU</Text>
            </View>
          </View>
        </View>

        {/* Info Koki Piri */}
        <View style={styles.info}>
          <KokiPiri ukuran={44} />
          <Text style={styles.infoTeks}>
            Soal aktif milikmu ikut muncul di sesi Tebak semua siswa. Kunci jawaban dihitung otomatis dari
            perintah yang kamu tulis.
          </Text>
        </View>

        {/* Statistik */}
        <View style={styles.statBaris}>
          <Stat angka={ringkas.total} label="Total" warnaAngka={warna.teks} />
          <Stat angka={ringkas.aktif} label="Aktif" warnaAngka={warna.hijau} />
          <Stat angka={ringkas.nonaktif} label="Nonaktif" warnaAngka={warna.teksRedup} />
        </View>

        <Tombol
          label="Soal baru"
          varian="utama"
          ikon="add"
          tinggi={56}
          onPress={() => navigation.navigate('FormSoal')}
        />

        {/* Saringan */}
        <View style={styles.segmen} accessibilityRole="tablist">
          {FILTER.map((f) => {
            const dipilih = filter === f.id;
            return (
              <Pressable
                key={f.id}
                style={[styles.segmenTombol, dipilih && styles.segmenAktif]}
                onPress={() => setFilter(f.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: dipilih }}
                accessibilityLabel={`${f.label}, ${jumlahFilter[f.id]} soal`}
              >
                <Text style={[styles.segmenTeks, dipilih && styles.segmenTeksAktif]}>
                  {f.label} {jumlahFilter[f.id]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {daftar === null && memuat && (
          <SpinnerPiring ukuran={72} label="Memuat soal" style={{ marginTop: 10, alignSelf: 'center' }} />
        )}

        {galat && (
          <View style={styles.kotakGalat} accessibilityRole="alert">
            <Ionicons name="warning-outline" size={20} color="#B91C1C" />
            <View style={styles.kolom}>
              <Text style={styles.galatTeks}>{galat}</Text>
              <Pressable onPress={muat} style={styles.cobaLagi} accessibilityRole="button">
                <Text style={styles.cobaLagiTeks}>Coba lagi</Text>
              </Pressable>
            </View>
          </View>
        )}

        {daftar !== null && tampil.length === 0 && !galat && ringkas.total === 0 && (
          <KeadaanKosong
            judul="Piringnya masih kosong"
            deskripsi="Belum ada soal. Tambahkan soal pertama untuk siswa."
            aksi={{ label: '+ Tambah soal', onPress: () => navigation.navigate('FormSoal') }}
          />
        )}

        {daftar !== null && tampil.length === 0 && !galat && ringkas.total > 0 && (
          <Text style={styles.kosong}>Tidak ada soal di daftar ini.</Text>
        )}

        {tampil.map((b) => (
          <KartuSoalGuru
            key={b.id}
            soal={b}
            ringkas={ringkasSoal(b)}
            sibuk={sibuk !== null}
            onUbahAktif={(v) => ubahAktif(b, v)}
            onUbah={() => navigation.navigate('FormSoal', { soal: b })}
            onHapus={() => konfirmasiHapus(b)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ angka, label, warnaAngka }: { angka: number; label: string; warnaAngka: string }) {
  return (
    <View style={styles.statKotak} accessible accessibilityLabel={`${label}: ${angka}`}>
      <Text style={[styles.statAngka, { color: warnaAngka }]}>{angka}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 20, paddingBottom: 40, gap: 14 },
  kolom: { flex: 1, gap: 4 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kotakIkon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: warna.hijauMuda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerKolom: { flex: 1, alignItems: 'flex-start', gap: 4 },
  judul: { fontFamily: font.judul, fontSize: 22, color: warna.teks },
  chipGuru: { backgroundColor: warna.hijauMuda, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  chipGuruTeks: { fontFamily: font.judul, fontSize: 11, color: warna.hijauTua },

  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: warna.garis,
    padding: 12,
  },
  infoTeks: { flex: 1, fontFamily: font.tebal, fontSize: 13, lineHeight: 19, color: warna.teks },

  statBaris: { flexDirection: 'row', gap: 10 },
  statKotak: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: warna.garis,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statAngka: { fontFamily: font.judul, fontSize: 24 },
  statLabel: { fontFamily: font.tebal, fontSize: 12, color: warna.teksRedup },

  segmen: { flexDirection: 'row', backgroundColor: warna.garis, borderRadius: 16, padding: 4 },
  segmenTombol: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmenAktif: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1F1A17',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmenTeks: { fontFamily: font.tebal, fontSize: 13, color: warna.teksRedup },
  segmenTeksAktif: { color: warna.teks },

  kotakGalat: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 14,
  },
  galatTeks: { fontFamily: font.isi, fontSize: 14, lineHeight: 20, color: '#B91C1C' },
  cobaLagi: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  cobaLagiTeks: { fontFamily: font.tebal, fontSize: 14, color: '#B91C1C' },

  kosong: { fontFamily: font.isi, fontSize: 14, color: warna.teksRedup, textAlign: 'center', marginTop: 10 },
});

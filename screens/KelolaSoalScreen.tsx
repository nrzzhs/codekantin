import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { warna } from '../lib/tema';
import { ambilSoalSaya, hapusSoal, setAktif } from '../lib/bankSoal';
import { hitungRingkasan, ringkasSoal, saring } from '../logic/formSoal';
import type { BarisKelola, FilterSoal } from '../logic/formSoal';
import { useBankSoal } from '../context/BankSoalContext';
import { SpinnerPiring } from '../components/Loading';
import KeadaanKosong from '../components/ui/KeadaanKosong';

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.isi}
        refreshControl={<RefreshControl refreshing={memuat && daftar !== null} onRefresh={muat} />}
      >
        <View style={styles.banner}>
          <Text style={styles.bannerTag}>MODE GURU</Text>
          <Text style={styles.bannerJudul}>Kelola Bank Soal</Text>
          <Text style={styles.bannerSub}>
            Soal aktif milikmu ikut muncul di sesi Tebak semua siswa. Kunci jawaban dihitung otomatis
            dari perintah yang kamu tulis.
          </Text>
        </View>

        <View style={styles.statBaris}>
          <View style={styles.statKotak}>
            <Text style={styles.statAngka}>{ringkas.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statKotak}>
            <Text style={styles.statAngka}>{ringkas.aktif}</Text>
            <Text style={styles.statLabel}>Aktif</Text>
          </View>
          <View style={styles.statKotak}>
            <Text style={styles.statAngka}>{ringkas.nonaktif}</Text>
            <Text style={styles.statLabel}>Nonaktif</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.tombolUtama}
          onPress={() => navigation.navigate('FormSoal')}
          accessibilityRole="button"
        >
          <Text style={styles.tombolUtamaTeks}>＋ Soal baru</Text>
        </TouchableOpacity>

        <View style={styles.filterBaris}>
          {FILTER.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.pil, filter === f.id && styles.pilAktif]}
              onPress={() => setFilter(f.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === f.id }}
            >
              <Text style={[styles.pilTeks, filter === f.id && styles.pilTeksAktif]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {daftar === null && memuat && <SpinnerPiring ukuran={72} label="Memuat soal" style={{ marginTop: 24, alignSelf: 'center' }} />}

        {galat && (
          <View style={styles.kotakGalat}>
            <Text style={styles.galatTeks}>{galat}</Text>
            <TouchableOpacity style={styles.tombolKecil} onPress={muat}>
              <Text style={styles.tombolKecilTeks}>Coba lagi</Text>
            </TouchableOpacity>
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
          <Text style={styles.kosong}>Tidak ada soal untuk filter ini.</Text>
        )}

        {tampil.map((b) => {
          const r = ringkasSoal(b);
          return (
            <View key={b.id} style={[styles.kartu, !b.aktif && styles.kartuMati]}>
              <View style={styles.barisAtas}>
                <View style={styles.lencana}>
                  <Text style={styles.lencanaTeks}>
                    {r.jenisLabel} • {r.subLabel}
                  </Text>
                </View>
                {!b.aktif && <Text style={styles.tagNonaktif}>NONAKTIF</Text>}
              </View>

              <Text style={styles.judul}>{r.judul}</Text>
              <Text style={styles.rincian}>{r.rincian}</Text>

              <View style={styles.aksi}>
                <View style={styles.sakelar}>
                  <Switch
                    value={b.aktif}
                    onValueChange={(v) => ubahAktif(b, v)}
                    disabled={sibuk !== null}
                    accessibilityLabel={`Soal ${b.aktif ? 'aktif' : 'nonaktif'}. Ketuk untuk mengubah.`}
                  />
                  <Text style={styles.sakelarTeks}>{b.aktif ? 'Aktif' : 'Nonaktif'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.tombolKecil}
                  onPress={() => navigation.navigate('FormSoal', { soal: b })}
                  disabled={sibuk !== null}
                  accessibilityRole="button"
                >
                  <Text style={styles.tombolKecilTeks}>Ubah</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tombolKecil}
                  onPress={() => konfirmasiHapus(b)}
                  disabled={sibuk !== null}
                  accessibilityRole="button"
                >
                  <Text style={[styles.tombolKecilTeks, { color: '#B91C1C' }]}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 18, paddingBottom: 40 },

  banner: { backgroundColor: warna.hijauMuda, borderRadius: 20, padding: 18, marginBottom: 14 },
  bannerTag: { color: '#0F766E', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  bannerJudul: { fontSize: 22, fontWeight: '800', color: warna.teks, marginTop: 6 },
  bannerSub: { color: warna.teksRedup, marginTop: 6, lineHeight: 20 },

  statBaris: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statKotak: {
    flex: 1, backgroundColor: warna.kartu, borderRadius: 14, borderWidth: 1,
    borderColor: warna.garis, paddingVertical: 12, alignItems: 'center',
  },
  statAngka: { fontSize: 22, fontWeight: '800', color: warna.teks },
  statLabel: { color: warna.teksRedup, marginTop: 2 },

  tombolUtama: {
    backgroundColor: warna.hijau, borderRadius: 14, minHeight: 48,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  tombolUtamaTeks: { color: '#fff', fontWeight: '700', fontSize: 16 },

  filterBaris: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  pil: {
    minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1,
    borderColor: warna.garis, backgroundColor: '#fff', justifyContent: 'center',
  },
  pilAktif: { backgroundColor: warna.gelap, borderColor: warna.gelap },
  pilTeks: { fontWeight: '700', color: warna.teks },
  pilTeksAktif: { color: '#fff' },

  kotakGalat: { backgroundColor: '#FEE2E2', borderRadius: 14, padding: 14, marginBottom: 14 },
  galatTeks: { color: '#B91C1C', lineHeight: 20 },
  kosong: { color: warna.teksRedup, textAlign: 'center', marginTop: 24, lineHeight: 22 },

  kartu: {
    backgroundColor: warna.kartu, borderRadius: 18, borderWidth: 1,
    borderColor: warna.garis, padding: 16, marginBottom: 12,
  },
  kartuMati: { backgroundColor: '#F7F1EA' },
  barisAtas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lencana: { backgroundColor: warna.biruMuda, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  lencanaTeks: { color: warna.biru, fontWeight: '800', fontSize: 11 },
  tagNonaktif: { color: warna.teksRedup, fontWeight: '800', fontSize: 11 },
  judul: { fontSize: 16, fontWeight: '700', color: warna.teks, marginTop: 10, lineHeight: 22 },
  rincian: { color: warna.teksRedup, marginTop: 4, lineHeight: 20 },

  aksi: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  sakelar: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sakelarTeks: { color: warna.teks, fontWeight: '600', marginLeft: 4 },
  tombolKecil: {
    minHeight: 44, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1,
    borderColor: warna.garis, backgroundColor: '#fff', justifyContent: 'center',
  },
  tombolKecilTeks: { fontWeight: '700', color: warna.teks },
});
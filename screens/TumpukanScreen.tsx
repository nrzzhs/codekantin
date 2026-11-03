import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTumpukan, KAPASITAS } from '../context/SimulatorContext';
import { warna, fontKode } from '../lib/tema';

const JENIS = ['Keramik', 'Kaca', 'Melamin', 'Porselen', 'Kayu'];

export default function TumpukanScreen() {
  const sim = useTumpukan();

  const { tampil } = sim;
  const isi = tampil.isi; // dasar → TOP
  const slotKosong = Math.max(0, KAPASITAS - isi.length);
  const dariAtas = [...isi].reverse(); // supaya TOP tampil paling atas

  function push() {
    const n = sim.penghitung;
    sim.tambah(`Piring ${JENIS[n % JENIS.length]} #${n + 1}`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.isi}>
        <View style={styles.banner}>
          <Text style={styles.bannerTag}>STRUKTUR DATA • STACK</Text>
          <Text style={styles.bannerJudul}>Yang Ditaruh Terakhir, Diambil Pertama</Text>
          <Text style={styles.bannerSub}>
            Piring baru ditaruh di puncak (TOP), dan piring yang diambil juga dari puncak.
          </Text>
        </View>

        {/* Rak cuci piring */}
        <View style={styles.kartu}>
          <View style={styles.barisAtas}>
            <Text style={styles.kartuJudul}>Rak Cuci Piring</Text>
            <Text style={styles.kapasitas}>{isi.length}/{KAPASITAS}</Text>
          </View>
          <Text style={styles.arah}>Tambah dan ambil hanya lewat TOP</Text>

          <View style={styles.rak}>
            {Array.from({ length: slotKosong }).map((_, i) => (
              <View key={`kosong-${i}`} style={[styles.piring, styles.piringKosong]}>
                <Text style={styles.kosongTeks}>kosong</Text>
              </View>
            ))}

            {dariAtas.map((nama, i) => {
              const atas = i === 0;
              const dasar = i === dariAtas.length - 1;
              return (
                <View key={`${nama}-${i}`} style={[styles.piring, atas && styles.piringAtas]}>
                  <Text style={styles.emoji}>🍽️</Text>
                  <Text style={styles.piringNama} numberOfLines={1}>{nama}</Text>
                  <View style={styles.penanda}>
                    {atas && <Text style={styles.tagAtas}>TOP</Text>}
                    {dasar && <Text style={styles.tagDasar}>DASAR</Text>}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.tombolBaris}>
            <TouchableOpacity
              style={[styles.tombol, { backgroundColor: warna.oranye }, !sim.diAkhir && styles.mati]}
              onPress={push}
              disabled={!sim.diAkhir}
            >
              <Text style={styles.tombolTeks}>Push (+Piring)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tombol, styles.tombolGaris, !sim.diAkhir && styles.mati]}
              onPress={() => sim.ambil()}
              disabled={!sim.diAkhir}
            >
              <Text style={[styles.tombolTeks, { color: warna.teks }]}>Pop (Ambil)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pesan operasi terakhir */}
        <View style={[styles.pesan, tampil.galat ? styles.pesanGalat : styles.pesanOk]}>
          <Text style={[styles.pesanTeks, tampil.galat && { color: '#B91C1C' }]}>
            {tampil.pesan}
          </Text>
        </View>

        {/* Replay */}
        <View style={styles.replay}>
          <TouchableOpacity
            style={[styles.tombolKecil, sim.indeks === 0 && styles.mati]}
            onPress={sim.mundur}
            disabled={sim.indeks === 0}
          >
            <Text style={styles.tombolKecilTeks}>◀ Mundur</Text>
          </TouchableOpacity>
          <Text style={styles.langkah}>Langkah {sim.indeks}/{sim.totalLangkah}</Text>
          <TouchableOpacity
            style={[styles.tombolKecil, sim.diAkhir && styles.mati]}
            onPress={sim.maju}
            disabled={sim.diAkhir}
          >
            <Text style={styles.tombolKecilTeks}>Maju ▶</Text>
          </TouchableOpacity>
        </View>
        {!sim.diAkhir && (
          <Text style={styles.catatanReplay}>
            Mode replay: tekan Maju sampai langkah terakhir untuk menjalankan operasi lagi.
          </Text>
        )}

        {/* Panel status struktur data */}
        <View style={styles.kode}>
          <Text style={styles.kodeJudul}>Status Struktur Data</Text>
          <Text style={styles.kodeBaris}>
            stack = [{isi.map((x) => `"${x}"`).join(', ')}]
          </Text>
          <Text style={styles.kodeBaris}>
            top   = {isi.length ? `"${isi[isi.length - 1]}"` : 'null'}
          </Text>
          <Text style={styles.kodeBaris}>
            dasar = {isi.length ? `"${isi[0]}"` : 'null'}
          </Text>
          <Text style={styles.kodeBaris}>size  = {isi.length} / {KAPASITAS}</Text>
        </View>

        <TouchableOpacity style={styles.reset} onPress={sim.reset}>
          <Text style={styles.resetTeks}>↺ Reset tumpukan</Text>
        </TouchableOpacity>

        <View style={styles.catatan}>
          <Text style={styles.catatanJudul}>📝 Catatan Logika Komputer</Text>
          <Text style={styles.catatanIsi}>
            Prinsip LIFO (Last In, First Out): elemen yang terakhir masuk menjadi elemen pertama yang
            keluar. Penambahan dengan push dan pengambilan dengan pop sama-sama terjadi di TOP.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 18, paddingBottom: 36 },

  banner: { backgroundColor: warna.oranyeMuda, borderRadius: 20, padding: 18, marginBottom: 14 },
  bannerTag: { color: '#C2410C', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  bannerJudul: { fontSize: 22, fontWeight: '800', color: warna.teks, marginTop: 6 },
  bannerSub: { color: warna.teksRedup, marginTop: 6, lineHeight: 20 },

  kartu: {
    backgroundColor: warna.kartu, borderRadius: 20, borderWidth: 1,
    borderColor: warna.garis, padding: 18, marginBottom: 12,
  },
  barisAtas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kartuJudul: { fontSize: 18, fontWeight: '800', color: warna.teks },
  kapasitas: { fontWeight: '700', color: '#C2410C' },
  arah: { color: warna.teksRedup, fontSize: 12, marginTop: 2, marginBottom: 12 },

  rak: { gap: 8 },
  piring: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: warna.oranyeMuda,
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FED7AA',
  },
  piringAtas: { borderColor: warna.oranye, borderWidth: 2 },
  piringKosong: {
    backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: '#D6CFC7',
    justifyContent: 'center',
  },
  kosongTeks: { color: '#B0A79E', fontSize: 12 },
  emoji: { fontSize: 20, marginRight: 10 },
  piringNama: { flex: 1, fontWeight: '700', color: warna.teks },
  penanda: { flexDirection: 'row', gap: 6 },
  tagAtas: {
    backgroundColor: warna.oranye, color: '#fff', fontSize: 10, fontWeight: '800',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden',
  },
  tagDasar: {
    backgroundColor: '#78716C', color: '#fff', fontSize: 10, fontWeight: '800',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden',
  },

  tombolBaris: { flexDirection: 'row', gap: 10, marginTop: 14 },
  tombol: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  tombolGaris: { backgroundColor: '#fff', borderWidth: 1, borderColor: warna.garis },
  tombolTeks: { color: '#fff', fontWeight: '700', fontSize: 15 },
  mati: { opacity: 0.4 },

  pesan: { borderRadius: 12, padding: 12, marginBottom: 12 },
  pesanOk: { backgroundColor: '#ECFDF5' },
  pesanGalat: { backgroundColor: '#FEE2E2' },
  pesanTeks: { fontFamily: fontKode, color: warna.hijauTeks, fontSize: 13 },

  replay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  tombolKecil: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: warna.garis, paddingHorizontal: 14, paddingVertical: 9,
  },
  tombolKecilTeks: { fontWeight: '700', color: warna.teks, fontSize: 13 },
  langkah: { color: warna.teksRedup, fontWeight: '600' },
  catatanReplay: { color: warna.persikTeks, fontSize: 12, marginBottom: 8 },

  kode: { backgroundColor: warna.gelap, borderRadius: 16, padding: 16, marginTop: 8 },
  kodeJudul: { color: '#FDBA74', fontWeight: '800', fontSize: 12, marginBottom: 8, letterSpacing: 0.5 },
  kodeBaris: { color: '#E2E8F0', fontFamily: fontKode, fontSize: 13, lineHeight: 22 },

  reset: { alignSelf: 'center', marginTop: 14, paddingHorizontal: 18, paddingVertical: 10 },
  resetTeks: { color: warna.teksRedup, fontWeight: '700' },

  catatan: {
    backgroundColor: warna.kotakKode, borderRadius: 16, borderWidth: 1,
    borderColor: '#F5C9B5', padding: 16, marginTop: 6,
  },
  catatanJudul: { fontWeight: '800', color: '#7C2D12', marginBottom: 6 },
  catatanIsi: { color: '#7C2D12', lineHeight: 20 },
});
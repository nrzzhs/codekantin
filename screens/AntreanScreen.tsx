import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAntrean, KAPASITAS } from '../context/SimulatorContext';
import PanelPseudocode from '../components/PanelPseudocode';
import Tombol from '../components/ui/Tombol';
import HeaderSimulasi from '../components/simulasi/HeaderSimulasi';
import PanggungAntrean from '../components/simulasi/PanggungAntrean';
import ReaksiPiri from '../components/simulasi/ReaksiPiri';
import KontrolReplay from '../components/simulasi/KontrolReplay';
import TabDetail, { KartuCatatan } from '../components/simulasi/TabDetail';
import PanelInspeksi, { angka, daftar, kosong, simbol, teks } from '../components/simulasi/PanelInspeksi';
import { font, warna } from '../lib/tema';

const NAMA = ['Andi', 'Budi', 'Citra', 'Dina', 'Eka', 'Fajar', 'Gita', 'Hana'];

export default function AntreanScreen() {
  const sim = useAntrean();
  const [goyang, setGoyang] = useState(0); // naik setiap overflow/underflow

  const { tampil } = sim;
  const isi = tampil.isi;

  // Umpan balik setelah operasi: getar ringan kalau berhasil, getar peringatan + goyang kalau galat
  function reaksi(berhasil: boolean) {
    if (!sim.siap || !sim.diAkhir) return; // operasi tidak dijalankan
    if (berhasil) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setGoyang((g) => g + 1);
    }
  }

  function enqueue() {
    const n = sim.penghitung;
    reaksi(sim.tambah(`${NAMA[n % NAMA.length]} #${n + 1}`));
  }

  function dequeue() {
    reaksi(sim.ambil() !== undefined);
  }

  function reset() {
    sim.reset();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.isi}>
        <HeaderSimulasi judul="Antrean Kasir" chip="QUEUE · FIFO" jenis="antrean" onReset={reset} />

        <PanggungAntrean isi={isi} kapasitas={KAPASITAS} goyang={goyang} />

        <ReaksiPiri jenis="antrean" snap={tampil} kunci={sim.versi} lompatan={goyang} />

        <View style={styles.tombolBaris}>
          <Tombol
            label="Enqueue"
            varian="antrean"
            ikon="person-add-outline"
            besar
            onPress={enqueue}
            nonaktif={!sim.diAkhir}
            accessibilityHint="Tambah pelanggan di REAR"
            style={styles.tombol}
          />
          <Tombol
            label="Dequeue"
            varian="sekunder"
            ikon="person-remove-outline"
            besar
            onPress={dequeue}
            nonaktif={!sim.diAkhir}
            accessibilityHint="Layani pelanggan di FRONT"
            style={styles.tombol}
          />
        </View>

        <View style={styles.replay}>
          <KontrolReplay
            indeks={sim.indeks}
            total={sim.totalLangkah}
            onMundur={sim.mundur}
            onMaju={sim.maju}
            aksen={warna.biru}
          />
          {!sim.diAkhir && (
            <Text style={styles.catatanReplay}>
              Mode replay: tekan Maju sampai langkah terakhir untuk menjalankan operasi lagi.
            </Text>
          )}
        </View>

        <TabDetail
          kode={
            <PanelPseudocode
              jenis="queue"
              op={tampil.op}
              galat={tampil.galat}
              kunci={sim.versi}
              aksen={warna.biru}
            />
          }
          data={
            <PanelInspeksi
              label="Inspeksi struktur data"
              baris={[
                { kunci: 'queue', nilai: daftar(isi) },
                { kunci: 'front', nilai: [isi.length ? teks(isi[0]) : kosong] },
                { kunci: 'rear', nilai: [isi.length ? teks(isi[isi.length - 1]) : kosong] },
                { kunci: 'size', nilai: [angka(isi.length), simbol(' / '), angka(KAPASITAS)] },
              ]}
            />
          }
          catatan={
            <KartuCatatan
              jenis="antrean"
              kotak={['Masuk lewat REAR', 'Keluar lewat FRONT']}
              judul="Catatan Logika Komputer"
              teks="Prinsip FIFO (First In, First Out): elemen yang pertama masuk menjadi elemen pertama yang keluar. Penambahan di REAR dengan enqueue, pengambilan di FRONT dengan dequeue."
            />
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 20, paddingBottom: 32, gap: 14 },
  tombolBaris: { flexDirection: 'row', gap: 10 },
  tombol: { flex: 1 },
  replay: { gap: 6 },
  catatanReplay: { fontFamily: font.semi, fontSize: 12, color: warna.persikTeks, textAlign: 'center' },
});

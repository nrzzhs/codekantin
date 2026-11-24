import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTumpukan, KAPASITAS } from '../context/SimulatorContext';
import PanelPseudocode from '../components/PanelPseudocode';
import Tombol from '../components/ui/Tombol';
import HeaderSimulasi from '../components/simulasi/HeaderSimulasi';
import PanggungTumpukan from '../components/simulasi/PanggungTumpukan';
import ReaksiPiri from '../components/simulasi/ReaksiPiri';
import KontrolReplay from '../components/simulasi/KontrolReplay';
import TabDetail, { KartuCatatan } from '../components/simulasi/TabDetail';
import PanelInspeksi, { angka, daftar, kosong, simbol, teks } from '../components/simulasi/PanelInspeksi';
import { font, warna } from '../lib/tema';

const JENIS = ['Keramik', 'Kaca', 'Melamin', 'Porselen', 'Kayu'];

export default function TumpukanScreen() {
  const sim = useTumpukan();
  const [goyang, setGoyang] = useState(0); // naik setiap overflow/underflow

  const { tampil } = sim;
  const isi = tampil.isi; // dasar → TOP

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

  function push() {
    const n = sim.penghitung;
    reaksi(sim.tambah(`Piring ${JENIS[n % JENIS.length]} #${n + 1}`));
  }

  function pop() {
    reaksi(sim.ambil() !== undefined);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.isi}>
        <HeaderSimulasi judul="Tumpukan Piring" chip="STACK · LIFO" jenis="tumpukan" onReset={sim.reset} />

        <PanggungTumpukan isi={isi} kapasitas={KAPASITAS} goyang={goyang} />

        <ReaksiPiri jenis="tumpukan" snap={tampil} kunci={sim.versi} lompatan={goyang} />

        <View style={styles.tombolBaris}>
          <Tombol
            label="Push"
            varian="tumpukan"
            ikon="arrow-up"
            besar
            onPress={push}
            nonaktif={!sim.diAkhir}
            accessibilityHint="Taruh piring baru di TOP"
            style={styles.tombol}
          />
          <Tombol
            label="Pop"
            varian="sekunder"
            ikon="arrow-down"
            besar
            onPress={pop}
            nonaktif={!sim.diAkhir}
            accessibilityHint="Ambil piring dari TOP"
            style={styles.tombol}
          />
        </View>

        <View style={styles.replay}>
          <KontrolReplay
            indeks={sim.indeks}
            total={sim.totalLangkah}
            onMundur={sim.mundur}
            onMaju={sim.maju}
            aksen={warna.oranye}
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
              jenis="stack"
              op={tampil.op}
              galat={tampil.galat}
              kunci={sim.versi}
              aksen={warna.oranye}
            />
          }
          data={
            <PanelInspeksi
              label="Status struktur data"
              baris={[
                { kunci: 'stack', nilai: daftar(isi) },
                { kunci: 'top', nilai: [isi.length ? teks(isi[isi.length - 1]) : kosong] },
                { kunci: 'dasar', nilai: [isi.length ? teks(isi[0]) : kosong] },
                { kunci: 'size', nilai: [angka(isi.length), simbol(' / '), angka(KAPASITAS)] },
              ]}
            />
          }
          catatan={
            <KartuCatatan
              jenis="tumpukan"
              kotak={['Masuk lewat TOP', 'Keluar lewat TOP juga']}
              judul="Catatan Logika Komputer"
              teks="Prinsip LIFO (Last In, First Out): elemen yang terakhir masuk menjadi elemen pertama yang keluar. Penambahan dengan push dan pengambilan dengan pop sama-sama terjadi di TOP."
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

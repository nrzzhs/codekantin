import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Stack } from '../logic/Stack';
import { Queue } from '../logic/Queue';
import { font, warna } from '../lib/tema';
import { KAPASITAS, useBandingkan } from '../context/SimulatorContext';
import Kartu from '../components/ui/Kartu';
import Tombol from '../components/ui/Tombol';
import KokiPiri from '../components/ilustrasi/KokiPiri';
import type { JenisMakanan } from '../components/ilustrasi/Makanan';
import HeaderBandingkan from '../components/bandingkan/HeaderBandingkan';
import UbinBahan from '../components/bandingkan/UbinBahan';
import PanelStruktur, { type ItemPanel } from '../components/bandingkan/PanelStruktur';
import KartuUrutanKeluar from '../components/bandingkan/KartuUrutanKeluar';

const BAHAN = [
  { nama: 'Burger', emoji: '🍔' },
  { nama: 'Pizza', emoji: '🍕' },
  { nama: 'Donat', emoji: '🍩' },
];

// Jeda antar elemen saat "Keluarkan Semua" ditampilkan bertahap
const JEDA_KELUAR = 650;

// Teks gelembung Koki Piri untuk keadaan sebelum hasil keluar (teks UI, bukan data)
const PESAN_KOSONG = 'Ketuk makanan di atas, lalu tekan Keluarkan Semua.';
const PESAN_ADA_ISI = 'Masuknya sama persis. Coba tebak: siapa yang keluar duluan?';
const PESAN_BERJALAN = 'Mengeluarkan satu per satu…';

export default function BandingkanScreen() {
  const navigation = useNavigation<any>();
  const kurangiGerak = useReducedMotion();
  const { nilai, setNilai, siap } = useBandingkan();
  const masuk = Array.isArray(nilai.masuk) ? nilai.masuk : [];
  const dikeluarkan = !!nilai.dikeluarkan;

  // Tampilan bertahap: berapa elemen yang sudah terlihat keluar (null = tidak sedang berjalan)
  const [langkah, setLangkah] = useState<number | null>(null);
  const [lompatan, setLompatan] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const penuh = masuk.length >= KAPASITAS;
  const terkunci = !siap || dikeluarkan || penuh;

  // Teruskan input yang sama ke Queue dan Stack
  const queue = new Queue<string>();
  const stack = new Stack<string>();
  for (const x of masuk) {
    queue.enqueue(x);
    stack.push(x);
  }

  const isiQueue = dikeluarkan ? [] : queue.toArray();           // FRONT → REAR
  const isiStack = dikeluarkan ? [] : stack.toArray().reverse(); // TOP → DASAR

  const keluarQueue: string[] = [];
  const keluarStack: string[] = [];
  if (dikeluarkan) {
    while (!queue.isEmpty()) keluarQueue.push(queue.dequeue() as string);
    while (!stack.isEmpty()) keluarStack.push(stack.pop() as string);
  }

  function tambah(nama: string, emoji: string) {
    if (terkunci) return;
    const huruf = String.fromCharCode(65 + masuk.length);
    setNilai({ masuk: [...masuk, `${emoji} ${nama} (${huruf})`], dikeluarkan: false });
  }

  function keluarkan() {
    if (!siap || masuk.length === 0 || dikeluarkan) return;
    setNilai({ masuk, dikeluarkan: true });
  }

  function ulangi() {
    setNilai({ masuk: [], dikeluarkan: false });
  }

  let kesimpulan = 'Pilih bahan di atas, lalu tekan Keluarkan Semua.';
  if (masuk.length > 0 && !dikeluarkan) {
    kesimpulan = 'Sekarang tekan Keluarkan Semua untuk melihat urutan keluarnya.';
  } else if (dikeluarkan && masuk.length < 2) {
    kesimpulan = 'Dengan satu item, Queue dan Stack mengeluarkan hal yang sama. Tambahkan lebih banyak item.';
  } else if (dikeluarkan) {
    kesimpulan =
      'Input sama, output berbeda: Queue mengeluarkan sesuai urutan masuk (FIFO), sedangkan Stack mengeluarkan terbalik (LIFO).';
  }

  // ===== Tampilan bertahap (hanya tampilan; datanya sudah dikeluarkan semua oleh keluarkan()) =====
  function hentikanTimer() {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }

  // Bersihkan timer saat layar ditutup
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  function selesaiKeluar() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setLompatan((l) => l + 1);
  }

  function keluarkanBertahap() {
    if (!siap || masuk.length === 0 || dikeluarkan) return;
    keluarkan();
    if (kurangiGerak) {
      selesaiKeluar();
      return;
    }
    const n = masuk.length;
    let i = 0;
    setLangkah(0);
    hentikanTimer();
    timer.current = setInterval(() => {
      i += 1;
      if (i >= n) {
        hentikanTimer();
        setLangkah(null);
        selesaiKeluar();
      } else {
        setLangkah(i);
      }
    }, JEDA_KELUAR);
  }

  function ulangiSemua() {
    hentikanTimer();
    setLangkah(null);
    ulangi();
  }

  const n = masuk.length;
  const berjalan = dikeluarkan && langkah !== null;
  const sudahKeluar = dikeluarkan ? (langkah ?? n) : 0;

  // Kunci elemen = posisinya di urutan masuk, supaya animasi muncul/keluar tepat sasaran
  const itemQueue: ItemPanel[] = dikeluarkan
    ? keluarQueue.slice(sudahKeluar).map((x, j) => ({ kunci: `m-${sudahKeluar + j}`, isi: x }))
    : isiQueue.map((x, j) => ({ kunci: `m-${j}`, isi: x }));
  const itemStack: ItemPanel[] = dikeluarkan
    ? keluarStack.slice(sudahKeluar).map((x, j) => ({ kunci: `m-${n - 1 - (sudahKeluar + j)}`, isi: x }))
    : isiStack.map((x, j) => ({ kunci: `m-${n - 1 - j}`, isi: x }));

  const selesai = dikeluarkan && !berjalan;
  const pesan = n === 0 ? PESAN_KOSONG : !dikeluarkan ? PESAN_ADA_ISI : berjalan ? PESAN_BERJALAN : kesimpulan;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.isi}>
        <HeaderBandingkan onKembali={() => navigation.goBack()} onUlangi={ulangiSemua} />

        {/* Masukkan makanan */}
        <Kartu style={styles.kartuMasuk}>
          <View style={styles.barisJudul}>
            <Text style={styles.judulKartu}>Masukkan makanan</Text>
            <View style={styles.pil} accessible accessibilityLabel={`${n} dari ${KAPASITAS} terisi`}>
              <Text style={styles.pilTeks}>
                {n}/{KAPASITAS}
              </Text>
            </View>
          </View>
          <View style={styles.barisUbin}>
            {BAHAN.map((b, i) => (
              <UbinBahan
                key={b.nama}
                nama={b.nama}
                jenis={b.nama.toLowerCase() as JenisMakanan}
                urutan={i}
                nonaktif={terkunci}
                onPress={() => tambah(b.nama, b.emoji)}
              />
            ))}
          </View>
        </Kartu>

        {/* Dua struktur berdampingan */}
        <View style={styles.duaPanel}>
          <PanelStruktur jenis="queue" item={itemQueue} />
          <PanelStruktur jenis="stack" item={itemStack} />
        </View>

        <Tombol
          label="Keluarkan Semua"
          varian="utama"
          ikon="play"
          tinggi={58}
          sudut={20}
          onPress={keluarkanBertahap}
          nonaktif={n === 0 || dikeluarkan || !siap}
          accessibilityHint="Dequeue dan pop semua elemen"
        />

        {dikeluarkan && (
          <KartuUrutanKeluar
            queue={keluarQueue.slice(0, sudahKeluar)}
            stack={keluarStack.slice(0, sudahKeluar)}
          />
        )}

        {/* Koki Piri + kesimpulan */}
        <View
          style={styles.reaksi}
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Koki Piri: ${pesan}`}
        >
          <KokiPiri ukuran={56} lompatan={lompatan} tinggiLompat={8} ekspresi={selesai ? 'tertawa' : 'senang'} />
          <View style={[styles.gelembung, selesai && styles.gelembungSelesai]}>
            <Text style={styles.gelembungTeks}>{pesan}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 20, paddingBottom: 32, gap: 14 },

  kartuMasuk: { borderRadius: 22, gap: 12 },
  barisJudul: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  judulKartu: { fontFamily: font.judul, fontSize: 15, color: warna.teks },
  pil: { backgroundColor: warna.garis, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pilTeks: { fontFamily: font.judul, fontSize: 12, color: warna.teksRedup },
  barisUbin: { flexDirection: 'row', gap: 10 },

  duaPanel: { flexDirection: 'row', gap: 10 },

  reaksi: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gelembung: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: warna.garis,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  gelembungSelesai: { borderColor: '#86EFAC' },
  gelembungTeks: { fontFamily: font.tebal, fontSize: 13, lineHeight: 19, color: warna.teks },
});

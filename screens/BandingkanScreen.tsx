import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Stack } from '../logic/Stack';
import { Queue } from '../logic/Queue';
import { warna } from '../lib/tema';
import { KAPASITAS } from '../context/SimulatorContext';

const BAHAN = [
  { nama: 'Burger', emoji: '🍔' },
  { nama: 'Pizza', emoji: '🍕' },
  { nama: 'Donat', emoji: '🍩' },
];

export default function BandingkanScreen() {
  const [masuk, setMasuk] = useState<string[]>([]);
  const [dikeluarkan, setDikeluarkan] = useState(false);

  const penuh = masuk.length >= KAPASITAS;

  // Teruskan input yang sama ke Queue dan Stack
  const queue = new Queue<string>();
  const stack = new Stack<string>();
  for (const x of masuk) {
    queue.enqueue(x);
    stack.push(x);
  }

  const isiQueue = dikeluarkan ? [] : queue.toArray();        // FRONT → REAR
  const isiStack = dikeluarkan ? [] : stack.toArray().reverse(); // TOP → DASAR

  const keluarQueue: string[] = [];
  const keluarStack: string[] = [];
  if (dikeluarkan) {
    while (!queue.isEmpty()) keluarQueue.push(queue.dequeue() as string);
    while (!stack.isEmpty()) keluarStack.push(stack.pop() as string);
  }

  function tambah(nama: string, emoji: string) {
    if (dikeluarkan || penuh) return;
    const huruf = String.fromCharCode(65 + masuk.length);
    setMasuk([...masuk, `${emoji} ${nama} (${huruf})`]);
  }

  function ulangi() {
    setMasuk([]);
    setDikeluarkan(false);
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

  return (
    <ScrollView style={styles.latar} contentContainerStyle={styles.isi}>
      {/* Urutan masuk */}
      <View style={styles.kartu}>
        <View style={styles.barisAtas}>
          <Text style={styles.judul}>Urutan Masuk Makanan</Text>
          <Text style={styles.kapasitas}>{masuk.length}/{KAPASITAS}</Text>
        </View>

        <View style={styles.bahanBaris}>
          {BAHAN.map((b) => (
            <TouchableOpacity
              key={b.nama}
              style={[styles.bahan, (dikeluarkan || penuh) && styles.mati]}
              onPress={() => tambah(b.nama, b.emoji)}
              disabled={dikeluarkan || penuh}
            >
              <Text style={styles.bahanEmoji}>{b.emoji}</Text>
              <Text style={styles.bahanNama}>{b.nama}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.petunjuk}>
          {penuh ? 'Kapasitas penuh.' : 'Tap bahan untuk menambah. Bahan yang sama boleh dipilih berulang.'}
        </Text>

        <View style={styles.urutan}>
          {masuk.length === 0 ? (
            <Text style={styles.kosong}>Belum ada item</Text>
          ) : (
            masuk.map((x, i) => (
              <Text key={`${x}-${i}`} style={styles.urutanItem}>{i + 1}. {x}</Text>
            ))
          )}
        </View>
      </View>

      {/* Dua struktur berdampingan */}
      <View style={styles.duaKolom}>
        <View style={[styles.panel, { backgroundColor: warna.biruMuda, borderColor: '#BAE6FD' }]}>
          <Text style={[styles.panelJudul, { color: warna.biru }]}>QUEUE</Text>
          <Text style={styles.panelSub}>FIFO • FRONT → REAR</Text>
          {isiQueue.length === 0 ? (
            <Text style={styles.panelKosong}>{dikeluarkan ? 'Sudah kosong' : 'Kosong'}</Text>
          ) : (
            isiQueue.map((x, i) => (
              <View key={`q-${i}`} style={styles.elemen}>
                <Text style={styles.elemenTeks} numberOfLines={1}>{x}</Text>
                {i === 0 && <Text style={[styles.tag, { backgroundColor: warna.biru }]}>FRONT</Text>}
                {i === isiQueue.length - 1 && i !== 0 && (
                  <Text style={[styles.tag, { backgroundColor: warna.oranye }]}>REAR</Text>
                )}
              </View>
            ))
          )}
        </View>

        <View style={[styles.panel, { backgroundColor: warna.oranyeMuda, borderColor: '#FED7AA' }]}>
          <Text style={[styles.panelJudul, { color: '#C2410C' }]}>STACK</Text>
          <Text style={styles.panelSub}>LIFO • TOP → DASAR</Text>
          {isiStack.length === 0 ? (
            <Text style={styles.panelKosong}>{dikeluarkan ? 'Sudah kosong' : 'Kosong'}</Text>
          ) : (
            isiStack.map((x, i) => (
              <View key={`s-${i}`} style={styles.elemen}>
                <Text style={styles.elemenTeks} numberOfLines={1}>{x}</Text>
                {i === 0 && <Text style={[styles.tag, { backgroundColor: warna.oranye }]}>TOP</Text>}
              </View>
            ))
          )}
        </View>
      </View>

      {/* Tombol */}
      <TouchableOpacity
        style={[styles.tombolHijau, (masuk.length === 0 || dikeluarkan) && styles.mati]}
        onPress={() => setDikeluarkan(true)}
        disabled={masuk.length === 0 || dikeluarkan}
      >
        <Text style={styles.tombolHijauTeks}>Keluarkan Semua (Dequeue & Pop)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tombolUlang} onPress={ulangi}>
        <Text style={styles.tombolUlangTeks}>↺ Ulangi Simulasi (Reset)</Text>
      </TouchableOpacity>

      {/* Hasil */}
      {dikeluarkan && (
        <View style={styles.kartu}>
          <Text style={styles.judul}>Hasil Perbandingan Urutan Keluar</Text>

          <View style={[styles.hasil, { backgroundColor: warna.biruMuda }]}>
            <Text style={[styles.hasilJudul, { color: warna.biru }]}>Antrean (Queue) · FIFO</Text>
            {keluarQueue.map((x, i) => (
              <Text key={`kq-${i}`} style={styles.hasilItem}>{i + 1}. {x}</Text>
            ))}
          </View>

          <View style={[styles.hasil, { backgroundColor: warna.oranyeMuda }]}>
            <Text style={[styles.hasilJudul, { color: '#C2410C' }]}>Tumpukan (Stack) · LIFO</Text>
            {keluarStack.map((x, i) => (
              <Text key={`ks-${i}`} style={styles.hasilItem}>{i + 1}. {x}</Text>
            ))}
          </View>
        </View>
      )}

      <View style={styles.kesimpulan}>
        <Text style={styles.kesimpulanJudul}>⚡ Kesimpulan Kilat</Text>
        <Text style={styles.kesimpulanIsi}>{kesimpulan}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  latar: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 18, paddingBottom: 36 },

  kartu: {
    backgroundColor: warna.kartu, borderRadius: 20, borderWidth: 1,
    borderColor: warna.garis, padding: 18, marginBottom: 14,
  },
  barisAtas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  judul: { fontSize: 18, fontWeight: '800', color: warna.teks },
  kapasitas: { fontWeight: '700', color: warna.teksRedup },

  bahanBaris: { flexDirection: 'row', gap: 10, marginTop: 14 },
  bahan: {
    flex: 1, alignItems: 'center', backgroundColor: warna.latar, borderRadius: 14,
    borderWidth: 1, borderColor: warna.garis, paddingVertical: 14,
  },
  bahanEmoji: { fontSize: 28 },
  bahanNama: { fontWeight: '700', color: warna.teks, marginTop: 4 },
  petunjuk: { color: warna.teksRedup, fontSize: 12, marginTop: 10 },

  urutan: { backgroundColor: warna.kotakKode, borderRadius: 12, padding: 12, marginTop: 12 },
  urutanItem: { color: warna.teks, fontWeight: '600', lineHeight: 22 },
  kosong: { color: '#B0A79E' },

  duaKolom: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  panel: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12 },
  panelJudul: { fontWeight: '800', fontSize: 14 },
  panelSub: { color: warna.teksRedup, fontSize: 11, marginTop: 2, marginBottom: 10 },
  panelKosong: { color: '#B0A79E', fontSize: 12, fontStyle: 'italic' },
  elemen: { backgroundColor: '#fff', borderRadius: 10, padding: 8, marginBottom: 6 },
  elemenTeks: { fontWeight: '600', color: warna.teks, fontSize: 12 },
  tag: {
    alignSelf: 'flex-start', color: '#fff', fontSize: 9, fontWeight: '800',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, overflow: 'hidden', marginTop: 4,
  },

  tombolHijau: { backgroundColor: warna.hijau, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  tombolHijauTeks: { color: '#fff', fontWeight: '700', fontSize: 15 },
  tombolUlang: {
    borderRadius: 14, borderWidth: 1, borderColor: warna.garis, backgroundColor: '#fff',
    paddingVertical: 14, alignItems: 'center', marginTop: 10, marginBottom: 14,
  },
  tombolUlangTeks: { color: warna.teks, fontWeight: '700' },
  mati: { opacity: 0.4 },

  hasil: { borderRadius: 14, padding: 14, marginTop: 12 },
  hasilJudul: { fontWeight: '800', marginBottom: 6 },
  hasilItem: { color: warna.teks, fontWeight: '600', lineHeight: 22 },

  kesimpulan: {
    backgroundColor: warna.kotakKode, borderRadius: 16, borderWidth: 1,
    borderColor: '#F5C9B5', padding: 16,
  },
  kesimpulanJudul: { fontWeight: '800', color: '#7C2D12', marginBottom: 6 },
  kesimpulanIsi: { color: '#7C2D12', lineHeight: 20 },
});
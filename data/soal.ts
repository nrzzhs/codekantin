import type { JenisStruktur } from '../logic/simulasi';
import type { Miskonsepsi } from './miskonsepsi';

export type Tingkat = 'mudah' | 'sedang' | 'menantang';

export type SoalSimulasi = {
  id: string;
  jenis: 'simulasi';
  struktur: JenisStruktur;
  tingkat: Tingkat;
  konteks: string;
  operasi: string[]; // kunci jawaban dihitung dari sini, bukan ditulis manual
};

export type PilihanJawaban = { id: string; teks: string; miskonsepsi?: Miskonsepsi };

export type SoalPilihanGanda = {
  id: string;
  jenis: 'pilihan-ganda';
  pertanyaan: string;
  pilihan: PilihanJawaban[];
  benar: string; // id pilihan yang benar
  penjelasan: string;
};

export type Soal = SoalSimulasi | SoalPilihanGanda;

// Sumber: Modul Materi Stack dan Queue (latihan bagian J, kunci bagian K, contoh bagian F)
export const BANK_SOAL: Soal[] = [
  // ===== Simulasi: mudah =====
  {
    id: 'sim-stack-1', jenis: 'simulasi', struktur: 'stack', tingkat: 'mudah',
    konteks: 'Piring bersih ditumpuk di rak, lalu satu diambil.',
    operasi: ['push(1)', 'push(2)', 'push(3)', 'pop()'],
  },
  {
    id: 'sim-queue-1', jenis: 'simulasi', struktur: 'queue', tingkat: 'mudah',
    konteks: 'Tiga pelanggan datang ke kasir, satu dilayani.',
    operasi: ['enqueue(A)', 'enqueue(B)', 'enqueue(C)', 'dequeue()'],
  },
  // ===== Simulasi: sedang =====
  {
    id: 'sim-stack-2', jenis: 'simulasi', struktur: 'stack', tingkat: 'sedang',
    konteks: 'Rak cuci piring dengan pesanan masuk berselang-seling.',
    operasi: ['push(5)', 'push(3)', 'pop()', 'push(8)', 'pop()'],
  },
  {
    id: 'sim-queue-2', jenis: 'simulasi', struktur: 'queue', tingkat: 'sedang',
    konteks: 'Pelanggan datang dan dilayani bergantian.',
    operasi: ['enqueue(4)', 'enqueue(9)', 'dequeue()', 'enqueue(6)', 'dequeue()', 'enqueue(1)'],
  },
  {
    id: 'sim-stack-3', jenis: 'simulasi', struktur: 'stack', tingkat: 'sedang',
    konteks: 'Tiga piring ditumpuk, lalu diambil dan ditambah lagi.',
    operasi: ['push(5)', 'push(3)', 'push(2)', 'pop()', 'push(4)', 'pop()', 'pop()'],
  },
  {
    id: 'sim-stack-4', jenis: 'simulasi', struktur: 'stack', tingkat: 'sedang',
    konteks: 'Piring C baru ditaruh setelah B diambil.',
    operasi: ['push(A)', 'push(B)', 'pop()', 'push(C)', 'pop()'],
  },
  {
    id: 'sim-queue-3', jenis: 'simulasi', struktur: 'queue', tingkat: 'sedang',
    konteks: 'Antrean kasir yang terus bergerak.',
    operasi: ['enqueue(A)', 'enqueue(B)', 'dequeue()', 'enqueue(C)', 'dequeue()'],
  },
  // ===== Simulasi: menantang =====
  {
    id: 'sim-stack-5', jenis: 'simulasi', struktur: 'stack', tingkat: 'menantang',
    konteks: 'Rak piring sempat kosong sebelum diisi lagi.',
    operasi: ['push(A)', 'push(B)', 'pop()', 'pop()', 'push(C)', 'push(D)', 'pop()'],
  },
  {
    id: 'sim-queue-4', jenis: 'simulasi', struktur: 'queue', tingkat: 'menantang',
    konteks: 'Pelanggan terus berdatangan saat kasir melayani.',
    operasi: [
      'enqueue(A)', 'enqueue(B)', 'enqueue(C)', 'dequeue()',
      'enqueue(D)', 'dequeue()', 'dequeue()', 'enqueue(E)',
    ],
  },
  {
    id: 'sim-queue-5', jenis: 'simulasi', struktur: 'queue', tingkat: 'menantang',
    konteks: 'Antrean cetak: dokumen dikirim berurutan ke printer.',
    operasi: [
      'enqueue(Laporan)', 'enqueue(Tugas)', 'enqueue(Poster)', 'enqueue(Jadwal)',
      'dequeue()', 'dequeue()', 'dequeue()', 'dequeue()',
    ],
  },

  // ===== Pilihan ganda (kunci modul: B, C, C, A, B, C, B, B) =====
  {
    id: 'pg-1', jenis: 'pilihan-ganda',
    pertanyaan: 'Prinsip utama Stack adalah ...',
    pilihan: [
      { id: 'a', teks: 'FIFO', miskonsepsi: 'tukar-fifo-lifo' },
      { id: 'b', teks: 'LIFO' },
      { id: 'c', teks: 'Acak' },
      { id: 'd', teks: 'Prioritas' },
    ],
    benar: 'b',
    penjelasan: 'Stack menerapkan LIFO (Last In, First Out): elemen yang terakhir masuk keluar lebih dulu.',
  },
  {
    id: 'pg-2', jenis: 'pilihan-ganda',
    pertanyaan: 'Operasi untuk menambahkan elemen ke Queue adalah ...',
    pilihan: [
      { id: 'a', teks: 'pop' },
      { id: 'b', teks: 'dequeue' },
      { id: 'c', teks: 'enqueue' },
      { id: 'd', teks: 'peek' },
    ],
    benar: 'c',
    penjelasan: 'Enqueue menambahkan elemen di REAR (belakang) Queue.',
  },
  {
    id: 'pg-3', jenis: 'pilihan-ganda',
    pertanyaan: 'Jika Stack berisi [A, B, C] dari dasar ke TOP, operasi pop mengambil ...',
    pilihan: [
      { id: 'a', teks: 'A', miskonsepsi: 'pop-terbawah' },
      { id: 'b', teks: 'B' },
      { id: 'c', teks: 'C' },
      { id: 'd', teks: 'semuanya' },
    ],
    benar: 'c',
    penjelasan: 'C berada di TOP, dan pop selalu mengambil elemen TOP.',
  },
  {
    id: 'pg-4', jenis: 'pilihan-ganda',
    pertanyaan: 'Jika Queue berisi [A, B, C] dari FRONT ke REAR, operasi dequeue mengambil ...',
    pilihan: [
      { id: 'a', teks: 'A' },
      { id: 'b', teks: 'B' },
      { id: 'c', teks: 'C', miskonsepsi: 'dequeue-terbaru' },
      { id: 'd', teks: 'semuanya' },
    ],
    benar: 'a',
    penjelasan: 'A berada di FRONT, dan dequeue mengambil elemen FRONT.',
  },
  {
    id: 'pg-5', jenis: 'pilihan-ganda',
    pertanyaan: 'Fungsi peek pada Stack adalah ...',
    pilihan: [
      { id: 'a', teks: 'menghapus TOP', miskonsepsi: 'peek-menghapus' },
      { id: 'b', teks: 'melihat TOP tanpa menghapus' },
      { id: 'c', teks: 'menambah elemen' },
      { id: 'd', teks: 'mengosongkan Stack' },
    ],
    benar: 'b',
    penjelasan: 'Peek hanya melihat elemen TOP, isi Stack tidak berubah.',
  },
  {
    id: 'pg-6', jenis: 'pilihan-ganda',
    pertanyaan: 'Pengambilan elemen dari struktur kosong disebut ...',
    pilihan: [
      { id: 'a', teks: 'enqueue' },
      { id: 'b', teks: 'overflow' },
      { id: 'c', teks: 'underflow' },
      { id: 'd', teks: 'sorting' },
    ],
    benar: 'c',
    penjelasan: 'Underflow adalah mengambil data saat struktur kosong. Overflow kebalikannya: menambah saat struktur penuh.',
  },
  {
    id: 'pg-7', jenis: 'pilihan-ganda',
    pertanyaan: 'Struktur yang paling sesuai untuk antrean cetak dengan urutan kedatangan adalah ...',
    pilihan: [
      { id: 'a', teks: 'Stack', miskonsepsi: 'tukar-fifo-lifo' },
      { id: 'b', teks: 'Queue' },
      { id: 'c', teks: 'keduanya tidak bisa' },
      { id: 'd', teks: 'tidak perlu struktur' },
    ],
    benar: 'b',
    penjelasan: 'Queue menjaga urutan kedatangan: dokumen yang lebih dulu masuk dicetak lebih dulu.',
  },
  {
    id: 'pg-8', jenis: 'pilihan-ganda',
    pertanyaan: 'Operasi push(1), push(2), pop() mengeluarkan ...',
    pilihan: [
      { id: 'a', teks: '1', miskonsepsi: 'pop-terbawah' },
      { id: 'b', teks: '2' },
      { id: 'c', teks: '1 dan 2' },
      { id: 'd', teks: 'tidak ada' },
    ],
    benar: 'b',
    penjelasan: 'Pop mengambil elemen terbaru yang masih ada, yaitu 2.',
  },
];

export function cariSoal(id: string): Soal | undefined {
  return BANK_SOAL.find((s) => s.id === id);
}
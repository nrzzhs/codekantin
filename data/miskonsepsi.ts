export type Miskonsepsi =
  | 'tukar-fifo-lifo'
  | 'pop-terbawah'
  | 'dequeue-terbaru'
  | 'abaikan-urutan'
  | 'peek-menghapus';

export type InfoMiskonsepsi = { judul: string; penjelasan: string; perbaikan: string };

// Bersumber dari Modul Materi, bagian G (Kesalahan Umum)
export const INFO_MISKONSEPSI: Record<Miskonsepsi, InfoMiskonsepsi> = {
  'tukar-fifo-lifo': {
    judul: 'Menukar FIFO dan LIFO',
    penjelasan: 'Aturan pengambilan Stack dan Queue berbeda.',
    perbaikan: 'Ingat: Stack mengambil dari TOP; Queue mengambil dari FRONT.',
  },
  'pop-terbawah': {
    judul: 'Pop mengambil elemen terbawah',
    penjelasan: 'Pop selalu mengambil TOP yang sedang aktif.',
    perbaikan: 'Tulis Stack dari dasar ke atas dan tandai TOP.',
  },
  'dequeue-terbaru': {
    judul: 'Dequeue mengambil elemen terbaru',
    penjelasan: 'Queue mengambil elemen paling depan.',
    perbaikan: 'Tulis Queue dari FRONT ke REAR.',
  },
  'abaikan-urutan': {
    judul: 'Melupakan perintah di tengah',
    penjelasan: 'Satu perintah dapat mengubah isi dan posisi elemen.',
    perbaikan: 'Buat tabel jejak untuk setiap langkah.',
  },
  'peek-menghapus': {
    judul: 'Menganggap peek menghapus elemen',
    penjelasan: 'Peek hanya melihat elemen.',
    perbaikan: 'Bandingkan isi sebelum dan sesudah peek; isinya harus sama.',
  },
};
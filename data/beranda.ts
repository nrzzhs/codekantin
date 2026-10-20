// ===== Modul =====
export type RuteModul = 'Antrean' | 'Tumpukan' | 'Tebak';

export type Modul = {
  id: RuteModul;
  tag: string;
  tagBg: string;
  tagTeks: string;
  judul: string;
  deskripsi: string;
  tombol: string;
  warnaTombol: string;
};

export const DAFTAR_MODUL: Modul[] = [
  {
    id: 'Antrean',
    tag: 'FIFO • First In First Out',
    tagBg: '#99F6E4',
    tagTeks: '#115E59',
    judul: 'Antrean Kasir (Queue)',
    deskripsi: 'Yang datang pertama, dilayani duluan! Pas untuk simulasi kasir & order pesanan kantin.',
    tombol: 'Mulai Simulasi Antrean →',
    warnaTombol: '#0284C7',
  },
  {
    id: 'Tumpukan',
    tag: 'LIFO • Last In First Out',
    tagBg: '#FDE4D6',
    tagTeks: '#9A3412',
    judul: 'Tumpukan Piring (Stack)',
    deskripsi: 'Piring yang terakhir ditaruh di puncak adalah yang pertama dicuci dan diambil pelanggan.',
    tombol: 'Mulai Simulasi Tumpukan →',
    warnaTombol: '#F97316',
  },
  {
    id: 'Tebak',
    tag: 'TANTANGAN CEPAT',
    tagBg: '#86EFAC',
    tagTeks: '#14532D',
    judul: 'Tebak: Prediksi Stack & Queue',
    deskripsi: 'Tebak urutan keluar piring atau antrean berdasarkan alur instruksi pesanan kantin!',
    tombol: 'Mulai Tantangan Logika →',
    warnaTombol: '#16A34A',
  },
];

// ===== Contoh isi struktur data (sementara, nanti dari simulator) =====
export const CONTOH_ANTREAN: string[] = ['Meja Kasir #1', 'Meja Kasir #2']; // depan → belakang
export const CONTOH_TUMPUKAN: string[] = ['Piring Keramik #1', 'Piring Keramik #2', 'Piring Keramik #3']; // dasar → atas
export const KAPASITAS_TUMPUKAN = 5;

export const POIN_PER_TANTANGAN = 20;
export const INSTRUKSI_TEBAK = ['push', 'enqueue', 'pop'];

export function ringkasanModul(id: RuteModul): { kiri: string; kanan: string } {
  if (id === 'Antrean') {
    const depan = CONTOH_ANTREAN[0];
    return {
      kiri: depan ? `FRONT: ${depan}` : 'FRONT: (kosong)',
      kanan: `${CONTOH_ANTREAN.length} Menunggu`,
    };
  }
  if (id === 'Tumpukan') {
    const atas = CONTOH_TUMPUKAN[CONTOH_TUMPUKAN.length - 1];
    return {
      kiri: atas ? `TOP: ${atas}` : 'TOP: (kosong)',
      kanan: `Tinggi: ${CONTOH_TUMPUKAN.length}/${KAPASITAS_TUMPUKAN}`,
    };
  }
  return {
    kiri: `Instruksi: ${INSTRUKSI_TEBAK.join(', ')}`,
    kanan: `Skor +${POIN_PER_TANTANGAN} Poin`,
  };
}

// ===== Lencana (dihitung dari XP) =====
const LENCANA = [
  { xp: 0, nama: 'Koki Magang' },
  { xp: 100, nama: 'Koki Muda' },
  { xp: 300, nama: 'Koki Handal' },
  { xp: 600, nama: 'Master Koki LIFO/FIFO' },
];

export function hitungLencana(xp: number) {
  const berikutnya = LENCANA.find((l) => l.xp > xp);
  if (!berikutnya) {
    return { teks: 'Semua lencana terkumpul 🏆', progres: 1 };
  }
  const sebelumnya = [...LENCANA].reverse().find((l) => l.xp <= xp) ?? LENCANA[0];
  const progres = (xp - sebelumnya.xp) / (berikutnya.xp - sebelumnya.xp);
  return { teks: `Lencana Menanti: ${berikutnya.nama}`, progres };
}

// ===== Tahukah Kamu =====
export const FAKTA: string[] = [
  'Queue persis seperti antrean kasir gerai boba (yang duluan pesan dapat minum duluan), sedangkan Stack seperti tumpukan panekuk hangat (yang terakhir ditaruh di piring adalah yang pertama disantap)!',
  'Tombol Undo di aplikasi memakai prinsip Stack: aksi terbaru dibatalkan lebih dulu.',
  'Antrean cetak di printer memakai Queue, jadi dokumen yang dikirim lebih dulu dicetak lebih dulu.',
  'Tombol "kembali" di browser bekerja seperti Stack: halaman terakhir yang dibuka menjadi yang pertama kamu kunjungi ulang.',
  'Kalau data A, B, C dimasukkan ke Stack lalu dikeluarkan semuanya, urutannya terbalik menjadi C, B, A.',
];
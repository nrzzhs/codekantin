import { jalankan } from './simulasi';
import type { SoalPilihanGanda, SoalSimulasi, Tingkat } from '../data/soal';
import { INFO_MISKONSEPSI } from '../data/miskonsepsi';
import type { Miskonsepsi } from '../data/miskonsepsi';
import { BATAS, validasiPilihanGanda, validasiSimulasi } from './soalGuru';
import type { HasilValidasi } from './soalGuru';

const DAFTAR_TINGKAT: Tingkat[] = ['mudah', 'sedang', 'menantang'];
const POLA_TAMBAH_NILAI = /^\s*(?:push|enqueue)\s*\(\s*([^)]*?)\s*\)\s*$/i;

// Baris soal milik guru, seperti yang dikembalikan Supabase
export type BarisKelola = {
  id: string;
  jenis: 'simulasi' | 'pilihan-ganda';
  tingkat: Tingkat | null;
  struktur: 'stack' | 'queue' | null;
  konteks: string | null;
  operasi: string[] | null;
  pertanyaan: string | null;
  pilihan: unknown;
  benar: string | null;
  penjelasan: string | null;
  aktif: boolean;
  versi: number;
  diubah: string;
};

export type PayloadSoal = Record<string, unknown>;

export type FormSimulasi = {
  struktur: 'stack' | 'queue';
  tingkat: Tingkat;
  konteks: string;
  perintah: string; // teks mentah: satu perintah per baris (atau dipisah koma atau titik koma)
};

export type OpsiForm = { teks: string; miskonsepsi: Miskonsepsi | null };

export type FormPilihanGanda = {
  pertanyaan: string;
  opsi: OpsiForm[];
  indeksBenar: number;
  penjelasan: string;
};

export type FilterSoal = 'semua' | 'aktif' | 'nonaktif';

export type RingkasanSoal = {
  jenisLabel: string;
  subLabel: string;
  judul: string;
  rincian: string;
};

export type Pratinjau = {
  keluar: string[];
  isiAkhir: string[];
  ujung: string;
  langkah: { perintah: string; isi: string[]; keluar: string | null }[];
};

// ===== Form kosong =====
export function formSimulasiKosong(): FormSimulasi {
  return { struktur: 'stack', tingkat: 'sedang', konteks: '', perintah: '' };
}

export function formPilihanGandaKosong(): FormPilihanGanda {
  return {
    pertanyaan: '',
    opsi: Array.from({ length: 4 }, () => ({ teks: '', miskonsepsi: null })),
    indeksBenar: 0,
    penjelasan: '',
  };
}

// ===== Perintah =====
export function parsePerintah(teks: string): string[] {
  return teks
    .split(/[\n;,]+/)
    .map((s) => s.trim())
    .filter((s) => s !== '');
}

// Angka terkecil (mulai 1) yang belum dipakai sebagai nilai push atau enqueue
export function nilaiBerikutnya(operasi: string[]): string {
  const dipakai = new Set<string>();
  for (const op of operasi) {
    const cocok = POLA_TAMBAH_NILAI.exec(op);
    if (cocok) dipakai.add(cocok[1].toLowerCase());
  }
  let n = 1;
  while (dipakai.has(String(n))) n++;
  return String(n);
}

export function tambahBaris(teks: string, baris: string): string {
  const dasar = teks.replace(/\s+$/, '');
  return dasar === '' ? baris : `${dasar}\n${baris}`;
}

export function hapusBarisTerakhir(teks: string): string {
  return parsePerintah(teks).slice(0, -1).join('\n');
}

const KE_QUEUE: Record<string, string> = { push: 'enqueue', pop: 'dequeue' };
const KE_STACK: Record<string, string> = { enqueue: 'push', dequeue: 'pop', front: 'peek' };

// Saat guru berpindah Stack ↔ Queue, perintahnya ikut diterjemahkan
export function terjemahkanPerintah(teks: string, ke: 'stack' | 'queue'): string {
  const peta = ke === 'queue' ? KE_QUEUE : KE_STACK;
  return parsePerintah(teks)
    .map((p) => p.replace(/^([a-zA-Z]+)/, (nama) => peta[nama.toLowerCase()] ?? nama))
    .join('\n');
}

// ===== Validasi dari isi form =====
export function bangunSimulasi(f: FormSimulasi, id: string = 'pratinjau') {
  return validasiSimulasi(
    {
      struktur: f.struktur,
      tingkat: f.tingkat,
      konteks: f.konteks,
      operasi: parsePerintah(f.perintah),
    },
    id,
  );
}

export function idPilihan(i: number): string {
  return String.fromCharCode(97 + i);
}

export function bangunPilihanGanda(f: FormPilihanGanda, id: string = 'pratinjau') {
  const pilihan = f.opsi.map((o, i) => ({
    id: idPilihan(i),
    teks: o.teks,
    ...(o.miskonsepsi ? { miskonsepsi: o.miskonsepsi } : {}),
  }));
  const benar = f.indeksBenar >= 0 && f.indeksBenar < f.opsi.length ? idPilihan(f.indeksBenar) : '';
  return validasiPilihanGanda(
    { pertanyaan: f.pertanyaan, pilihan, benar, penjelasan: f.penjelasan },
    id,
  );
}

export type { HasilValidasi };

// ===== Pratinjau kunci jawaban (dihitung dari logika, bukan ditulis guru) =====
export function pratinjauKunci(soal: SoalSimulasi): Pratinjau {
  const h = jalankan(soal.struktur, soal.operasi);
  const ujung =
    soal.struktur === 'stack'
      ? `TOP = ${h.top ?? 'kosong'}`
      : `FRONT = ${h.front ?? 'kosong'}, REAR = ${h.rear ?? 'kosong'}`;
  return {
    keluar: h.keluar,
    isiAkhir: h.isiAkhir,
    ujung,
    langkah: h.langkah.map((l) => ({ perintah: l.perintah, isi: l.isi, keluar: l.keluar })),
  };
}

// ===== Isi yang dikirim ke Supabase =====
export function payloadSimulasi(soal: SoalSimulasi): PayloadSoal {
  return {
    jenis: 'simulasi',
    tingkat: soal.tingkat,
    struktur: soal.struktur,
    konteks: soal.konteks,
    operasi: soal.operasi,
  };
}

export function payloadPilihanGanda(soal: SoalPilihanGanda): PayloadSoal {
  return {
    jenis: 'pilihan-ganda',
    pertanyaan: soal.pertanyaan,
    pilihan: soal.pilihan,
    benar: soal.benar,
    penjelasan: soal.penjelasan,
  };
}

// ===== Dari baris Supabase kembali ke isi form (untuk mengubah soal) =====
export function formSimulasiDariBaris(b: BarisKelola): FormSimulasi {
  return {
    struktur: b.struktur === 'queue' ? 'queue' : 'stack',
    tingkat: DAFTAR_TINGKAT.includes(b.tingkat as Tingkat) ? (b.tingkat as Tingkat) : 'sedang',
    konteks: b.konteks ?? '',
    perintah: Array.isArray(b.operasi) ? b.operasi.join('\n') : '',
  };
}

type PilihanBaca = { id: string; teks: string; miskonsepsi: Miskonsepsi | null };

function bacaPilihan(nilai: unknown): PilihanBaca[] {
  if (!Array.isArray(nilai)) return [];
  const hasil: PilihanBaca[] = [];
  for (const p of nilai) {
    if (!p || typeof p !== 'object') continue;
    const item = p as { id?: unknown; teks?: unknown; miskonsepsi?: unknown };
    const miskonsepsi =
      typeof item.miskonsepsi === 'string' &&
      Object.prototype.hasOwnProperty.call(INFO_MISKONSEPSI, item.miskonsepsi)
        ? (item.miskonsepsi as Miskonsepsi)
        : null;
    hasil.push({
      id: typeof item.id === 'string' ? item.id : '',
      teks: typeof item.teks === 'string' ? item.teks : '',
      miskonsepsi,
    });
  }
  return hasil;
}

export function formPilihanGandaDariBaris(b: BarisKelola): FormPilihanGanda {
  const baca = bacaPilihan(b.pilihan).slice(0, BATAS.pilihanMaks);
  const dasar = formPilihanGandaKosong();
  if (baca.length < BATAS.pilihanMin) {
    return { ...dasar, pertanyaan: b.pertanyaan ?? '', penjelasan: b.penjelasan ?? '' };
  }
  const idx = baca.findIndex((p) => p.id === b.benar);
  return {
    pertanyaan: b.pertanyaan ?? '',
    opsi: baca.map(({ teks, miskonsepsi }) => ({ teks, miskonsepsi })),
    indeksBenar: idx >= 0 ? idx : 0,
    penjelasan: b.penjelasan ?? '',
  };
}

// ===== Tampilan daftar =====
export function ringkasSoal(b: BarisKelola): RingkasanSoal {
  if (b.jenis === 'simulasi') {
    const ops = Array.isArray(b.operasi) ? b.operasi : [];
    const maks = 4;
    const cuplikan = ops.slice(0, maks).join(', ') + (ops.length > maks ? ', …' : '');
    return {
      jenisLabel: 'SIMULASI',
      subLabel: `${b.struktur === 'queue' ? 'Queue' : 'Stack'} • ${b.tingkat ?? 'sedang'}`,
      judul: b.konteks?.trim() || 'Soal dari guru.',
      rincian: `${ops.length} perintah: ${cuplikan}`,
    };
  }
  const pilihan = bacaPilihan(b.pilihan);
  const benar = pilihan.find((p) => p.id === b.benar);
  return {
    jenisLabel: 'PILIHAN GANDA',
    subLabel: `${pilihan.length} pilihan`,
    judul: b.pertanyaan?.trim() || '(tanpa pertanyaan)',
    rincian: `Jawaban benar: ${benar ? benar.teks : '-'}`,
  };
}

export function hitungRingkasan(daftar: BarisKelola[]): { total: number; aktif: number; nonaktif: number } {
  const aktif = daftar.filter((b) => b.aktif).length;
  return { total: daftar.length, aktif, nonaktif: daftar.length - aktif };
}

export function saring(daftar: BarisKelola[], filter: FilterSoal): BarisKelola[] {
  if (filter === 'aktif') return daftar.filter((b) => b.aktif);
  if (filter === 'nonaktif') return daftar.filter((b) => !b.aktif);
  return daftar;
}
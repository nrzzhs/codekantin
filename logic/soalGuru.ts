import { jalankan } from './simulasi';
import type { JenisStruktur } from './simulasi';
import type { PilihanJawaban, Soal, SoalPilihanGanda, SoalSimulasi, Tingkat } from '../data/soal';
import { INFO_MISKONSEPSI } from '../data/miskonsepsi';
import type { Miskonsepsi } from '../data/miskonsepsi';

export const PREFIKS_GURU = 'guru:';

export const BATAS = {
  konteks: 200,
  perintahMin: 2,
  perintahMaks: 16,
  nilaiMaks: 12,
  keluarMin: 1,
  keluarMaks: 6,
  pertanyaanMin: 5,
  pertanyaanMaks: 300,
  pilihanMin: 2,
  pilihanMaks: 6,
  teksPilihanMaks: 120,
  penjelasanMaks: 500,
  soalMaks: 300,
};

// Baris mentah dari Supabase. Semua isinya dianggap tidak tepercaya sampai divalidasi.
export type BarisSoal = {
  id?: unknown;
  jenis?: unknown;
  tingkat?: unknown;
  struktur?: unknown;
  konteks?: unknown;
  operasi?: unknown;
  pertanyaan?: unknown;
  pilihan?: unknown;
  benar?: unknown;
  penjelasan?: unknown;
  aktif?: unknown;
  versi?: unknown;
};

export type HasilValidasi<T extends Soal = Soal> =
  | { ok: true; soal: T; peringatan: string[] }
  | { ok: false; galat: string[] };

const NAMA_STRUKTUR: Record<JenisStruktur, string> = { stack: 'Stack', queue: 'Queue' };
const OP_TAMBAH: Record<JenisStruktur, string> = { stack: 'push', queue: 'enqueue' };
const OP_AMBIL: Record<JenisStruktur, string> = { stack: 'pop', queue: 'dequeue' };
const OP_LIHAT: Record<JenisStruktur, string[]> = { stack: ['peek'], queue: ['front', 'peek'] };

const PETA_LAIN: Record<string, string> = {
  push: 'enqueue',
  enqueue: 'push',
  pop: 'dequeue',
  dequeue: 'pop',
  front: 'peek',
};

const POLA_PERINTAH = /^\s*([a-zA-Z]+)\s*\(\s*([^)]*?)\s*\)\s*$/;
const POLA_NILAI = /^[A-Za-z0-9 _.\-]{1,12}$/;
const POLA_ID_PILIHAN = /^[A-Za-z0-9_-]{1,10}$/;
const POLA_ID_BARIS = /^[0-9a-fA-F-]{8,40}$/;
const POLA_TAMBAH = /^\s*(?:push|enqueue)\s*\(/i;
const POLA_AMBIL = /^\s*(?:pop|dequeue)\s*\(/i;

const DAFTAR_TINGKAT: Tingkat[] = ['mudah', 'sedang', 'menantang'];
const DAFTAR_MISKONSEPSI = Object.keys(INFO_MISKONSEPSI) as Miskonsepsi[];

export function adalahSoalGuru(id: string): boolean {
  return id.startsWith(PREFIKS_GURU);
}

function bersihkan(teks: unknown): string | null {
  if (typeof teks !== 'string') return null;
  return teks.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
}

function sama(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function terjemahkan(ops: string[]): string[] {
  return ops.map((op) =>
    op.replace(/^\s*([a-zA-Z]+)/, (_semua, nama: string) => PETA_LAIN[nama.toLowerCase()] ?? nama),
  );
}

function urutanBatch(ops: string[]): string[] {
  return [...ops.filter((o) => POLA_TAMBAH.test(o)), ...ops.filter((o) => POLA_AMBIL.test(o))];
}

// "  PUSH( 5 ) " → "push(5)"
export function normalisasiPerintah(teks: string): string {
  const cocok = POLA_PERINTAH.exec(teks);
  if (!cocok) return teks.trim();
  const arg = cocok[2].replace(/\s+/g, ' ').trim();
  return `${cocok[1].toLowerCase()}(${arg})`;
}

export function validasiSimulasi(
  masukan: { struktur?: unknown; tingkat?: unknown; konteks?: unknown; operasi?: unknown },
  id: string = 'pratinjau',
): HasilValidasi<SoalSimulasi> {
  const galat: string[] = [];
  const peringatan: string[] = [];

  const strukturOk = masukan.struktur === 'stack' || masukan.struktur === 'queue';
  if (!strukturOk) galat.push('Struktur data harus Stack atau Queue.');

  const tingkatOk = DAFTAR_TINGKAT.includes(masukan.tingkat as Tingkat);
  if (!tingkatOk) galat.push('Tingkat harus mudah, sedang, atau menantang.');

  let konteks = bersihkan(masukan.konteks) ?? '';
  if (konteks.length > BATAS.konteks) galat.push(`Konteks maksimal ${BATAS.konteks} karakter.`);
  if (konteks === '') konteks = 'Soal dari guru.';

  if (!Array.isArray(masukan.operasi) || masukan.operasi.some((o) => typeof o !== 'string')) {
    galat.push('Daftar perintah tidak valid.');
    return { ok: false, galat };
  }

  const operasi = (masukan.operasi as string[]).map(normalisasiPerintah).filter((o) => o !== '');
  if (operasi.length < BATAS.perintahMin || operasi.length > BATAS.perintahMaks) {
    galat.push(
      `Jumlah perintah harus ${BATAS.perintahMin} sampai ${BATAS.perintahMaks} (sekarang ${operasi.length}).`,
    );
  }

  if (!strukturOk) return { ok: false, galat };
  const struktur = masukan.struktur as JenisStruktur;
  const nama = NAMA_STRUKTUR[struktur];
  const tambah = OP_TAMBAH[struktur];
  const ambil = OP_AMBIL[struktur];
  const lihat = OP_LIHAT[struktur];

  let adaGalatPerintah = false;
  const nilaiDipakai = new Map<string, number>();

  operasi.forEach((op, i) => {
    const awal = `Perintah ke-${i + 1} "${op}"`;
    const cocok = POLA_PERINTAH.exec(op);
    if (!cocok) {
      galat.push(`${awal} tidak valid. Contoh: ${tambah}(5) atau ${ambil}().`);
      adaGalatPerintah = true;
      return;
    }
    const nm = cocok[1];
    const arg = cocok[2];

    if (nm === tambah) {
      if (!POLA_NILAI.test(arg)) {
        galat.push(
          `${awal}: nilai harus 1 sampai ${BATAS.nilaiMaks} karakter (huruf, angka, spasi, titik, strip, atau garis bawah).`,
        );
        adaGalatPerintah = true;
        return;
      }
      const kunci = arg.toLowerCase();
      if (nilaiDipakai.has(kunci)) {
        galat.push(
          `${awal}: nilai "${arg}" sudah dipakai di perintah ke-${nilaiDipakai.get(kunci)}. Setiap nilai harus berbeda.`,
        );
        adaGalatPerintah = true;
        return;
      }
      nilaiDipakai.set(kunci, i + 1);
    } else if (nm === ambil || lihat.includes(nm)) {
      if (arg !== '') {
        galat.push(`${awal}: ${nm}() tidak memakai nilai.`);
        adaGalatPerintah = true;
      }
    } else {
      galat.push(
        `${awal}: perintah "${nm}" tidak dikenal untuk ${nama}. Gunakan ${tambah}, ${ambil}, atau ${lihat[0]}.`,
      );
      adaGalatPerintah = true;
    }
  });

  let kunciKeluar: string[] = [];
  if (!adaGalatPerintah && operasi.length > 0) {
    try {
      const hasil = jalankan(struktur, operasi);
      const gagal = hasil.langkah.findIndex((l) => l.galat !== null);
      if (gagal !== -1) {
        galat.push(
          `Perintah ke-${gagal + 1} "${operasi[gagal]}" mengambil dari ${nama} yang masih kosong (underflow).`,
        );
      } else {
        kunciKeluar = hasil.keluar;
        if (kunciKeluar.length < BATAS.keluarMin) {
          galat.push('Soal harus punya minimal 1 perintah yang mengeluarkan elemen (pop atau dequeue).');
        }
        if (kunciKeluar.length > BATAS.keluarMaks) {
          galat.push(`Maksimal ${BATAS.keluarMaks} elemen yang keluar.`);
        }
      }
    } catch {
      galat.push('Perintah tidak dapat dijalankan.');
    }
  }

  if (galat.length > 0) return { ok: false, galat };

  const tingkat = masukan.tingkat as Tingkat;

  // Peringatan mutu (tidak memblokir penyimpanan)
  try {
    const lain: JenisStruktur = struktur === 'stack' ? 'queue' : 'stack';
    const tertukar = jalankan(lain, terjemahkan(operasi)).keluar;
    if (sama(kunciKeluar, tertukar)) {
      peringatan.push(
        'Jawaban sama persis kalau Stack dan Queue tertukar, jadi kesalahan itu tidak bisa terdeteksi.',
      );
    }
  } catch {
    // abaikan
  }
  if (struktur === 'stack' && tingkat !== 'mudah') {
    try {
      const batch = jalankan('stack', urutanBatch(operasi)).keluar;
      if (sama(kunciKeluar, batch)) {
        peringatan.push(
          'Jawaban sama walau perintah selang-seling diabaikan, jadi kesalahan itu tidak bisa terdeteksi.',
        );
      }
    } catch {
      // abaikan
    }
  }

  return {
    ok: true,
    soal: { id, jenis: 'simulasi', struktur, tingkat, konteks, operasi },
    peringatan,
  };
}

export function validasiPilihanGanda(
  masukan: { pertanyaan?: unknown; pilihan?: unknown; benar?: unknown; penjelasan?: unknown },
  id: string = 'pratinjau',
): HasilValidasi<SoalPilihanGanda> {
  const galat: string[] = [];
  const peringatan: string[] = [];

  const pertanyaan = bersihkan(masukan.pertanyaan) ?? '';
  if (pertanyaan.length < BATAS.pertanyaanMin || pertanyaan.length > BATAS.pertanyaanMaks) {
    galat.push(`Pertanyaan harus ${BATAS.pertanyaanMin} sampai ${BATAS.pertanyaanMaks} karakter.`);
  }

  const penjelasan = bersihkan(masukan.penjelasan) ?? '';
  if (penjelasan === '') galat.push('Penjelasan jawaban wajib diisi.');
  else if (penjelasan.length > BATAS.penjelasanMaks) {
    galat.push(`Penjelasan maksimal ${BATAS.penjelasanMaks} karakter.`);
  }

  const pilihan: PilihanJawaban[] = [];
  if (!Array.isArray(masukan.pilihan)) {
    galat.push('Daftar pilihan tidak valid.');
  } else {
    if (masukan.pilihan.length < BATAS.pilihanMin || masukan.pilihan.length > BATAS.pilihanMaks) {
      galat.push(`Jumlah pilihan harus ${BATAS.pilihanMin} sampai ${BATAS.pilihanMaks}.`);
    }
    const idDipakai = new Set<string>();
    const teksDipakai = new Set<string>();

    masukan.pilihan.forEach((p: unknown, i: number) => {
      const nomor = `Pilihan ke-${i + 1}`;
      if (!p || typeof p !== 'object') {
        galat.push(`${nomor} tidak valid.`);
        return;
      }
      const item = p as { id?: unknown; teks?: unknown; miskonsepsi?: unknown };

      const idp = typeof item.id === 'string' ? item.id : '';
      if (!POLA_ID_PILIHAN.test(idp)) galat.push(`${nomor}: ID tidak valid.`);
      else if (idDipakai.has(idp)) galat.push(`${nomor}: ID "${idp}" kembar.`);
      idDipakai.add(idp);

      const teks = bersihkan(item.teks) ?? '';
      if (teks === '') galat.push(`${nomor}: teks wajib diisi.`);
      else if (teks.length > BATAS.teksPilihanMaks) {
        galat.push(`${nomor}: teks maksimal ${BATAS.teksPilihanMaks} karakter.`);
      } else {
        const kunci = teks.toLowerCase();
        if (teksDipakai.has(kunci)) galat.push(`${nomor}: teksnya sama dengan pilihan lain.`);
        teksDipakai.add(kunci);
      }

      let miskonsepsi: Miskonsepsi | undefined;
      if (item.miskonsepsi !== undefined && item.miskonsepsi !== null && item.miskonsepsi !== '') {
        if (DAFTAR_MISKONSEPSI.includes(item.miskonsepsi as Miskonsepsi)) {
          miskonsepsi = item.miskonsepsi as Miskonsepsi;
        } else {
          galat.push(`${nomor}: jenis miskonsepsi tidak dikenal.`);
        }
      }
      pilihan.push(miskonsepsi ? { id: idp, teks, miskonsepsi } : { id: idp, teks });
    });
  }

  const benar = typeof masukan.benar === 'string' ? masukan.benar : '';
  if (!pilihan.some((p) => p.id === benar)) galat.push('Jawaban benar harus salah satu pilihan.');

  if (galat.length > 0) return { ok: false, galat };

  if (pilihan.some((p) => p.id === benar && p.miskonsepsi)) {
    peringatan.push('Pilihan yang benar tidak perlu dikaitkan dengan miskonsepsi, jadi sudah dibersihkan.');
  }
  const akhir: PilihanJawaban[] = pilihan.map((p) =>
    p.id === benar && p.miskonsepsi ? { id: p.id, teks: p.teks } : p,
  );
  if (!akhir.some((p) => p.miskonsepsi)) {
    peringatan.push(
      'Tidak ada pilihan salah yang dikaitkan dengan miskonsepsi, jadi diagnosis tidak akan tercatat untuk soal ini.',
    );
  }

  return {
    ok: true,
    soal: { id, jenis: 'pilihan-ganda', pertanyaan, pilihan: akhir, benar, penjelasan },
    peringatan,
  };
}

// Mengubah satu baris Supabase menjadi soal siap pakai. Mengembalikan null kalau tidak layak.
export function ubahBarisKeSoal(baris: unknown): Soal | null {
  if (!baris || typeof baris !== 'object') return null;
  const b = baris as BarisSoal;
  if (typeof b.id !== 'string' || !POLA_ID_BARIS.test(b.id)) return null;
  if (b.aktif === false) return null;

  const id = PREFIKS_GURU + b.id;
  if (b.jenis === 'simulasi') {
    const hasil = validasiSimulasi(b, id);
    return hasil.ok ? hasil.soal : null;
  }
  if (b.jenis === 'pilihan-ganda') {
    const hasil = validasiPilihanGanda(b, id);
    return hasil.ok ? hasil.soal : null;
  }
  return null;
}

export function ubahDaftarBaris(daftar: unknown): Soal[] {
  if (!Array.isArray(daftar)) return [];
  const hasil: Soal[] = [];
  const dilihat = new Set<string>();
  for (const baris of daftar) {
    const soal = ubahBarisKeSoal(baris);
    if (!soal || dilihat.has(soal.id)) continue;
    dilihat.add(soal.id);
    hasil.push(soal);
    if (hasil.length >= BATAS.soalMaks) break;
  }
  return hasil;
}
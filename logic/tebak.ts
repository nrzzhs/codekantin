import { jalankan } from './simulasi';
import type { JenisStruktur, HasilSimulasi } from './simulasi';
import { BANK_SOAL } from '../data/soal';
import type { Soal, SoalSimulasi, SoalPilihanGanda } from '../data/soal';
import type { Miskonsepsi } from '../data/miskonsepsi';

const POLA_TAMBAH = /^\s*(?:push|enqueue)\s*\(\s*([^)]*?)\s*\)\s*$/i;
const POLA_AMBIL = /^\s*(?:pop|dequeue)\s*\(/i;

const PETA_LAIN: Record<string, string> = {
  push: 'enqueue',
  enqueue: 'push',
  pop: 'dequeue',
  dequeue: 'pop',
  front: 'peek',
};

function sama(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function strukturLain(j: JenisStruktur): JenisStruktur {
  return j === 'stack' ? 'queue' : 'stack';
}

// Mengubah perintah Stack menjadi perintah Queue (atau sebaliknya)
function terjemahkan(ops: string[]): string[] {
  return ops.map((op) =>
    op.replace(/^\s*([a-zA-Z]+)/, (_semua, nama: string) => PETA_LAIN[nama.toLowerCase()] ?? nama),
  );
}

// Semua penambahan dulu, baru semua pengambilan (mengabaikan urutan selang-seling)
function urutanBatch(ops: string[]): string[] {
  return [...ops.filter((o) => POLA_TAMBAH.test(o)), ...ops.filter((o) => POLA_AMBIL.test(o))];
}

// Kunci jawaban dihitung dari logika Stack/Queue yang sama dengan simulator
export function hitungKunci(soal: SoalSimulasi): HasilSimulasi {
  return jalankan(soal.struktur, soal.operasi);
}

// Pilihan jawaban = nilai yang dimasukkan lewat push/enqueue, diurutkan netral
export function pilihanJawaban(soal: SoalSimulasi): string[] {
  const nilai = new Set<string>();
  for (const op of soal.operasi) {
    const cocok = POLA_TAMBAH.exec(op);
    if (cocok) nilai.add(cocok[1]);
  }
  return Array.from(nilai).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// Memetakan jawaban salah ke jenis miskonsepsi (modul bagian G)
export function diagnosaSimulasi(soal: SoalSimulasi, jawaban: string[]): Miskonsepsi | null {
  const kunci = hitungKunci(soal).keluar;
  if (sama(jawaban, kunci)) return null;

  // Jawaban sesuai aturan struktur yang tertukar
  const tertukar = jalankan(strukturLain(soal.struktur), terjemahkan(soal.operasi)).keluar;
  if (sama(jawaban, tertukar)) {
    return soal.struktur === 'stack' ? 'pop-terbawah' : 'dequeue-terbaru';
  }

  // Jawaban sesuai kalau perintah selang-seling diabaikan
  const batch = jalankan(soal.struktur, urutanBatch(soal.operasi)).keluar;
  if (sama(jawaban, batch)) return 'abaikan-urutan';

  return null;
}

export function periksaSimulasi(
  soal: SoalSimulasi,
  jawaban: (string | null)[],
): { benar: boolean; miskonsepsi: Miskonsepsi | null } {
  const kunci = hitungKunci(soal).keluar;
  const terisi = jawaban.filter((x): x is string => x !== null);
  const lengkap = terisi.length === kunci.length;
  const benar = lengkap && sama(terisi, kunci);
  return { benar, miskonsepsi: benar || !lengkap ? null : diagnosaSimulasi(soal, terisi) };
}

export function periksaPilihanGanda(
  soal: SoalPilihanGanda,
  idPilihan: string,
): { benar: boolean; miskonsepsi: Miskonsepsi | null } {
  const benar = idPilihan === soal.benar;
  const dipilih = soal.pilihan.find((p) => p.id === idPilihan);
  return { benar, miskonsepsi: benar ? null : dipilih?.miskonsepsi ?? null };
}

function acak<T>(daftar: T[]): T[] {
  const salinan = [...daftar];
  for (let i = salinan.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [salinan[i], salinan[j]] = [salinan[j], salinan[i]];
  }
  return salinan;
}

// 5 soal naik bertahap: mudah, PG, sedang, PG, menantang
export function buatSesi(bank: Soal[] = BANK_SOAL): string[] {
  const ambil = (tingkat: string): Soal | undefined =>
    acak(bank.filter((s) => s.jenis === 'simulasi' && s.tingkat === tingkat))[0];
  const pg = acak(bank.filter((s) => s.jenis === 'pilihan-ganda'));
  const urutan = [ambil('mudah'), pg[0], ambil('sedang'), pg[1], ambil('menantang')];
  return urutan.filter((s): s is Soal => s !== undefined).map((s) => s.id);
}
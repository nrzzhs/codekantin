import type { Soal, Tingkat } from '../data/soal';
import { adalahSoalGuru } from './soalGuru';

// Peluang memilih soal guru untuk sebuah slot kalau soal guru yang cocok tersedia
export const PELUANG_SOAL_GURU = 0.6;

export type Sesi = {
  idSoal: string[];
  soalSesi: Record<string, Soal>; // salinan soal guru yang dipakai di sesi ini
};

function pilihAcak<T>(daftar: T[], acak: () => number): T {
  return daftar[Math.min(daftar.length - 1, Math.floor(acak() * daftar.length))];
}

// 5 soal naik bertahap: mudah, PG, sedang, PG, menantang
export function susunSesi(
  bank: Soal[],
  soalGuru: Soal[],
  acak: () => number = Math.random,
): Sesi {
  const dipakai = new Set<string>();

  const ambil = (cocok: (s: Soal) => boolean): Soal | undefined => {
    const dariBank = bank.filter((s) => cocok(s) && !dipakai.has(s.id));
    const dariGuru = soalGuru.filter((s) => cocok(s) && !dipakai.has(s.id));

    let terpilih: Soal | undefined;
    if (dariGuru.length > 0 && (dariBank.length === 0 || acak() < PELUANG_SOAL_GURU)) {
      terpilih = pilihAcak(dariGuru, acak);
    } else if (dariBank.length > 0) {
      terpilih = pilihAcak(dariBank, acak);
    }
    if (terpilih) dipakai.add(terpilih.id);
    return terpilih;
  };

  const simulasi = (t: Tingkat) => ambil((s) => s.jenis === 'simulasi' && s.tingkat === t);
  const pilihanGanda = () => ambil((s) => s.jenis === 'pilihan-ganda');

  const urutan = [
    simulasi('mudah'),
    pilihanGanda(),
    simulasi('sedang'),
    pilihanGanda(),
    simulasi('menantang'),
  ].filter((s): s is Soal => s !== undefined);

  const soalSesi: Record<string, Soal> = {};
  for (const s of urutan) {
    if (adalahSoalGuru(s.id)) soalSesi[s.id] = s;
  }
  return { idSoal: urutan.map((s) => s.id), soalSesi };
}
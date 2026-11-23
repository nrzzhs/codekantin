import { PELUANG_SOAL_GURU, susunSesi } from '../logic/sesi';
import { BANK_SOAL } from '../data/soal';
import type { Soal, SoalPilihanGanda, SoalSimulasi } from '../data/soal';

function simGuru(i: number, tingkat: SoalSimulasi['tingkat']): SoalSimulasi {
  return {
    id: `guru:sim-${i}`,
    jenis: 'simulasi',
    struktur: 'stack',
    tingkat,
    konteks: 'Dari guru',
    operasi: ['push(1)', 'push(2)', 'pop()'],
  };
}

function pgGuru(i: number): SoalPilihanGanda {
  return {
    id: `guru:pg-${i}`,
    jenis: 'pilihan-ganda',
    pertanyaan: `Pertanyaan guru ${i}?`,
    pilihan: [{ id: 'a', teks: 'Ya' }, { id: 'b', teks: 'Tidak' }],
    benar: 'a',
    penjelasan: 'Penjelasan.',
  };
}

const GURU_LENGKAP: Soal[] = [
  simGuru(1, 'mudah'),
  simGuru(2, 'sedang'),
  simGuru(3, 'menantang'),
  pgGuru(1),
  pgGuru(2),
];

const POLA = ['simulasi:mudah', 'pilihan-ganda', 'simulasi:sedang', 'pilihan-ganda', 'simulasi:menantang'];

function bentuk(s: Soal): string {
  return s.jenis === 'simulasi' ? `simulasi:${s.tingkat}` : 'pilihan-ganda';
}

function cariDi(daftar: Soal[], id: string): Soal {
  const s = daftar.find((x) => x.id === id);
  if (!s) throw new Error(`Soal ${id} tidak ditemukan`);
  return s;
}

function benihAcak(awal: number): () => number {
  let a = awal;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

describe('susunSesi', () => {
  test('tanpa soal guru: 5 soal berbeda dengan pola yang benar, tanpa salinan', () => {
    for (let i = 0; i < 30; i++) {
      const { idSoal, soalSesi } = susunSesi(BANK_SOAL, []);
      expect(idSoal).toHaveLength(5);
      expect(new Set(idSoal).size).toBe(5);
      expect(idSoal.map((id) => bentuk(cariDi(BANK_SOAL, id)))).toEqual(POLA);
      expect(soalSesi).toEqual({});
    }
  });

  test('kalau soal guru diutamakan: semua slot terisi soal guru dan disalin ke sesi', () => {
    const { idSoal, soalSesi } = susunSesi(BANK_SOAL, GURU_LENGKAP, () => 0);
    expect(idSoal).toHaveLength(5);
    expect(idSoal.every((id) => id.startsWith('guru:'))).toBe(true);
    expect(Object.keys(soalSesi).sort()).toEqual([...idSoal].sort());
    for (const id of idSoal) expect(soalSesi[id]).toEqual(cariDi(GURU_LENGKAP, id));
  });

  test('kalau bank diutamakan: tidak ada soal guru', () => {
    const { idSoal, soalSesi } = susunSesi(BANK_SOAL, GURU_LENGKAP, () => 0.99);
    expect(idSoal.some((id) => id.startsWith('guru:'))).toBe(false);
    expect(soalSesi).toEqual({});
  });

  test('soal guru hanya untuk satu tingkat: slot lain tetap dari bank', () => {
    const guru = [simGuru(1, 'menantang')];
    const { idSoal, soalSesi } = susunSesi(BANK_SOAL, guru, () => 0);
    const semua = [...BANK_SOAL, ...guru];
    expect(idSoal).toHaveLength(5);
    expect(new Set(idSoal).size).toBe(5);
    expect(idSoal[4]).toBe('guru:sim-1');
    expect(idSoal.slice(0, 4).some((id) => id.startsWith('guru:'))).toBe(false);
    expect(idSoal.map((id) => bentuk(cariDi(semua, id)))).toEqual(POLA);
    expect(Object.keys(soalSesi)).toEqual(['guru:sim-1']);
  });

  test('hanya satu pilihan ganda dari guru: pilihan ganda kedua dari bank, tidak kembar', () => {
    const guru = [pgGuru(1)];
    const { idSoal } = susunSesi(BANK_SOAL, guru, () => 0);
    expect(idSoal[1]).toBe('guru:pg-1');
    expect(idSoal[3].startsWith('guru:')).toBe(false);
    expect(new Set(idSoal).size).toBe(5);
  });

  test('bank kosong: sesi disusun dari soal guru saja', () => {
    const { idSoal } = susunSesi([], GURU_LENGKAP, () => 0.99);
    expect(idSoal).toHaveLength(5);
    expect(idSoal.every((id) => id.startsWith('guru:'))).toBe(true);
    expect(new Set(idSoal).size).toBe(5);
  });

  test('tidak ada soal sama sekali: sesi kosong, bukan error', () => {
    expect(susunSesi([], [])).toEqual({ idSoal: [], soalSesi: {} });
  });

  test('peluang soal guru mengikuti PELUANG_SOAL_GURU', () => {
    const acak = benihAcak(12345);
    const guru = [simGuru(1, 'mudah')];
    let dariGuru = 0;
    const percobaan = 1000;
    for (let i = 0; i < percobaan; i++) {
      if (susunSesi(BANK_SOAL, guru, acak).idSoal[0].startsWith('guru:')) dariGuru++;
    }
    const rasio = dariGuru / percobaan;
    expect(rasio).toBeGreaterThan(PELUANG_SOAL_GURU - 0.1);
    expect(rasio).toBeLessThan(PELUANG_SOAL_GURU + 0.1);
  });
});
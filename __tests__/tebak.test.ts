import { BANK_SOAL, cariSoal } from '../data/soal';
import type { SoalPilihanGanda, SoalSimulasi } from '../data/soal';
import {
  buatSesi,
  diagnosaSimulasi,
  hitungKunci,
  periksaPilihanGanda,
  periksaSimulasi,
  pilihanJawaban,
} from '../logic/tebak';

function sim(id: string): SoalSimulasi {
  const s = cariSoal(id);
  if (!s || s.jenis !== 'simulasi') throw new Error(`Soal simulasi ${id} tidak ada`);
  return s;
}

function pg(id: string): SoalPilihanGanda {
  const s = cariSoal(id);
  if (!s || s.jenis !== 'pilihan-ganda') throw new Error(`Soal pilihan ganda ${id} tidak ada`);
  return s;
}

describe('Bank soal', () => {
  test('id setiap soal unik', () => {
    expect(new Set(BANK_SOAL.map((s) => s.id)).size).toBe(BANK_SOAL.length);
  });

  test('semua soal simulasi berjalan tanpa underflow/overflow dan punya urutan keluar', () => {
    for (const s of BANK_SOAL) {
      if (s.jenis !== 'simulasi') continue;
      const k = hitungKunci(s);
      expect(k.keluar.length).toBeGreaterThan(0);
      expect(k.langkah.every((l) => l.galat === null)).toBe(true);
    }
  });

  test('pilihan jawaban cukup untuk semua elemen yang keluar', () => {
    for (const s of BANK_SOAL) {
      if (s.jenis !== 'simulasi') continue;
      expect(pilihanJawaban(s).length).toBeGreaterThanOrEqual(hitungKunci(s).keluar.length);
    }
  });

  test('kunci pilihan ganda sama dengan kunci modul (B, C, C, A, B, C, B, B)', () => {
    const ids = ['pg-1', 'pg-2', 'pg-3', 'pg-4', 'pg-5', 'pg-6', 'pg-7', 'pg-8'];
    expect(ids.map((id) => pg(id).benar)).toEqual(['b', 'c', 'c', 'a', 'b', 'c', 'b', 'b']);
  });

  test('kunci setiap pilihan ganda ada di daftar pilihannya', () => {
    for (const s of BANK_SOAL) {
      if (s.jenis !== 'pilihan-ganda') continue;
      expect(s.pilihan.some((p) => p.id === s.benar)).toBe(true);
    }
  });
});

describe('Kunci simulasi (modul bagian F dan K)', () => {
  test('contoh F1: keluar 2, 4, 3 dan isi akhir [5]', () => {
    const k = hitungKunci(sim('sim-stack-3'));
    expect(k.keluar).toEqual(['2', '4', '3']);
    expect(k.isiAkhir).toEqual(['5']);
  });

  test('soal sedang Stack: keluar 3, 8', () => {
    expect(hitungKunci(sim('sim-stack-2')).keluar).toEqual(['3', '8']);
  });

  test('soal sedang Queue: keluar 4, 9', () => {
    expect(hitungKunci(sim('sim-queue-2')).keluar).toEqual(['4', '9']);
  });

  test('contoh F3 dan F4', () => {
    expect(hitungKunci(sim('sim-stack-4')).keluar).toEqual(['B', 'C']);
    expect(hitungKunci(sim('sim-queue-3')).keluar).toEqual(['A', 'B']);
  });

  test('soal menantang Stack dan Queue', () => {
    expect(hitungKunci(sim('sim-stack-5')).keluar).toEqual(['B', 'A', 'D']);
    expect(hitungKunci(sim('sim-queue-4')).keluar).toEqual(['A', 'B', 'C']);
  });

  test('antrean cetak: urutan pencetakan sama dengan urutan kirim', () => {
    expect(hitungKunci(sim('sim-queue-5')).keluar).toEqual(['Laporan', 'Tugas', 'Poster', 'Jadwal']);
  });
});

describe('Pilihan jawaban', () => {
  test('diurutkan netral dan tanpa duplikat', () => {
    expect(pilihanJawaban(sim('sim-queue-5'))).toEqual(['Jadwal', 'Laporan', 'Poster', 'Tugas']);
    expect(pilihanJawaban(sim('sim-stack-3'))).toEqual(['2', '3', '4', '5']);
  });
});

describe('Diagnosa miskonsepsi', () => {
  test('jawaban benar tidak dianggap miskonsepsi', () => {
    expect(diagnosaSimulasi(sim('sim-stack-3'), ['2', '4', '3'])).toBeNull();
  });

  test('Stack dijawab seperti Queue = pop mengambil elemen terbawah', () => {
    expect(diagnosaSimulasi(sim('sim-stack-2'), ['5', '3'])).toBe('pop-terbawah');
    expect(diagnosaSimulasi(sim('sim-stack-1'), ['1'])).toBe('pop-terbawah');
  });

  test('Queue dijawab seperti Stack = dequeue mengambil elemen terbaru', () => {
    expect(diagnosaSimulasi(sim('sim-queue-2'), ['9', '6'])).toBe('dequeue-terbaru');
  });

  test('mengabaikan perintah selang-seling', () => {
    expect(diagnosaSimulasi(sim('sim-stack-2'), ['8', '3'])).toBe('abaikan-urutan');
  });

  test('jawaban acak tidak dipetakan ke miskonsepsi', () => {
    expect(diagnosaSimulasi(sim('sim-stack-3'), ['5', '5', '5'])).toBeNull();
  });
});

describe('Pemeriksaan jawaban', () => {
  test('simulasi benar', () => {
    expect(periksaSimulasi(sim('sim-stack-2'), ['3', '8']).benar).toBe(true);
  });

  test('simulasi salah membawa miskonsepsi', () => {
    const p = periksaSimulasi(sim('sim-stack-2'), ['5', '3']);
    expect(p.benar).toBe(false);
    expect(p.miskonsepsi).toBe('pop-terbawah');
  });

  test('slot yang belum terisi tidak dianggap benar', () => {
    expect(periksaSimulasi(sim('sim-stack-2'), ['3', null]).benar).toBe(false);
  });

  test('pilihan ganda: benar dan salah dengan miskonsepsi', () => {
    expect(periksaPilihanGanda(pg('pg-1'), 'b')).toEqual({ benar: true, miskonsepsi: null });
    expect(periksaPilihanGanda(pg('pg-1'), 'a')).toEqual({ benar: false, miskonsepsi: 'tukar-fifo-lifo' });
    expect(periksaPilihanGanda(pg('pg-6'), 'a')).toEqual({ benar: false, miskonsepsi: null });
  });
});

describe('Penyusunan sesi', () => {
  test('5 soal berbeda, naik bertahap: mudah, PG, sedang, PG, menantang', () => {
    for (let i = 0; i < 20; i++) {
      const ids = buatSesi();
      expect(ids).toHaveLength(5);
      expect(new Set(ids).size).toBe(5);
      const soal = ids.map((id) => cariSoal(id));
      expect(soal.every((s) => s !== undefined)).toBe(true);
      expect((soal[0] as SoalSimulasi).tingkat).toBe('mudah');
      expect(soal[1]?.jenis).toBe('pilihan-ganda');
      expect((soal[2] as SoalSimulasi).tingkat).toBe('sedang');
      expect(soal[3]?.jenis).toBe('pilihan-ganda');
      expect((soal[4] as SoalSimulasi).tingkat).toBe('menantang');
    }
  });
});
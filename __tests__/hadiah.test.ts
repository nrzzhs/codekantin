import {
  hitungHadiah,
  ringkasRiwayat,
  tambahCatatan,
  tandaiTersinkron,
} from '../logic/hadiah';
import type { CatatanSesi } from '../logic/hadiah';

function catatan(
  id: string,
  benar: number,
  total: number,
  miskonsepsi: string[] = [],
  tersinkron = false,
): CatatanSesi {
  const hasil = Array.from({ length: total }, (_, i) => ({
    idSoal: `s${i}`,
    benar: i < benar,
    miskonsepsi: i >= benar ? miskonsepsi[i - benar] ?? null : null,
  }));
  return { sesiId: id, waktu: '2026-11-01T00:00:00.000Z', hasil, tersinkron };
}

describe('hitungHadiah', () => {
  test('semua benar: 10 XP per soal + bonus 20, poin penuh', () => {
    expect(hitungHadiah(5, 5)).toEqual({ xp: 70, poin: 20 });
  });

  test('sebagian benar', () => {
    expect(hitungHadiah(3, 5)).toEqual({ xp: 30, poin: 12 });
    expect(hitungHadiah(4, 5)).toEqual({ xp: 40, poin: 16 });
  });

  test('tidak ada yang benar', () => {
    expect(hitungHadiah(0, 5)).toEqual({ xp: 0, poin: 0 });
  });

  test('masukan tidak masuk akal tidak merusak hasil', () => {
    expect(hitungHadiah(0, 0)).toEqual({ xp: 0, poin: 0 });
    expect(hitungHadiah(-1, 5)).toEqual({ xp: 0, poin: 0 });
    expect(hitungHadiah(9, 5)).toEqual({ xp: 70, poin: 20 });
  });
});

describe('tambahCatatan', () => {
  test('sesi yang sama tidak digandakan', () => {
    const a = catatan('a', 3, 5);
    const hasil = tambahCatatan(tambahCatatan([], a), a);
    expect(hasil).toHaveLength(1);
  });

  test('melebihi batas membuang yang tersinkron paling lama', () => {
    let r: CatatanSesi[] = [];
    r = tambahCatatan(r, catatan('a', 1, 5, [], true), 3);
    r = tambahCatatan(r, catatan('b', 1, 5, [], false), 3);
    r = tambahCatatan(r, catatan('c', 1, 5, [], true), 3);
    r = tambahCatatan(r, catatan('d', 1, 5, [], false), 3);
    expect(r.map((c) => c.sesiId)).toEqual(['b', 'c', 'd']);
  });

  test('catatan yang belum tersinkron tidak pernah dibuang', () => {
    let r: CatatanSesi[] = [];
    for (const id of ['a', 'b', 'c']) r = tambahCatatan(r, catatan(id, 1, 5), 2);
    expect(r.map((c) => c.sesiId)).toEqual(['a', 'b', 'c']);
  });
});

describe('tandaiTersinkron', () => {
  test('hanya sesi yang dimaksud yang berubah', () => {
    const r = tandaiTersinkron([catatan('a', 1, 5), catatan('b', 1, 5)], 'b');
    expect(r.map((c) => c.tersinkron)).toEqual([false, true]);
  });
});

describe('ringkasRiwayat', () => {
  test('riwayat kosong', () => {
    expect(ringkasRiwayat([])).toEqual({ sesi: 0, benar: 0, total: 0, akurasi: 0, miskonsepsi: [] });
  });

  test('menghitung akurasi dan miskonsepsi tersering', () => {
    const r = ringkasRiwayat([
      catatan('1', 4, 5, ['pop-terbawah']),
      catatan('2', 2, 5, ['tukar-fifo-lifo', 'pop-terbawah']),
    ]);
    expect(r.sesi).toBe(2);
    expect(r.benar).toBe(6);
    expect(r.total).toBe(10);
    expect(r.akurasi).toBe(60);
    expect(r.miskonsepsi).toEqual([
      { jenis: 'pop-terbawah', jumlah: 2 },
      { jenis: 'tukar-fifo-lifo', jumlah: 1 },
    ]);
  });
});
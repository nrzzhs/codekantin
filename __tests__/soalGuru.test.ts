import {
  BATAS,
  adalahSoalGuru,
  normalisasiPerintah,
  ubahBarisKeSoal,
  ubahDaftarBaris,
  validasiPilihanGanda,
  validasiSimulasi,
} from '../logic/soalGuru';
import type { HasilValidasi } from '../logic/soalGuru';
import {
  hitungKunci,
  periksaPilihanGanda,
  periksaSimulasi,
  pilihanJawaban,
} from '../logic/tebak';
import type { Soal } from '../data/soal';

const STACK_SEDANG = ['push(5)', 'push(3)', 'pop()', 'push(8)', 'pop()'];
const QUEUE_SEDANG = ['enqueue(A)', 'enqueue(B)', 'dequeue()', 'enqueue(C)', 'dequeue()'];

function sim(operasi: unknown, tambahan: Record<string, unknown> = {}) {
  return validasiSimulasi({ struktur: 'stack', tingkat: 'sedang', konteks: 'Uji', operasi, ...tambahan });
}

function ambilSoal<T extends Soal>(h: HasilValidasi<T>): T {
  if (!h.ok) throw new Error(`Seharusnya valid, galat: ${h.galat.join(' | ')}`);
  return h.soal;
}

function galatDari<T extends Soal>(h: HasilValidasi<T>): string[] {
  return h.ok ? [] : h.galat;
}

function peringatanDari<T extends Soal>(h: HasilValidasi<T>): string[] {
  return h.ok ? h.peringatan : [];
}

const ada = (daftar: string[], kata: string) => daftar.some((x) => x.includes(kata));

describe('normalisasiPerintah', () => {
  test('merapikan huruf dan spasi', () => {
    expect(normalisasiPerintah('  PUSH(  5 ) ')).toBe('push(5)');
    expect(normalisasiPerintah('Pop ( )')).toBe('pop()');
    expect(normalisasiPerintah('push(Nasi   Goreng)')).toBe('push(Nasi Goreng)');
  });

  test('teks yang bukan perintah dibiarkan', () => {
    expect(normalisasiPerintah('  asal-asalan ')).toBe('asal-asalan');
  });
});

describe('validasiSimulasi: soal yang valid', () => {
  test('Stack: soal valid, kunci dihitung dari logika, bukan dari guru', () => {
    const soal = ambilSoal(
      validasiSimulasi(
        { struktur: 'stack', tingkat: 'sedang', konteks: '  Rak   piring  ', operasi: STACK_SEDANG },
        'guru:abc',
      ),
    );
    expect(soal.id).toBe('guru:abc');
    expect(soal.konteks).toBe('Rak piring');
    expect(soal.operasi).toEqual(STACK_SEDANG);
    expect(hitungKunci(soal).keluar).toEqual(['3', '8']);
    expect(pilihanJawaban(soal)).toEqual(['3', '5', '8']);
    expect(periksaSimulasi(soal, ['3', '8']).benar).toBe(true);
    expect(periksaSimulasi(soal, ['5', '3']).benar).toBe(false);
  });

  test('Queue valid', () => {
    const soal = ambilSoal(
      validasiSimulasi({ struktur: 'queue', tingkat: 'sedang', konteks: 'Uji', operasi: QUEUE_SEDANG }),
    );
    expect(hitungKunci(soal).keluar).toEqual(['A', 'B']);
  });

  test('konteks kosong diganti teks bawaan', () => {
    expect(ambilSoal(sim(STACK_SEDANG, { konteks: '   ' })).konteks).toBe('Soal dari guru.');
    expect(ambilSoal(sim(STACK_SEDANG, { konteks: undefined })).konteks).toBe('Soal dari guru.');
  });

  test('huruf besar dan baris kosong dirapikan', () => {
    const soal = ambilSoal(sim(['PUSH(1)', '', '   ', 'push(2)', 'POP()']));
    expect(soal.operasi).toEqual(['push(1)', 'push(2)', 'pop()']);
  });

  test('peek dan front diterima, tidak mengubah isi', () => {
    expect(ambilSoal(sim(['push(1)', 'peek()', 'pop()'])).operasi).toHaveLength(3);
    const q = ambilSoal(
      validasiSimulasi({ struktur: 'queue', tingkat: 'mudah', konteks: '', operasi: ['enqueue(A)', 'front()', 'dequeue()'] }),
    );
    expect(hitungKunci(q).keluar).toEqual(['A']);
  });

  test('nilai boleh mengandung spasi', () => {
    const soal = ambilSoal(sim(['push(Nasi Goreng)', 'push(Es Teh)', 'pop()']));
    expect(hitungKunci(soal).keluar).toEqual(['Es Teh']);
    expect(pilihanJawaban(soal)).toEqual(['Es Teh', 'Nasi Goreng']);
  });
});

describe('validasiSimulasi: soal yang ditolak', () => {
  test('underflow', () => {
    expect(ada(galatDari(sim(['pop()', 'push(1)', 'push(2)'])), 'underflow')).toBe(true);
  });

  test('nilai kembar, termasuk beda huruf besar', () => {
    expect(ada(galatDari(sim(['push(1)', 'push(1)', 'pop()'])), 'sudah dipakai')).toBe(true);
    expect(ada(galatDari(sim(['push(A)', 'push(a)', 'pop()'])), 'sudah dipakai')).toBe(true);
  });

  test('perintah yang salah untuk strukturnya', () => {
    expect(ada(galatDari(sim(['enqueue(1)', 'push(2)', 'pop()'])), 'tidak dikenal')).toBe(true);
    const q = validasiSimulasi({
      struktur: 'queue',
      tingkat: 'sedang',
      konteks: '',
      operasi: ['push(1)', 'enqueue(2)', 'dequeue()'],
    });
    expect(ada(galatDari(q), 'tidak dikenal')).toBe(true);
  });

  test('nilai tidak valid', () => {
    expect(ada(galatDari(sim(['push(a;b)', 'push(2)', 'pop()'])), 'nilai harus')).toBe(true);
    expect(ada(galatDari(sim(['push(abcdefghijklm)', 'push(2)', 'pop()'])), 'nilai harus')).toBe(true);
  });

  test('pop dan peek tidak boleh memakai nilai', () => {
    expect(ada(galatDari(sim(['push(1)', 'push(2)', 'pop(3)'])), 'tidak memakai nilai')).toBe(true);
    expect(ada(galatDari(sim(['push(1)', 'peek(1)', 'pop()'])), 'tidak memakai nilai')).toBe(true);
  });

  test('format perintah salah', () => {
    expect(ada(galatDari(sim(['push 5', 'push(2)', 'pop()'])), 'tidak valid')).toBe(true);
  });

  test('jumlah perintah di luar batas', () => {
    expect(ada(galatDari(sim(['push(1)'])), 'Jumlah perintah')).toBe(true);
    const banyak = Array.from({ length: 17 }, (_, i) => (i % 2 === 0 ? `push(${i})` : 'pop()'));
    expect(ada(galatDari(sim(banyak)), 'Jumlah perintah')).toBe(true);
  });

  test('harus ada yang keluar, dan tidak lebih dari batas', () => {
    expect(ada(galatDari(sim(['push(1)', 'push(2)'])), 'minimal 1')).toBe(true);
    const tujuh = [
      ...Array.from({ length: 7 }, (_, i) => `push(${i + 1})`),
      ...Array.from({ length: 7 }, () => 'pop()'),
    ];
    expect(ada(galatDari(sim(tujuh)), 'Maksimal')).toBe(true);
  });

  test('struktur, tingkat, konteks, dan daftar perintah tidak valid', () => {
    expect(ada(galatDari(sim(STACK_SEDANG, { struktur: 'heap' })), 'Struktur')).toBe(true);
    expect(ada(galatDari(sim(STACK_SEDANG, { tingkat: 'sulit' })), 'Tingkat')).toBe(true);
    expect(ada(galatDari(sim(STACK_SEDANG, { konteks: 'x'.repeat(BATAS.konteks + 1) })), 'Konteks')).toBe(true);
    expect(ada(galatDari(sim('push(1)')), 'Daftar perintah')).toBe(true);
    expect(ada(galatDari(sim([1, 2])), 'Daftar perintah')).toBe(true);
  });
});

describe('validasiSimulasi: peringatan mutu', () => {
  test('soal yang baik tidak mendapat peringatan', () => {
    expect(peringatanDari(sim(STACK_SEDANG))).toEqual([]);
    const q = validasiSimulasi({ struktur: 'queue', tingkat: 'sedang', konteks: '', operasi: QUEUE_SEDANG });
    expect(peringatanDari(q)).toEqual([]);
  });

  test('jawaban sama kalau Stack dan Queue tertukar', () => {
    const p = peringatanDari(sim(['push(1)', 'pop()', 'push(2)', 'pop()']));
    expect(ada(p, 'tertukar')).toBe(true);
    expect(ada(p, 'selang-seling')).toBe(false);
  });

  test('jawaban sama kalau selang-seling diabaikan (Stack tingkat sedang)', () => {
    const p = peringatanDari(sim(['push(1)', 'push(2)', 'pop()', 'pop()']));
    expect(ada(p, 'selang-seling')).toBe(true);
    expect(ada(p, 'tertukar')).toBe(false);
  });

  test('peringatan selang-seling tidak berlaku di tingkat mudah', () => {
    const p = peringatanDari(sim(['push(1)', 'push(2)', 'pop()', 'pop()'], { tingkat: 'mudah' }));
    expect(ada(p, 'selang-seling')).toBe(false);
  });
});

describe('validasiPilihanGanda', () => {
  const PILIHAN = [
    { id: 'a', teks: 'Stack' },
    { id: 'b', teks: 'Queue', miskonsepsi: 'tukar-fifo-lifo' },
    { id: 'c', teks: 'Keduanya sama saja' },
    { id: 'd', teks: 'Tidak perlu struktur data' },
  ];
  const DASAR = {
    pertanyaan: 'Struktur untuk tombol Undo adalah ...',
    pilihan: PILIHAN,
    benar: 'a',
    penjelasan: 'Aksi terbaru dibatalkan lebih dulu (LIFO).',
  };

  test('soal valid dan terhubung ke pemeriksa jawaban', () => {
    const h = validasiPilihanGanda(DASAR);
    const soal = ambilSoal(h);
    expect(soal.pilihan).toHaveLength(4);
    expect(peringatanDari(h)).toEqual([]);
    expect(periksaPilihanGanda(soal, 'a')).toEqual({ benar: true, miskonsepsi: null });
    expect(periksaPilihanGanda(soal, 'b')).toEqual({ benar: false, miskonsepsi: 'tukar-fifo-lifo' });
    expect(periksaPilihanGanda(soal, 'd')).toEqual({ benar: false, miskonsepsi: null });
  });

  test('teks dirapikan', () => {
    const soal = ambilSoal(validasiPilihanGanda({ ...DASAR, pertanyaan: '  Apa   itu Stack?  ' }));
    expect(soal.pertanyaan).toBe('Apa itu Stack?');
  });

  test('miskonsepsi pada jawaban benar dibuang dengan peringatan', () => {
    const h = validasiPilihanGanda({ ...DASAR, benar: 'b' });
    const soal = ambilSoal(h);
    expect(soal.pilihan.find((p) => p.id === 'b')?.miskonsepsi).toBeUndefined();
    expect(ada(peringatanDari(h), 'tidak perlu dikaitkan')).toBe(true);
  });

  test('tanpa miskonsepsi sama sekali dapat peringatan diagnosis', () => {
    const polos = PILIHAN.map(({ id, teks }) => ({ id, teks }));
    expect(ada(peringatanDari(validasiPilihanGanda({ ...DASAR, pilihan: polos })), 'diagnosis')).toBe(true);
  });

  test('pilihan di luar batas jumlah', () => {
    expect(ada(galatDari(validasiPilihanGanda({ ...DASAR, pilihan: [PILIHAN[0]] })), 'Jumlah pilihan')).toBe(true);
    const tujuh = Array.from({ length: 7 }, (_, i) => ({ id: String.fromCharCode(97 + i), teks: `Opsi ${i + 1}` }));
    expect(ada(galatDari(validasiPilihanGanda({ ...DASAR, pilihan: tujuh, benar: 'a' })), 'Jumlah pilihan')).toBe(true);
  });

  test('teks dan ID kembar ditolak', () => {
    const kembar = [PILIHAN[0], { id: 'b', teks: 'stack' }, PILIHAN[2]];
    expect(ada(galatDari(validasiPilihanGanda({ ...DASAR, pilihan: kembar })), 'sama dengan pilihan lain')).toBe(true);
    const idKembar = [PILIHAN[0], { id: 'a', teks: 'Lain' }, PILIHAN[2]];
    expect(ada(galatDari(validasiPilihanGanda({ ...DASAR, pilihan: idKembar })), 'kembar')).toBe(true);
  });

  test('jawaban benar harus salah satu pilihan', () => {
    expect(ada(galatDari(validasiPilihanGanda({ ...DASAR, benar: 'z' })), 'Jawaban benar')).toBe(true);
  });

  test('miskonsepsi tidak dikenal ditolak', () => {
    const p = [{ id: 'a', teks: 'Stack' }, { id: 'b', teks: 'Queue', miskonsepsi: 'ngawur' }];
    expect(ada(galatDari(validasiPilihanGanda({ ...DASAR, pilihan: p })), 'miskonsepsi')).toBe(true);
  });

  test('isian kosong atau salah bentuk ditolak', () => {
    expect(galatDari(validasiPilihanGanda({ ...DASAR, pertanyaan: 'Hai' }))).not.toEqual([]);
    expect(ada(galatDari(validasiPilihanGanda({ ...DASAR, penjelasan: '  ' })), 'Penjelasan')).toBe(true);
    expect(ada(galatDari(validasiPilihanGanda({ ...DASAR, pilihan: 'bukan daftar' })), 'tidak valid')).toBe(true);
    expect(galatDari(validasiPilihanGanda({ ...DASAR, pilihan: ['a', 'b'] }))).not.toEqual([]);
    const kosong = [{ id: 'a', teks: '   ' }, { id: 'b', teks: 'Queue' }];
    expect(ada(galatDari(validasiPilihanGanda({ ...DASAR, pilihan: kosong })), 'teks wajib')).toBe(true);
  });
});

describe('ubahBarisKeSoal dan ubahDaftarBaris', () => {
  const ID1 = '3f2b8a52-1c7e-4d1e-9a64-0b5f7f6f1a01';
  const ID2 = '3f2b8a52-1c7e-4d1e-9a64-0b5f7f6f1a02';

  const barisSim = {
    id: ID1,
    jenis: 'simulasi',
    tingkat: 'sedang',
    struktur: 'stack',
    konteks: null,
    operasi: STACK_SEDANG,
    pertanyaan: null,
    pilihan: null,
    benar: null,
    penjelasan: null,
    aktif: true,
    versi: 1,
  };
  const barisPG = {
    id: ID2,
    jenis: 'pilihan-ganda',
    tingkat: null,
    struktur: null,
    konteks: null,
    operasi: null,
    pertanyaan: 'Struktur untuk Undo adalah ...',
    pilihan: [{ id: 'a', teks: 'Stack' }, { id: 'b', teks: 'Queue', miskonsepsi: 'tukar-fifo-lifo' }],
    benar: 'a',
    penjelasan: 'Aksi terbaru dibatalkan lebih dulu.',
    aktif: true,
    versi: 2,
  };

  test('baris simulasi dan pilihan ganda diubah menjadi soal berawalan guru:', () => {
    const s = ubahBarisKeSoal(barisSim);
    expect(s?.id).toBe(`guru:${ID1}`);
    expect(s?.jenis).toBe('simulasi');
    expect(s?.jenis === 'simulasi' && s.konteks).toBe('Soal dari guru.');
    expect(ubahBarisKeSoal(barisPG)?.jenis).toBe('pilihan-ganda');
  });

  test('adalahSoalGuru', () => {
    expect(adalahSoalGuru(`guru:${ID1}`)).toBe(true);
    expect(adalahSoalGuru('sim-stack-1')).toBe(false);
  });

  test('baris yang tidak layak menjadi null', () => {
    expect(ubahBarisKeSoal({ ...barisSim, aktif: false })).toBeNull();
    expect(ubahBarisKeSoal({ ...barisSim, id: '1; drop table soal' })).toBeNull();
    expect(ubahBarisKeSoal({ ...barisSim, id: undefined })).toBeNull();
    expect(ubahBarisKeSoal({ ...barisSim, jenis: 'esai' })).toBeNull();
    expect(ubahBarisKeSoal({ ...barisSim, operasi: ['pop()', 'push(1)', 'push(2)'] })).toBeNull();
    expect(ubahBarisKeSoal({ ...barisPG, benar: 'z' })).toBeNull();
    expect(ubahBarisKeSoal(null)).toBeNull();
    expect(ubahBarisKeSoal('teks')).toBeNull();
    expect(ubahBarisKeSoal(5)).toBeNull();
  });

  test('daftar: baris rusak dan kembar dibuang, bukan daftar menjadi kosong', () => {
    const daftar = [barisSim, barisPG, { ...barisSim, jenis: 'esai', id: '3f2b8a52-1c7e-4d1e-9a64-0b5f7f6f1a03' }, barisSim];
    expect(ubahDaftarBaris(daftar).map((s) => s.id)).toEqual([`guru:${ID1}`, `guru:${ID2}`]);
    expect(ubahDaftarBaris('bukan daftar')).toEqual([]);
    expect(ubahDaftarBaris(null)).toEqual([]);
  });

  test('daftar dibatasi jumlahnya', () => {
    const banyak = Array.from({ length: BATAS.soalMaks + 50 }, (_, i) => ({
      ...barisSim,
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    }));
    expect(ubahDaftarBaris(banyak)).toHaveLength(BATAS.soalMaks);
  });
});
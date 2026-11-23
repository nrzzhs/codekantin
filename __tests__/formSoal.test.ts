import {
  bangunPilihanGanda,
  bangunSimulasi,
  formPilihanGandaDariBaris,
  formPilihanGandaKosong,
  formSimulasiDariBaris,
  formSimulasiKosong,
  hapusBarisTerakhir,
  hitungRingkasan,
  nilaiBerikutnya,
  parsePerintah,
  payloadPilihanGanda,
  payloadSimulasi,
  pratinjauKunci,
  ringkasSoal,
  saring,
  tambahBaris,
  terjemahkanPerintah,
} from '../logic/formSoal';
import type { BarisKelola, FormPilihanGanda } from '../logic/formSoal';

const STACK_SEDANG = ['push(5)', 'push(3)', 'pop()', 'push(8)', 'pop()'];

function baris(p: Partial<BarisKelola> = {}): BarisKelola {
  return {
    id: 'id-1',
    jenis: 'simulasi',
    tingkat: 'sedang',
    struktur: 'stack',
    konteks: 'Rak piring',
    operasi: STACK_SEDANG,
    pertanyaan: null,
    pilihan: null,
    benar: null,
    penjelasan: null,
    aktif: true,
    versi: 1,
    diubah: '2026-11-20T00:00:00.000Z',
    ...p,
  };
}

function formPG(p: Partial<FormPilihanGanda> = {}): FormPilihanGanda {
  return {
    pertanyaan: 'Struktur untuk tombol Undo adalah ...',
    opsi: [
      { teks: 'Stack', miskonsepsi: null },
      { teks: 'Queue', miskonsepsi: 'tukar-fifo-lifo' },
      { teks: 'Keduanya sama saja', miskonsepsi: null },
      { teks: 'Tidak perlu struktur data', miskonsepsi: null },
    ],
    indeksBenar: 0,
    penjelasan: 'Aksi terbaru dibatalkan lebih dulu (LIFO).',
    ...p,
  };
}

const ada = (daftar: string[], kata: string) => daftar.some((x) => x.includes(kata));

describe('parsePerintah', () => {
  test('dipisah baris, koma, atau titik koma; kosong dibuang', () => {
    expect(parsePerintah(' push(5) ,\n pop() ;; \n')).toEqual(['push(5)', 'pop()']);
    expect(parsePerintah('push(1)\r\npush(2)\r\npop()')).toEqual(['push(1)', 'push(2)', 'pop()']);
    expect(parsePerintah('')).toEqual([]);
  });
});

describe('nilaiBerikutnya', () => {
  test('angka terkecil yang belum dipakai', () => {
    expect(nilaiBerikutnya([])).toBe('1');
    expect(nilaiBerikutnya(['push(1)', 'push(2)'])).toBe('3');
    expect(nilaiBerikutnya(['push(2)', 'push(3)'])).toBe('1');
    expect(nilaiBerikutnya(['enqueue(1)', 'dequeue()'])).toBe('2');
    expect(nilaiBerikutnya(['push( 2 )', 'push(1)'])).toBe('3');
    expect(nilaiBerikutnya(['push(A)'])).toBe('1');
  });
});

describe('tambahBaris dan hapusBarisTerakhir', () => {
  test('tambahBaris', () => {
    expect(tambahBaris('', 'push(1)')).toBe('push(1)');
    expect(tambahBaris('push(1)\n', 'pop()')).toBe('push(1)\npop()');
    expect(tambahBaris('push(1)', 'pop()')).toBe('push(1)\npop()');
  });

  test('hapusBarisTerakhir', () => {
    expect(hapusBarisTerakhir('push(1)\npush(2)\npop()')).toBe('push(1)\npush(2)');
    expect(hapusBarisTerakhir('push(1)')).toBe('');
    expect(hapusBarisTerakhir('')).toBe('');
  });
});

describe('terjemahkanPerintah', () => {
  test('Stack ke Queue dan sebaliknya', () => {
    expect(terjemahkanPerintah('push(1)\npush(2)\npop()', 'queue')).toBe('enqueue(1)\nenqueue(2)\ndequeue()');
    expect(terjemahkanPerintah('enqueue(A)\nfront()\ndequeue()', 'stack')).toBe('push(A)\npeek()\npop()');
    expect(terjemahkanPerintah('PUSH(1)', 'queue')).toBe('enqueue(1)');
    expect(terjemahkanPerintah('', 'queue')).toBe('');
  });
});

describe('bangunSimulasi', () => {
  test('perintah dipisah koma dan huruf besar tetap diterima dan dirapikan', () => {
    const f = { ...formSimulasiKosong(), perintah: 'PUSH(1), push(2); POP()' };
    const h = bangunSimulasi(f);
    expect(h.ok).toBe(true);
    if (h.ok) {
      expect(h.soal.operasi).toEqual(['push(1)', 'push(2)', 'pop()']);
      expect(pratinjauKunci(h.soal).keluar).toEqual(['2']);
    }
  });

  test('underflow ditolak', () => {
    const h = bangunSimulasi({ ...formSimulasiKosong(), perintah: 'pop()\npush(1)\npush(2)' });
    expect(h.ok).toBe(false);
    if (!h.ok) expect(ada(h.galat, 'underflow')).toBe(true);
  });

  test('form kosong ditolak', () => {
    const h = bangunSimulasi(formSimulasiKosong());
    expect(h.ok).toBe(false);
    if (!h.ok) expect(ada(h.galat, 'Jumlah perintah')).toBe(true);
  });

  test('id diteruskan', () => {
    const h = bangunSimulasi({ ...formSimulasiKosong(), perintah: STACK_SEDANG.join('\n') }, 'xyz');
    expect(h.ok && h.soal.id).toBe('xyz');
  });
});

describe('pratinjauKunci', () => {
  test('Stack: urutan keluar, isi akhir, dan TOP', () => {
    const h = bangunSimulasi({ ...formSimulasiKosong(), konteks: 'Uji', perintah: STACK_SEDANG.join('\n') });
    if (!h.ok) throw new Error('seharusnya valid');
    const p = pratinjauKunci(h.soal);
    expect(p.keluar).toEqual(['3', '8']);
    expect(p.isiAkhir).toEqual(['5']);
    expect(p.ujung).toBe('TOP = 5');
    expect(p.langkah).toHaveLength(5);
    expect(p.langkah[2]).toEqual({ perintah: 'pop()', isi: ['5'], keluar: '3' });
  });

  test('Queue: FRONT dan REAR', () => {
    const h = bangunSimulasi({
      struktur: 'queue',
      tingkat: 'sedang',
      konteks: '',
      perintah: 'enqueue(A)\nenqueue(B)\nenqueue(C)\ndequeue()',
    });
    if (!h.ok) throw new Error('seharusnya valid');
    const p = pratinjauKunci(h.soal);
    expect(p.keluar).toEqual(['A']);
    expect(p.ujung).toBe('FRONT = B, REAR = C');
  });

  test('struktur yang berakhir kosong', () => {
    const h = bangunSimulasi({ ...formSimulasiKosong(), perintah: 'push(1)\npop()' });
    if (!h.ok) throw new Error('seharusnya valid');
    expect(pratinjauKunci(h.soal).ujung).toBe('TOP = kosong');
  });
});

describe('bangunPilihanGanda', () => {
  test('ID dibuat otomatis berurutan dan jawaban benar sesuai indeks', () => {
    const h = bangunPilihanGanda(formPG());
    expect(h.ok).toBe(true);
    if (h.ok) {
      expect(h.soal.pilihan.map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
      expect(h.soal.benar).toBe('a');
      expect(h.soal.pilihan[1].miskonsepsi).toBe('tukar-fifo-lifo');
      expect(h.peringatan).toEqual([]);
    }
  });

  test('indeks benar lain dipetakan ke ID yang sesuai', () => {
    const h = bangunPilihanGanda(formPG({ indeksBenar: 2 }));
    expect(h.ok && h.soal.benar).toBe('c');
  });

  test('miskonsepsi pada jawaban benar dibuang dengan peringatan', () => {
    const h = bangunPilihanGanda(formPG({ indeksBenar: 1 }));
    expect(h.ok).toBe(true);
    if (h.ok) {
      expect(h.soal.pilihan[1].miskonsepsi).toBeUndefined();
      expect(ada(h.peringatan, 'tidak perlu dikaitkan')).toBe(true);
    }
  });

  test('indeks benar di luar jangkauan ditolak', () => {
    const h = bangunPilihanGanda(formPG({ indeksBenar: 9 }));
    expect(h.ok).toBe(false);
    if (!h.ok) expect(ada(h.galat, 'Jawaban benar')).toBe(true);
  });

  test('pilihan kosong ditolak', () => {
    const h = bangunPilihanGanda(formPilihanGandaKosong());
    expect(h.ok).toBe(false);
    if (!h.ok) expect(ada(h.galat, 'teks wajib')).toBe(true);
  });
});

describe('form kosong', () => {
  test('selalu array baru, tidak saling memengaruhi', () => {
    const a = formPilihanGandaKosong();
    a.opsi[0].teks = 'diubah';
    expect(formPilihanGandaKosong().opsi[0].teks).toBe('');
    expect(formPilihanGandaKosong().opsi).toHaveLength(4);
  });
});

describe('dari baris Supabase ke form dan kembali', () => {
  test('simulasi: bolak-balik menghasilkan soal yang sama', () => {
    const f = formSimulasiDariBaris(baris());
    expect(f).toEqual({
      struktur: 'stack',
      tingkat: 'sedang',
      konteks: 'Rak piring',
      perintah: STACK_SEDANG.join('\n'),
    });
    const h = bangunSimulasi(f);
    expect(h.ok && h.soal.operasi).toEqual(STACK_SEDANG);
  });

  test('simulasi: data aneh diganti nilai bawaan', () => {
    const f = formSimulasiDariBaris(baris({ tingkat: null, struktur: null, konteks: null, operasi: null }));
    expect(f).toEqual({ struktur: 'stack', tingkat: 'sedang', konteks: '', perintah: '' });
  });

  test('pilihan ganda: indeks benar ditemukan dari ID', () => {
    const b = baris({
      jenis: 'pilihan-ganda',
      pertanyaan: 'Apa itu LIFO?',
      pilihan: [
        { id: 'a', teks: 'Satu' },
        { id: 'b', teks: 'Dua', miskonsepsi: 'tukar-fifo-lifo' },
        { id: 'c', teks: 'Tiga' },
      ],
      benar: 'c',
      penjelasan: 'Karena begitu.',
    });
    const f = formPilihanGandaDariBaris(b);
    expect(f.indeksBenar).toBe(2);
    expect(f.opsi).toHaveLength(3);
    expect(f.opsi[1].miskonsepsi).toBe('tukar-fifo-lifo');
    const h = bangunPilihanGanda(f);
    expect(h.ok && h.soal.benar).toBe('c');
  });

  test('pilihan ganda: pilihan rusak digantikan 4 pilihan kosong', () => {
    const f = formPilihanGandaDariBaris(baris({ jenis: 'pilihan-ganda', pilihan: 'bukan daftar', pertanyaan: 'X?' }));
    expect(f.opsi).toHaveLength(4);
    expect(f.indeksBenar).toBe(0);
    expect(f.pertanyaan).toBe('X?');
  });

  test('miskonsepsi tidak dikenal dibaca sebagai tidak ada', () => {
    const f = formPilihanGandaDariBaris(
      baris({
        jenis: 'pilihan-ganda',
        pilihan: [
          { id: 'a', teks: 'Satu', miskonsepsi: 'toString' },
          { id: 'b', teks: 'Dua' },
        ],
        benar: 'b',
      }),
    );
    expect(f.opsi[0].miskonsepsi).toBeNull();
  });
});

describe('payload', () => {
  test('simulasi', () => {
    const h = bangunSimulasi({ ...formSimulasiKosong(), konteks: 'Uji', perintah: STACK_SEDANG.join('\n') });
    if (!h.ok) throw new Error('seharusnya valid');
    expect(payloadSimulasi(h.soal)).toEqual({
      jenis: 'simulasi',
      tingkat: 'sedang',
      struktur: 'stack',
      konteks: 'Uji',
      operasi: STACK_SEDANG,
    });
  });

  test('pilihan ganda', () => {
    const h = bangunPilihanGanda(formPG());
    if (!h.ok) throw new Error('seharusnya valid');
    const p = payloadPilihanGanda(h.soal);
    expect(p.jenis).toBe('pilihan-ganda');
    expect(p.benar).toBe('a');
    expect(Array.isArray(p.pilihan)).toBe(true);
    expect(p.penjelasan).toBe('Aksi terbaru dibatalkan lebih dulu (LIFO).');
  });
});

describe('ringkasSoal', () => {
  test('simulasi dengan lebih dari 4 perintah dipotong', () => {
    expect(ringkasSoal(baris())).toEqual({
      jenisLabel: 'SIMULASI',
      subLabel: 'Stack • sedang',
      judul: 'Rak piring',
      rincian: '5 perintah: push(5), push(3), pop(), push(8), …',
    });
  });

  test('simulasi pendek dan konteks kosong', () => {
    const r = ringkasSoal(baris({ konteks: '  ', struktur: 'queue', operasi: ['enqueue(1)', 'enqueue(2)', 'dequeue()'] }));
    expect(r.subLabel).toBe('Queue • sedang');
    expect(r.judul).toBe('Soal dari guru.');
    expect(r.rincian).toBe('3 perintah: enqueue(1), enqueue(2), dequeue()');
  });

  test('pilihan ganda', () => {
    const r = ringkasSoal(
      baris({
        jenis: 'pilihan-ganda',
        pertanyaan: 'Apa itu Stack?',
        pilihan: [{ id: 'a', teks: 'Tumpukan' }, { id: 'b', teks: 'Antrean' }],
        benar: 'a',
      }),
    );
    expect(r).toEqual({
      jenisLabel: 'PILIHAN GANDA',
      subLabel: '2 pilihan',
      judul: 'Apa itu Stack?',
      rincian: 'Jawaban benar: Tumpukan',
    });
  });
});

describe('hitungRingkasan dan saring', () => {
  const daftar = [baris({ id: '1' }), baris({ id: '2', aktif: false }), baris({ id: '3' })];

  test('hitungRingkasan', () => {
    expect(hitungRingkasan(daftar)).toEqual({ total: 3, aktif: 2, nonaktif: 1 });
    expect(hitungRingkasan([])).toEqual({ total: 0, aktif: 0, nonaktif: 0 });
  });

  test('saring', () => {
    expect(saring(daftar, 'semua')).toHaveLength(3);
    expect(saring(daftar, 'aktif').map((b) => b.id)).toEqual(['1', '3']);
    expect(saring(daftar, 'nonaktif').map((b) => b.id)).toEqual(['2']);
  });
});
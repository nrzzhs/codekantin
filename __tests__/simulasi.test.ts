import { jalankan } from '../logic/simulasi';

describe('Simulasi Stack (contoh bagian F1 modul)', () => {
  test('urutan keluar 2, 4, 3 dan isi akhir [5]', () => {
    const h = jalankan('stack', [
      'push(5)', 'push(3)', 'push(2)', 'pop()', 'push(4)', 'pop()', 'pop()',
    ]);
    expect(h.keluar).toEqual(['2', '4', '3']);
    expect(h.isiAkhir).toEqual(['5']);
    expect(h.top).toBe('5');
  });
});

describe('Kunci jawaban modul (bagian K)', () => {
  test('soal sedang Stack: keluar 3, 8, isi [5], TOP 5', () => {
    const h = jalankan('stack', ['push(5)', 'push(3)', 'pop()', 'push(8)', 'pop()']);
    expect(h.keluar).toEqual(['3', '8']);
    expect(h.isiAkhir).toEqual(['5']);
    expect(h.top).toBe('5');
  });

  test('soal sedang Queue: keluar 4, 9, isi [6, 1], FRONT 6, REAR 1', () => {
    const h = jalankan('queue', [
      'enqueue(4)', 'enqueue(9)', 'dequeue()', 'enqueue(6)', 'dequeue()', 'enqueue(1)',
    ]);
    expect(h.keluar).toEqual(['4', '9']);
    expect(h.isiAkhir).toEqual(['6', '1']);
    expect(h.front).toBe('6');
    expect(h.rear).toBe('1');
  });

  test('soal menantang Stack: keluar B, A, D, isi [C], TOP C', () => {
    const h = jalankan('stack', [
      'push(A)', 'push(B)', 'pop()', 'pop()', 'push(C)', 'push(D)', 'pop()',
    ]);
    expect(h.keluar).toEqual(['B', 'A', 'D']);
    expect(h.isiAkhir).toEqual(['C']);
    expect(h.top).toBe('C');
  });

  test('soal menantang Queue: keluar A, B, C, isi [D, E], FRONT D, REAR E', () => {
    const h = jalankan('queue', [
      'enqueue(A)', 'enqueue(B)', 'enqueue(C)', 'dequeue()',
      'enqueue(D)', 'dequeue()', 'dequeue()', 'enqueue(E)',
    ]);
    expect(h.keluar).toEqual(['A', 'B', 'C']);
    expect(h.isiAkhir).toEqual(['D', 'E']);
    expect(h.front).toBe('D');
    expect(h.rear).toBe('E');
  });

  test('antrean cetak: urutan pencetakan sama dengan urutan kirim', () => {
    const h = jalankan('queue', [
      'enqueue(Laporan)', 'enqueue(Tugas)', 'enqueue(Poster)', 'enqueue(Jadwal)',
      'dequeue()', 'dequeue()', 'dequeue()', 'dequeue()',
    ]);
    expect(h.keluar).toEqual(['Laporan', 'Tugas', 'Poster', 'Jadwal']);
  });
});

describe('Kasus tepi', () => {
  test('pop pada Stack kosong menghasilkan underflow dan isi tidak berubah', () => {
    const h = jalankan('stack', ['pop()']);
    expect(h.langkah[0].galat).toBe('underflow');
    expect(h.keluar).toEqual([]);
    expect(h.isiAkhir).toEqual([]);
  });

  test('peek tidak mengubah isi', () => {
    const h = jalankan('stack', ['push(A)', 'push(B)', 'peek()']);
    expect(h.isiAkhir).toEqual(['A', 'B']);
    expect(h.langkah[2].keluar).toBeNull();
  });

  test('overflow dicatat pada langkah yang bersangkutan', () => {
    const h = jalankan('queue', ['enqueue(A)', 'enqueue(B)', 'enqueue(C)'], 2);
    expect(h.langkah[2].galat).toBe('overflow');
    expect(h.isiAkhir).toEqual(['A', 'B']);
  });

  test('perintah yang salah untuk strukturnya ditolak', () => {
    expect(() => jalankan('stack', ['enqueue(A)'])).toThrow();
    expect(() => jalankan('queue', ['push(A)'])).toThrow();
  });

  test('perintah tidak valid ditolak', () => {
    expect(() => jalankan('stack', ['asal-asalan'])).toThrow();
  });
});
import { Stack } from '../logic/Stack';

describe('Stack (LIFO)', () => {
  test('pop mengambil elemen terbaru', () => {
    const s = new Stack<number>();
    s.push(1);
    s.push(2);
    s.push(3);
    expect(s.pop()).toBe(3);
    expect(s.toArray()).toEqual([1, 2]);
  });

  test('peek melihat TOP tanpa menghapus', () => {
    const s = new Stack<string>();
    s.push('A');
    s.push('B');
    expect(s.peek()).toBe('B');
    expect(s.toArray()).toEqual(['A', 'B']);
  });

  test('pop pada Stack kosong (underflow) mengembalikan undefined dan tidak mengubah isi', () => {
    const s = new Stack<number>();
    expect(s.pop()).toBeUndefined();
    expect(s.isEmpty()).toBe(true);
  });

  test('push saat penuh (overflow) ditolak', () => {
    const s = new Stack<number>(2);
    expect(s.push(1)).toBe(true);
    expect(s.push(2)).toBe(true);
    expect(s.push(3)).toBe(false);
    expect(s.toArray()).toEqual([1, 2]);
    expect(s.isFull()).toBe(true);
  });

  test('toArray mengembalikan salinan', () => {
    const s = new Stack<number>();
    s.push(1);
    s.toArray().push(99);
    expect(s.toArray()).toEqual([1]);
  });
});
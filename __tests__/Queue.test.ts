import { Queue } from '../logic/Queue';

describe('Queue (FIFO)', () => {
  test('dequeue mengambil elemen paling lama', () => {
    const q = new Queue<string>();
    q.enqueue('A');
    q.enqueue('B');
    q.enqueue('C');
    expect(q.dequeue()).toBe('A');
    expect(q.toArray()).toEqual(['B', 'C']);
  });

  test('peek = FRONT dan rear = REAR', () => {
    const q = new Queue<string>();
    q.enqueue('A');
    q.enqueue('B');
    q.enqueue('C');
    expect(q.peek()).toBe('A');
    expect(q.rear()).toBe('C');
    expect(q.toArray()).toEqual(['A', 'B', 'C']);
  });

  test('dequeue pada Queue kosong (underflow) mengembalikan undefined', () => {
    const q = new Queue<number>();
    expect(q.dequeue()).toBeUndefined();
    expect(q.peek()).toBeUndefined();
    expect(q.rear()).toBeUndefined();
  });

  test('enqueue saat penuh (overflow) ditolak', () => {
    const q = new Queue<number>(2);
    expect(q.enqueue(1)).toBe(true);
    expect(q.enqueue(2)).toBe(true);
    expect(q.enqueue(3)).toBe(false);
    expect(q.toArray()).toEqual([1, 2]);
  });

  test('operasi berselang-seling tetap benar', () => {
    const q = new Queue<string>();
    q.enqueue('A');
    q.enqueue('B');
    expect(q.dequeue()).toBe('A');
    q.enqueue('C');
    expect(q.dequeue()).toBe('B');
    expect(q.toArray()).toEqual(['C']);
  });

  test('tetap benar setelah banyak dequeue (penunjuk head dirapikan)', () => {
    const q = new Queue<number>();
    for (let i = 0; i < 1000; i++) q.enqueue(i);
    for (let i = 0; i < 900; i++) expect(q.dequeue()).toBe(i);
    expect(q.size()).toBe(100);
    expect(q.peek()).toBe(900);
    expect(q.rear()).toBe(999);
    expect(q.toArray()[0]).toBe(900);
  });

  test('dequeue 100.000 elemen selesai cepat (bukan O(n) per operasi)', () => {
    const q = new Queue<number>();
    const n = 100000;
    for (let i = 0; i < n; i++) q.enqueue(i);
    const mulai = Date.now();
    for (let i = 0; i < n; i++) q.dequeue();
    expect(Date.now() - mulai).toBeLessThan(1000);
    expect(q.isEmpty()).toBe(true);
  });
});
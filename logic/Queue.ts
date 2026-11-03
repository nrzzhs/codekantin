export class Queue<T> {
  private items: (T | undefined)[] = [];
  private head = 0; // penunjuk FRONT
  private readonly kapasitas: number;

  constructor(kapasitas: number = Infinity) {
    this.kapasitas = kapasitas;
  }

  // Mengembalikan false (overflow) kalau sudah penuh
  enqueue(item: T): boolean {
    if (this.isFull()) return false;
    this.items.push(item);
    return true;
  }

  // O(1): cukup menggeser head. Mengembalikan undefined (underflow) kalau kosong
  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const nilai = this.items[this.head];
    this.items[this.head] = undefined; // lepaskan referensi
    this.head++;
    this.rapikan();
    return nilai;
  }

  // Melihat FRONT tanpa menghapus
  peek(): T | undefined {
    return this.isEmpty() ? undefined : this.items[this.head];
  }

  // Melihat REAR
  rear(): T | undefined {
    return this.isEmpty() ? undefined : this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  isFull(): boolean {
    return this.size() >= this.kapasitas;
  }

  size(): number {
    return this.items.length - this.head;
  }

  // Isi dari FRONT ke REAR
  toArray(): T[] {
    return this.items.slice(this.head) as T[];
  }

  clear(): void {
    this.items = [];
    this.head = 0;
  }

  // Buang ruang kosong di depan supaya memori tidak membengkak
  private rapikan(): void {
    if (this.head > 32 && this.head * 2 >= this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
  }
}
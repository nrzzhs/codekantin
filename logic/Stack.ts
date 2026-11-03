export class Stack<T> {
  private items: T[] = [];
  private readonly kapasitas: number;

  constructor(kapasitas: number = Infinity) {
    this.kapasitas = kapasitas;
  }

  // Mengembalikan false (overflow) kalau sudah penuh
  push(item: T): boolean {
    if (this.isFull()) return false;
    this.items.push(item);
    return true;
  }

  // Mengembalikan undefined (underflow) kalau kosong
  pop(): T | undefined {
    return this.items.pop();
  }

  // Melihat TOP tanpa menghapus
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  isFull(): boolean {
    return this.items.length >= this.kapasitas;
  }

  size(): number {
    return this.items.length;
  }

  // Isi dari dasar ke TOP (salinan, aman dari perubahan luar)
  toArray(): T[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }
}
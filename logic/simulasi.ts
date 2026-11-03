import { Stack } from './Stack';
import { Queue } from './Queue';

export type JenisStruktur = 'stack' | 'queue';

export type Langkah = {
  perintah: string;
  isi: string[];           // stack: dasar → TOP, queue: FRONT → REAR
  keluar: string | null;   // elemen yang keluar (pop/dequeue)
  galat: 'underflow' | 'overflow' | null;
};

export type HasilSimulasi = {
  langkah: Langkah[];
  keluar: string[];        // urutan elemen yang keluar
  isiAkhir: string[];
  top: string | null;      // khusus stack
  front: string | null;    // khusus queue
  rear: string | null;     // khusus queue
};

const POLA = /^\s*([a-zA-Z]+)\s*\(\s*([^)]*?)\s*\)\s*$/;

export function jalankan(
  jenis: JenisStruktur,
  daftarPerintah: string[],
  kapasitas: number = Infinity,
): HasilSimulasi {
  const stack = new Stack<string>(kapasitas);
  const queue = new Queue<string>(kapasitas);
  const langkah: Langkah[] = [];
  const keluar: string[] = [];

  const isiSaatIni = () => (jenis === 'stack' ? stack.toArray() : queue.toArray());

  for (const perintah of daftarPerintah) {
    const cocok = POLA.exec(perintah);
    if (!cocok) throw new Error(`Perintah tidak valid: "${perintah}"`);

    const op = cocok[1].toLowerCase();
    const nilai = cocok[2];
    let hasilKeluar: string | null = null;
    let galat: Langkah['galat'] = null;

    if (jenis === 'stack') {
      if (op === 'push') {
        if (!stack.push(nilai)) galat = 'overflow';
      } else if (op === 'pop') {
        const v = stack.pop();
        if (v === undefined) galat = 'underflow';
        else hasilKeluar = v;
      } else if (op === 'peek') {
        // hanya melihat, tidak mengubah isi
      } else {
        throw new Error(`Operasi "${op}" tidak dikenal untuk Stack`);
      }
    } else {
      if (op === 'enqueue') {
        if (!queue.enqueue(nilai)) galat = 'overflow';
      } else if (op === 'dequeue') {
        const v = queue.dequeue();
        if (v === undefined) galat = 'underflow';
        else hasilKeluar = v;
      } else if (op === 'front' || op === 'peek') {
        // hanya melihat, tidak mengubah isi
      } else {
        throw new Error(`Operasi "${op}" tidak dikenal untuk Queue`);
      }
    }

    if (hasilKeluar !== null) keluar.push(hasilKeluar);
    langkah.push({ perintah, isi: isiSaatIni(), keluar: hasilKeluar, galat });
  }

  return {
    langkah,
    keluar,
    isiAkhir: isiSaatIni(),
    top: jenis === 'stack' ? stack.peek() ?? null : null,
    front: jenis === 'queue' ? queue.peek() ?? null : null,
    rear: jenis === 'queue' ? queue.rear() ?? null : null,
  };
}
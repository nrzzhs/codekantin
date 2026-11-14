import type { JenisStruktur } from './simulasi';

export type OperasiSim = 'tambah' | 'ambil';
export type GalatSim = 'underflow' | 'overflow' | null;

type Definisi = {
  baris: string[];
  jejak: { sukses: number[]; galat: number[] }; // indeks baris yang dieksekusi
};

const DEFINISI: Record<JenisStruktur, Record<OperasiSim, Definisi>> = {
  queue: {
    tambah: {
      baris: [
        'prosedur enqueue(x)',
        '  jika antrean penuh maka',
        '    tampilkan "overflow"; selesai',
        '  tambahkan x di REAR',
        '  size ← size + 1',
      ],
      jejak: { sukses: [0, 1, 3, 4], galat: [0, 1, 2] },
    },
    ambil: {
      baris: [
        'prosedur dequeue()',
        '  jika antrean kosong maka',
        '    tampilkan "underflow"; selesai',
        '  nilai ← elemen di FRONT',
        '  geser FRONT ke elemen berikutnya',
        '  kembalikan nilai',
      ],
      jejak: { sukses: [0, 1, 3, 4, 5], galat: [0, 1, 2] },
    },
  },
  stack: {
    tambah: {
      baris: [
        'prosedur push(x)',
        '  jika tumpukan penuh maka',
        '    tampilkan "overflow"; selesai',
        '  naikkan TOP',
        '  simpan x di TOP',
      ],
      jejak: { sukses: [0, 1, 3, 4], galat: [0, 1, 2] },
    },
    ambil: {
      baris: [
        'prosedur pop()',
        '  jika tumpukan kosong maka',
        '    tampilkan "underflow"; selesai',
        '  nilai ← elemen di TOP',
        '  turunkan TOP',
        '  kembalikan nilai',
      ],
      jejak: { sukses: [0, 1, 3, 4, 5], galat: [0, 1, 2] },
    },
  },
};

export function barisPseudocode(jenis: JenisStruktur, op: OperasiSim): string[] {
  return [...DEFINISI[jenis][op].baris];
}

// Baris yang dieksekusi, berurutan. Kalau terjadi overflow/underflow, berhenti di baris pesan.
export function jejakBaris(
  jenis: JenisStruktur,
  op: OperasiSim,
  galat: GalatSim | undefined,
): number[] {
  const d = DEFINISI[jenis][op].jejak;
  return [...(galat ? d.galat : d.sukses)];
}
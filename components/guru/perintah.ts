import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

type NamaIkon = ComponentProps<typeof Ionicons>['name'];
export type Struktur = 'stack' | 'queue';

const POLA = /^\s*([a-zA-Z]+)\s*\(\s*([^)]*?)\s*\)\s*$/;
const SINGKAT: Record<string, string> = { enqueue: 'enq', dequeue: 'deq' };

export type InfoPerintah = {
  jenis: 'masuk' | 'keluar' | 'lihat' | 'lain';
  /** "push 1", "pop", "enqueue A", "dequeue" */
  label: string;
  /** Untuk ubin sempit: "enq A", "deq" */
  labelPendek: string;
  ikon: NamaIkon;
};

/** Mengurai satu baris perintah untuk ditampilkan (tidak memvalidasi). */
export function uraikanPerintah(op: string): InfoPerintah {
  const cocok = POLA.exec(op);
  if (!cocok) return { jenis: 'lain', label: op.trim(), labelPendek: op.trim(), ikon: 'help-outline' };
  const nama = cocok[1].toLowerCase();
  const nilai = cocok[2];
  const ekor = nilai ? ` ${nilai}` : '';
  const pendek = `${SINGKAT[nama] ?? nama}${ekor}`;
  if (nama === 'push' || nama === 'enqueue') {
    return { jenis: 'masuk', label: `${nama}${ekor}`, labelPendek: pendek, ikon: 'arrow-up' };
  }
  if (nama === 'pop' || nama === 'dequeue') {
    return { jenis: 'keluar', label: `${nama}${ekor}`, labelPendek: pendek, ikon: 'arrow-down' };
  }
  if (nama === 'peek' || nama === 'front') {
    return { jenis: 'lihat', label: `${nama}${ekor}`, labelPendek: pendek, ikon: 'eye-outline' };
  }
  return { jenis: 'lain', label: `${nama}${ekor}`, labelPendek: pendek, ikon: 'help-outline' };
}

/** Warna chip/ubin perintah: masuk mengikuti struktur, keluar merah, lainnya netral. */
export function warnaPerintah(jenis: InfoPerintah['jenis'], struktur: Struktur) {
  if (jenis === 'masuk') {
    return struktur === 'stack'
      ? { latar: '#FFF7ED', garis: '#FED7AA', teks: '#9A3412' }
      : { latar: '#F0F9FF', garis: '#BAE6FD', teks: '#0369A1' };
  }
  if (jenis === 'keluar') return { latar: '#FEF2F2', garis: '#FCA5A5', teks: '#B91C1C' };
  return { latar: '#FAF1EC', garis: '#F1E7DC', teks: '#6B625B' };
}

/** Warna tingkat: mudah hijau, sedang oranye, menantang merah. */
export const WARNA_TINGKAT: Record<string, { latar: string; teks: string; kuat: string }> = {
  mudah: { latar: '#CCFBF1', teks: '#166534', kuat: '#15803D' },
  sedang: { latar: '#FFEDD5', teks: '#9A3412', kuat: '#C2410C' },
  menantang: { latar: '#FEE2E2', teks: '#B91C1C', kuat: '#B91C1C' },
};

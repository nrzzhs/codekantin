import { Keyframe } from 'react-native-reanimated';
import type { JenisMakanan } from '../ilustrasi/Makanan';

/**
 * Item tersimpan berbentuk "🍔 Burger (A)". Untuk tampilan, ambil jenis makanannya
 * (untuk gambar SVG) dan labelnya tanpa emoji ("Burger (A)").
 */
export function uraikanBahan(item: string): { jenis: JenisMakanan | null; label: string } {
  const cocok = /(Burger|Pizza|Donat)\s*\((\w+)\)/i.exec(item);
  if (!cocok) return { jenis: null, label: item };
  return {
    jenis: cocok[1].toLowerCase() as JenisMakanan,
    label: `${cocok[1]} (${cocok[2]})`,
  };
}

/** Muncul dengan "pop": skala 0,3 → 1,12 → 1. */
export const MUNCUL_POP = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.3 }] },
  60: { opacity: 1, transform: [{ scale: 1.12 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(320);

/** Keluar: terangkat ke arah baris "Urutan keluar" sambil mengecil dan memudar. */
export const KELUAR_TERBANG = new Keyframe({
  0: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
  100: { opacity: 0, transform: [{ translateY: -36 }, { scale: 0.6 }] },
}).duration(380);

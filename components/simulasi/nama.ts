/** Memisahkan nama elemen simulasi dari nomornya: "Budi #2" → { nama: "Budi", nomor: 2 }. */
export function pisahNama(elemen: string): { nama: string; nomor: number | null } {
  const cocok = /^(.*?)\s*#(\d+)$/.exec(elemen);
  if (!cocok) return { nama: elemen, nomor: null };
  return { nama: cocok[1], nomor: Number(cocok[2]) };
}

export type JenisSimulasi = 'antrean' | 'tumpukan';

/** Warna modul: biru = Queue, oranye = Stack. */
export const WARNA_SIMULASI: Record<JenisSimulasi, { aksen: string; muda: string; teks: string }> = {
  antrean: { aksen: '#0369A1', muda: '#E0F2FE', teks: '#0369A1' },
  tumpukan: { aksen: '#C2410C', muda: '#FFEDD5', teks: '#9A3412' },
};

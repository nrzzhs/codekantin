// Ambang sama dengan LENCANA di data/beranda.ts (tidak diekspor, jadi disalin di sini).
// hitungLencana() di data/ hanya memberi teks & progres; nama, level, dan ambang dihitung di sini.
// Dipakai bersama oleh Beranda dan Profil.
export const TAHAP_LENCANA = [
  { xp: 0, nama: 'Koki Magang' },
  { xp: 100, nama: 'Koki Muda' },
  { xp: 300, nama: 'Koki Handal' },
  { xp: 600, nama: 'Master Koki LIFO/FIFO' },
];

export function infoLencana(xp: number) {
  let indeks = 0;
  TAHAP_LENCANA.forEach((t, i) => {
    if (xp >= t.xp) indeks = i;
  });
  const berikutnya = TAHAP_LENCANA[indeks + 1] ?? null;
  return {
    nama: TAHAP_LENCANA[indeks].nama,
    level: indeks + 1,
    berikutnya,
    sisa: berikutnya ? berikutnya.xp - xp : 0,
  };
}

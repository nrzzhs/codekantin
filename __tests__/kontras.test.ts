import { rasioKontras, BATAS_TEKS_NORMAL } from '../logic/kontras';
import { warna } from '../lib/tema';

const PUTIH = '#FFFFFF';

// [nama pasangan, warna teks, warna latar]
const PASANGAN: [string, string, string][] = [
  ['teks utama di latar', warna.teks, warna.latar],
  ['teks utama di kartu', warna.teks, warna.kartu],
  ['teks redup di latar', warna.teksRedup, warna.latar],
  ['teks redup di kartu', warna.teksRedup, warna.kartu],
  ['teks redup di kotak kode', warna.teksRedup, warna.kotakKode],
  ['teks redup di biru muda', warna.teksRedup, warna.biruMuda],
  ['teks redup di oranye muda', warna.teksRedup, warna.oranyeMuda],
  ['putih di tombol biru', PUTIH, warna.biru],
  ['putih di tombol atau tag oranye', PUTIH, warna.oranye],
  ['putih di tombol hijau', PUTIH, warna.hijau],
  ['putih di tombol merah', PUTIH, '#DC2626'],
  ['putih di tag DASAR', PUTIH, '#78716C'],
  ['teks pil poin di latar persik', warna.persikTeks, warna.persik],
  ['teks persik di latar', warna.persikTeks, warna.latar],
  ['teks persik di kotak kode', warna.persikTeks, warna.kotakKode],
  ['teks hijau di pesan sukses', warna.hijauTeks, '#ECFDF5'],
  ['teks merah di pesan galat', '#B91C1C', '#FEE2E2'],
  ['biru sebagai teks di biru muda', warna.biru, warna.biruMuda],
  ['teks slot kosong di putih', '#64748B', PUTIH],
  ['teks pseudocode redup di panel gelap', '#94A3B8', warna.gelap],
  ['teks pseudocode menyala di panel gelap', '#E2E8F0', warna.gelap],
  // Tampilan tahap 1–2
  ['tagline & huruf avatar di header persik', warna.persikTeks, warna.persik],
  ['teks redup di pilihan Masuk/Daftar & keadaan kosong', warna.teksRedup, warna.kotakKode],
  ['tab aktif & pil Koki Magang di hijau muda', warna.hijauTua, warna.hijauMuda],
  ['teks tombol nonaktif', warna.teksRedup, warna.garis],
  ['putih di tombol utama hijau', PUTIH, warna.hijau],
  ['teks syarat terpenuhi di kartu putih', warna.hijauTeks, PUTIH],
  // Tampilan tahap 3 (Beranda)
  ['chip ungu Tebak', warna.ungu, warna.unguMuda],
  ['putih di tombol Tebak', PUTIH, warna.ungu],
  ['chip biru Queue', warna.biru, warna.biruMuda],
  ['chip Stack & pil poin', warna.persikTeks, warna.oranyeMuda],
  ['angka XP di kartu maskot', '#CBD5E1', warna.gelap],
  ['petunjuk "Ketuk Koki Piri"', '#94A3B8', warna.gelap],
  ['teks pil Lv di toska', warna.gelap, '#5EEAD4'],
  ['putih di tombol Stack', PUTIH, warna.oranye],
  ['putih di tombol Queue', PUTIH, warna.biru],
];

describe('Kontras warna (WCAG AA, teks normal minimal 4,5:1)', () => {
  test('rumus benar: hitam di putih 21:1, warna sama 1:1', () => {
    expect(rasioKontras('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(rasioKontras('#336699', '#336699')).toBeCloseTo(1, 5);
  });

  test.each(PASANGAN)('%s', (_nama, teks, latar) => {
    expect(rasioKontras(teks, latar)).toBeGreaterThanOrEqual(BATAS_TEKS_NORMAL);
  });
});
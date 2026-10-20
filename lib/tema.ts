import { Platform } from 'react-native';

export const warna = {
  latar: '#FFF8F0',
  kartu: '#FFFFFF',
  garis: '#F1E7DC',
  teks: '#1F1A17',
  teksRedup: '#6B625B',
  gelap: '#0F172A',
  biru: '#0284C7',
  biruMuda: '#E0F2FE',
  oranye: '#F97316',
  oranyeMuda: '#FFEDD5',
  hijau: '#16A34A',
  hijauTeks: '#15803D',
  hijauMuda: '#CCFBF1',
  persik: '#FDE4D6',
  persikTeks: '#B45309',
  kotakKode: '#FAF1EC',
};

export const fontKode = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});
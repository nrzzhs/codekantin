import type { TextStyle, ViewStyle } from 'react-native';

export const warna = {
  latar: '#FFF8F0',
  kartu: '#FFFFFF',
  garis: '#F1E7DC',
  teks: '#1F1A17',
  teksRedup: '#6B625B',
  gelap: '#0F172A',
  biru: '#0369A1',
  biruMuda: '#E0F2FE',
  oranye: '#C2410C',
  oranyeMuda: '#FFEDD5',
  hijau: '#15803D',
  hijauTeks: '#15803D',
  hijauMuda: '#CCFBF1',
  persik: '#FDE4D6',
  persikTeks: '#9A3412',
  kotakKode: '#FAF1EC',
  // Teks hijau di atas hijauMuda: #15803D di #CCFBF1 hanya 4,45:1, jadi pakai yang lebih tua
  hijauTua: '#166534',
};

// Nama keluarga font = nama kunci yang dimuat useFonts di App.tsx.
// Jangan gabungkan dengan fontWeight: di Android itu bisa membuat font kembali ke bawaan.
export const font = {
  judul: 'PlusJakartaSans_800ExtraBold',
  tebal: 'PlusJakartaSans_700Bold',
  semi: 'PlusJakartaSans_600SemiBold',
  isi: 'PlusJakartaSans_500Medium',
  kode: 'JetBrainsMono_500Medium',
  kodeTebal: 'JetBrainsMono_700Bold',
};

export const fontKode = font.kode;

export const ukuranTeks = {
  judulLayar: 28,
  judulKartu: 20,
  isi: 16,
  kecil: 14,
  label: 12,
};

export const jarak = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  kartu: 20,
  tombol: 16,
  input: 16,
  pil: 999,
};

export const bayanganKartu: ViewStyle = {
  shadowColor: '#1F1A17',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};

/** Gaya label kecil berhuruf kapital, mis. "PRATINJAU BERANDA". */
export const gayaLabel: TextStyle = {
  fontFamily: font.tebal,
  fontSize: ukuranTeks.label,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  color: warna.teksRedup,
};

import type { ComponentProps } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { warna, font } from '../lib/tema';
import Kartu from './ui/Kartu';
import TekanSkala from './ui/TekanSkala';
import Tombol from './ui/Tombol';

type Props = {
  tag: string;
  tagBg: string;
  tagTeks: string;
  judul: string;
  deskripsi: string;
  previewKiri: string;
  previewKanan: string;
  tombol: string;
  /** Dipakai kalau `varianTombol` tidak diisi. */
  warnaTombol: string;
  onPress: () => void;
  // --- opsional (tampilan tahap 3) ---
  ikon?: ComponentProps<typeof Ionicons>['name'];
  ikonBg?: string;
  ikonWarna?: string;
  varianTombol?: 'antrean' | 'tumpukan' | 'tebak' | 'utama';
  jenisPreview?: 'antrean' | 'tumpukan';
  /** Jumlah isi untuk visual slot di kotak preview (0–5). */
  isiPreview?: number;
  /** Warna teks previewKanan. Bawaan hijau. */
  warnaPreviewKanan?: string;
};

const SLOT_ANTREAN = 5;
const SLOT_TUMPUKAN = 3;
const WARNA_KOSONG = '#C9BBAE';

/** Visual kecil isi simulator: kotak berjejer (antrean) atau piring bertumpuk (tumpukan). */
function VisualSlot({ jenis, isi }: { jenis: 'antrean' | 'tumpukan'; isi: number }) {
  const n = Math.max(0, Math.round(isi));
  if (jenis === 'antrean') {
    const terisi = Math.min(n, SLOT_ANTREAN);
    return (
      <View style={styles.slotAntrean}>
        {Array.from({ length: SLOT_ANTREAN }, (_, i) => (
          <View key={i} style={[styles.kotakSlot, i < terisi ? styles.kotakIsi : styles.kotakKosong]} />
        ))}
      </View>
    );
  }
  const terisi = Math.min(n, SLOT_TUMPUKAN);
  return (
    <View style={styles.slotTumpukan}>
      {Array.from({ length: SLOT_TUMPUKAN }, (_, i) => (
        <View key={i} style={[styles.piring, i < terisi ? styles.piringIsi : styles.piringKosong]} />
      ))}
    </View>
  );
}

export default function KartuModul(p: Props) {
  // "→" di data diganti ikon panah; data aslinya tidak diubah
  const labelTombol = p.tombol.replace(/\s*→\s*$/, '');

  return (
    // Seluruh kartu bisa diketuk; untuk pembaca layar, tombol di dalamnya yang menjadi target
    <TekanSkala onPress={p.onPress} accessible={false}>
      <Kartu style={styles.kartu}>
        <View style={styles.barisAtas}>
          {p.ikon && (
            <View style={[styles.kotakIkon, { backgroundColor: p.ikonBg ?? p.tagBg }]}>
              <Ionicons name={p.ikon} size={26} color={p.ikonWarna ?? p.tagTeks} />
            </View>
          )}
          <View style={styles.kolomJudul}>
            <View style={[styles.tag, { backgroundColor: p.tagBg }]}>
              <Text style={[styles.tagTeks, { color: p.tagTeks }]}>{p.tag}</Text>
            </View>
            <Text style={styles.judul} accessibilityRole="header">
              {p.judul}
            </Text>
          </View>
        </View>

        <Text style={styles.deskripsi}>{p.deskripsi}</Text>

        <View style={styles.preview} accessible accessibilityLabel={`${p.previewKiri}. ${p.previewKanan}`}>
          {p.jenisPreview && <VisualSlot jenis={p.jenisPreview} isi={p.isiPreview ?? 0} />}
          <Text style={styles.previewKiri} numberOfLines={1}>
            {p.previewKiri}
          </Text>
          <Text style={[styles.previewKanan, { color: p.warnaPreviewKanan ?? warna.hijauTeks }]}>
            {p.previewKanan}
          </Text>
        </View>

        <Tombol
          label={labelTombol}
          onPress={p.onPress}
          ikon="arrow-forward"
          posisiIkon="kanan"
          {...(p.varianTombol ? { varian: p.varianTombol } : { warnaLatar: p.warnaTombol })}
        />
      </Kartu>
    </TekanSkala>
  );
}

const styles = StyleSheet.create({
  kartu: { padding: 16, gap: 12 },

  barisAtas: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kotakIkon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kolomJudul: { flex: 1, alignItems: 'flex-start', gap: 4 },
  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  tagTeks: { fontFamily: font.judul, fontSize: 11 },
  judul: { fontFamily: font.judul, fontSize: 18, color: warna.teks },

  deskripsi: { fontFamily: font.isi, fontSize: 14, lineHeight: 21, color: warna.teksRedup },

  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: warna.kotakKode,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  previewKiri: { flex: 1, fontFamily: font.kode, fontSize: 12, color: warna.teksRedup },
  previewKanan: { fontFamily: font.judul, fontSize: 13 },

  slotAntrean: { flexDirection: 'row', gap: 4 },
  kotakSlot: { width: 18, height: 18, borderRadius: 6 },
  kotakIsi: { backgroundColor: warna.biru },
  kotakKosong: { borderWidth: 2, borderStyle: 'dashed', borderColor: WARNA_KOSONG },

  // column-reverse: piring pertama di bawah, tumpukan tumbuh ke atas
  slotTumpukan: { flexDirection: 'column-reverse', gap: 3, justifyContent: 'center' },
  piring: { width: 34, height: 6, borderRadius: 999 },
  piringIsi: { backgroundColor: warna.oranye },
  piringKosong: { borderWidth: 1, borderStyle: 'dashed', borderColor: WARNA_KOSONG },
});

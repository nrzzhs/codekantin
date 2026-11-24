import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { warna, fontKode } from '../lib/tema';

type Props = {
  tag: string;
  tagBg: string;
  tagTeks: string;
  judul: string;
  deskripsi: string;
  previewKiri: string;
  previewKanan: string;
  tombol: string;
  warnaTombol: string;
  onPress: () => void;
};

export default function KartuModul(p: Props) {
  return (
    <View style={styles.kartu}>
      <View style={[styles.tag, { backgroundColor: p.tagBg }]}>
        <Text style={[styles.tagTeks, { color: p.tagTeks }]}>{p.tag}</Text>
      </View>

      <Text style={styles.judul}>{p.judul}</Text>
      <Text style={styles.deskripsi}>{p.deskripsi}</Text>

      <View style={styles.preview}>
        <Text style={styles.previewKiri} numberOfLines={1}>{p.previewKiri}</Text>
        <Text style={styles.previewKanan}>{p.previewKanan}</Text>
      </View>

      <TouchableOpacity
        style={[styles.tombol, { backgroundColor: p.warnaTombol }]}
        onPress={p.onPress}
        activeOpacity={0.85}
      >
        <Text style={styles.tombolTeks}>{p.tombol}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: {
    backgroundColor: warna.kartu,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: warna.garis,
    padding: 18,
    marginBottom: 14,
  },
  tag: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  tagTeks: { fontSize: 12, fontWeight: '700' },
  judul: { fontSize: 22, fontWeight: '800', color: warna.teks, marginTop: 14 },
  deskripsi: { color: warna.teksRedup, marginTop: 6, lineHeight: 20 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: warna.kotakKode,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  previewKiri: { flex: 1, fontFamily: fontKode, color: warna.teksRedup, fontSize: 13 },
  previewKanan: { color: warna.hijauTeks, fontWeight: '700', fontSize: 13, marginLeft: 8 },
  tombol: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 14 },
  tombolTeks: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
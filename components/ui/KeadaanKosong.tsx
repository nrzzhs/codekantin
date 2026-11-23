import { StyleSheet, Text, View } from 'react-native';
import PiringKosong from '../ilustrasi/PiringKosong';
import Tombol from './Tombol';
import { font, radius, warna } from '../../lib/tema';

type Props = {
  judul: string;
  deskripsi: string;
  aksi?: { label: string; onPress: () => void };
};

/** Pengganti daftar yang masih kosong: ilustrasi piring, judul, deskripsi, dan tombol opsional. */
export default function KeadaanKosong({ judul, deskripsi, aksi }: Props) {
  return (
    <View style={styles.wadah}>
      <PiringKosong lebar={120} tinggi={90} />
      <Text style={styles.judul} accessibilityRole="header">
        {judul}
      </Text>
      <Text style={styles.deskripsi}>{deskripsi}</Text>
      {aksi && <Tombol label={aksi.label} onPress={aksi.onPress} style={styles.aksi} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wadah: {
    backgroundColor: warna.kotakKode,
    borderRadius: radius.kartu,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  judul: { fontFamily: font.judul, fontSize: 18, color: warna.teks, textAlign: 'center', marginTop: 4 },
  deskripsi: { fontFamily: font.isi, fontSize: 14, color: warna.teksRedup, textAlign: 'center', lineHeight: 20 },
  aksi: { alignSelf: 'stretch', marginTop: 8 },
});

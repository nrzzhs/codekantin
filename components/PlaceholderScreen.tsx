import { View, Text, StyleSheet } from 'react-native';

type Props = { judul: string; subjudul: string; warna: string };

export default function PlaceholderScreen({ judul, subjudul, warna }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.kartu, { backgroundColor: warna }]}>
        <Text style={styles.judul}>{judul}</Text>
        <Text style={styles.subjudul}>{subjudul}</Text>
        <Text style={styles.catatan}>Segera hadir 🚧</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7', justifyContent: 'center', padding: 24 },
  kartu: { borderRadius: 20, padding: 24, alignItems: 'center' },
  judul: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subjudul: { fontSize: 16, color: '#444', marginBottom: 12 },
  catatan: { color: '#666' },
});
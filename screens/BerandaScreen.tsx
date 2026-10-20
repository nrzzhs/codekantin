import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

type Props = {
  nickname: string;
  points: number;
  xp: number;
  onLogout: () => void;
};

export default function BerandaScreen({ nickname, points, xp, onLogout }: Props) {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sapaan}>Halo, {nickname} 👋</Text>
        <Text style={styles.sub}>Siap belajar stack & queue hari ini?</Text>

        <View style={styles.statRow}>
          <Text style={styles.stat}>⭐ {points} poin</Text>
          <Text style={styles.stat}>⚡ {xp} XP</Text>
        </View>

        <Text style={styles.bagian}>Pilih modul</Text>

        <TouchableOpacity
          style={[styles.kartu, { backgroundColor: '#DBEAFE' }]}
          onPress={() => navigation.navigate('Antrean')}
        >
          <Text style={styles.kartuJudul}>Antrean Kasir</Text>
          <Text>Queue / FIFO: yang datang pertama, dilayani pertama</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kartu, { backgroundColor: '#FFEDD5' }]}
          onPress={() => navigation.navigate('Tumpukan')}
        >
          <Text style={styles.kartuJudul}>Tumpukan Piring</Text>
          <Text>Stack / LIFO: yang ditaruh terakhir, diambil pertama</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kartu, { backgroundColor: '#EDE9FE' }]}
          onPress={() => navigation.navigate('Tebak')}
        >
          <Text style={styles.kartuJudul}>Mode Tebak</Text>
          <Text>Prediksi hasil operasi, dapatkan XP</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.keluar} onPress={onLogout}>
          <Text style={styles.keluarText}>Keluar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8E7' },
  content: { padding: 20 },
  sapaan: { fontSize: 26, fontWeight: 'bold' },
  sub: { color: '#555', marginBottom: 16 },
  statRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  stat: { fontSize: 16, fontWeight: '600' },
  bagian: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  kartu: { borderRadius: 16, padding: 18, marginBottom: 12 },
  kartuJudul: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  keluar: { backgroundColor: '#DC2626', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 16 },
  keluarText: { color: '#fff', fontWeight: '600' },
});
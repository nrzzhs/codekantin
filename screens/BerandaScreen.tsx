import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

type Props = {
  nickname: string;
  fullName: string | null;
  school: string | null;
  avatarUrl: string | null;
  points: number;
  xp: number;
};

export default function BerandaScreen({ nickname, fullName, school, avatarUrl, points, xp }: Props) {
  const navigation = useNavigation<any>();

  const keterangan = [fullName, school].filter(Boolean).join(' · ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Profil')}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.foto} />
            ) : (
              <View style={[styles.foto, styles.fotoKosong]}>
                <Text style={styles.inisial}>{nickname.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.headerTeks}>
            <Text style={styles.sapaan} numberOfLines={1}>Halo, {nickname} 👋</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {keterangan || 'Siap belajar algoritma hari ini?'}
            </Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statAngka}>⭐ {points}</Text>
            <Text style={styles.statLabel}>Poin</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statAngka}>⚡ {xp}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8E7' },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  foto: { width: 56, height: 56, borderRadius: 28 },
  fotoKosong: { backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  inisial: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerTeks: { flex: 1, marginLeft: 14 },
  sapaan: { fontSize: 22, fontWeight: 'bold' },
  sub: { color: '#555', marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center' },
  statAngka: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#666' },
  bagian: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  kartu: { borderRadius: 16, padding: 18, marginBottom: 12 },
  kartuJudul: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
});
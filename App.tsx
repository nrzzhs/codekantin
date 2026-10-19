import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CodeKantin 🍽️</Text>
      <Text style={styles.subtitle}>Belajar Stack dan Queue lewat restoran</Text>

      <View style={[styles.card, { backgroundColor: '#DBEAFE' }]}>
        <Text style={styles.cardTitle}>Antrean Kasir</Text>
        <Text>Queue / FIFO</Text>
      </View>

      <View style={[styles.card, { backgroundColor: '#FFEDD5' }]}>
        <Text style={styles.cardTitle}>Tumpukan Piring</Text>
        <Text>Stack / LIFO</Text>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 32 },
  card: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
});
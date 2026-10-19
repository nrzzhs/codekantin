import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDaftar, setIsDaftar] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Oops', 'Email dan password wajib diisi.');
      return;
    }
    setLoading(true);

    if (isDaftar) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);

      if (error) {
        Alert.alert('Gagal daftar', error.message);
        return;
      }
      if (data.user && data.user.identities?.length === 0) {
        Alert.alert('Gagal', 'Email ini sudah terdaftar. Coba masuk.');
        return;
      }
      if (!data.session) {
        Alert.alert('Cek email kamu 📩', 'Klik link konfirmasi dulu, lalu masuk.');
        setIsDaftar(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) Alert.alert('Gagal masuk', error.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CodeKantin 🍽️</Text>
      <Text style={styles.subtitle}>{isDaftar ? 'Buat akun baru' : 'Masuk ke akunmu'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min. 6 karakter)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Memproses...' : isDaftar ? 'Daftar' : 'Masuk'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsDaftar(!isDaftar)}>
        <Text style={styles.link}>
          {isDaftar ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#2563EB', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { textAlign: 'center', color: '#2563EB', marginTop: 16 },
});
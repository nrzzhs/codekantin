import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

type Props = { onDone: () => void };

export default function ResetPasswordScreen({ onDone }: Props) {
  const [email, setEmail] = useState('');
  const [kode, setKode] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [kodeTerkirim, setKodeTerkirim] = useState(false);
  const [terverifikasi, setTerverifikasi] = useState(false);
  const [loading, setLoading] = useState(false);

  async function kirimKode() {
    if (!email.trim()) {
      Alert.alert('Oops', 'Email wajib diisi.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) {
      Alert.alert('Gagal', error.message);
      return;
    }
    setKodeTerkirim(true);
    Alert.alert('Cek emailmu', 'Kalau email terdaftar, kode sudah dikirim.');
  }

  async function simpanPasswordBaru() {
    if (!terverifikasi && !kode.trim()) {
      Alert.alert('Oops', 'Kode wajib diisi.');
      return;
    }
    if (passwordBaru.length < 6) {
      Alert.alert('Oops', 'Password baru minimal 6 karakter.');
      return;
    }
    setLoading(true);

    if (!terverifikasi) {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: kode.trim(),
        type: 'recovery',
      });
      if (error) {
        setLoading(false);
        Alert.alert('Kode salah atau kedaluwarsa', error.message);
        return;
      }
      setTerverifikasi(true);
    }

    const { error } = await supabase.auth.updateUser({ password: passwordBaru });
    setLoading(false);
    if (error) {
      Alert.alert('Gagal mengubah password', error.message);
      return;
    }
    Alert.alert('Berhasil', 'Password sudah diganti.');
    onDone();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lupa password 🔑</Text>
      <Text style={styles.subtitle}>
        {kodeTerkirim ? 'Masukkan kode dari email dan password baru.' : 'Masukkan email akunmu.'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!kodeTerkirim}
      />

      {!kodeTerkirim ? (
        <TouchableOpacity style={styles.button} onPress={kirimKode} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Mengirim...' : 'Kirim kode'}</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Kode dari email"
            keyboardType="number-pad"
            maxLength={10}
            value={kode}
            onChangeText={setKode}
          />
          <TextInput
            style={styles.input}
            placeholder="Password baru (min. 6 karakter)"
            secureTextEntry
            value={passwordBaru}
            onChangeText={setPasswordBaru}
          />
          <TouchableOpacity style={styles.button} onPress={simpanPasswordBaru} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Menyimpan...' : 'Simpan password baru'}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={onDone}>
        <Text style={styles.link}>Kembali</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#2563EB', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { textAlign: 'center', color: '#2563EB', marginTop: 16 },
});
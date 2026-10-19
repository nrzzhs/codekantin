import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

type Props = { userId: string; onSaved: () => void };

export default function NicknameScreen({ userId, onSaved }: Props) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  async function simpan() {
    const nama = nickname.trim();
    if (!nama) {
      Alert.alert('Oops', 'Nama panggilan wajib diisi.');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .insert({ id: userId, nickname: nama });
    setLoading(false);
    if (error) Alert.alert('Gagal', error.message);
    else onSaved();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Siapa namamu? 👨‍🍳</Text>
      <Text style={styles.subtitle}>Nama ini akan muncul di sapaan Beranda.</Text>
      <TextInput
        style={styles.input}
        placeholder="Nama panggilan"
        value={nickname}
        onChangeText={setNickname}
        maxLength={20}
      />
      <TouchableOpacity style={styles.button} onPress={simpan} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Menyimpan...' : 'Mulai'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#2563EB', borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
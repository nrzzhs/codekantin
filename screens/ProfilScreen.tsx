import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';

type Props = {
  userId: string;
  email: string;
  profile: Profile;
  onUpdated: () => Promise<void>;
  onLogout: () => void;
};

export default function ProfilScreen({ userId, email, profile, onUpdated, onLogout }: Props) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [school, setSchool] = useState(profile.school ?? '');
  const [grade, setGrade] = useState(profile.grade ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fotoError, setFotoError] = useState(false);

  async function pilihFoto() {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert('Izin dibutuhkan', 'Izinkan akses galeri untuk memilih foto profil.');
      return;
    }
    const hasil = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (hasil.canceled) return;

    const aset = hasil.assets[0];
    if (!aset.base64) {
      Alert.alert('Gagal', 'Foto tidak bisa dibaca. Coba pilih foto lain.');
      return;
    }
    await unggahFoto(aset.base64, aset.mimeType ?? 'image/jpeg');
  }

  async function unggahFoto(base64: string, contentType: string) {
    setUploading(true);
    try {
      const path = `${userId}/avatar.jpg`;

      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, decode(base64), { contentType, upsert: true });
      if (error) throw error;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      // ?t= supaya foto baru tidak tertahan cache foto lama
      const url = `${data.publicUrl}?t=${Date.now()}`;

      const { error: errUpdate } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', userId);
      if (errUpdate) throw errUpdate;

      setFotoError(false);
      await onUpdated();
    } catch (e: any) {
      Alert.alert('Gagal mengunggah foto', e.message ?? 'Coba lagi.');
    } finally {
      setUploading(false);
    }
  }

  async function simpan() {
    if (!nickname.trim()) {
      Alert.alert('Oops', 'Nama panggilan wajib diisi.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        nickname: nickname.trim(),
        full_name: fullName.trim() || null,
        school: school.trim() || null,
        grade: grade.trim() || null,
        bio: bio.trim() || null,
      })
      .eq('id', userId);
    setSaving(false);
    if (error) {
      Alert.alert('Gagal menyimpan', error.message);
      return;
    }
    await onUpdated();
    Alert.alert('Tersimpan', 'Profilmu sudah diperbarui.');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.judul}>Profil</Text>

        <View style={styles.fotoWrap}>
          <TouchableOpacity onPress={pilihFoto} disabled={uploading}>
            {profile.avatar_url && !fotoError ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.foto}
                onError={() => setFotoError(true)}
              />
            ) : (
              <View style={[styles.foto, styles.fotoKosong]}>
                <Text style={styles.inisial}>{profile.nickname.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {uploading && (
              <View style={styles.loadingFoto}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pilihFoto} disabled={uploading}>
            <Text style={styles.ubahFoto}>{uploading ? 'Mengunggah...' : 'Ubah foto'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statAngka}>⭐ {profile.total_points}</Text>
            <Text style={styles.statLabel}>Poin</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statAngka}>⚡ {profile.total_xp}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
        </View>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.emailText}>{email}</Text>

        <Text style={styles.label}>Nama panggilan *</Text>
        <TextInput style={styles.input} value={nickname} onChangeText={setNickname} maxLength={20} />

        <Text style={styles.label}>Nama lengkap</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} maxLength={60} />

        <Text style={styles.label}>Sekolah</Text>
        <TextInput style={styles.input} value={school} onChangeText={setSchool} maxLength={60} />

        <Text style={styles.label}>Kelas</Text>
        <TextInput
          style={styles.input}
          value={grade}
          onChangeText={setGrade}
          placeholder="Contoh: X, XI, atau XII"
          maxLength={20}
        />

        <Text style={styles.label}>Bio singkat</Text>
        <TextInput
          style={[styles.input, styles.inputBio]}
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={150}
          placeholder="Ceritakan sedikit tentang dirimu"
        />
        <Text style={styles.hitung}>{bio.length}/150</Text>

        <TouchableOpacity style={styles.tombolSimpan} onPress={simpan} disabled={saving}>
          <Text style={styles.tombolText}>{saving ? 'Menyimpan...' : 'Simpan perubahan'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tombolKeluar} onPress={onLogout}>
          <Text style={styles.tombolText}>Keluar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8E7' },
  content: { padding: 20, paddingBottom: 48 },
  judul: { fontSize: 26, fontWeight: 'bold', marginBottom: 16 },
  fotoWrap: { alignItems: 'center', marginBottom: 16 },
  foto: { width: 110, height: 110, borderRadius: 55 },
  fotoKosong: { backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  inisial: { color: '#fff', fontSize: 44, fontWeight: 'bold' },
  loadingFoto: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 55,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ubahFoto: { color: '#2563EB', marginTop: 8, fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center' },
  statAngka: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#666' },
  label: { fontWeight: '600', marginBottom: 6, marginTop: 8 },
  emailText: { color: '#555', marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputBio: { minHeight: 80, textAlignVertical: 'top' },
  hitung: { textAlign: 'right', color: '#888', marginTop: 4 },
  tombolSimpan: { backgroundColor: '#2563EB', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 },
  tombolKeluar: { backgroundColor: '#DC2626', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  tombolText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
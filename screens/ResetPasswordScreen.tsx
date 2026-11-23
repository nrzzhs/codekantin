import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { font, warna } from '../lib/tema';
import Kartu from '../components/ui/Kartu';
import KolomIsian from '../components/ui/KolomIsian';
import Tombol from '../components/ui/Tombol';
import Gembok from '../components/ilustrasi/Gembok';

type Props = { onDone: () => void };

export default function ResetPasswordScreen({ onDone }: Props) {
  const [email, setEmail] = useState('');
  const [kode, setKode] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [ulangPassword, setUlangPassword] = useState('');
  const [kodeTerkirim, setKodeTerkirim] = useState(false);
  const [terverifikasi, setTerverifikasi] = useState(false);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

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

  // Syarat tampilan: tombol simpan baru menyala kalau keduanya terpenuhi
  const syarat = [
    { teks: 'Minimal 6 karakter', ok: passwordBaru.length >= 6 },
    { teks: 'Kedua password sama', ok: ulangPassword.length > 0 && ulangPassword === passwordBaru },
  ];
  const syaratLengkap = syarat.every((s) => s.ok);

  return (
    <View style={[styles.layar, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.layar}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.isi} keyboardShouldPersistTaps="handled">
          <View style={styles.tengah}>
            <View style={styles.lingkaran}>
              <Gembok ukuran={100} />
            </View>
            <Text style={styles.judul} accessibilityRole="header">
              {kodeTerkirim ? 'Buat password baru' : 'Lupa password?'}
            </Text>
            <Text style={styles.deskripsi}>
              {kodeTerkirim
                ? 'Pakai password yang mudah kamu ingat tapi susah ditebak orang lain.'
                : 'Masukkan email akunmu. Kami kirim kode untuk membuat password baru.'}
            </Text>
          </View>

          <KolomIsian
            label="Email"
            ikon="mail-outline"
            placeholder="nama@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            editable={!kodeTerkirim}
          />

          {kodeTerkirim && (
            <>
              <KolomIsian
                label="Kode dari email"
                ikon="keypad-outline"
                placeholder="Kode dari email"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={10}
                value={kode}
                onChangeText={setKode}
              />
              <KolomIsian
                label="Password baru"
                ikon="lock-closed-outline"
                placeholder="Password baru"
                rahasia
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                value={passwordBaru}
                onChangeText={setPasswordBaru}
              />
              <KolomIsian
                label="Ulangi password"
                ikon="lock-closed-outline"
                placeholder="Ketik ulang password baru"
                rahasia
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                value={ulangPassword}
                onChangeText={setUlangPassword}
              />

              <Kartu style={styles.syarat} accessibilityLiveRegion="polite">
                {syarat.map((s) => (
                  <View
                    key={s.teks}
                    style={styles.barisSyarat}
                    accessible
                    accessibilityLabel={`${s.teks}: ${s.ok ? 'terpenuhi' : 'belum terpenuhi'}`}
                  >
                    <View style={[styles.bulatSyarat, s.ok && styles.bulatSyaratOk]}>
                      {s.ok && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={[styles.teksSyarat, s.ok && styles.teksSyaratOk]}>{s.teks}</Text>
                  </View>
                ))}
              </Kartu>
            </>
          )}
        </ScrollView>

        <View style={[styles.kaki, { paddingBottom: insets.bottom + 8 }]}>
          {kodeTerkirim ? (
            <Tombol
              label="Simpan Password"
              onPress={simpanPasswordBaru}
              nonaktif={!syaratLengkap}
              memuat={loading}
            />
          ) : (
            <Tombol label="Kirim Kode" ikon="mail-outline" onPress={kirimKode} memuat={loading} />
          )}
          <Pressable
            onPress={onDone}
            style={styles.kembali}
            accessibilityRole="button"
            accessibilityLabel="Kembali ke halaman masuk"
          >
            <Text style={styles.kembaliTeks}>Kembali</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  layar: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 20, gap: 20, flexGrow: 1 },

  tengah: { alignItems: 'center', gap: 8 },
  lingkaran: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: warna.persik,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  judul: { fontFamily: font.judul, fontSize: 26, color: warna.teks, textAlign: 'center' },
  deskripsi: {
    fontFamily: font.isi,
    fontSize: 15,
    lineHeight: 22,
    color: warna.teksRedup,
    textAlign: 'center',
  },

  syarat: { gap: 12 },
  barisSyarat: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bulatSyarat: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: warna.garis,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulatSyaratOk: { backgroundColor: warna.hijau },
  teksSyarat: { fontFamily: font.semi, fontSize: 14, color: warna.teksRedup },
  teksSyaratOk: { color: warna.hijauTeks },

  kaki: { paddingHorizontal: 20, paddingTop: 8, gap: 4, backgroundColor: warna.latar },
  kembali: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  kembaliTeks: { fontFamily: font.tebal, fontSize: 14, color: warna.biru },
});

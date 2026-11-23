import { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { font, radius, warna } from '../lib/tema';
import Kartu from '../components/ui/Kartu';
import KolomIsian from '../components/ui/KolomIsian';
import Tombol from '../components/ui/Tombol';
import IlustrasiLogin from '../components/ilustrasi/IlustrasiLogin';

type Props = { onForgot: () => void };
export default function LoginScreen({ onForgot }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDaftar, setIsDaftar] = useState(false);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

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

  const labelTombol = loading
    ? isDaftar
      ? 'Mendaftar…'
      : 'Masuk…'
    : isDaftar
      ? 'Daftar Akun'
      : 'Masuk';

  return (
    <View style={styles.layar}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.layar}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.gulir}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.merek}>
              <Image
                source={require('../assets/icon.png')}
                style={styles.ikonApp}
                accessibilityIgnoresInvertColors
              />
              <Text style={styles.namaApp} accessibilityRole="header">
                Code<Text style={styles.namaAppAksen}>Kantin</Text>
              </Text>
            </View>
            <Text style={styles.tagline}>Belajar Stack & Queue di dapur restoran</Text>
            <View style={styles.ilustrasi}>
              <IlustrasiLogin lebar={width} />
            </View>
          </View>

          <Kartu style={styles.kartu}>
            <View style={styles.pilihan} accessibilityRole="tablist">
              {[
                { daftar: false, label: 'Masuk' },
                { daftar: true, label: 'Daftar' },
              ].map((m) => {
                const dipilih = isDaftar === m.daftar;
                return (
                  <Pressable
                    key={m.label}
                    onPress={() => setIsDaftar(m.daftar)}
                    disabled={loading}
                    style={[styles.pilihanTombol, dipilih && styles.pilihanAktif]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: dipilih, disabled: loading }}
                  >
                    <Text style={[styles.pilihanTeks, dipilih && styles.pilihanTeksAktif]}>
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.judul} accessibilityRole="header">
              {isDaftar ? 'Buat akun koki barumu' : 'Selamat datang kembali, Koki!'}
            </Text>

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
            />
            <KolomIsian
              label="Password"
              ikon="lock-closed-outline"
              placeholder="Password"
              rahasia
              autoCapitalize="none"
              autoComplete={isDaftar ? 'new-password' : 'current-password'}
              textContentType={isDaftar ? 'newPassword' : 'password'}
              value={password}
              onChangeText={setPassword}
            />

            {isDaftar ? (
              <Text style={styles.bantuan}>Minimal 6 karakter.</Text>
            ) : (
              <Pressable
                onPress={onForgot}
                style={styles.lupa}
                accessibilityRole="button"
                hitSlop={4}
              >
                <Text style={styles.lupaTeks}>Lupa password?</Text>
              </Pressable>
            )}

            <Tombol label={labelTombol} onPress={handleSubmit} memuat={loading} />
          </Kartu>

          <View style={styles.pengisi} />
          <Text style={[styles.kaki, { paddingBottom: insets.bottom + 16 }]}>
            IK300 Mobile Programming · Pendidikan Ilmu Komputer UPI
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  layar: { flex: 1, backgroundColor: warna.latar },
  gulir: { flexGrow: 1 },

  header: {
    backgroundColor: warna.persik,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    alignItems: 'center',
  },
  merek: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ikonApp: { width: 44, height: 44, borderRadius: 10 },
  namaApp: { fontFamily: font.judul, fontSize: 26, letterSpacing: -0.8, color: warna.gelap },
  // #C2410C di #FDE4D6 = 4,25:1 — lolos untuk teks besar & tebal (minimal 3:1)
  namaAppAksen: { color: warna.oranye },
  tagline: { fontFamily: font.semi, fontSize: 14, color: warna.persikTeks, marginTop: 6 },
  ilustrasi: { marginTop: 12 },

  kartu: { marginHorizontal: 20, marginTop: -20, padding: 22, gap: 16 },

  pilihan: {
    flexDirection: 'row',
    backgroundColor: warna.kotakKode,
    borderRadius: radius.tombol,
    padding: 4,
  },
  pilihanTombol: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pilihanAktif: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1F1A17',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pilihanTeks: { fontFamily: font.tebal, fontSize: 14, color: warna.teksRedup },
  pilihanTeksAktif: { color: warna.teks },

  judul: { fontFamily: font.judul, fontSize: 20, color: warna.teks },

  bantuan: { fontFamily: font.isi, fontSize: 13, color: warna.teksRedup, marginTop: -8 },
  lupa: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginVertical: -8 },
  lupaTeks: { fontFamily: font.tebal, fontSize: 14, color: warna.biru },

  pengisi: { flex: 1, minHeight: 24 },
  kaki: {
    fontFamily: font.isi,
    fontSize: 12,
    color: warna.teksRedup,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

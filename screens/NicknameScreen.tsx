import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { font, gayaLabel, warna } from '../lib/tema';
import Kartu from '../components/ui/Kartu';
import KolomIsian from '../components/ui/KolomIsian';
import Tombol from '../components/ui/Tombol';
import TopiKoki from '../components/ilustrasi/TopiKoki';

type Props = { userId: string; onSaved: () => void };

const PANJANG_MAKS = 20;

export default function NicknameScreen({ userId, onSaved }: Props) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

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

  // Pratinjau Beranda yang diperbarui langsung saat mengetik
  const namaRapi = nickname.trim();
  const namaSapaan = namaRapi.length >= 2 ? namaRapi : 'Koki';
  const inisial = namaRapi ? namaRapi.charAt(0).toUpperCase() : '?';

  return (
    <View style={[styles.layar, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.layar}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.isi} keyboardShouldPersistTaps="handled">
          <View
            style={styles.langkah}
            accessible
            accessibilityLabel="Langkah 2 dari 2, langkah terakhir"
          >
            <View style={styles.bar} />
            <View style={styles.bar} />
            <Text style={styles.langkahTeks}>Langkah terakhir</Text>
          </View>

          <View style={styles.tengah}>
            <TopiKoki lebar={160} tinggi={130} />
            <Text style={styles.judul} accessibilityRole="header">
              Siapa nama kokimu?
            </Text>
            <Text style={styles.deskripsi}>
              Nama panggilan ini muncul di Beranda. Bisa diubah nanti di Profil.
            </Text>
          </View>

          <KolomIsian
            label="Nama panggilan"
            aksen={warna.hijau}
            placeholder="contoh: Raka"
            maxLength={PANJANG_MAKS}
            autoCapitalize="words"
            labelKanan={`${nickname.length}/${PANJANG_MAKS}`}
            value={nickname}
            onChangeText={setNickname}
            returnKeyType="done"
          />

          <View style={styles.pratinjau}>
            <Text style={gayaLabel}>Pratinjau Beranda</Text>
            <Kartu
              style={styles.kartuPratinjau}
              accessible
              accessibilityLabel={`Pratinjau Beranda: Halo, ${namaSapaan}! Koki Magang.`}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarHuruf}>{inisial}</Text>
              </View>
              <View style={styles.sapaan}>
                <Text style={styles.dapur}>DAPUR ALGORITMA</Text>
                <Text style={styles.halo} numberOfLines={1}>
                  Halo, {namaSapaan}!
                </Text>
                <View style={styles.pil}>
                  <Text style={styles.pilTeks}>Koki Magang</Text>
                </View>
              </View>
            </Kartu>
          </View>
        </ScrollView>

        <View style={[styles.kaki, { paddingBottom: insets.bottom + 16 }]}>
          <Tombol
            label="Mulai Memasak"
            onPress={simpan}
            nonaktif={namaRapi.length < 2}
            memuat={loading}
            accessibilityHint="Butuh nama panggilan minimal 2 huruf"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  layar: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 20, gap: 20, flexGrow: 1 },

  langkah: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bar: { flex: 1, height: 6, borderRadius: 999, backgroundColor: warna.hijau },
  langkahTeks: { fontFamily: font.tebal, fontSize: 12, color: warna.teksRedup, marginLeft: 6 },

  tengah: { alignItems: 'center', gap: 8 },
  judul: { fontFamily: font.judul, fontSize: 26, color: warna.teks, textAlign: 'center', marginTop: 4 },
  deskripsi: {
    fontFamily: font.isi,
    fontSize: 15,
    lineHeight: 22,
    color: warna.teksRedup,
    textAlign: 'center',
  },

  pratinjau: { gap: 8 },
  kartuPratinjau: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: warna.persik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHuruf: { fontFamily: font.judul, fontSize: 20, color: warna.persikTeks },
  sapaan: { flex: 1, alignItems: 'flex-start', gap: 2 },
  dapur: { fontFamily: font.judul, fontSize: 11, letterSpacing: 1, color: warna.persikTeks },
  halo: { fontFamily: font.judul, fontSize: 17, color: warna.teks },
  pil: {
    marginTop: 4,
    backgroundColor: warna.hijauMuda,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pilTeks: { fontFamily: font.tebal, fontSize: 12, color: warna.hijauTua },

  kaki: { paddingHorizontal: 20, paddingTop: 8, backgroundColor: warna.latar },
});

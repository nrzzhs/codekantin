import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';
import { font, warna } from '../lib/tema';
import { infoLencana } from '../lib/lencana';
import { hitungLencana } from '../data/beranda';
import Kartu from '../components/ui/Kartu';
import KolomIsian from '../components/ui/KolomIsian';
import Tombol from '../components/ui/Tombol';
import Toast from '../components/ui/Toast';
import KartuIdentitas from '../components/profil/KartuIdentitas';
import StatistikProfil from '../components/profil/StatistikProfil';
import PilihanKelas from '../components/profil/PilihanKelas';

type Props = {
  userId: string;
  email: string;
  profile: Profile;
  onUpdated: () => Promise<void>;
  onLogout: () => void;
};

const KELAS_BAKU = ['X', 'XI', 'XII'];
const LAMA_TOAST = 2000;

export default function ProfilScreen({ userId, email, profile, onUpdated, onLogout }: Props) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [school, setSchool] = useState(profile.school ?? '');
  const [grade, setGrade] = useState(profile.grade ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fotoError, setFotoError] = useState(false);

  // Tampilan saja
  const [toast, setToast] = useState(false);
  const [konfirmasiKeluar, setKonfirmasiKeluar] = useState(false);
  const timerToast = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(
    () => () => {
      if (timerToast.current) clearTimeout(timerToast.current);
    },
    [],
  );

  const lv = useMemo(() => infoLencana(profile.total_xp), [profile.total_xp]);
  const progres = useMemo(() => hitungLencana(profile.total_xp).progres, [profile.total_xp]);

  // Nilai kelas lama di luar X/XI/XII tetap ditampilkan sebagai pilihan keempat
  const gradeAwal = (profile.grade ?? '').trim();
  const kelasLain = gradeAwal && !KELAS_BAKU.includes(gradeAwal) ? gradeAwal : null;

  // Tombol simpan aktif hanya kalau ada perubahan dibanding data tersimpan
  const berubah =
    nickname.trim() !== profile.nickname ||
    fullName.trim() !== (profile.full_name ?? '') ||
    school.trim() !== (profile.school ?? '') ||
    grade.trim() !== (profile.grade ?? '') ||
    bio.trim() !== (profile.bio ?? '');

  function tampilkanToast() {
    if (timerToast.current) clearTimeout(timerToast.current);
    setToast(true);
    timerToast.current = setTimeout(() => setToast(false), LAMA_TOAST);
  }

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
    // Berhasil: toast + getar (menggantikan Alert "Tersimpan")
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    tampilkanToast();
  }

  const namaTampil = nickname.trim() || profile.nickname;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <KartuIdentitas
          nama={namaTampil}
          avatarUrl={profile.avatar_url}
          fotoError={fotoError}
          onFotoError={() => setFotoError(true)}
          mengunggah={uploading}
          onUbahFoto={pilihFoto}
          guru={profile.role === 'guru'}
          lencana={lv.nama}
        />

        <StatistikProfil
          poin={profile.total_points}
          xp={profile.total_xp}
          level={lv.level}
          berikutnya={lv.berikutnya}
          progres={progres}
        />

        <Kartu style={styles.biodata}>
          <Text style={styles.judulKartu} accessibilityRole="header">
            Biodata
          </Text>

          <View style={styles.email} accessible accessibilityLabel={`Email: ${email}. Tidak bisa diubah`}>
            <Ionicons name="mail-outline" size={20} color={warna.teksRedup} />
            <View style={styles.emailKolom}>
              <Text style={styles.emailLabel}>Email</Text>
              <Text style={styles.emailTeks} numberOfLines={1}>
                {email}
              </Text>
            </View>
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={warna.teksRedup}
              accessibilityLabel="Tidak bisa diubah"
            />
          </View>

          <KolomIsian
            label="Nama panggilan"
            wajib
            ikon="person-outline"
            value={nickname}
            onChangeText={setNickname}
            maxLength={20}
          />
          <KolomIsian
            label="Nama lengkap"
            ikon="id-card-outline"
            placeholder="Nama sesuai absen"
            value={fullName}
            onChangeText={setFullName}
            maxLength={60}
          />
          <KolomIsian
            label="Sekolah"
            ikon="school-outline"
            value={school}
            onChangeText={setSchool}
            maxLength={60}
          />
          <PilihanKelas nilai={grade} onUbah={setGrade} nilaiLain={kelasLain} />
          <KolomIsian
            label="Bio singkat"
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={150}
            placeholder="Ceritakan sedikit tentang dirimu"
            penghitung={`${bio.length}/150`}
          />
        </Kartu>

        <Tombol
          label="Simpan perubahan"
          varian="utama"
          ikon="checkmark"
          onPress={simpan}
          memuat={saving}
          nonaktif={!berubah}
          accessibilityHint={berubah ? undefined : 'Belum ada perubahan'}
        />

        <Pressable
          onPress={() => setKonfirmasiKeluar((v) => !v)}
          style={({ pressed }) => [styles.keluar, pressed && styles.keluarTekan]}
          accessibilityRole="button"
          accessibilityLabel="Keluar"
          accessibilityState={{ expanded: konfirmasiKeluar }}
        >
          <Ionicons name="log-out-outline" size={20} color="#B91C1C" />
          <Text style={styles.keluarTeks}>Keluar</Text>
        </Pressable>

        {konfirmasiKeluar && (
          <View style={styles.konfirmasi} accessibilityLiveRegion="polite">
            <Text style={styles.konfirmasiTeks}>Yakin mau keluar dari akun?</Text>
            <View style={styles.konfirmasiBaris}>
              <Pressable
                onPress={() => setKonfirmasiKeluar(false)}
                style={({ pressed }) => [styles.batal, pressed && styles.keluarTekan]}
                accessibilityRole="button"
              >
                <Text style={styles.batalTeks}>Batal</Text>
              </Pressable>
              <Pressable
                onPress={onLogout}
                style={({ pressed }) => [styles.yaKeluar, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
              >
                <Text style={styles.yaKeluarTeks}>Ya, keluar</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {toast && <Toast teks="Profil tersimpan!" atas={insets.top + 8} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warna.latar },
  content: { padding: 20, paddingBottom: 48, gap: 16 },

  biodata: { borderRadius: 22, padding: 16, gap: 14 },
  judulKartu: { fontFamily: font.judul, fontSize: 17, color: warna.teks },
  email: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: warna.kotakKode,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  emailKolom: { flex: 1 },
  emailLabel: { fontFamily: font.semi, fontSize: 11, color: warna.teksRedup },
  emailTeks: { fontFamily: font.tebal, fontSize: 14, color: warna.teks },

  keluar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FECACA',
    backgroundColor: '#FFFFFF',
  },
  keluarTekan: { backgroundColor: '#FEF2F2' },
  keluarTeks: { fontFamily: font.tebal, fontSize: 16, color: '#B91C1C' },

  konfirmasi: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  konfirmasiTeks: { fontFamily: font.tebal, fontSize: 14, color: warna.teks },
  konfirmasiBaris: { flexDirection: 'row', gap: 10 },
  batal: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: warna.garis,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batalTeks: { fontFamily: font.tebal, fontSize: 15, color: warna.teks },
  yaKeluar: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yaKeluarTeks: { fontFamily: font.tebal, fontSize: 15, color: '#FFFFFF' },
});

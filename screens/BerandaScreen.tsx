import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import KartuModulMini from '../components/KartuModulMini';
import KokiPiri from '../components/ilustrasi/KokiPiri';
import IlustrasiQueue from '../components/ilustrasi/IlustrasiQueue';
import IlustrasiStack from '../components/ilustrasi/IlustrasiStack';
import IlustrasiTebak from '../components/ilustrasi/IlustrasiTebak';
import IlustrasiBandingkan from '../components/ilustrasi/IlustrasiBandingkan';
import { font, warna } from '../lib/tema';
import { infoLencana } from '../lib/lencana';
import { FAKTA, hitungLencana } from '../data/beranda';
import { POIN_MAKS } from '../logic/hadiah';
import { KAPASITAS, useAntrean, useTumpukan, useTebak } from '../context/SimulatorContext';

type Props = {
  nickname: string;
  avatarUrl: string | null;
  points: number;
  xp: number;
  onRefresh: () => Promise<void>;
};

// Warna kartu maskot (latar gelap)
const TOSKA = '#5EEAD4';
const TRACK = '#334155';
const TEKS_TERANG = '#CBD5E1';
const TEKS_REDUP = '#94A3B8';


export default function BerandaScreen({ nickname, avatarUrl, points, xp, onRefresh }: Props) {
  const navigation = useNavigation<any>();
  const isiAntrean = useAntrean().tampil.isi;
  const isiTumpukan = useTumpukan().tampil.isi;
  const sesiTebak = useTebak().nilai;
  const infoTebak =
    sesiTebak && Array.isArray(sesiTebak.idSoal) && sesiTebak.idSoal.length > 0
      ? { indeks: Math.min(sesiTebak.indeks, sesiTebak.idSoal.length), total: sesiTebak.idSoal.length }
      : null;

  const [refreshing, setRefreshing] = useState(false);
  const [fotoError, setFotoError] = useState(false);
  const [indeksPesan, setIndeksPesan] = useState(0);
  const [lompatan, setLompatan] = useState(0);
  const kurangiGerak = useReducedMotion();

  const lencana = useMemo(() => hitungLencana(xp), [xp]);
  const lv = useMemo(() => infoLencana(xp), [xp]);

  const muatUlang = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  // Isi gelembung bicara: sapaan, semua fakta "Tahukah Kamu?", lalu target XP
  const daftarPesan = useMemo(
    () => [
      `Hai ${nickname}! Mau melayani antrean atau menumpuk piring?`,
      ...FAKTA,
      lv.berikutnya
        ? `Kumpulkan ${lv.sisa} XP lagi untuk jadi ${lv.berikutnya.nama}!`
        : 'Kamu sudah Master Koki. Hebat!',
    ],
    [nickname, lv],
  );
  const pesan = daftarPesan[indeksPesan % daftarPesan.length];

  function ketukKoki() {
    setLompatan((n) => n + 1);
    setIndeksPesan((i) => (i + 1) % daftarPesan.length);
  }

  // Gelembung muncul dari skala 0,85 sambil memudar masuk setiap kali berganti
  const gelembung = useSharedValue(1);
  useEffect(() => {
    if (kurangiGerak) {
      gelembung.set(1);
      return;
    }
    gelembung.set(0);
    gelembung.set(withTiming(1, { duration: 300 }));
  }, [indeksPesan, kurangiGerak, gelembung]);
  const gayaGelembung = useAnimatedStyle(() => ({
    opacity: gelembung.get(),
    transform: [{ scale: 0.85 + 0.15 * gelembung.get() }],
  }));

  // Progress XP terisi dari 0 saat layar dibuka, lalu mengikuti perubahan XP
  const progres = useSharedValue(0);
  useEffect(() => {
    progres.set(kurangiGerak ? lencana.progres : withTiming(lencana.progres, { duration: 1000 }));
  }, [lencana.progres, kurangiGerak, progres]);
  const gayaProgres = useAnimatedStyle(() => ({ width: `${progres.get() * 100}%` }));

  // Animasi masuk berurutan, jeda 60 ms per elemen
  const masuk = (urutan: number) =>
    kurangiGerak ? undefined : FadeInDown.delay(urutan * 60).duration(350);

  const nAntrean = isiAntrean.length;
  const nTumpukan = isiTumpukan.length;
  const teksSesiTebak = !infoTebak
    ? 'Belum ada sesi.'
    : infoTebak.indeks >= infoTebak.total
      ? 'Sesi selesai.'
      : `Sesi berjalan, soal ${infoTebak.indeks + 1} dari ${infoTebak.total}.`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.isi}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={muatUlang}
            colors={[warna.biru]}
            tintColor={warna.biru}
          />
        }
      >
        {/* 1. Header */}
        <Animated.View entering={masuk(0)} style={styles.header}>
          <View style={styles.baris}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.ikonApp}
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.wordmark} numberOfLines={1} accessibilityLabel="CodeKantin">
              Code<Text style={styles.wordmarkAksen}>Kantin</Text>
            </Text>
            <View style={styles.pilPoin} accessible accessibilityLabel={`${points} poin`}>
              <Ionicons name="star" size={18} color={warna.oranye} />
              <Text style={styles.pilPoinTeks}>{points}</Text>
            </View>
          </View>

          <View style={styles.baris}>
            <Pressable
              onPress={() => navigation.navigate('Profil')}
              accessibilityRole="button"
              accessibilityLabel="Buka Profil"
            >
              {avatarUrl && !fotoError ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} onError={() => setFotoError(true)} />
              ) : (
                <View style={[styles.avatar, styles.avatarKosong]}>
                  <Text style={styles.inisial}>{nickname.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </Pressable>
            <Text style={styles.sapaan} numberOfLines={1} accessibilityRole="header">
              Halo, {nickname}!
            </Text>
          </View>
        </Animated.View>

        {/* 2. Maskot + XP */}
        <Animated.View entering={masuk(1)} style={styles.kartuMaskot}>
          <View style={styles.barisMaskot}>
            <Pressable
              onPress={ketukKoki}
              accessibilityRole="button"
              accessibilityLabel="Ketuk Koki Piri untuk tips berikutnya"
            >
              <KokiPiri ukuran={104} lompatan={lompatan} />
            </Pressable>

            <Pressable onPress={ketukKoki} accessible={false} style={styles.kolomGelembung}>
              <Animated.View style={[styles.gelembung, gayaGelembung]}>
                <View style={styles.ekor} />
                <View accessibilityLiveRegion="polite">
                  <Text style={styles.gelembungTeks}>{pesan}</Text>
                </View>
              </Animated.View>
              <View
                style={styles.petunjuk}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Ionicons name="hand-left-outline" size={13} color={TEKS_REDUP} />
                <Text style={styles.petunjukTeks}>Ketuk Koki Piri</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.xp}>
            <View style={styles.barisXp}>
              <View
                style={styles.lencana}
                accessible
                accessibilityLabel={`Level ${lv.level}, ${lv.nama}`}
              >
                <View style={styles.pilLv}>
                  <Text style={styles.pilLvTeks}>Lv {lv.level}</Text>
                </View>
                <Text style={styles.namaLencana} numberOfLines={1}>
                  {lv.nama}
                </Text>
              </View>
              <Text style={styles.angkaXp}>
                {lv.berikutnya ? `${xp} / ${lv.berikutnya.xp} XP` : `${xp} XP`}
              </Text>
            </View>
            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityLabel={
                lv.berikutnya ? `XP menuju ${lv.berikutnya.nama}` : 'XP, level tertinggi'
              }
              accessibilityValue={{ min: 0, max: 100, now: Math.round(lencana.progres * 100) }}
            >
              <Animated.View style={[styles.trackIsi, gayaProgres]} />
            </View>
          </View>
        </Animated.View>

        {/* 3. Judul bagian */}
        <Animated.View entering={masuk(2)}>
          <Text style={styles.judulBagian} accessibilityRole="header">
            Mau masak apa hari ini?
          </Text>
        </Animated.View>

        {/* 4. Grid modul 2×2 */}
        <View style={styles.grid}>
          <View style={styles.barisGrid}>
            <Animated.View entering={masuk(3)} style={styles.sel}>
              <KartuModulMini
                judul="Queue"
                warna="antrean"
                status={`${nAntrean}/${KAPASITAS}`}
                labelTombol="Main"
                ilustrasi={<IlustrasiQueue />}
                onPress={() => navigation.navigate('Antrean')}
                accessibilityLabel={`Queue, antrean kasir. ${nAntrean} dari ${KAPASITAS} pelanggan. Ketuk untuk mulai simulasi.`}
              />
            </Animated.View>
            <Animated.View entering={masuk(4)} style={styles.sel}>
              <KartuModulMini
                judul="Stack"
                warna="tumpukan"
                status={`${nTumpukan}/${KAPASITAS}`}
                labelTombol="Main"
                ilustrasi={<IlustrasiStack />}
                onPress={() => navigation.navigate('Tumpukan')}
                accessibilityLabel={`Stack, tumpukan piring. ${nTumpukan} dari ${KAPASITAS} piring. Ketuk untuk mulai simulasi.`}
              />
            </Animated.View>
          </View>
          <View style={styles.barisGrid}>
            <Animated.View entering={masuk(5)} style={styles.sel}>
              <KartuModulMini
                judul="Tebak"
                warna="tebak"
                status={`+${POIN_MAKS}`}
                labelTombol="Main"
                ilustrasi={<IlustrasiTebak />}
                onPress={() => navigation.navigate('Tebak')}
                accessibilityLabel={`Tebak, tantangan prediksi Stack dan Queue. Hingga ${POIN_MAKS} poin. ${teksSesiTebak} Ketuk untuk mulai.`}
              />
            </Animated.View>
            <Animated.View entering={masuk(6)} style={styles.sel}>
              <KartuModulMini
                judul="Bandingkan"
                warna="bandingkan"
                labelTombol="Buka"
                ilustrasi={<IlustrasiBandingkan />}
                onPress={() => navigation.navigate('Bandingkan')}
                accessibilityLabel="Bandingkan Stack dan Queue secara berdampingan. Ketuk untuk membuka."
              />
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 20, paddingBottom: 32, gap: 18 },

  // Header
  header: { gap: 14 },
  baris: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ikonApp: { width: 36, height: 36, borderRadius: 8 },
  wordmark: { flex: 1, fontFamily: font.judul, fontSize: 20, letterSpacing: -0.6, color: warna.gelap },
  // #C2410C di #FFF8F0 lolos untuk teks besar & tebal
  wordmarkAksen: { color: warna.oranye },
  pilPoin: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: warna.oranyeMuda,
  },
  pilPoinTeks: { fontFamily: font.judul, fontSize: 15, color: warna.persikTeks },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarKosong: { backgroundColor: warna.biru, alignItems: 'center', justifyContent: 'center' },
  inisial: { fontFamily: font.judul, fontSize: 20, color: '#FFFFFF' },
  sapaan: { flex: 1, fontFamily: font.judul, fontSize: 22, color: warna.teks },

  // Kartu maskot
  kartuMaskot: {
    backgroundColor: warna.gelap,
    borderRadius: 26,
    padding: 16,
    gap: 14,
    shadowColor: warna.gelap,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  barisMaskot: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  kolomGelembung: { flex: 1, gap: 6 },
  gelembung: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  ekor: {
    position: 'absolute',
    left: -5,
    top: 16,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  gelembungTeks: { fontFamily: font.tebal, fontSize: 13, lineHeight: 19, color: warna.teks },
  petunjuk: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 4 },
  petunjukTeks: { fontFamily: font.tebal, fontSize: 11, color: TEKS_REDUP },

  xp: { gap: 8 },
  barisXp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  lencana: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pilLv: { backgroundColor: TOSKA, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  pilLvTeks: { fontFamily: font.judul, fontSize: 11, color: warna.gelap },
  namaLencana: { flexShrink: 1, fontFamily: font.judul, fontSize: 13, color: '#FFFFFF' },
  angkaXp: { fontFamily: font.tebal, fontSize: 12, color: TEKS_TERANG },
  track: { height: 14, borderRadius: 999, backgroundColor: TRACK, overflow: 'hidden' },
  trackIsi: { height: '100%', borderRadius: 999, backgroundColor: TOSKA },

  // Grid modul
  judulBagian: { fontFamily: font.judul, fontSize: 20, color: warna.teks },
  grid: { gap: 12 },
  barisGrid: { flexDirection: 'row', gap: 12 },
  sel: { flex: 1 },
});

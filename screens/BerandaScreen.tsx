import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
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
import KartuModul from '../components/KartuModul';
import Kartu from '../components/ui/Kartu';
import TekanSkala from '../components/ui/TekanSkala';
import Tombol from '../components/ui/Tombol';
import { font, warna } from '../lib/tema';
import { DAFTAR_MODUL, FAKTA, hitungLencana, ringkasanModul, type RuteModul } from '../data/beranda';
import { useAntrean, useTumpukan, useTebak } from '../context/SimulatorContext';

type Props = {
  nickname: string;
  avatarUrl: string | null;
  points: number;
  xp: number;
  onRefresh: () => Promise<void>;
};

type NamaIkon = ComponentProps<typeof Ionicons>['name'];

// Warna banner gelap
const TOSKA = '#5EEAD4';
const PANEL = '#1E293B';
const TRACK = '#334155';
const TEKS_BANNER = '#CBD5E1';
const TEKS_BANNER_REDUP = '#94A3B8';

// Warna per modul: biru = Queue, oranye = Stack, ungu = Mode Tebak.
// Data modul (teks & warna lama) tetap di data/beranda.ts; di sini hanya tampilannya.
const GAYA_MODUL: Record<
  RuteModul,
  {
    ikon: NamaIkon;
    latar: string;
    teksTag: string;
    warnaIkon: string;
    varian: 'antrean' | 'tumpukan' | 'tebak';
    warnaKanan: string;
    jenisPreview?: 'antrean' | 'tumpukan';
  }
> = {
  Antrean: {
    ikon: 'people-outline',
    latar: warna.biruMuda,
    teksTag: warna.biru,
    warnaIkon: warna.biru,
    varian: 'antrean',
    warnaKanan: warna.biru,
    jenisPreview: 'antrean',
  },
  Tumpukan: {
    ikon: 'layers-outline',
    latar: warna.oranyeMuda,
    teksTag: warna.persikTeks,
    warnaIkon: warna.oranye,
    varian: 'tumpukan',
    warnaKanan: warna.persikTeks,
    jenisPreview: 'tumpukan',
  },
  Tebak: {
    ikon: 'locate-outline',
    latar: warna.unguMuda,
    teksTag: warna.ungu,
    warnaIkon: warna.ungu,
    varian: 'tebak',
    warnaKanan: warna.ungu,
  },
};

// Ambang sama dengan LENCANA di data/beranda.ts (tidak diekspor, jadi disalin di sini).
// hitungLencana() hanya memberi teks & progres; nama, level, dan sisa XP dihitung di sini.
const TAHAP_LENCANA = [
  { xp: 0, nama: 'Koki Magang', pendek: 'Magang' },
  { xp: 100, nama: 'Koki Muda', pendek: 'Muda' },
  { xp: 300, nama: 'Koki Handal', pendek: 'Handal' },
  { xp: 600, nama: 'Master Koki LIFO/FIFO', pendek: 'Master' },
];

function infoLencana(xp: number) {
  let indeks = 0;
  TAHAP_LENCANA.forEach((t, i) => {
    if (xp >= t.xp) indeks = i;
  });
  const berikutnya = TAHAP_LENCANA[indeks + 1];
  return {
    indeks,
    nama: TAHAP_LENCANA[indeks].nama,
    level: indeks + 1,
    berikutnya: berikutnya?.nama ?? null,
    sisa: berikutnya ? berikutnya.xp - xp : 0,
  };
}

function faktaAcak(kecuali?: number) {
  let i = Math.floor(Math.random() * FAKTA.length);
  if (kecuali !== undefined && FAKTA.length > 1) {
    while (i === kecuali) i = Math.floor(Math.random() * FAKTA.length);
  }
  return i;
}

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
  const [indeksFakta, setIndeksFakta] = useState(() => faktaAcak());
  const [fotoError, setFotoError] = useState(false);
  const kurangiGerak = useReducedMotion();

  const lencana = useMemo(() => hitungLencana(xp), [xp]);
  const lv = useMemo(() => infoLencana(xp), [xp]);

  const muatUlang = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setIndeksFakta((i) => faktaAcak(i));
    setRefreshing(false);
  }, [onRefresh]);

  // Progress bar terisi dari 0 saat layar dibuka, lalu mengikuti perubahan XP
  const progres = useSharedValue(0);
  useEffect(() => {
    progres.set(kurangiGerak ? lencana.progres : withTiming(lencana.progres, { duration: 900 }));
  }, [lencana.progres, kurangiGerak, progres]);
  const gayaProgres = useAnimatedStyle(() => ({ width: `${progres.get() * 100}%` }));

  // Fakta baru: muncul pelan sambil bergeser 6 px ke atas
  const faktaOpasitas = useSharedValue(1);
  const faktaGeser = useSharedValue(0);
  useEffect(() => {
    if (kurangiGerak) return;
    faktaOpasitas.set(0);
    faktaGeser.set(6);
    faktaOpasitas.set(withTiming(1, { duration: 300 }));
    faktaGeser.set(withTiming(0, { duration: 300 }));
  }, [indeksFakta, kurangiGerak, faktaOpasitas, faktaGeser]);
  const gayaFakta = useAnimatedStyle(() => ({
    opacity: faktaOpasitas.get(),
    transform: [{ translateY: faktaGeser.get() }],
  }));

  // Animasi masuk berurutan, jeda 60 ms per elemen
  const masuk = (urutan: number) =>
    kurangiGerak ? undefined : FadeInDown.delay(urutan * 60).duration(350);

  const fakta = FAKTA[indeksFakta];

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

          <View style={styles.headerTeks}>
            <Text style={styles.merek}>CODE KANTIN</Text>
            <Text style={styles.sapaan} numberOfLines={1} accessibilityRole="header">
              Halo, {nickname}!
            </Text>
          </View>

          <View style={styles.pilPoin} accessible accessibilityLabel={`${points} Poin`}>
            <Ionicons name="star" size={18} color={warna.oranye} />
            <Text style={styles.pilPoinTeks}>{points} Poin</Text>
          </View>
        </Animated.View>

        {/* 2. Banner */}
        <Animated.View entering={masuk(1)} style={styles.banner}>
          <View style={styles.chipBanner}>
            <Text style={styles.chipBannerTeks}>KONSEP DASAR CS</Text>
          </View>
          <Text style={styles.bannerJudul}>
            Pahami logika antrean (Queue) & tumpukan (Stack) lewat simulasi dapur nyata!
          </Text>
          <View style={styles.garis} />

          <View
            style={styles.barisLencana}
            accessible
            accessibilityLabel={`Lencana kamu: ${lv.nama}, level ${lv.level}`}
          >
            <View style={styles.kotakLencana}>
              <Ionicons name="ribbon-outline" size={30} color={TOSKA} />
            </View>
            <View style={styles.kolomLencana}>
              <Text style={styles.lencanaLabel}>Lencana kamu</Text>
              <Text style={styles.lencanaNama} numberOfLines={2}>
                {lv.nama}
              </Text>
            </View>
            <View style={styles.chipLv}>
              <Text style={styles.chipLvTeks}>Lv {lv.level}</Text>
            </View>
          </View>

          <View style={styles.barisXp}>
            <Text style={styles.xp}>{xp} XP</Text>
            <Text style={styles.xpSisa}>
              {lv.berikutnya ? `${lv.sisa} XP lagi → ${lv.berikutnya}` : 'Level tertinggi!'}
            </Text>
          </View>
          <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityLabel={lv.berikutnya ? `Kemajuan menuju ${lv.berikutnya}` : 'Level tertinggi'}
            accessibilityValue={{ min: 0, max: 100, now: Math.round(lencana.progres * 100) }}
          >
            <Animated.View style={[styles.trackIsi, gayaProgres]} />
          </View>

          <View style={styles.tahap} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            {TAHAP_LENCANA.map((t, i) => {
              const capai = i <= lv.indeks;
              return (
                <View key={t.pendek} style={styles.kolomTahap}>
                  <View style={[styles.garisTahap, { backgroundColor: capai ? TOSKA : TRACK }]} />
                  <Text style={[styles.teksTahap, { color: capai ? TOSKA : TEKS_BANNER_REDUP }]}>
                    {t.pendek}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* 3–4. Modul */}
        <View style={styles.bagianModul}>
          <Animated.View entering={masuk(2)}>
            <Text style={styles.bagian} accessibilityRole="header">
              Modul Pembelajaran
            </Text>
            <Text style={styles.bagianSub}>Pilih konsep untuk mulai simulasi interaktif</Text>
          </Animated.View>

          {DAFTAR_MODUL.map((m, i) => {
            const r = ringkasanModul(m.id, isiAntrean, isiTumpukan, infoTebak);
            const g = GAYA_MODUL[m.id];
            const isi = m.id === 'Antrean' ? isiAntrean.length : m.id === 'Tumpukan' ? isiTumpukan.length : 0;
            return (
              <Animated.View key={m.id} entering={masuk(3 + i)}>
                <KartuModul
                  tag={m.tag}
                  tagBg={g.latar}
                  tagTeks={g.teksTag}
                  judul={m.judul}
                  deskripsi={m.deskripsi}
                  previewKiri={r.kiri}
                  previewKanan={r.kanan}
                  tombol={m.tombol}
                  warnaTombol={m.warnaTombol}
                  onPress={() => navigation.navigate(m.id)}
                  ikon={g.ikon}
                  ikonBg={g.latar}
                  ikonWarna={g.warnaIkon}
                  varianTombol={g.varian}
                  jenisPreview={g.jenisPreview}
                  isiPreview={isi}
                  warnaPreviewKanan={g.warnaKanan}
                />
              </Animated.View>
            );
          })}
        </View>

        {/* 5. Bandingkan */}
        <Animated.View entering={masuk(3 + DAFTAR_MODUL.length)}>
          <TekanSkala onPress={() => navigation.navigate('Bandingkan')} accessible={false}>
            <Kartu style={styles.kartuBandingkan}>
              <View style={styles.barisAtas}>
                <View style={[styles.chip, { backgroundColor: warna.hijauMuda }]}>
                  <Text style={[styles.chipTeks, { color: warna.hijauTua }]}>KOMPARASI LOGIKA</Text>
                </View>
                <View style={styles.layarPenuh}>
                  <Ionicons name="expand-outline" size={14} color={warna.teksRedup} />
                  <Text style={styles.layarPenuhTeks}>Layar Penuh</Text>
                </View>
              </View>
              <Text style={styles.judulKartu} accessibilityRole="header">
                Bandingkan Stack vs Queue
              </Text>
              <Text style={styles.deskripsiKartu}>
                Lihat perbedaan alur data secara berdampingan dalam satu kanvas dapur simultan!
              </Text>

              <View style={styles.duaPanel}>
                <Panel
                  latar={warna.biruMuda}
                  warnaTeks={warna.biru}
                  ikon="people-outline"
                  judul="QUEUE"
                  operasi="enqueue · dequeue"
                  ikonPil="swap-horizontal"
                  teksPil="Depan & Belakang"
                  jumlah={isiAntrean.length}
                />
                <Panel
                  latar={warna.oranyeMuda}
                  warnaTeks={warna.persikTeks}
                  ikon="layers-outline"
                  judul="STACK"
                  operasi="push · pop"
                  ikonPil="arrow-up"
                  teksPil="Puncak Saja (TOP)"
                  jumlah={isiTumpukan.length}
                />
              </View>

              <Tombol
                label="Buka Mode Bandingkan"
                varian="sekunder"
                ikon="swap-vertical"
                onPress={() => navigation.navigate('Bandingkan')}
              />
            </Kartu>
          </TekanSkala>
        </Animated.View>

        {/* 6. Tahukah Kamu? */}
        <Animated.View entering={masuk(4 + DAFTAR_MODUL.length)}>
          <TekanSkala
            style={styles.fakta}
            onPress={() => setIndeksFakta((i) => faktaAcak(i))}
            accessibilityRole="button"
            accessibilityLabel={`Tahukah Kamu? ${fakta}. Ketuk untuk fakta lain.`}
          >
            <View style={styles.faktaAtas}>
              <View style={styles.kotakBohlam}>
                <Ionicons name="bulb-outline" size={20} color={warna.oranye} />
              </View>
              <Text style={styles.faktaJudul}>Tahukah Kamu?</Text>
              <Text style={styles.faktaNomor}>
                {indeksFakta + 1}/{FAKTA.length}
              </Text>
            </View>
            <Animated.Text style={[styles.faktaIsi, gayaFakta]}>{fakta}</Animated.Text>
            <View style={styles.faktaBawah}>
              <Ionicons name="refresh" size={16} color={warna.persikTeks} />
              <Text style={styles.faktaPetunjuk}>Ketuk untuk fakta lain</Text>
            </View>
          </TekanSkala>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

type PanelProps = {
  latar: string;
  warnaTeks: string;
  ikon: NamaIkon;
  judul: string;
  operasi: string;
  ikonPil: NamaIkon;
  teksPil: string;
  jumlah: number;
};

function Panel({ latar, warnaTeks, ikon, judul, operasi, ikonPil, teksPil, jumlah }: PanelProps) {
  return (
    <View
      style={[styles.panel, { backgroundColor: latar }]}
      accessible
      accessibilityLabel={`${judul}: ${operasi}, ${teksPil}, ${jumlah} elemen`}
    >
      <View style={styles.panelJudulBaris}>
        <Ionicons name={ikon} size={18} color={warnaTeks} />
        <Text style={[styles.panelJudul, { color: warnaTeks }]}>{judul}</Text>
      </View>
      <Text style={[styles.panelOperasi, { color: warnaTeks }]}>{operasi}</Text>
      <View style={styles.panelPil}>
        <Ionicons name={ikonPil} size={12} color={warnaTeks} />
        <Text style={[styles.panelPilTeks, { color: warnaTeks }]} numberOfLines={1}>
          {teksPil}
        </Text>
      </View>
      <Text style={[styles.panelJumlah, { color: warnaTeks }]}>{jumlah} elemen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 20, paddingBottom: 32, gap: 24 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarKosong: { backgroundColor: warna.biru, alignItems: 'center', justifyContent: 'center' },
  inisial: { fontFamily: font.judul, fontSize: 22, color: '#FFFFFF' },
  headerTeks: { flex: 1 },
  merek: { fontFamily: font.judul, fontSize: 11, letterSpacing: 1.5, color: warna.persikTeks },
  sapaan: { fontFamily: font.judul, fontSize: 20, color: warna.teks },
  pilPoin: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: warna.oranyeMuda,
  },
  pilPoinTeks: { fontFamily: font.judul, fontSize: 14, color: warna.persikTeks },

  // Banner
  banner: {
    backgroundColor: warna.gelap,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: warna.gelap,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  chipBanner: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(94,234,212,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipBannerTeks: { fontFamily: font.judul, fontSize: 11, letterSpacing: 0.5, color: TOSKA },
  bannerJudul: { fontFamily: font.judul, fontSize: 17, lineHeight: 23, color: '#FFFFFF' },
  garis: { height: 1, backgroundColor: PANEL },
  barisLencana: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kotakLencana: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: PANEL,
    borderWidth: 2,
    borderColor: TOSKA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kolomLencana: { flex: 1 },
  lencanaLabel: { fontFamily: font.semi, fontSize: 12, color: TEKS_BANNER },
  lencanaNama: { fontFamily: font.judul, fontSize: 20, color: '#FFFFFF' },
  chipLv: {
    backgroundColor: 'rgba(94,234,212,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipLvTeks: { fontFamily: font.judul, fontSize: 11, color: TOSKA },
  barisXp: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  xp: { fontFamily: font.judul, fontSize: 15, color: '#FFFFFF' },
  xpSisa: { flexShrink: 1, textAlign: 'right', fontFamily: font.semi, fontSize: 13, color: TEKS_BANNER },
  track: { height: 12, borderRadius: 999, backgroundColor: TRACK, overflow: 'hidden', marginTop: -6 },
  trackIsi: { height: '100%', borderRadius: 999, backgroundColor: TOSKA },
  tahap: { flexDirection: 'row', gap: 6 },
  kolomTahap: { flex: 1, gap: 6 },
  garisTahap: { height: 4, borderRadius: 999 },
  teksTahap: { fontFamily: font.tebal, fontSize: 10, textAlign: 'center' },

  // Modul
  bagianModul: { gap: 16 },
  bagian: { fontFamily: font.judul, fontSize: 22, color: warna.teks },
  bagianSub: { fontFamily: font.isi, fontSize: 14, color: warna.teksRedup, marginTop: 2 },

  // Bandingkan
  kartuBandingkan: { gap: 12 },
  barisAtas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  chipTeks: { fontFamily: font.judul, fontSize: 11 },
  layarPenuh: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  layarPenuhTeks: { fontFamily: font.semi, fontSize: 12, color: warna.teksRedup },
  judulKartu: { fontFamily: font.judul, fontSize: 18, color: warna.teks },
  deskripsiKartu: { fontFamily: font.isi, fontSize: 14, lineHeight: 21, color: warna.teksRedup },
  duaPanel: { flexDirection: 'row', gap: 10 },
  panel: { flex: 1, borderRadius: 14, padding: 12, gap: 8, alignItems: 'flex-start' },
  panelJudulBaris: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  panelJudul: { fontFamily: font.judul, fontSize: 13 },
  panelOperasi: { fontFamily: font.kode, fontSize: 11 },
  panelPil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  panelPilTeks: { fontFamily: font.tebal, fontSize: 11, flexShrink: 1 },
  panelJumlah: { fontFamily: font.semi, fontSize: 12 },

  // Tahukah Kamu?
  fakta: { backgroundColor: warna.persik, borderRadius: 20, padding: 16, gap: 10 },
  faktaAtas: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kotakBohlam: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faktaJudul: { flex: 1, fontFamily: font.judul, fontSize: 15, color: warna.persikTeks },
  faktaNomor: { fontFamily: font.tebal, fontSize: 12, color: warna.persikTeks },
  faktaIsi: { fontFamily: font.isi, fontSize: 15, lineHeight: 23, color: warna.teks },
  faktaBawah: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  faktaPetunjuk: { fontFamily: font.tebal, fontSize: 13, color: warna.persikTeks },
});

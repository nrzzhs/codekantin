import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, RefreshControl, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import KartuModul from '../components/KartuModul';
import { warna } from '../lib/tema';
import {
  DAFTAR_MODUL, FAKTA, hitungLencana, ringkasanModul,
  CONTOH_ANTREAN, CONTOH_TUMPUKAN,
} from '../data/beranda';

type Props = {
  nickname: string;
  avatarUrl: string | null;
  points: number;
  xp: number;
  onRefresh: () => Promise<void>;
};

function faktaAcak(kecuali?: number) {
  let i = Math.floor(Math.random() * FAKTA.length);
  if (kecuali !== undefined && FAKTA.length > 1) {
    while (i === kecuali) i = Math.floor(Math.random() * FAKTA.length);
  }
  return i;
}

export default function BerandaScreen({ nickname, avatarUrl, points, xp, onRefresh }: Props) {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [indeksFakta, setIndeksFakta] = useState(() => faktaAcak());
  const [fotoError, setFotoError] = useState(false);

  const lencana = useMemo(() => hitungLencana(xp), [xp]);

  const muatUlang = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setIndeksFakta((i) => faktaAcak(i));
    setRefreshing(false);
  }, [onRefresh]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.isi}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={muatUlang} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Profil')} style={styles.avatarWrap}>
            {avatarUrl && !fotoError ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} onError={() => setFotoError(true)} />
            ) : (
              <View style={[styles.avatar, styles.avatarKosong]}>
                <Text style={styles.inisial}>{nickname.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.headerTeks}>
            <Text style={styles.merek}>CODE KANTIN</Text>
            <Text style={styles.sapaan} numberOfLines={1}>Halo, {nickname}! 👋</Text>
          </View>

          <View style={styles.pil}>
            <Text style={styles.pilTeks}>⭐ {points} Poin</Text>
          </View>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerAtas}>
            <View style={styles.bannerTag}>
              <Text style={styles.bannerTagTeks}>KONSEP DASAR CS</Text>
            </View>
            <Text style={styles.bannerLencana} numberOfLines={1}>{lencana.teks}</Text>
          </View>
          <Text style={styles.bannerJudul}>
            Pahami logika antrean (Queue) & tumpukan (Stack) lewat simulasi dapur nyata!
          </Text>
          <View style={styles.progresLatar}>
            <View style={[styles.progresIsi, { width: `${Math.round(lencana.progres * 100)}%` }]} />
          </View>
          <Text style={styles.progresTeks}>{xp} XP terkumpul</Text>
        </View>

        {/* Modul */}
        <Text style={styles.bagian}>Modul Pembelajaran</Text>
        <Text style={styles.bagianSub}>Pilih konsep untuk mulai simulasi interaktif</Text>

        {DAFTAR_MODUL.map((m) => {
          const r = ringkasanModul(m.id);
          return (
            <KartuModul
              key={m.id}
              tag={m.tag}
              tagBg={m.tagBg}
              tagTeks={m.tagTeks}
              judul={m.judul}
              deskripsi={m.deskripsi}
              previewKiri={r.kiri}
              previewKanan={r.kanan}
              tombol={m.tombol}
              warnaTombol={m.warnaTombol}
              onPress={() => navigation.navigate(m.id)}
            />
          );
        })}

        {/* Bandingkan */}
        <View style={styles.kartu}>
          <View style={styles.barisAtas}>
            <View style={[styles.tagKecil, { backgroundColor: warna.hijauMuda }]}>
              <Text style={[styles.tagKecilTeks, { color: '#0F766E' }]}>KOMPARASI LOGIKA</Text>
            </View>
            <Text style={styles.layarPenuh}>Layar Penuh</Text>
          </View>
          <Text style={styles.judulKartu}>Bandingkan Stack vs Queue</Text>
          <Text style={styles.deskripsiKartu}>
            Lihat perbedaan alur data secara berdampingan dalam satu kanvas dapur simultan!
          </Text>

          <View style={styles.duaKolom}>
            <View style={[styles.mini, { backgroundColor: warna.biruMuda, borderColor: '#BAE6FD' }]}>
              <Text style={[styles.miniJudul, { color: warna.biru }]}>QUEUE</Text>
              <Text style={styles.miniOp}>Enqueue • Dequeue</Text>
              <View style={[styles.miniPil, { backgroundColor: '#BAE6FD' }]}>
                <Text style={styles.miniPilTeks}>↔️ Depan & Belakang</Text>
              </View>
              <Text style={styles.miniJumlah}>{CONTOH_ANTREAN.length} elemen</Text>
            </View>
            <View style={[styles.mini, { backgroundColor: warna.oranyeMuda, borderColor: '#FED7AA' }]}>
              <Text style={[styles.miniJudul, { color: '#C2410C' }]}>STACK</Text>
              <Text style={styles.miniOp}>Push • Pop</Text>
              <View style={[styles.miniPil, { backgroundColor: '#FED7AA' }]}>
                <Text style={styles.miniPilTeks}>⬆️ Puncak Saja (TOP)</Text>
              </View>
              <Text style={styles.miniJumlah}>{CONTOH_TUMPUKAN.length} elemen</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.tombolGaris}
            onPress={() => navigation.navigate('Bandingkan')}
            activeOpacity={0.85}
          >
            <Text style={styles.tombolGarisTeks}>Buka Mode Bandingkan</Text>
          </TouchableOpacity>
        </View>

        {/* Tahukah Kamu */}
        <TouchableOpacity
          style={styles.fakta}
          activeOpacity={0.85}
          onPress={() => setIndeksFakta((i) => faktaAcak(i))}
        >
          <Text style={styles.faktaJudul}>💡 Tahukah Kamu?</Text>
          <Text style={styles.faktaIsi}>{FAKTA[indeksFakta]}</Text>
          <Text style={styles.faktaHint}>Ketuk untuk fakta lain</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 18, paddingBottom: 32 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarWrap: { marginRight: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarKosong: { backgroundColor: warna.biru, alignItems: 'center', justifyContent: 'center' },
  inisial: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerTeks: { flex: 1 },
  merek: { fontSize: 12, fontWeight: '800', color: '#B45309', letterSpacing: 1 },
  sapaan: { fontSize: 24, fontWeight: '800', color: warna.teks },
  pil: { backgroundColor: warna.persik, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginLeft: 8 },
  pilTeks: { fontWeight: '700', color: warna.persikTeks, fontSize: 13 },

  banner: { backgroundColor: warna.gelap, borderRadius: 20, padding: 18, marginBottom: 22 },
  bannerAtas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerTag: { backgroundColor: 'rgba(94,234,212,0.18)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  bannerTagTeks: { color: '#5EEAD4', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  bannerLencana: { color: '#94A3B8', fontSize: 11, flex: 1, textAlign: 'right', marginLeft: 8 },
  bannerJudul: { color: '#fff', fontSize: 19, fontWeight: '800', lineHeight: 26, marginTop: 14 },
  progresLatar: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  progresIsi: { height: 6, backgroundColor: '#5EEAD4', borderRadius: 3 },
  progresTeks: { color: '#94A3B8', fontSize: 11, marginTop: 6 },

  bagian: { fontSize: 22, fontWeight: '800', color: warna.teks },
  bagianSub: { color: warna.teksRedup, marginTop: 2, marginBottom: 14, fontSize: 13 },

  kartu: {
    backgroundColor: warna.kartu, borderRadius: 20, borderWidth: 1,
    borderColor: warna.garis, padding: 18, marginBottom: 14,
  },
  barisAtas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagKecil: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  tagKecilTeks: { fontSize: 12, fontWeight: '700' },
  layarPenuh: { color: warna.teksRedup, fontSize: 12 },
  judulKartu: { fontSize: 22, fontWeight: '800', color: warna.teks, marginTop: 14 },
  deskripsiKartu: { color: warna.teksRedup, marginTop: 6, lineHeight: 20 },

  duaKolom: { flexDirection: 'row', gap: 10, marginTop: 14 },
  mini: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center' },
  miniJudul: { fontWeight: '800', fontSize: 13 },
  miniOp: { color: warna.teksRedup, fontSize: 12, marginTop: 4 },
  miniPil: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8 },
  miniPilTeks: { fontSize: 11, fontWeight: '600', color: warna.teks },
  miniJumlah: { color: warna.teksRedup, fontSize: 11, marginTop: 8 },

  tombolGaris: {
    borderRadius: 14, borderWidth: 1, borderColor: warna.garis,
    paddingVertical: 16, alignItems: 'center', marginTop: 12, backgroundColor: '#fff',
  },
  tombolGarisTeks: { fontWeight: '700', fontSize: 16, color: warna.teks },

  fakta: {
    backgroundColor: warna.kotakKode, borderRadius: 20, borderWidth: 1,
    borderColor: '#F5C9B5', padding: 18,
  },
  faktaJudul: { fontWeight: '800', color: '#7C2D12', fontSize: 16, marginBottom: 8 },
  faktaIsi: { color: '#7C2D12', fontWeight: '600', lineHeight: 21 },
  faktaHint: { color: '#B45309', fontSize: 11, marginTop: 10 },
});
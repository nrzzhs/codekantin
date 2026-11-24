import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import Kartu from '../ui/Kartu';
import { font, warna } from '../../lib/tema';
import { WARNA_SIMULASI, type JenisSimulasi } from './nama';

type IdTab = 'kode' | 'data' | 'catatan';

const TAB: { id: IdTab; label: string }[] = [
  { id: 'kode', label: 'Kode' },
  { id: 'data', label: 'Isi Data' },
  { id: 'catatan', label: 'Catatan' },
];

type Props = { kode: ReactNode; data: ReactNode; catatan: ReactNode };

/** Penjelasan panjang di balik tiga tab: Kode, Isi Data, Catatan. */
export default function TabDetail({ kode, data, catatan }: Props) {
  const [aktif, setAktif] = useState<IdTab>('kode');
  const kurangiGerak = useReducedMotion();
  const isi = { kode, data, catatan }[aktif];

  return (
    <View style={styles.wadah}>
      <View style={styles.pemilih} accessibilityRole="tablist">
        {TAB.map((t) => {
          const dipilih = t.id === aktif;
          return (
            <Pressable
              key={t.id}
              onPress={() => setAktif(t.id)}
              style={[styles.tab, dipilih && styles.tabAktif]}
              accessibilityRole="tab"
              accessibilityState={{ selected: dipilih }}
            >
              <Text style={[styles.tabTeks, dipilih && styles.tabTeksAktif]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Animated.View key={aktif} entering={kurangiGerak ? undefined : FadeIn.duration(200)}>
        {isi}
      </Animated.View>
    </View>
  );
}

type CatatanProps = {
  jenis: JenisSimulasi;
  /** Dua kotak ringkas: [masuk, keluar]. */
  kotak: [string, string];
  judul: string;
  teks: string;
};

/** Isi tab Catatan: dua kotak arah masuk/keluar, lalu catatan logika. */
export function KartuCatatan({ jenis, kotak, judul, teks }: CatatanProps) {
  const w = WARNA_SIMULASI[jenis];
  return (
    <Kartu style={styles.catatan}>
      <View style={styles.duaKotak}>
        {kotak.map((k) => (
          <View key={k} style={[styles.kotak, { backgroundColor: w.muda }]}>
            <Text style={[styles.kotakTeks, { color: w.teks }]}>{k}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.catatanJudul} accessibilityRole="header">
        {judul}
      </Text>
      <Text style={styles.catatanTeks}>{teks}</Text>
    </Kartu>
  );
}

const styles = StyleSheet.create({
  wadah: { gap: 12 },
  pemilih: { flexDirection: 'row', backgroundColor: warna.garis, borderRadius: 16, padding: 4 },
  tab: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabAktif: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1F1A17',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabTeks: { fontFamily: font.tebal, fontSize: 14, color: warna.teksRedup },
  tabTeksAktif: { color: warna.teks },

  catatan: { gap: 12 },
  duaKotak: { flexDirection: 'row', gap: 10 },
  kotak: { flex: 1, borderRadius: 12, padding: 10 },
  kotakTeks: { fontFamily: font.judul, fontSize: 13 },
  catatanJudul: { fontFamily: font.judul, fontSize: 15, color: warna.teks },
  catatanTeks: { fontFamily: font.isi, fontSize: 14, lineHeight: 22, color: warna.teksRedup },
});

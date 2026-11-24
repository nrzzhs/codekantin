import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import KokiPiri from '../ilustrasi/KokiPiri';
import type { Snapshot } from '../../hooks/useSimulator';
import { font, warna } from '../../lib/tema';
import { pisahNama, type JenisSimulasi } from './nama';

type Props = {
  jenis: JenisSimulasi;
  snap: Snapshot;
  /** Berubah setiap tampilan simulasi berubah (operasi baru atau replay). */
  kunci: number;
  /** Naikkan untuk membuat Koki Piri melompat kecil (saat galat). */
  lompatan: number;
};

type Suasana = 'siap' | 'ok' | 'galat';

const GAYA: Record<Suasana, { latar: string; garis: string; kode: string }> = {
  siap: { latar: '#FFFFFF', garis: warna.garis, kode: warna.teksRedup },
  ok: { latar: '#F0FDF4', garis: '#86EFAC', kode: warna.hijauTua },
  galat: { latar: '#FEF2F2', garis: '#FCA5A5', kode: '#B91C1C' },
};

/** Kode operasi dan kalimat santai untuk snapshot yang sedang tampil. */
function isiReaksi(jenis: JenisSimulasi, s: Snapshot): { suasana: Suasana; kode: string; kalimat: string } {
  const antrean = jenis === 'antrean';
  if (!s.op) {
    return {
      suasana: 'siap',
      kode: 'Siap!',
      kalimat: antrean
        ? 'Tekan Enqueue untuk memanggil pelanggan.'
        : 'Tekan Push untuk menaruh piring.',
    };
  }
  if (s.galat) {
    const kalimat =
      s.galat === 'overflow'
        ? antrean
          ? 'Waduh, antrean penuh! Layani pelanggan dulu.'
          : 'Waduh, rak penuh! Ambil piring dulu dengan pop.'
        : antrean
          ? 'Antrean kosong, tidak ada yang dilayani.'
          : 'Rak kosong, tidak ada piring yang bisa diambil.';
    return { suasana: 'galat', kode: s.galat.toUpperCase(), kalimat };
  }
  let kalimat: string;
  if (antrean) {
    const elemen = s.op === 'tambah' ? s.isi[s.isi.length - 1] : s.keluar;
    const nama = elemen ? pisahNama(elemen).nama : 'Pelanggan';
    kalimat =
      s.op === 'tambah'
        ? `${nama} masuk di REAR. Antre dulu, ya!`
        : `${nama} dilayani duluan karena datang paling awal.`;
  } else {
    kalimat =
      s.op === 'tambah' ? 'Piring baru ditaruh paling atas (TOP).' : 'Yang terakhir ditaruh, diambil duluan!';
  }
  return { suasana: 'ok', kode: s.pesan, kalimat };
}

/** Koki Piri bereaksi terhadap operasi terakhir lewat gelembung bicara. */
export default function ReaksiPiri({ jenis, snap, kunci, lompatan }: Props) {
  const { suasana, kode, kalimat } = isiReaksi(jenis, snap);
  const g = GAYA[suasana];
  const kurangiGerak = useReducedMotion();

  // Gelembung muncul dari skala 0,9 setiap kali pesan berganti
  const skala = useSharedValue(1);
  useEffect(() => {
    if (kurangiGerak) return;
    skala.set(0.9);
    skala.set(withTiming(1, { duration: 250 }));
  }, [kunci, kurangiGerak, skala]);
  const gayaGelembung = useAnimatedStyle(() => ({ transform: [{ scale: skala.get() }] }));

  return (
    <View
      style={styles.baris}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Koki Piri: ${kode}. ${kalimat}`}
    >
      <KokiPiri
        ukuran={56}
        lompatan={lompatan}
        tinggiLompat={8}
        ekspresi={suasana === 'galat' ? 'kaget' : 'senang'}
      />
      <Animated.View
        style={[styles.gelembung, { backgroundColor: g.latar, borderColor: g.garis }, gayaGelembung]}
      >
        <Text style={[styles.kode, { color: g.kode }]}>{kode}</Text>
        <Text style={styles.kalimat}>{kalimat}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  baris: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gelembung: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 2,
  },
  kode: { fontFamily: font.kodeTebal, fontSize: 13 },
  kalimat: { fontFamily: font.tebal, fontSize: 13, lineHeight: 19, color: warna.teks },
});

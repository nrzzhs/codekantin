import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { font, warna } from '../lib/tema';
import { barisPseudocode, jejakBaris } from '../logic/pseudocode';
import type { GalatSim, OperasiSim } from '../logic/pseudocode';
import type { JenisStruktur } from '../logic/simulasi';

type Props = {
  jenis: JenisStruktur;
  op: OperasiSim | null | undefined;
  galat: GalatSim | undefined;
  kunci: number; // berubah setiap tampilan berubah, memicu pemutaran sorotan
  aksen: string; // warna sorotan baris yang sedang dieksekusi
};

const JEDA = 450; // ms antar baris
const MERAH = '#B91C1C';

export default function PanelPseudocode({ jenis, op, galat, kunci, aksen }: Props) {
  const operasi: OperasiSim = op ?? 'tambah';
  const baris = barisPseudocode(jenis, operasi);
  const jejak = op ? jejakBaris(jenis, op, galat) : [];

  // Hormati pengaturan "hapus animasi" di HP
  const kurangGerak = useReducedMotion();
  const [tahap, setTahap] = useState(jejak.length); // berapa baris jejak yang sudah menyala
  const [kunciTerakhir, setKunciTerakhir] = useState(kunci);
  const pertama = useRef(true);

  // Saat kunci berubah (operasi baru atau langkah replay), mulai ulang dari baris pertama.
  // Disesuaikan saat render, bukan di dalam effect, supaya tidak memicu render berantai.
  if (kunci !== kunciTerakhir) {
    setKunciTerakhir(kunci);
    setTahap(kurangGerak || jejak.length === 0 ? jejak.length : 0);
  }

  // Putar sorotan baris demi baris
  useEffect(() => {
    if (pertama.current) {
      pertama.current = false; // tampilan awal (data tersimpan) langsung menyala penuh
      return;
    }
    if (kurangGerak || jejak.length === 0) return;
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      setTahap(n);
      if (n >= jejak.length) clearInterval(timer);
    }, JEDA);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci]);

  const menyala = jejak.slice(0, tahap);
  const barisSekarang = tahap > 0 ? jejak[tahap - 1] : -1;
  const selesai = tahap >= jejak.length;
  const nama = baris[0].replace('prosedur ', '');

  let status = 'Jalankan satu operasi untuk melihat baris kode yang dieksekusi.';
  if (op) {
    if (tahap === 0) status = 'Memulai eksekusi...';
    else if (!selesai) status = `Mengeksekusi baris ${barisSekarang + 1}...`;
    else if (galat) status = `Berhenti di baris ${barisSekarang + 1}: ${galat}.`;
    else status = 'Selesai: operasi berhasil.';
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.judul}>{nama}</Text>

      {baris.map((teks, i) => {
        const sekarang = i === barisSekarang;
        const sudah = menyala.includes(i);
        const merah = sekarang && !!galat && selesai;
        const keadaan = sekarang ? (merah ? 'galat' : 'aktif') : sudah ? 'sudah' : 'lewat';
        return (
          <View
            key={`${i}-${teks}`}
            style={[
              styles.baris,
              keadaan === 'sudah' && styles.barisSudah,
              keadaan === 'aktif' && { backgroundColor: aksen },
              keadaan === 'galat' && { backgroundColor: MERAH },
            ]}
            accessibilityLabel={`Baris ${i + 1}: ${teks.trim()}${sekarang ? ', sedang dijalankan' : ''}`}
          >
            <Text style={[styles.no, keadaan === 'sudah' && styles.noSudah, sekarang && styles.teksSekarang]}>
              {i + 1}
            </Text>
            <Text
              style={[
                styles.teks,
                keadaan === 'sudah' && styles.teksSudah,
                sekarang && styles.teksSekarang,
              ]}
            >
              {teks}
            </Text>
          </View>
        );
      })}

      <Text style={[styles.status, galat && selesai && op ? styles.statusGalat : null]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: warna.gelap, borderRadius: 20, padding: 14, gap: 4 },
  judul: { fontFamily: font.kodeTebal, fontSize: 13, color: '#5EEAD4', marginBottom: 6 },
  baris: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  barisSudah: { backgroundColor: '#1E293B' },
  no: { width: 20, fontFamily: font.kode, fontSize: 12, lineHeight: 18, color: '#7C8BA1' },
  noSudah: { color: '#94A3B8' },
  teks: { flex: 1, fontFamily: font.kode, fontSize: 13, lineHeight: 18, color: '#7C8BA1' },
  teksSudah: { color: '#E2E8F0' },
  teksSekarang: { fontFamily: font.kodeTebal, color: '#FFFFFF' },
  status: { fontFamily: font.isi, fontSize: 12, color: '#94A3B8', marginTop: 8 },
  statusGalat: { color: '#FCA5A5' },
});

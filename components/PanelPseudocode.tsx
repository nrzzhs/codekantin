import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, View, Text, StyleSheet } from 'react-native';
import { warna, fontKode } from '../lib/tema';
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

export default function PanelPseudocode({ jenis, op, galat, kunci, aksen }: Props) {
  const operasi: OperasiSim = op ?? 'tambah';
  const baris = barisPseudocode(jenis, operasi);
  const jejak = op ? jejakBaris(jenis, op, galat) : [];

  const [kurangGerak, setKurangGerak] = useState(false);
  const [tahap, setTahap] = useState(jejak.length); // berapa baris jejak yang sudah menyala
  const pertama = useRef(true);

  // Hormati pengaturan "hapus animasi" di HP
  useEffect(() => {
    let batal = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (!batal) setKurangGerak(v);
      })
      .catch(() => {});
    const langganan = AccessibilityInfo.addEventListener('reduceMotionChanged', setKurangGerak);
    return () => {
      batal = true;
      langganan.remove();
    };
  }, []);

  // Putar sorotan baris demi baris setiap ada operasi baru atau langkah replay
  useEffect(() => {
    if (pertama.current) {
      pertama.current = false;
      setTahap(jejak.length);
      return;
    }
    if (kurangGerak || jejak.length === 0) {
      setTahap(jejak.length);
      return;
    }
    setTahap(0);
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
      <Text style={styles.judul}>PSEUDOCODE • {nama}</Text>

      {baris.map((teks, i) => {
        const sekarang = i === barisSekarang;
        const sudah = menyala.includes(i);
        const merah = sekarang && !!galat && selesai;
        return (
          <View
            key={`${i}-${teks}`}
            style={[
              styles.baris,
              sudah && styles.barisSudah,
              sekarang && { backgroundColor: merah ? '#B91C1C' : aksen },
            ]}
          >
            <Text style={styles.no}>{i + 1}</Text>
            <Text style={[styles.teks, sudah && styles.teksSudah, sekarang && styles.teksSekarang]}>
              {teks}
            </Text>
          </View>
        );
      })}

      <Text style={[styles.status, galat && selesai && op ? styles.statusGalat : null]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: warna.gelap, borderRadius: 16, padding: 16, marginTop: 8 },
  judul: { color: '#5EEAD4', fontWeight: '800', fontSize: 12, marginBottom: 10, letterSpacing: 0.5 },
  baris: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderRadius: 6 },
  barisSudah: { backgroundColor: 'rgba(255,255,255,0.08)' },
  no: { width: 20, color: '#64748B', fontFamily: fontKode, fontSize: 12 },
  teks: { flex: 1, color: '#64748B', fontFamily: fontKode, fontSize: 13 },
  teksSudah: { color: '#E2E8F0' },
  teksSekarang: { color: '#fff', fontWeight: '700' },
  status: { color: '#94A3B8', fontSize: 12, marginTop: 10 },
  statusGalat: { color: '#FCA5A5' },
});
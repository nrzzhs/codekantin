import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import SakelarAktif from './SakelarAktif';
import { WARNA_TINGKAT, uraikanPerintah, warnaPerintah } from './perintah';
import type { BarisKelola, RingkasanSoal } from '../../logic/formSoal';
import { bayanganKartu, font, warna } from '../../lib/tema';

type Props = {
  soal: BarisKelola;
  ringkas: RingkasanSoal;
  sibuk: boolean;
  onUbahAktif: (nilai: boolean) => void;
  onUbah: () => void;
  onHapus: () => void;
};

const MAKS_CHIP = 8;

/** Kartu satu soal guru: chip jenis/struktur/tingkat, cuplikan perintah, sakelar aktif, ubah & hapus. */
export default function KartuSoalGuru({ soal, ringkas, sibuk, onUbahAktif, onUbah, onHapus }: Props) {
  const simulasi = soal.jenis === 'simulasi';
  const struktur = soal.struktur === 'queue' ? 'queue' : 'stack';
  const strip = !simulasi ? warna.ungu : struktur === 'stack' ? warna.oranye : warna.biru;
  const ops = Array.isArray(soal.operasi) ? soal.operasi : [];
  const jumlahPilihan = Array.isArray(soal.pilihan) ? soal.pilihan.length : 0;
  const tingkat = soal.tingkat ?? 'sedang';
  const wt = WARNA_TINGKAT[tingkat] ?? WARNA_TINGKAT.sedang;

  return (
    <View style={[styles.kartu, !soal.aktif && styles.mati]}>
      <View style={[styles.strip, { backgroundColor: strip }]} />

      <View style={styles.barisChip}>
        <Chip teks={ringkas.jenisLabel} latar={warna.unguMuda} warnaTeks={warna.ungu} />
        {simulasi && (
          <Chip
            teks={struktur === 'stack' ? 'Stack · LIFO' : 'Queue · FIFO'}
            latar={struktur === 'stack' ? warna.oranyeMuda : warna.biruMuda}
            warnaTeks={struktur === 'stack' ? warna.persikTeks : warna.biru}
          />
        )}
        {simulasi && <Chip teks={tingkat} latar={wt.latar} warnaTeks={wt.teks} />}
      </View>

      <Text style={styles.judul}>{ringkas.judul}</Text>

      <View
        style={styles.barisPerintah}
        accessible
        accessibilityLabel={simulasi ? `${ops.length} perintah: ${ops.join(', ')}` : ringkas.rincian}
      >
        {simulasi ? (
          <>
            {ops.slice(0, MAKS_CHIP).map((op, i) => {
              const info = uraikanPerintah(op);
              const w = warnaPerintah(info.jenis, struktur);
              return (
                <View key={`${op}-${i}`} style={[styles.chipKode, { backgroundColor: w.latar }]}>
                  <Text style={[styles.chipKodeTeks, { color: w.teks }]}>{info.label}</Text>
                </View>
              );
            })}
            {ops.length > MAKS_CHIP && <Text style={styles.sisa}>+{ops.length - MAKS_CHIP}</Text>}
          </>
        ) : (
          <>
            <View style={[styles.chipKode, { backgroundColor: warna.unguMuda }]}>
              <Text style={[styles.chipKodeTeks, { color: warna.ungu }]}>
                {jumlahPilihan} pilihan · A–{String.fromCharCode(64 + Math.max(1, jumlahPilihan))}
              </Text>
            </View>
            <Text style={styles.jawaban} numberOfLines={1}>
              {ringkas.rincian}
            </Text>
          </>
        )}
      </View>

      <View style={styles.bawah}>
        <View style={styles.kiri}>
          <SakelarAktif nilai={soal.aktif} onUbah={onUbahAktif} nonaktif={sibuk} />
        </View>
        <TombolIkon ikon="create-outline" label="Ubah" warnaIkon={warna.teks} garis={warna.garis} onPress={onUbah} nonaktif={sibuk} />
        <TombolIkon ikon="trash-outline" label="Hapus" warnaIkon="#B91C1C" garis="#FECACA" onPress={onHapus} nonaktif={sibuk} />
      </View>
    </View>
  );
}

function Chip({ teks, latar, warnaTeks }: { teks: string; latar: string; warnaTeks: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: latar }]}>
      <Text style={[styles.chipTeks, { color: warnaTeks }]}>{teks}</Text>
    </View>
  );
}

function TombolIkon({
  ikon,
  label,
  warnaIkon,
  garis,
  onPress,
  nonaktif,
}: {
  ikon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  warnaIkon: string;
  garis: string;
  onPress: () => void;
  nonaktif: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={nonaktif}
      style={({ pressed }) => [
        styles.tombolIkon,
        { borderColor: garis },
        pressed && { backgroundColor: warna.kotakKode },
        nonaktif && { opacity: 0.5 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: nonaktif }}
    >
      <Ionicons name={ikon} size={20} color={warnaIkon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kartu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 14,
    paddingRight: 14,
    paddingBottom: 14,
    paddingLeft: 20,
    gap: 10,
    overflow: 'hidden',
    ...bayanganKartu,
  },
  mati: { opacity: 0.7 },
  strip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  barisChip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  chipTeks: { fontFamily: font.judul, fontSize: 11 },
  judul: { fontFamily: font.judul, fontSize: 16, lineHeight: 22, color: warna.teks },
  barisPerintah: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  chipKode: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  chipKodeTeks: { fontFamily: font.kodeTebal, fontSize: 11 },
  sisa: { fontFamily: font.tebal, fontSize: 12, color: warna.teksRedup },
  jawaban: { flex: 1, fontFamily: font.isi, fontSize: 13, color: warna.teksRedup },
  bawah: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: warna.garis,
    paddingTop: 10,
  },
  kiri: { flex: 1 },
  tombolIkon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

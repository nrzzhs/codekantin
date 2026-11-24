import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import { View, Text, ScrollView, StyleSheet, AccessibilityInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../lib/supabase';
import { font, warna } from '../lib/tema';
import { useTebak, useRiwayatTebak } from '../context/SimulatorContext';
import type { SesiTebak, HasilSoal } from '../context/SimulatorContext';
import { cariSoal as cariSoalBank, BANK_SOAL } from '../data/soal';
import { susunSesi } from '../logic/sesi';
import { useBankSoal } from '../context/BankSoalContext';
import type { Soal, SoalSimulasi, SoalPilihanGanda } from '../data/soal';
import { INFO_MISKONSEPSI } from '../data/miskonsepsi';
import type { Miskonsepsi } from '../data/miskonsepsi';
import {
  hitungKunci,
  pilihanJawaban,
  periksaSimulasi,
  periksaPilihanGanda,
} from '../logic/tebak';
import {
  BONUS_XP_SEMPURNA,
  XP_PER_BENAR,
  hitungHadiah,
  ringkasRiwayat,
  tambahCatatan,
  tandaiTersinkron,
} from '../logic/hadiah';
import type { HasilRingkas } from '../logic/hadiah';
import Kartu from '../components/ui/Kartu';
import Tombol from '../components/ui/Tombol';
import PanggungPembuka from '../components/tebak/PanggungPembuka';
import KepalaSoal from '../components/tebak/KepalaSoal';
import KartuAlur from '../components/tebak/KartuAlur';
import SlotJawaban from '../components/tebak/SlotJawaban';
import TokenPilihan from '../components/tebak/TokenPilihan';
import PilihanGanda from '../components/tebak/PilihanGanda';
import LembarUmpanBalik from '../components/tebak/LembarUmpanBalik';
import {
  KartuDiagnosis,
  KartuJuara,
  KartuTanpaMiskonsepsi,
  KotakHadiah,
} from '../components/tebak/HasilTebak';

// Jumlah soal per sesi mengikuti susunan di logic/sesi.ts (tidak ditulis ulang di sini)
const JUMLAH_SOAL = susunSesi(BANK_SOAL, []).idSoal.length;

const ISI_TANTANGAN =
  '5 soal: 3 simulasi urutan keluar dan 2 pilihan ganda. Tingkat naik bertahap: mudah, sedang, menantang. ' +
  'Tiap jawaban benar +10 XP, semua benar bonus +20 XP. Poin hingga +20, sesuai jumlah jawaban benar.';

const TINGKAT = [
  { teks: 'mudah', latar: '#CCFBF1', warna: '#166534' },
  { teks: 'sedang', latar: '#FFEDD5', warna: '#9A3412' },
  { teks: 'menantang', latar: '#FEE2E2', warna: '#B91C1C' },
];

function buatDraft(soal: Soal | undefined): (string | null)[] {
  if (!soal) return [];
  if (soal.jenis === 'pilihan-ganda') return [null];
  return Array.from({ length: hitungKunci(soal).keluar.length }, () => null);
}

function namaItem(soal: SoalSimulasi, x: string): string {
  if (x.length > 2) return x;
  return soal.struktur === 'stack' ? `Piring ${x}` : `Pelanggan ${x}`;
}

function buatIdSesi(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function ringkasHasil(h: HasilSoal): HasilRingkas {
  return { idSoal: h.idSoal, benar: h.benar, miskonsepsi: h.miskonsepsi };
}

function namaMiskonsepsi(jenis: string): string {
  return INFO_MISKONSEPSI[jenis as Miskonsepsi]?.judul ?? jenis;
}

type Props = { onProfilBerubah: () => Promise<void> };

export default function TebakScreen({ onProfilBerubah }: Props) {
  const { nilai: sesi, setNilai: setSesi, siap } = useTebak();
  const { siap: bankSiap, muatUlang } = useBankSoal();
  const [memulai, setMemulai] = useState(false);
  const [lihatRiwayat, setLihatRiwayat] = useState(false);
  // Soal guru dibaca dari salinan di sesi, supaya tidak berubah di tengah jalan
  const cariSoal = (id: string) => sesi?.soalSesi?.[id] ?? cariSoalBank(id);
  const { nilai: riwayatMentah, setNilai: setRiwayat, siap: riwayatSiap } = useRiwayatTebak();

  const riwayat = Array.isArray(riwayatMentah) ? riwayatMentah : [];
  const riwayatRef = useRef(riwayat);
  riwayatRef.current = riwayat;

  const [mengirim, setMengirim] = useState(false);
  const [galatKirim, setGalatKirim] = useState<string | null>(null);
  const sedangKirim = useRef(false);

  // Sesi tersimpan dianggap tidak valid kalau soalnya sudah tidak ada di bank
  const sesiAktif: SesiTebak | null =
    sesi &&
    typeof sesi.sesiId === 'string' &&
    Array.isArray(sesi.idSoal) &&
    Array.isArray(sesi.hasil) &&
    Array.isArray(sesi.draft) &&
    sesi.idSoal.length > 0 &&
    sesi.idSoal.every((id) => cariSoal(id))
      ? sesi
      : null;

  const selesai = !!sesiAktif && sesiAktif.indeks >= sesiAktif.idSoal.length;
  const jumlahTertunda = riwayat.filter((c) => !c.tersinkron).length;

  // Kirim semua hasil sesi yang belum tercatat di Supabase (aman dipanggil berulang)
  const kirimTertunda = useCallback(async () => {
    if (sedangKirim.current) return;
    const tertunda = riwayatRef.current.filter((c) => !c.tersinkron);
    if (tertunda.length === 0) return;

    sedangKirim.current = true;
    setMengirim(true);
    setGalatKirim(null);
    let adaBerhasil = false;
    try {
      for (const c of tertunda) {
        const { error } = await supabase.rpc('selesaikan_sesi_tebak', {
          p_sesi_id: c.sesiId,
          p_hasil: c.hasil,
        });
        if (error) {
          setGalatKirim(error.message);
          break;
        }
        adaBerhasil = true;
        setRiwayat((r) => tandaiTersinkron(r, c.sesiId));
      }
    } catch (e: any) {
      setGalatKirim(e?.message ?? 'Koneksi bermasalah.');
    } finally {
      sedangKirim.current = false;
      setMengirim(false);
    }
    if (adaBerhasil) await onProfilBerubah();
  }, [setRiwayat, onProfilBerubah]);

  // Saat sesi selesai, catat ke riwayat (tidak akan ganda karena dicek lewat sesiId)
  useEffect(() => {
    if (!selesai || !sesiAktif || !riwayatSiap) return;
    setRiwayat((r) =>
      tambahCatatan(r, {
        sesiId: sesiAktif.sesiId,
        waktu: new Date().toISOString(),
        hasil: sesiAktif.hasil.map(ringkasHasil),
        tersinkron: false,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selesai, sesiAktif?.sesiId, riwayatSiap]);

  // Kirim otomatis kalau ada hasil yang belum tersimpan
  useEffect(() => {
    if (riwayatSiap && jumlahTertunda > 0) kirimTertunda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riwayatSiap, jumlahTertunda]);

  async function mulai() {
    if (!siap || !bankSiap || memulai) return;
    setMemulai(true);
    try {
      // Coba ambil soal guru terbaru (maksimal 2 detik), kalau gagal pakai salinan di HP
      const soalGuru = await muatUlang(2000);
      const { idSoal, soalSesi } = susunSesi(BANK_SOAL, soalGuru);
      const pertama = soalSesi[idSoal[0]] ?? cariSoalBank(idSoal[0]);
      setSesi({
        sesiId: buatIdSesi(),
        soalSesi,
        idSoal,
        indeks: 0,
        hasil: [],
        draft: buatDraft(pertama),
        diperiksa: false,
      });
    } finally {
      setMemulai(false);
    }
  }

  function isiSlot(nilai: string) {
    if (!siap || !sesiAktif || sesiAktif.diperiksa) return;
    const posisi = sesiAktif.draft.indexOf(null);
    if (posisi === -1) return;
    const draft = [...sesiAktif.draft];
    draft[posisi] = nilai;
    setSesi({ ...sesiAktif, draft });
  }

  function kosongkanSlot(i: number) {
    if (!siap || !sesiAktif || sesiAktif.diperiksa) return;
    const draft = [...sesiAktif.draft];
    draft[i] = null;
    setSesi({ ...sesiAktif, draft });
  }

  function pilihPG(id: string) {
    if (!siap || !sesiAktif || sesiAktif.diperiksa) return;
    setSesi({ ...sesiAktif, draft: [id] });
  }

  function periksa(soal: Soal) {
    if (!siap || !sesiAktif || sesiAktif.diperiksa) return;
    let hasil: HasilSoal;
    if (soal.jenis === 'simulasi') {
      const p = periksaSimulasi(soal, sesiAktif.draft);
      hasil = {
        idSoal: soal.id,
        jawaban: sesiAktif.draft.filter((x): x is string => x !== null),
        benar: p.benar,
        miskonsepsi: p.miskonsepsi,
      };
    } else {
      const id = sesiAktif.draft[0];
      if (!id) return;
      const p = periksaPilihanGanda(soal, id);
      hasil = { idSoal: soal.id, jawaban: [id], benar: p.benar, miskonsepsi: p.miskonsepsi };
    }
    setSesi({ ...sesiAktif, hasil: [...sesiAktif.hasil, hasil], diperiksa: true });

    // Umpan balik tampilan saja: getar dan pengumuman untuk pembaca layar
    Haptics.notificationAsync(
      hasil.benar ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {});
    AccessibilityInfo.announceForAccessibility(
      hasil.benar ? `Benar sekali! Tambah ${XP_PER_BENAR} XP.` : 'Belum tepat. Lihat penjelasan Koki.',
    );
  }

  function berikutnya() {
    if (!sesiAktif) return;
    const indeksBaru = sesiAktif.indeks + 1;
    const soalBaru =
      indeksBaru < sesiAktif.idSoal.length ? cariSoal(sesiAktif.idSoal[indeksBaru]) : undefined;
    setSesi({ ...sesiAktif, indeks: indeksBaru, draft: buatDraft(soalBaru), diperiksa: false });
  }

  const ringkas = ringkasRiwayat(riwayat);

  function renderRiwayat() {
    if (ringkas.sesi === 0) return null;
    return (
      <View style={styles.riwayat}>
        <Tombol
          label={lihatRiwayat ? 'Tutup Riwayat' : 'Lihat Riwayat'}
          varian="sekunder"
          ikon="time-outline"
          onPress={() => setLihatRiwayat((v) => !v)}
          accessibilityHint={lihatRiwayat ? undefined : 'Menampilkan ringkasan semua sesimu'}
        />
        {lihatRiwayat && (
          <Kartu style={styles.kartuRiwayat}>
            <Text style={styles.isiTeks}>
              {ringkas.sesi} sesi · akurasi {ringkas.akurasi}% ({ringkas.benar}/{ringkas.total} soal benar)
            </Text>
            {ringkas.miskonsepsi.length > 0 && (
              <>
                <Text style={styles.petunjuk}>Miskonsepsi yang paling sering muncul:</Text>
                {ringkas.miskonsepsi.slice(0, 3).map((m) => (
                  <Text key={m.jenis} style={styles.butir}>
                    • {namaMiskonsepsi(m.jenis)} ({m.jumlah}x)
                  </Text>
                ))}
              </>
            )}
          </Kartu>
        )}
      </View>
    );
  }

  // ===== 1. Belum mulai =====
  if (!sesiAktif) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.isi}>
          <PanggungPembuka />

          <View style={styles.judulBlok}>
            <Text style={styles.labelUngu}>MODE TEBAK</Text>
            <Text style={styles.judulBesar} accessibilityRole="header">
              Prediksi dulu, baru lihat jawabannya
            </Text>
          </View>

          <View style={styles.infoBaris}>
            <KotakInfo ikon="document-text-outline" warnaIkon={warna.ungu} angka={`${JUMLAH_SOAL}`} label="soal" />
            <KotakInfo
              ikon="checkmark-circle-outline"
              warnaIkon={warna.hijau}
              angka={`+${XP_PER_BENAR} XP`}
              label="per benar"
            />
            <KotakInfo ikon="star" warnaIkon={warna.oranye} angka={`+${BONUS_XP_SEMPURNA}`} label="bonus" />
          </View>

          <View
            style={styles.tingkat}
            accessible
            accessibilityLabel="Tingkat soal naik bertahap: mudah, sedang, lalu menantang"
          >
            <Text style={styles.tingkatLabel}>Tingkat:</Text>
            {TINGKAT.map((t, i) => (
              <View key={t.teks} style={styles.tingkatItem}>
                {i > 0 && <Ionicons name="chevron-forward" size={14} color={warna.teksRedup} />}
                <View style={[styles.pilTingkat, { backgroundColor: t.latar }]}>
                  <Text style={[styles.pilTingkatTeks, { color: t.warna }]}>{t.teks}</Text>
                </View>
              </View>
            ))}
          </View>

          {jumlahTertunda > 0 && (
            <View style={styles.peringatan}>
              <Ionicons name="cloud-offline-outline" size={20} color="#C2410C" />
              <View style={styles.kolom}>
                <Text style={styles.peringatanIsi}>
                  {jumlahTertunda} hasil sesi belum tersimpan ke akunmu.
                  {mengirim ? ' Sedang dikirim...' : ''}
                </Text>
                {!mengirim && (
                  <Text style={styles.tautan} onPress={kirimTertunda} accessibilityRole="button" suppressHighlighting>
                    Kirim sekarang
                  </Text>
                )}
              </View>
            </View>
          )}

          {renderRiwayat()}

          <Tombol
            label={siap && !memulai ? 'Mulai Tantangan' : 'Memuat...'}
            varian="tebak"
            ikon="play"
            tinggi={60}
            sudut={20}
            onPress={mulai}
            nonaktif={!siap}
            memuat={memulai}
            accessibilityHint={ISI_TANTANGAN}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const total = sesiAktif.idSoal.length;

  // ===== 2. Hasil akhir =====
  if (sesiAktif.indeks >= total) {
    const hasil = sesiAktif.hasil;
    const jumlahBenarSesi = hasil.filter((h) => h.benar).length;
    const hadiah = hitungHadiah(jumlahBenarSesi, total);
    const catatan = riwayat.find((c) => c.sesiId === sesiAktif.sesiId);
    const jenisMiskonsepsi = Array.from(
      new Set(hasil.map((h) => h.miskonsepsi).filter((m): m is Miskonsepsi => m !== null)),
    );

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.isi}>
          <KartuJuara benar={jumlahBenarSesi} total={total} />

          <View style={styles.hadiahBaris}>
            <KotakHadiah nilai={hadiah.xp} label="XP didapat" warnaAngka={warna.hijauTua} />
            <KotakHadiah
              nilai={hadiah.poin}
              label="poin"
              warnaAngka={warna.persikTeks}
              ikon="star"
              warnaIkon={warna.oranye}
            />
          </View>

          <View style={styles.status} accessibilityLiveRegion="polite">
            {catatan?.tersinkron ? (
              <>
                <Ionicons name="checkmark-circle" size={18} color={warna.hijau} />
                <Text style={[styles.statusTeks, { color: warna.hijauTeks }]}>Sudah tersimpan ke akunmu.</Text>
              </>
            ) : mengirim ? (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color={warna.teksRedup} />
                <Text style={styles.statusTeks}>Menyimpan ke akunmu...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-offline-outline" size={18} color="#B91C1C" />
                <View style={styles.kolom}>
                  <Text style={[styles.statusTeks, { color: '#B91C1C' }]}>
                    Belum tersimpan{galatKirim ? ` (${galatKirim})` : ''}. Hasilmu aman di HP dan akan dikirim
                    ulang.
                  </Text>
                  <Text style={styles.tautan} onPress={kirimTertunda} accessibilityRole="button" suppressHighlighting>
                    Coba simpan lagi
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.bagian}>
            <Text style={styles.judulBagian} accessibilityRole="header">
              Diagnosis sesi ini
            </Text>
            {jenisMiskonsepsi.length === 0 ? (
              <KartuTanpaMiskonsepsi
                sempurna={jumlahBenarSesi === total}
                teks={
                  jumlahBenarSesi === total
                    ? 'Tidak ada miskonsepsi terdeteksi. Mantap!'
                    : 'Tidak ada pola miskonsepsi khusus yang terdeteksi. Coba telusuri langkah demi langkah dengan tabel jejak.'
                }
              />
            ) : (
              jenisMiskonsepsi.map((m) => {
                const info = INFO_MISKONSEPSI[m];
                const kali = hasil.filter((h) => h.miskonsepsi === m).length;
                return (
                  <KartuDiagnosis
                    key={m}
                    judul={`${info.judul} (${kali}x)`}
                    teks={`${info.penjelasan} ${info.perbaikan}`}
                  />
                );
              })
            )}
          </View>

          {renderRiwayat()}

          <Tombol
            label="Main Lagi"
            varian="tebak"
            ikon="refresh"
            tinggi={56}
            sudut={20}
            onPress={mulai}
            memuat={memulai}
            accessibilityHint="Mulai sesi baru dengan soal baru"
          />
          <Text style={styles.sumber}>Soal disusun dari Modul Materi Stack dan Queue CodeKantin.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== 3. Mengerjakan soal =====
  const soal = cariSoal(sesiAktif.idSoal[sesiAktif.indeks]);
  if (!soal) return null;

  const hasilIni = sesiAktif.diperiksa ? sesiAktif.hasil[sesiAktif.indeks] : undefined;
  const lengkap = sesiAktif.draft.length > 0 && sesiAktif.draft.every((x) => x !== null);
  const terakhir = sesiAktif.indeks === total - 1;

  const chip =
    soal.jenis === 'pilihan-ganda'
      ? { teks: 'PILIHAN GANDA', latar: warna.unguMuda, warna: warna.ungu }
      : soal.struktur === 'stack'
        ? { teks: 'PREDIKSI · STACK (LIFO)', latar: warna.oranyeMuda, warna: warna.persikTeks }
        : { teks: 'PREDIKSI · QUEUE (FIFO)', latar: warna.biruMuda, warna: warna.biru };

  function renderSimulasi(s: SoalSimulasi, sesiIni: SesiTebak) {
    const kunci = hitungKunci(s);
    const opsi = pilihanJawaban(s);
    const tunggal = sesiIni.draft.length === 1;
    return (
      <>
        <KartuAlur struktur={s.struktur} konteks={s.konteks} operasi={s.operasi} />

        <Text style={styles.pertanyaan} accessibilityRole="header">
          {s.struktur === 'stack'
            ? 'Piring mana yang keluar, dan dalam urutan apa?'
            : 'Pelanggan mana yang dilayani, dan dalam urutan apa?'}
        </Text>

        <View style={styles.slot}>
          {sesiIni.draft.map((isi, i) => {
            const status = sesiIni.diperiksa ? (isi === kunci.keluar[i] ? 'benar' : 'salah') : null;
            return (
              <SlotJawaban
                key={`slot-${i}`}
                struktur={s.struktur}
                urutan={i}
                isi={isi}
                namaIsi={isi === null ? null : namaItem(s, isi)}
                urutanPilihan={isi === null ? 0 : opsi.indexOf(isi)}
                status={status}
                tunggal={tunggal}
                nonaktif={sesiIni.diperiksa}
                onPress={() => kosongkanSlot(i)}
              />
            );
          })}
        </View>

        <Text style={styles.petunjuk}>Pilihan (ketuk slot yang terisi untuk membatalkan):</Text>
        <View style={styles.token}>
          {opsi.map((o, i) => (
            <TokenPilihan
              key={o}
              struktur={s.struktur}
              nilai={o}
              urutan={i}
              label={namaItem(s, o)}
              dipakai={sesiIni.draft.includes(o)}
              nonaktif={sesiIni.diperiksa}
              onPress={() => isiSlot(o)}
            />
          ))}
        </View>
      </>
    );
  }

  function renderPilihanGanda(s: SoalPilihanGanda, sesiIni: SesiTebak) {
    return (
      <PilihanGanda soal={s} dipilih={sesiIni.draft[0] ?? null} diperiksa={sesiIni.diperiksa} onPilih={pilihPG} />
    );
  }

  function renderUmpanBalik(s: Soal, h: HasilSoal) {
    const info = h.miskonsepsi ? INFO_MISKONSEPSI[h.miskonsepsi] : null;
    const labelTombol = terakhir ? 'Lihat Hasil' : `Soal Berikutnya (${sesiAktif!.indeks + 2}/${total})`;

    if (s.jenis === 'simulasi') {
      const kunci = hitungKunci(s);
      const ringkasTeks = `Urutan keluar yang benar: ${kunci.keluar.map((x) => namaItem(s, x)).join(' → ')}`;
      const akhir =
        s.struktur === 'stack'
          ? `Isi akhir: [${kunci.isiAkhir.join(', ')}], TOP = ${kunci.top ?? 'kosong'}`
          : `Isi akhir: [${kunci.isiAkhir.join(', ')}], FRONT = ${kunci.front ?? 'kosong'}, REAR = ${kunci.rear ?? 'kosong'}`;
      return (
        <LembarUmpanBalik
          key={sesiAktif!.indeks}
          benar={h.benar}
          ringkas={ringkasTeks}
          xp={XP_PER_BENAR}
          simulasi={{
            struktur: s.struktur,
            petunjuk: `Telusuri langkah demi langkah (${
              s.struktur === 'stack' ? 'Stack, dasar → TOP' : 'Queue, FRONT → REAR'
            }):`,
            langkah: kunci.langkah,
            akhir,
          }}
          kesalahan={info}
          saranUmum="Coba telusuri ulang perintah satu per satu dan tulis isi struktur setelah setiap langkah."
          labelTombol={labelTombol}
          tombolNonaktif={terakhir && !riwayatSiap}
          onLanjut={berikutnya}
        />
      );
    }

    const benarTeks = s.pilihan.find((p) => p.id === s.benar)?.teks ?? '';
    return (
      <LembarUmpanBalik
        key={sesiAktif!.indeks}
        benar={h.benar}
        ringkas={`Jawaban yang benar: ${benarTeks}`}
        xp={XP_PER_BENAR}
        penjelasan={s.penjelasan}
        kesalahan={info}
        saranUmum="Coba telusuri ulang perintah satu per satu dan tulis isi struktur setelah setiap langkah."
        labelTombol={labelTombol}
        tombolNonaktif={terakhir && !riwayatSiap}
        onLanjut={berikutnya}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.layar}>
        <ScrollView
          contentContainerStyle={styles.isi}
          keyboardShouldPersistTaps="handled"
          importantForAccessibility={hasilIni ? 'no-hide-descendants' : 'auto'}
          accessibilityElementsHidden={!!hasilIni}
        >
          <KepalaSoal
            indeks={sesiAktif.indeks}
            total={total}
            chip={chip}
            dariGuru={soal.id.startsWith('guru:')}
          />

          {soal.jenis === 'simulasi' ? renderSimulasi(soal, sesiAktif) : renderPilihanGanda(soal, sesiAktif)}

          {!sesiAktif.diperiksa && (
            <Tombol
              label="Cek Jawaban"
              varian="tebak"
              ikon="checkmark"
              tinggi={58}
              sudut={20}
              onPress={() => periksa(soal)}
              nonaktif={!lengkap || !siap}
              accessibilityHint={lengkap ? undefined : 'Isi semua jawaban dulu'}
            />
          )}
        </ScrollView>

        {hasilIni && renderUmpanBalik(soal, hasilIni)}
      </View>
    </SafeAreaView>
  );
}

function KotakInfo({
  ikon,
  warnaIkon,
  angka,
  label,
}: {
  ikon: ComponentProps<typeof Ionicons>['name'];
  warnaIkon: string;
  angka: string;
  label: string;
}) {
  return (
    <View style={styles.kotakInfo} accessible accessibilityLabel={`${angka} ${label}`}>
      <Ionicons name={ikon} size={26} color={warnaIkon} />
      <Text style={styles.kotakInfoAngka}>{angka}</Text>
      <Text style={styles.kotakInfoLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warna.latar },
  layar: { flex: 1 },
  isi: { padding: 20, paddingBottom: 40, gap: 18 },
  kolom: { flex: 1, gap: 4 },

  // Pembuka
  judulBlok: { alignItems: 'center', gap: 4 },
  labelUngu: { fontFamily: font.judul, fontSize: 12, letterSpacing: 1, color: warna.ungu },
  judulBesar: { fontFamily: font.judul, fontSize: 26, lineHeight: 32, color: warna.teks, textAlign: 'center' },
  infoBaris: { flexDirection: 'row', gap: 10 },
  kotakInfo: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: warna.garis,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  kotakInfoAngka: { fontFamily: font.judul, fontSize: 18, color: warna.teks },
  kotakInfoLabel: { fontFamily: font.isi, fontSize: 12, color: warna.teksRedup },
  tingkat: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  tingkatLabel: { fontFamily: font.tebal, fontSize: 13, color: warna.teksRedup },
  tingkatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pilTingkat: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pilTingkatTeks: { fontFamily: font.judul, fontSize: 12 },

  peringatan: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FED7AA',
    padding: 12,
  },
  peringatanIsi: { fontFamily: font.isi, fontSize: 13, lineHeight: 19, color: warna.teks },
  tautan: {
    fontFamily: font.tebal,
    fontSize: 14,
    color: warna.ungu,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },

  riwayat: { gap: 10 },
  kartuRiwayat: { gap: 6 },
  isiTeks: { fontFamily: font.isi, fontSize: 14, lineHeight: 21, color: warna.teks },
  petunjuk: { fontFamily: font.semi, fontSize: 12, color: warna.teksRedup },
  butir: { fontFamily: font.isi, fontSize: 14, lineHeight: 21, color: warna.teks },

  // Soal
  pertanyaan: { fontFamily: font.judul, fontSize: 20, lineHeight: 27, color: warna.teks },
  slot: { gap: 8 },
  token: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },

  // Hasil
  hadiahBaris: { flexDirection: 'row', gap: 10 },
  status: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  statusTeks: { flex: 1, fontFamily: font.semi, fontSize: 13, lineHeight: 19, color: warna.teksRedup },
  bagian: { gap: 10 },
  judulBagian: { fontFamily: font.judul, fontSize: 18, color: warna.teks },
  sumber: { fontFamily: font.isi, fontSize: 12, color: warna.teksRedup, textAlign: 'center' },
});

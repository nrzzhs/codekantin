import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { warna, fontKode } from '../lib/tema';
import { useTebak, useRiwayatTebak } from '../context/SimulatorContext';
import type { SesiTebak, HasilSoal } from '../context/SimulatorContext';
import { cariSoal } from '../data/soal';
import type { Soal, SoalSimulasi, SoalPilihanGanda } from '../data/soal';
import { INFO_MISKONSEPSI } from '../data/miskonsepsi';
import type { Miskonsepsi } from '../data/miskonsepsi';
import {
  buatSesi,
  hitungKunci,
  pilihanJawaban,
  periksaSimulasi,
  periksaPilihanGanda,
} from '../logic/tebak';
import {
  hitungHadiah,
  ringkasRiwayat,
  tambahCatatan,
  tandaiTersinkron,
} from '../logic/hadiah';
import type { HasilRingkas } from '../logic/hadiah';

const URUTAN = ['Pertama', 'Kedua', 'Ketiga', 'Keempat', 'Kelima', 'Keenam'];
const MERAH = '#DC2626';
const MERAH_MUDA = '#FEE2E2';

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

  function mulai() {
    if (!siap) return;
    const ids = buatSesi();
    setSesi({
      sesiId: buatIdSesi(),
      idSoal: ids,
      indeks: 0,
      hasil: [],
      draft: buatDraft(cariSoal(ids[0])),
      diperiksa: false,
    });
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
  }

  function berikutnya() {
    if (!sesiAktif) return;
    const indeksBaru = sesiAktif.indeks + 1;
    const soalBaru =
      indeksBaru < sesiAktif.idSoal.length ? cariSoal(sesiAktif.idSoal[indeksBaru]) : undefined;
    setSesi({ ...sesiAktif, indeks: indeksBaru, draft: buatDraft(soalBaru), diperiksa: false });
  }

  const ringkas = ringkasRiwayat(riwayat);

  function renderRiwayat(judul: string) {
    if (ringkas.sesi === 0) return null;
    return (
      <View style={styles.kartu}>
        <Text style={styles.judul}>{judul}</Text>
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
      </View>
    );
  }

  // ===== 1. Belum mulai =====
  if (!sesiAktif) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.isi}>
          <View style={styles.banner}>
            <Text style={styles.bannerTag}>MODE TEBAK</Text>
            <Text style={styles.bannerJudul}>Prediksi dulu, baru lihat jawabannya</Text>
            <Text style={styles.bannerSub}>
              Baca alur perintah dapur, tebak urutan keluarnya, lalu cek jawabanmu. Setiap kesalahan
              dijelaskan langkah demi langkah.
            </Text>
          </View>

          <View style={styles.kartu}>
            <Text style={styles.judul}>Isi tantangan</Text>
            <Text style={styles.butir}>• 5 soal: 3 simulasi urutan keluar dan 2 pilihan ganda</Text>
            <Text style={styles.butir}>• Tingkat naik bertahap: mudah, sedang, menantang</Text>
            <Text style={styles.butir}>• Tiap jawaban benar +10 XP, semua benar bonus +20 XP</Text>
            <Text style={styles.butir}>• Poin hingga +20, sesuai jumlah jawaban benar</Text>
          </View>

          {renderRiwayat('Riwayat belajarmu')}

          {jumlahTertunda > 0 && (
            <View style={styles.peringatan}>
              <Text style={styles.peringatanIsi}>
                {jumlahTertunda} hasil sesi belum tersimpan ke akunmu.
                {mengirim ? ' Sedang dikirim...' : ''}
              </Text>
              {!mengirim && (
                <TouchableOpacity style={styles.tombolKecil} onPress={kirimTertunda}>
                  <Text style={styles.tombolKecilTeks}>Kirim sekarang</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.tombolHijau, !siap && styles.mati]}
            onPress={mulai}
            disabled={!siap}
          >
            <Text style={styles.tombolHijauTeks}>{siap ? 'Mulai Tantangan' : 'Memuat...'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const total = sesiAktif.idSoal.length;

  // ===== 2. Hasil akhir =====
  if (sesiAktif.indeks >= total) {
    const hasil = sesiAktif.hasil;
    const jumlahBenarSesi = hasil.filter((h) => h.benar).length;
    const akurasi = Math.round((jumlahBenarSesi / total) * 100);
    const hadiah = hitungHadiah(jumlahBenarSesi, total);
    const catatan = riwayat.find((c) => c.sesiId === sesiAktif.sesiId);
    const jenisMiskonsepsi = Array.from(
      new Set(hasil.map((h) => h.miskonsepsi).filter((m): m is Miskonsepsi => m !== null)),
    );
    const pesan =
      akurasi >= 80
        ? 'Koki Handal! Pemahamanmu sudah kuat. 🏆'
        : akurasi >= 50
        ? 'Lumayan! Tinggal diperkuat sedikit lagi. 👍'
        : 'Terus berlatih, coba lagi dengan simulasi di tab Antrean dan Tumpukan. 💪';

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.isi}>
          <View style={styles.banner}>
            <Text style={styles.bannerTag}>HASIL TANTANGAN</Text>
            <Text style={styles.bannerJudul}>
              {jumlahBenarSesi} dari {total} benar ({akurasi}%)
            </Text>
            <Text style={styles.bannerSub}>{pesan}</Text>
          </View>

          <View style={styles.kartu}>
            <Text style={styles.judul}>Hadiah sesi ini</Text>
            <View style={styles.hadiahBaris}>
              <View style={styles.hadiahKotak}>
                <Text style={styles.hadiahAngka}>⚡ +{hadiah.xp}</Text>
                <Text style={styles.hadiahLabel}>XP</Text>
              </View>
              <View style={styles.hadiahKotak}>
                <Text style={styles.hadiahAngka}>⭐ +{hadiah.poin}</Text>
                <Text style={styles.hadiahLabel}>Poin</Text>
              </View>
            </View>

            {catatan?.tersinkron ? (
              <Text style={styles.statusOk}>✅ Sudah tersimpan ke akunmu.</Text>
            ) : mengirim ? (
              <Text style={styles.petunjuk}>Menyimpan ke akunmu...</Text>
            ) : (
              <>
                <Text style={styles.statusGalat}>
                  ⚠️ Belum tersimpan{galatKirim ? ` (${galatKirim})` : ''}. Hasilmu aman di HP dan
                  akan dikirim ulang.
                </Text>
                <TouchableOpacity style={styles.tombolKecil} onPress={kirimTertunda}>
                  <Text style={styles.tombolKecilTeks}>Coba simpan lagi</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.kartu}>
            <Text style={styles.judul}>Rincian soal</Text>
            {hasil.map((h, i) => {
              const s = cariSoal(h.idSoal);
              const nama =
                s?.jenis === 'simulasi'
                  ? `Simulasi ${s.struktur === 'stack' ? 'Stack' : 'Queue'} (${s.tingkat})`
                  : s?.jenis === 'pilihan-ganda'
                  ? `Pilihan ganda: ${s.pertanyaan}`
                  : h.idSoal;
              return (
                <View key={`${h.idSoal}-${i}`} style={styles.barisHasil}>
                  <Text style={styles.hasilIkon}>{h.benar ? '✅' : '❌'}</Text>
                  <Text style={styles.hasilNama} numberOfLines={2}>{i + 1}. {nama}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.kartu}>
            <Text style={styles.judul}>Diagnosis sesi ini</Text>
            {jenisMiskonsepsi.length === 0 ? (
              <Text style={styles.isiTeks}>
                {jumlahBenarSesi === total
                  ? 'Tidak ada miskonsepsi terdeteksi. Mantap!'
                  : 'Tidak ada pola miskonsepsi khusus yang terdeteksi. Coba telusuri langkah demi langkah dengan tabel jejak.'}
              </Text>
            ) : (
              jenisMiskonsepsi.map((m) => {
                const info = INFO_MISKONSEPSI[m];
                const kali = hasil.filter((h) => h.miskonsepsi === m).length;
                return (
                  <View key={m} style={styles.peringatan}>
                    <Text style={styles.peringatanJudul}>⚠️ {info.judul} ({kali}x)</Text>
                    <Text style={styles.peringatanIsi}>{info.penjelasan}</Text>
                    <Text style={styles.peringatanTips}>💡 {info.perbaikan}</Text>
                  </View>
                );
              })
            )}
          </View>

          {renderRiwayat('Riwayat semua sesi')}

          <TouchableOpacity style={styles.tombolHijau} onPress={mulai}>
            <Text style={styles.tombolHijauTeks}>Main Lagi (soal baru)</Text>
          </TouchableOpacity>
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
  const progres = (sesiAktif.indeks + (sesiAktif.diperiksa ? 1 : 0)) / total;

  const tag =
    soal.jenis === 'pilihan-ganda'
      ? 'PILIHAN GANDA'
      : soal.struktur === 'stack'
      ? 'PREDIKSI • STACK (LIFO)'
      : 'PREDIKSI • QUEUE (FIFO)';
  const warnaTag =
    soal.jenis === 'pilihan-ganda' ? '#7C3AED' : soal.struktur === 'stack' ? '#C2410C' : warna.biru;

  function renderSimulasi(s: SoalSimulasi, sesiIni: SesiTebak) {
    const kunci = hitungKunci(s);
    const opsi = pilihanJawaban(s);
    return (
      <>
        <View style={styles.kode}>
          <Text style={styles.kodeJudul}>ALUR PERINTAH DAPUR</Text>
          <Text style={styles.kodeKonteks}>{s.konteks}</Text>
          {s.operasi.map((op, i) => {
            const ambil = /^\s*(pop|dequeue)/i.test(op);
            return (
              <View key={`${op}-${i}`} style={[styles.kodeBaris, ambil && styles.kodeAmbil]}>
                <Text style={styles.kodeNo}>{i + 1}</Text>
                <Text style={styles.kodeTeks}>{op}</Text>
                {ambil && <Text style={styles.kodeTag}>KELUAR</Text>}
              </View>
            );
          })}
        </View>

        <View style={styles.kartu}>
          <Text style={styles.pertanyaan}>
            {s.struktur === 'stack'
              ? 'Piring mana yang keluar, dan dalam urutan apa?'
              : 'Pelanggan mana yang dilayani, dan dalam urutan apa?'}
          </Text>

          {sesiIni.draft.map((isi, i) => {
            const status = sesiIni.diperiksa ? (isi === kunci.keluar[i] ? 'benar' : 'salah') : null;
            return (
              <TouchableOpacity
                key={`slot-${i}`}
                style={[
                  styles.slot,
                  status === 'benar' && styles.slotBenar,
                  status === 'salah' && styles.slotSalah,
                ]}
                onPress={() => kosongkanSlot(i)}
                disabled={sesiIni.diperiksa || isi === null}
              >
                <Text style={styles.slotLabel}>Keluar {URUTAN[i] ?? `ke-${i + 1}`}</Text>
                <Text style={[styles.slotIsi, isi === null && styles.slotKosong]}>
                  {isi === null ? 'ketuk pilihan di bawah' : namaItem(s, isi)}
                </Text>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.petunjuk}>Pilihan (ketuk slot yang terisi untuk membatalkan):</Text>
          <View style={styles.chipBaris}>
            {opsi.map((o) => {
              const dipakai = sesiIni.draft.includes(o);
              return (
                <TouchableOpacity
                  key={o}
                  style={[styles.chip, (dipakai || sesiIni.diperiksa) && styles.mati]}
                  onPress={() => isiSlot(o)}
                  disabled={dipakai || sesiIni.diperiksa}
                >
                  <Text style={styles.chipTeks}>{namaItem(s, o)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </>
    );
  }

  function renderPilihanGanda(s: SoalPilihanGanda, sesiIni: SesiTebak) {
    const dipilih = sesiIni.draft[0];
    return (
      <View style={styles.kartu}>
        <Text style={styles.pertanyaan}>{s.pertanyaan}</Text>
        {s.pilihan.map((p, i) => {
          const terpilih = dipilih === p.id;
          const benar = sesiIni.diperiksa && p.id === s.benar;
          const salah = sesiIni.diperiksa && terpilih && p.id !== s.benar;
          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.opsi,
                terpilih && styles.opsiTerpilih,
                benar && styles.slotBenar,
                salah && styles.slotSalah,
              ]}
              onPress={() => pilihPG(p.id)}
              disabled={sesiIni.diperiksa}
            >
              <Text style={styles.opsiHuruf}>{String.fromCharCode(65 + i)}</Text>
              <Text style={styles.opsiTeks}>{p.teks}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderUmpanBalik(s: Soal, h: HasilSoal) {
    const info = h.miskonsepsi ? INFO_MISKONSEPSI[h.miskonsepsi] : null;

    let ringkasTeks = '';
    let langkah: ReturnType<typeof hitungKunci>['langkah'] = [];
    let akhir = '';
    if (s.jenis === 'simulasi') {
      const kunci = hitungKunci(s);
      langkah = kunci.langkah;
      ringkasTeks = `Urutan keluar yang benar: ${kunci.keluar.map((x) => namaItem(s, x)).join(' → ')}`;
      akhir =
        s.struktur === 'stack'
          ? `Isi akhir: [${kunci.isiAkhir.join(', ')}], TOP = ${kunci.top ?? 'kosong'}`
          : `Isi akhir: [${kunci.isiAkhir.join(', ')}], FRONT = ${kunci.front ?? 'kosong'}, REAR = ${kunci.rear ?? 'kosong'}`;
    } else {
      const benarTeks = s.pilihan.find((p) => p.id === s.benar)?.teks ?? '';
      ringkasTeks = `Jawaban yang benar: ${benarTeks}`;
    }

    return (
      <>
        <View style={[styles.hasilBanner, h.benar ? styles.hasilBenar : styles.hasilSalah]}>
          <Text style={[styles.hasilJudul, { color: h.benar ? warna.hijauTeks : '#B91C1C' }]}>
            {h.benar ? 'Benar sekali! 🎉' : 'Belum tepat 🤔'}
          </Text>
          <Text style={styles.hasilIsi}>{ringkasTeks}</Text>
        </View>

        <View style={styles.kartu}>
          <Text style={styles.judul}>👨‍🍳 Penjelasan Koki</Text>
          {s.jenis === 'pilihan-ganda' ? (
            <Text style={styles.isiTeks}>{s.penjelasan}</Text>
          ) : (
            <>
              <Text style={styles.petunjuk}>
                Telusuri langkah demi langkah ({s.struktur === 'stack' ? 'Stack, dasar → TOP' : 'Queue, FRONT → REAR'}):
              </Text>
              {langkah.map((l, i) => (
                <View key={`l-${i}`} style={styles.langkah}>
                  <Text style={styles.langkahNo}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.langkahOp}>
                      {l.perintah}
                      {l.keluar !== null ? `  →  keluar ${namaItem(s, l.keluar)}` : ''}
                    </Text>
                    <Text style={styles.langkahIsi}>[{l.isi.join(', ')}]</Text>
                  </View>
                </View>
              ))}
              <Text style={styles.akhir}>{akhir}</Text>
            </>
          )}
        </View>

        {info && (
          <View style={styles.peringatan}>
            <Text style={styles.peringatanJudul}>⚠️ Hati-hati Kesalahan Umum: {info.judul}</Text>
            <Text style={styles.peringatanIsi}>{info.penjelasan}</Text>
            <Text style={styles.peringatanTips}>💡 {info.perbaikan}</Text>
          </View>
        )}
        {!info && !h.benar && (
          <View style={styles.peringatan}>
            <Text style={styles.peringatanIsi}>
              Coba telusuri ulang perintah satu per satu dan tulis isi struktur setelah setiap langkah.
            </Text>
          </View>
        )}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.isi} keyboardShouldPersistTaps="handled">
        <View style={styles.atas}>
          <View style={[styles.tagPil, { backgroundColor: warnaTag }]}>
            <Text style={styles.tagPilTeks}>{tag}</Text>
          </View>
          <Text style={styles.nomor}>Soal {sesiAktif.indeks + 1} dari {total}</Text>
        </View>
        <View style={styles.progresLatar}>
          <View style={[styles.progresIsi, { width: `${Math.round(progres * 100)}%` }]} />
        </View>

        {soal.jenis === 'simulasi' ? renderSimulasi(soal, sesiAktif) : renderPilihanGanda(soal, sesiAktif)}

        {!sesiAktif.diperiksa && (
          <TouchableOpacity
            style={[styles.tombolHijau, (!lengkap || !siap) && styles.mati]}
            onPress={() => periksa(soal)}
            disabled={!lengkap || !siap}
          >
            <Text style={styles.tombolHijauTeks}>Cek Jawaban</Text>
          </TouchableOpacity>
        )}

        {hasilIni && renderUmpanBalik(soal, hasilIni)}

        {hasilIni && (
          <TouchableOpacity
            style={[styles.tombolHijau, terakhir && !riwayatSiap && styles.mati]}
            onPress={berikutnya}
            disabled={terakhir && !riwayatSiap}
          >
            <Text style={styles.tombolHijauTeks}>
              {terakhir ? 'Lihat Hasil' : `Soal Berikutnya (${sesiAktif.indeks + 2}/${total})`}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 18, paddingBottom: 40 },

  banner: { backgroundColor: '#EDE9FE', borderRadius: 20, padding: 18, marginBottom: 14 },
  bannerTag: { color: '#6D28D9', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  bannerJudul: { fontSize: 22, fontWeight: '800', color: warna.teks, marginTop: 6 },
  bannerSub: { color: warna.teksRedup, marginTop: 6, lineHeight: 20 },

  kartu: {
    backgroundColor: warna.kartu, borderRadius: 20, borderWidth: 1,
    borderColor: warna.garis, padding: 18, marginBottom: 14,
  },
  judul: { fontSize: 18, fontWeight: '800', color: warna.teks, marginBottom: 8 },
  butir: { color: warna.teksRedup, lineHeight: 24 },
  isiTeks: { color: warna.teks, lineHeight: 21 },
  sumber: { textAlign: 'center', color: warna.teksRedup, fontSize: 11, marginTop: 14 },

  atas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagPil: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  tagPilTeks: { color: '#fff', fontWeight: '800', fontSize: 11 },
  nomor: { color: warna.teksRedup, fontWeight: '700' },
  progresLatar: { height: 6, backgroundColor: warna.garis, borderRadius: 3, marginVertical: 12, overflow: 'hidden' },
  progresIsi: { height: 6, backgroundColor: warna.hijau, borderRadius: 3 },

  kode: { backgroundColor: warna.gelap, borderRadius: 16, padding: 16, marginBottom: 14 },
  kodeJudul: { color: '#5EEAD4', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  kodeKonteks: { color: '#94A3B8', fontSize: 12, marginTop: 4, marginBottom: 10 },
  kodeBaris: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 6, borderRadius: 8 },
  kodeAmbil: { backgroundColor: 'rgba(239,68,68,0.18)' },
  kodeNo: { color: '#64748B', fontFamily: fontKode, width: 22 },
  kodeTeks: { color: '#E2E8F0', fontFamily: fontKode, fontSize: 14, flex: 1 },
  kodeTag: { color: '#FCA5A5', fontSize: 10, fontWeight: '800' },

  pertanyaan: { fontSize: 16, fontWeight: '700', color: warna.teks, marginBottom: 12, lineHeight: 22 },
  slot: {
    borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#CBD5E1',
    padding: 12, marginBottom: 8, backgroundColor: '#fff',
  },
  slotBenar: { borderColor: warna.hijau, backgroundColor: '#ECFDF5', borderStyle: 'solid' },
  slotSalah: { borderColor: MERAH, backgroundColor: MERAH_MUDA, borderStyle: 'solid' },
  slotLabel: { color: warna.teksRedup, fontSize: 11, fontWeight: '700' },
  slotIsi: { color: warna.teks, fontWeight: '700', fontSize: 15, marginTop: 2 },
  slotKosong: { color: '#94A3B8', fontWeight: '500' },
  petunjuk: { color: warna.teksRedup, fontSize: 12, marginTop: 6, marginBottom: 8 },
  chipBaris: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: warna.latar, borderRadius: 999, borderWidth: 1,
    borderColor: warna.garis, paddingHorizontal: 14, paddingVertical: 10,
  },
  chipTeks: { fontWeight: '700', color: warna.teks },

  opsi: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5,
    borderColor: warna.garis, padding: 12, marginBottom: 8, backgroundColor: '#fff',
  },
  opsiTerpilih: { borderColor: warna.biru, backgroundColor: warna.biruMuda },
  opsiHuruf: { fontWeight: '800', color: warna.teksRedup, width: 26 },
  opsiTeks: { flex: 1, color: warna.teks, fontWeight: '600' },

  tombolHijau: { backgroundColor: warna.hijau, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 14 },
  tombolHijauTeks: { color: '#fff', fontWeight: '700', fontSize: 15 },
  tombolKecil: {
    alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: warna.garis, paddingHorizontal: 14, paddingVertical: 9, marginTop: 8,
  },
  tombolKecilTeks: { fontWeight: '700', color: warna.teks, fontSize: 13 },
  mati: { opacity: 0.4 },

  hadiahBaris: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  hadiahKotak: { flex: 1, backgroundColor: warna.latar, borderRadius: 14, padding: 14, alignItems: 'center' },
  hadiahAngka: { fontSize: 22, fontWeight: '800', color: warna.teks },
  hadiahLabel: { color: warna.teksRedup, marginTop: 2 },
  statusOk: { color: warna.hijauTeks, fontWeight: '700' },
  statusGalat: { color: '#B91C1C', lineHeight: 20 },

  hasilBanner: { borderRadius: 16, padding: 16, marginBottom: 14 },
  hasilBenar: { backgroundColor: '#ECFDF5' },
  hasilSalah: { backgroundColor: MERAH_MUDA },
  hasilJudul: { fontSize: 18, fontWeight: '800' },
  hasilIsi: { color: warna.teks, marginTop: 4, fontWeight: '600', lineHeight: 20 },

  langkah: { flexDirection: 'row', marginBottom: 8 },
  langkahNo: { width: 24, color: warna.teksRedup, fontWeight: '800' },
  langkahOp: { fontFamily: fontKode, color: warna.teks, fontSize: 13 },
  langkahIsi: { fontFamily: fontKode, color: warna.teksRedup, fontSize: 12, marginTop: 2 },
  akhir: { marginTop: 6, fontWeight: '700', color: warna.hijauTeks },

  peringatan: {
    backgroundColor: warna.kotakKode, borderRadius: 16, borderWidth: 1,
    borderColor: '#F5C9B5', padding: 16, marginBottom: 14,
  },
  peringatanJudul: { fontWeight: '800', color: '#7C2D12', marginBottom: 6 },
  peringatanIsi: { color: '#7C2D12', lineHeight: 20 },
  peringatanTips: { color: '#B45309', marginTop: 6, fontWeight: '600', lineHeight: 20 },

  barisHasil: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  hasilIkon: { fontSize: 16, marginRight: 8 },
  hasilNama: { flex: 1, color: warna.teks, fontWeight: '600' },
});
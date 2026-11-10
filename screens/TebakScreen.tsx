import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { warna, fontKode } from '../lib/tema';
import { useTebak } from '../context/SimulatorContext';
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

export default function TebakScreen() {
  const { nilai: sesi, setNilai: setSesi, siap } = useTebak();

  // Sesi tersimpan dianggap tidak valid kalau soalnya sudah tidak ada di bank
  const sesiAktif: SesiTebak | null =
    sesi &&
    Array.isArray(sesi.idSoal) &&
    Array.isArray(sesi.hasil) &&
    Array.isArray(sesi.draft) &&
    sesi.idSoal.length > 0 &&
    sesi.idSoal.every((id) => cariSoal(id))
      ? sesi
      : null;

  function mulai() {
    if (!siap) return;
    const ids = buatSesi();
    setSesi({
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
            <Text style={styles.butir}>• Kunci jawaban dihitung dari logika Stack dan Queue asli</Text>
            <Text style={styles.butir}>• Kesalahanmu dipetakan ke jenis miskonsepsi</Text>
          </View>

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
    const jumlahBenar = hasil.filter((h) => h.benar).length;
    const akurasi = Math.round((jumlahBenar / total) * 100);
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
              {jumlahBenar} dari {total} benar ({akurasi}%)
            </Text>
            <Text style={styles.bannerSub}>{pesan}</Text>
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
            <Text style={styles.judul}>Diagnosis miskonsepsi</Text>
            {jenisMiskonsepsi.length === 0 ? (
              <Text style={styles.isiTeks}>
                {jumlahBenar === total
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

    let ringkas = '';
    let langkah: ReturnType<typeof hitungKunci>['langkah'] = [];
    let akhir = '';
    if (s.jenis === 'simulasi') {
      const kunci = hitungKunci(s);
      langkah = kunci.langkah;
      ringkas = `Urutan keluar yang benar: ${kunci.keluar.map((x) => namaItem(s, x)).join(' → ')}`;
      akhir =
        s.struktur === 'stack'
          ? `Isi akhir: [${kunci.isiAkhir.join(', ')}], TOP = ${kunci.top ?? 'kosong'}`
          : `Isi akhir: [${kunci.isiAkhir.join(', ')}], FRONT = ${kunci.front ?? 'kosong'}, REAR = ${kunci.rear ?? 'kosong'}`;
    } else {
      const benarTeks = s.pilihan.find((p) => p.id === s.benar)?.teks ?? '';
      ringkas = `Jawaban yang benar: ${benarTeks}`;
    }

    return (
      <>
        <View style={[styles.hasilBanner, h.benar ? styles.hasilBenar : styles.hasilSalah]}>
          <Text style={[styles.hasilJudul, { color: h.benar ? warna.hijauTeks : '#B91C1C' }]}>
            {h.benar ? 'Benar sekali! 🎉' : 'Belum tepat 🤔'}
          </Text>
          <Text style={styles.hasilIsi}>{ringkas}</Text>
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
          <TouchableOpacity style={styles.tombolHijau} onPress={berikutnya}>
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
  mati: { opacity: 0.4 },

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
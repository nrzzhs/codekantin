import { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { warna, fontKode } from '../lib/tema';
import { INFO_MISKONSEPSI } from '../data/miskonsepsi';
import type { Miskonsepsi } from '../data/miskonsepsi';
import type { Tingkat } from '../data/soal';
import { BATAS } from '../logic/soalGuru';
import {
  bangunPilihanGanda,
  bangunSimulasi,
  formPilihanGandaDariBaris,
  formPilihanGandaKosong,
  formSimulasiDariBaris,
  formSimulasiKosong,
  hapusBarisTerakhir,
  nilaiBerikutnya,
  parsePerintah,
  payloadPilihanGanda,
  payloadSimulasi,
  pratinjauKunci,
  tambahBaris,
  terjemahkanPerintah,
} from '../logic/formSoal';
import type { BarisKelola, FormPilihanGanda, FormSimulasi, OpsiForm } from '../logic/formSoal';
import { tambahSoal, ubahSoal } from '../lib/bankSoal';
import { useBankSoal } from '../context/BankSoalContext';

const TINGKAT: Tingkat[] = ['mudah', 'sedang', 'menantang'];
const DAFTAR_MISKONSEPSI = Object.keys(INFO_MISKONSEPSI) as Miskonsepsi[];

function Pil({
  teks,
  aktif,
  onPress,
  mati,
}: {
  teks: string;
  aktif: boolean;
  onPress: () => void;
  mati?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.pil, aktif && styles.pilAktif, mati && !aktif && styles.mati]}
      onPress={onPress}
      disabled={mati}
      accessibilityRole="button"
      accessibilityState={{ selected: aktif, disabled: !!mati }}
    >
      <Text style={[styles.pilTeks, aktif && styles.pilTeksAktif]}>{teks}</Text>
    </TouchableOpacity>
  );
}

export default function FormSoalScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { muatUlang } = useBankSoal();
  const sunting: BarisKelola | undefined = route.params?.soal;

  const [jenis, setJenis] = useState<'simulasi' | 'pilihan-ganda'>(sunting?.jenis ?? 'simulasi');
  const [sim, setSim] = useState<FormSimulasi>(() =>
    sunting && sunting.jenis === 'simulasi' ? formSimulasiDariBaris(sunting) : formSimulasiKosong(),
  );
  const [pg, setPg] = useState<FormPilihanGanda>(() =>
    sunting && sunting.jenis === 'pilihan-ganda'
      ? formPilihanGandaDariBaris(sunting)
      : formPilihanGandaKosong(),
  );
  const [disentuh, setDisentuh] = useState(!!sunting);
  const [menyimpan, setMenyimpan] = useState(false);

  const hasilSim = useMemo(() => bangunSimulasi(sim), [sim]);
  const hasilPg = useMemo(() => bangunPilihanGanda(pg), [pg]);
  const pratinjau = useMemo(() => (hasilSim.ok ? pratinjauKunci(hasilSim.soal) : null), [hasilSim]);

  const hasil = jenis === 'simulasi' ? hasilSim : hasilPg;
  const daftarGalat = hasil.ok ? [] : hasil.galat;
  const daftarPeringatan = hasil.ok ? hasil.peringatan : [];

  const daftarPerintah = parsePerintah(sim.perintah);
  const namaTambah = sim.struktur === 'stack' ? 'push' : 'enqueue';
  const namaAmbil = sim.struktur === 'stack' ? 'pop' : 'dequeue';

  function ubahSim(p: Partial<FormSimulasi>) {
    setDisentuh(true);
    setSim((s) => ({ ...s, ...p }));
  }

  function ubahPg(p: Partial<FormPilihanGanda>) {
    setDisentuh(true);
    setPg((s) => ({ ...s, ...p }));
  }

  function ubahOpsi(i: number, p: Partial<OpsiForm>) {
    setDisentuh(true);
    setPg((s) => ({ ...s, opsi: s.opsi.map((o, j) => (j === i ? { ...o, ...p } : o)) }));
  }

  function tambahOpsi() {
    if (pg.opsi.length >= BATAS.pilihanMaks) return;
    ubahPg({ opsi: [...pg.opsi, { teks: '', miskonsepsi: null }] });
  }

  function hapusOpsi(i: number) {
    if (pg.opsi.length <= BATAS.pilihanMin) return;
    let indeksBenar = pg.indeksBenar;
    if (i === indeksBenar) indeksBenar = 0;
    else if (i < indeksBenar) indeksBenar -= 1;
    ubahPg({ opsi: pg.opsi.filter((_, j) => j !== i), indeksBenar });
  }

  function siklusMiskonsepsi(i: number) {
    const urutan: (Miskonsepsi | null)[] = [null, ...DAFTAR_MISKONSEPSI];
    const sekarang = urutan.indexOf(pg.opsi[i].miskonsepsi);
    ubahOpsi(i, { miskonsepsi: urutan[(sekarang + 1) % urutan.length] });
  }

  async function simpan() {
    setDisentuh(true);
    if (!hasil.ok || menyimpan) return;
    const soal = hasil.soal;
    setMenyimpan(true);
    try {
      const payload = soal.jenis === 'simulasi' ? payloadSimulasi(soal) : payloadPilihanGanda(soal);
      if (sunting) await ubahSoal(sunting.id, payload);
      else await tambahSoal(payload);
      void muatUlang();
      navigation.goBack();
    } catch (e: any) {
      setMenyimpan(false);
      Alert.alert('Gagal menyimpan', e?.message ?? 'Coba lagi.');
    }
  }

  return (
    <ScrollView style={styles.latar} contentContainerStyle={styles.isi} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Jenis soal</Text>
      <View style={styles.barisPil}>
        <Pil teks="Simulasi" aktif={jenis === 'simulasi'} onPress={() => setJenis('simulasi')} mati={!!sunting} />
        <Pil
          teks="Pilihan ganda"
          aktif={jenis === 'pilihan-ganda'}
          onPress={() => setJenis('pilihan-ganda')}
          mati={!!sunting}
        />
      </View>
      {!!sunting && (
        <Text style={styles.catatan}>
          Jenis soal tidak bisa diubah. Buat soal baru kalau ingin jenis yang lain.
        </Text>
      )}

      {jenis === 'simulasi' ? (
        <>
          <Text style={styles.label}>Struktur data</Text>
          <View style={styles.barisPil}>
            <Pil
              teks="Stack (LIFO)"
              aktif={sim.struktur === 'stack'}
              onPress={() => ubahSim({ struktur: 'stack', perintah: terjemahkanPerintah(sim.perintah, 'stack') })}
            />
            <Pil
              teks="Queue (FIFO)"
              aktif={sim.struktur === 'queue'}
              onPress={() => ubahSim({ struktur: 'queue', perintah: terjemahkanPerintah(sim.perintah, 'queue') })}
            />
          </View>

          <Text style={styles.label}>Tingkat</Text>
          <View style={styles.barisPil}>
            {TINGKAT.map((t) => (
              <Pil key={t} teks={t} aktif={sim.tingkat === t} onPress={() => ubahSim({ tingkat: t })} />
            ))}
          </View>

          <Text style={styles.label}>Konteks (opsional)</Text>
          <TextInput
            style={styles.input}
            value={sim.konteks}
            onChangeText={(t) => ubahSim({ konteks: t })}
            maxLength={BATAS.konteks}
            placeholder="Contoh: Piring bernomor ditumpuk di rak cuci."
            placeholderTextColor="#6B625B"
          />

          <Text style={styles.label}>
            Perintah ({daftarPerintah.length}/{BATAS.perintahMaks})
          </Text>
          <TextInput
            style={[styles.input, styles.inputPerintah]}
            value={sim.perintah}
            onChangeText={(t) => ubahSim({ perintah: t })}
            multiline
            maxLength={600}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={`${namaTambah}(1)\n${namaTambah}(2)\n${namaAmbil}()`}
            placeholderTextColor="#6B625B"
          />
          <Text style={styles.catatan}>
            Satu perintah per baris. Setiap nilai harus berbeda, dan jangan sampai mengambil dari struktur
            yang kosong.
          </Text>

          <View style={styles.barisPil}>
            <TouchableOpacity
              style={styles.tombolKecil}
              onPress={() =>
                ubahSim({ perintah: tambahBaris(sim.perintah, `${namaTambah}(${nilaiBerikutnya(daftarPerintah)})`) })
              }
              accessibilityRole="button"
            >
              <Text style={styles.tombolKecilTeks}>＋ {namaTambah}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tombolKecil}
              onPress={() => ubahSim({ perintah: tambahBaris(sim.perintah, `${namaAmbil}()`) })}
              accessibilityRole="button"
            >
              <Text style={styles.tombolKecilTeks}>＋ {namaAmbil}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tombolKecil}
              onPress={() => ubahSim({ perintah: hapusBarisTerakhir(sim.perintah) })}
              accessibilityRole="button"
            >
              <Text style={styles.tombolKecilTeks}>↩ Hapus terakhir</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.label}>Pertanyaan</Text>
          <TextInput
            style={[styles.input, styles.inputBesar]}
            value={pg.pertanyaan}
            onChangeText={(t) => ubahPg({ pertanyaan: t })}
            multiline
            maxLength={BATAS.pertanyaanMaks}
            placeholder="Tulis pertanyaannya di sini"
            placeholderTextColor="#6B625B"
          />

          <Text style={styles.label}>Pilihan jawaban (ketuk lingkaran untuk menandai yang benar)</Text>
          {pg.opsi.map((o, i) => {
            const benar = i === pg.indeksBenar;
            const huruf = String.fromCharCode(65 + i);
            return (
              <View key={i} style={[styles.opsi, benar && styles.opsiBenar]}>
                <View style={styles.opsiAtas}>
                  <TouchableOpacity
                    onPress={() => ubahPg({ indeksBenar: i })}
                    style={styles.radio}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: benar }}
                    accessibilityLabel={`Tandai pilihan ${huruf} sebagai jawaban benar`}
                  >
                    <View style={[styles.radioDalam, benar && styles.radioDalamAktif]} />
                  </TouchableOpacity>
                  <Text style={styles.opsiHuruf}>{huruf}</Text>
                  <TextInput
                    style={[styles.input, styles.opsiInput]}
                    value={o.teks}
                    onChangeText={(t) => ubahOpsi(i, { teks: t })}
                    maxLength={BATAS.teksPilihanMaks}
                    placeholder={`Pilihan ${huruf}`}
                    placeholderTextColor="#6B625B"
                  />
                </View>
                {!benar && (
                  <TouchableOpacity
                    style={styles.tombolKecil}
                    onPress={() => siklusMiskonsepsi(i)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.tombolKecilTeks}>
                      Miskonsepsi: {o.miskonsepsi ? INFO_MISKONSEPSI[o.miskonsepsi].judul : 'tidak ada'} ▸
                    </Text>
                  </TouchableOpacity>
                )}
                {pg.opsi.length > BATAS.pilihanMin && (
                  <TouchableOpacity style={styles.hapusOpsi} onPress={() => hapusOpsi(i)} accessibilityRole="button">
                    <Text style={styles.hapusOpsiTeks}>Hapus pilihan {huruf}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          {pg.opsi.length < BATAS.pilihanMaks && (
            <TouchableOpacity style={styles.tombolKecil} onPress={tambahOpsi} accessibilityRole="button">
              <Text style={styles.tombolKecilTeks}>＋ Tambah pilihan</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Penjelasan jawaban</Text>
          <TextInput
            style={[styles.input, styles.inputBesar]}
            value={pg.penjelasan}
            onChangeText={(t) => ubahPg({ penjelasan: t })}
            multiline
            maxLength={BATAS.penjelasanMaks}
            placeholder="Mengapa jawaban itu benar? (tampil setelah siswa menjawab)"
            placeholderTextColor="#6B625B"
          />
        </>
      )}

      {disentuh && daftarGalat.length > 0 && (
        <View style={styles.kotakGalat}>
          <Text style={styles.galatJudul}>Belum bisa disimpan:</Text>
          {daftarGalat.map((g, i) => (
            <Text key={i} style={styles.galatTeks}>• {g}</Text>
          ))}
        </View>
      )}

      {daftarPeringatan.length > 0 && (
        <View style={styles.kotakPeringatan}>
          <Text style={styles.peringatanJudul}>⚠️ Saran perbaikan (tidak menghalangi penyimpanan):</Text>
          {daftarPeringatan.map((g, i) => (
            <Text key={i} style={styles.peringatanTeks}>• {g}</Text>
          ))}
        </View>
      )}

      {jenis === 'simulasi' && pratinjau && (
        <View style={styles.kode}>
          <Text style={styles.kodeJudul}>PRATINJAU KUNCI (DIHITUNG OTOMATIS)</Text>
          <Text style={styles.kodeBaris}>
            Urutan keluar: {pratinjau.keluar.join(' → ')}
          </Text>
          <Text style={styles.kodeBaris}>
            Isi akhir: [{pratinjau.isiAkhir.join(', ')}] · {pratinjau.ujung}
          </Text>
          <View style={styles.garis} />
          {pratinjau.langkah.map((l, i) => (
            <Text key={i} style={styles.kodeLangkah}>
              {i + 1}. {l.perintah}
              {l.keluar !== null ? ` → ${l.keluar}` : ''}  [{l.isi.join(', ')}]
            </Text>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.tombolSimpan, (!hasil.ok || menyimpan) && styles.mati]}
        onPress={simpan}
        disabled={!hasil.ok || menyimpan}
        accessibilityRole="button"
      >
        <Text style={styles.tombolSimpanTeks}>
          {menyimpan ? 'Menyimpan...' : sunting ? 'Simpan perubahan' : 'Simpan soal'}
        </Text>
      </TouchableOpacity>
      {!sunting && (
        <Text style={styles.catatan}>
          Soal baru langsung aktif dan bisa muncul di sesi Tebak semua siswa. Kamu bisa menonaktifkannya
          kapan saja dari daftar.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  latar: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 18, paddingBottom: 48 },

  label: { fontWeight: '700', color: warna.teks, marginTop: 14, marginBottom: 8 },
  catatan: { color: warna.teksRedup, fontSize: 12, lineHeight: 18, marginTop: 6 },
  barisPil: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mati: { opacity: 0.4 },

  pil: {
    minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1,
    borderColor: warna.garis, backgroundColor: '#fff', justifyContent: 'center',
  },
  pilAktif: { backgroundColor: warna.gelap, borderColor: warna.gelap },
  pilTeks: { fontWeight: '700', color: warna.teks },
  pilTeksAktif: { color: '#fff' },

  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#D6CFC7',
    paddingHorizontal: 14, paddingVertical: 12, color: warna.teks, minHeight: 48,
  },
  inputPerintah: { minHeight: 130, textAlignVertical: 'top', fontFamily: fontKode },
  inputBesar: { minHeight: 90, textAlignVertical: 'top' },

  tombolKecil: {
    minHeight: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1,
    borderColor: warna.garis, backgroundColor: '#fff', justifyContent: 'center', alignSelf: 'flex-start',
    marginTop: 8,
  },
  tombolKecilTeks: { fontWeight: '700', color: warna.teks },

  opsi: {
    backgroundColor: warna.kartu, borderRadius: 14, borderWidth: 1,
    borderColor: warna.garis, padding: 10, marginBottom: 10,
  },
  opsiBenar: { borderColor: warna.hijau, borderWidth: 2, backgroundColor: '#ECFDF5' },
  opsiAtas: { flexDirection: 'row', alignItems: 'center' },
  radio: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  radioDalam: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#6B625B' },
  radioDalamAktif: { backgroundColor: warna.hijau, borderColor: warna.hijau },
  opsiHuruf: { width: 22, fontWeight: '800', color: warna.teksRedup },
  opsiInput: { flex: 1 },
  hapusOpsi: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  hapusOpsiTeks: { color: '#B91C1C', fontWeight: '700' },

  kotakGalat: { backgroundColor: '#FEE2E2', borderRadius: 14, padding: 14, marginTop: 16 },
  galatJudul: { color: '#B91C1C', fontWeight: '800', marginBottom: 4 },
  galatTeks: { color: '#B91C1C', lineHeight: 20 },

  kotakPeringatan: {
    backgroundColor: warna.kotakKode, borderRadius: 14, borderWidth: 1,
    borderColor: '#F5C9B5', padding: 14, marginTop: 16,
  },
  peringatanJudul: { color: '#7C2D12', fontWeight: '800', marginBottom: 4 },
  peringatanTeks: { color: '#7C2D12', lineHeight: 20 },

  kode: { backgroundColor: warna.gelap, borderRadius: 16, padding: 16, marginTop: 16 },
  kodeJudul: { color: '#5EEAD4', fontWeight: '800', fontSize: 12, letterSpacing: 0.5, marginBottom: 8 },
  kodeBaris: { color: '#E2E8F0', fontFamily: fontKode, fontSize: 13, lineHeight: 22 },
  kodeLangkah: { color: '#94A3B8', fontFamily: fontKode, fontSize: 12, lineHeight: 20 },
  garis: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 10 },

  tombolSimpan: {
    backgroundColor: warna.hijau, borderRadius: 14, minHeight: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
  },
  tombolSimpanTeks: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
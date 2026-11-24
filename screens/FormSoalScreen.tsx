import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { font, fontKode, warna } from '../lib/tema';
import { INFO_MISKONSEPSI } from '../data/miskonsepsi';
import type { Miskonsepsi } from '../data/miskonsepsi';
import type { Tingkat } from '../data/soal';
import { BATAS } from '../logic/soalGuru';
import { jalankan } from '../logic/simulasi';
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
import Kartu from '../components/ui/Kartu';
import KolomIsian from '../components/ui/KolomIsian';
import Tombol from '../components/ui/Tombol';
import TombolPilihan, { IkonTingkat } from '../components/guru/TombolPilihan';
import UbinPerintah from '../components/guru/UbinPerintah';
import PratinjauKunci from '../components/guru/PratinjauKunci';
import { WARNA_TINGKAT } from '../components/guru/perintah';

const TINGKAT: Tingkat[] = ['mudah', 'sedang', 'menantang'];
const DAFTAR_MISKONSEPSI = Object.keys(INFO_MISKONSEPSI) as Miskonsepsi[];

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

  // Tampilan saja
  const [editTeks, setEditTeks] = useState(false);
  const [goyang, setGoyang] = useState(0);

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

  // ===== Tombol cepat (isi perintahnya sama seperti sebelumnya) =====
  // Kalau perintah yang baru ditambahkan langsung gagal (mengambil dari struktur kosong,
  // atau lebih dari batas), area ubin bergoyang dan HP bergetar. Tampilan saja.
  function getarKalauGagal(teksBaru: string) {
    const ops = parsePerintah(teksBaru);
    let gagal = ops.length > BATAS.perintahMaks;
    if (!gagal) {
      try {
        const h = jalankan(sim.struktur, ops);
        gagal = h.langkah.length > 0 && h.langkah[h.langkah.length - 1].galat !== null;
      } catch {
        gagal = false; // baris tidak valid ditulis manual; pesan galatnya tetap tampil
      }
    }
    if (gagal) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setGoyang((g) => g + 1);
    }
  }

  function cepatTambah() {
    const baru = tambahBaris(sim.perintah, `${namaTambah}(${nilaiBerikutnya(daftarPerintah)})`);
    ubahSim({ perintah: baru });
    getarKalauGagal(baru);
  }

  function cepatAmbil() {
    const baru = tambahBaris(sim.perintah, `${namaAmbil}()`);
    ubahSim({ perintah: baru });
    getarKalauGagal(baru);
  }

  function cepatHapus() {
    ubahSim({ perintah: hapusBarisTerakhir(sim.perintah) });
  }

  const warnaStruktur = sim.struktur === 'stack' ? warna.oranye : warna.biru;

  const kotakGalat =
    disentuh && daftarGalat.length > 0 ? (
      <View style={styles.kotakGalat} accessibilityRole="alert">
        <Ionicons name="warning-outline" size={20} color="#B91C1C" />
        <View style={styles.kolom}>
          <Text style={styles.galatJudul}>Belum bisa disimpan:</Text>
          {daftarGalat.map((g, i) => (
            <Text key={i} style={styles.galatTeks}>
              • {g}
            </Text>
          ))}
        </View>
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.latar} edges={['top']}>
      <ScrollView contentContainerStyle={styles.isi} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.kembali, pressed && { backgroundColor: warna.kotakKode }]}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <Ionicons name="arrow-back" size={22} color={warna.teks} />
          </Pressable>
          <Text style={styles.judulLayar} accessibilityRole="header">
            {sunting ? 'Ubah Soal' : 'Soal Baru'}
          </Text>
        </View>

        {/* Pilihan */}
        <Kartu style={styles.kartu}>
          <Grup label="Jenis soal">
            <TombolPilihan
              label="Simulasi"
              ikon="list-outline"
              terpilih={jenis === 'simulasi'}
              warnaTerpilih={warna.ungu}
              onPress={() => setJenis('simulasi')}
              nonaktif={!!sunting}
            />
            <TombolPilihan
              label="Pilihan ganda"
              ikon="list-circle-outline"
              terpilih={jenis === 'pilihan-ganda'}
              warnaTerpilih={warna.ungu}
              onPress={() => setJenis('pilihan-ganda')}
              nonaktif={!!sunting}
            />
          </Grup>
          {!!sunting && (
            <Text style={styles.catatan}>
              Jenis soal tidak bisa diubah. Buat soal baru kalau ingin jenis yang lain.
            </Text>
          )}

          {jenis === 'simulasi' && (
            <>
              <Grup label="Struktur data">
                <TombolPilihan
                  label="Stack"
                  ikon="layers-outline"
                  terpilih={sim.struktur === 'stack'}
                  warnaTerpilih={warna.oranye}
                  onPress={() =>
                    ubahSim({ struktur: 'stack', perintah: terjemahkanPerintah(sim.perintah, 'stack') })
                  }
                />
                <TombolPilihan
                  label="Queue"
                  ikon="people-outline"
                  terpilih={sim.struktur === 'queue'}
                  warnaTerpilih={warna.biru}
                  onPress={() =>
                    ubahSim({ struktur: 'queue', perintah: terjemahkanPerintah(sim.perintah, 'queue') })
                  }
                />
              </Grup>

              <Grup label="Tingkat">
                {TINGKAT.map((t, i) => (
                  <TombolPilihan
                    key={t}
                    label={t}
                    ikon={(w) => <IkonTingkat jumlah={i + 1} warnaIkon={w} />}
                    terpilih={sim.tingkat === t}
                    warnaTerpilih={WARNA_TINGKAT[t].kuat}
                    onPress={() => ubahSim({ tingkat: t })}
                  />
                ))}
              </Grup>

              <KolomIsian
                label="Cerita singkat (opsional)"
                ikon="chatbox-outline"
                value={sim.konteks}
                onChangeText={(t) => ubahSim({ konteks: t })}
                maxLength={BATAS.konteks}
                placeholder={
                  sim.struktur === 'stack'
                    ? 'Contoh: Piring bernomor ditumpuk di rak cuci.'
                    : 'Contoh: Siswa antre beli bakso.'
                }
              />
            </>
          )}
        </Kartu>

        {jenis === 'simulasi' ? (
          <>
            {/* Susun perintah */}
            <Kartu style={styles.kartu}>
              <View style={styles.judulBaris}>
                <Text style={styles.judulKartu} accessibilityRole="header">
                  Susun perintah
                </Text>
                <View style={styles.pil} accessible accessibilityLabel={`${daftarPerintah.length} dari ${BATAS.perintahMaks} perintah`}>
                  <Text style={styles.pilTeks}>
                    {daftarPerintah.length}/{BATAS.perintahMaks}
                  </Text>
                </View>
              </View>

              <UbinPerintah perintah={daftarPerintah} struktur={sim.struktur} goyang={goyang} />

              {kotakGalat}

              <View style={styles.barisCepat}>
                <TombolCepat
                  label={`+ ${namaTambah}`}
                  latar={warnaStruktur}
                  bayangan={sim.struktur === 'stack' ? '#8A2E08' : '#024B73'}
                  warnaTeks="#FFFFFF"
                  onPress={cepatTambah}
                  a11y={`Tambah ${namaTambah}`}
                />
                <TombolCepat
                  label={`+ ${namaAmbil}`}
                  latar="#FFFFFF"
                  garis="#FCA5A5"
                  bayangan="#FCA5A5"
                  warnaTeks="#B91C1C"
                  onPress={cepatAmbil}
                  a11y={`Tambah ${namaAmbil}`}
                />
                <TombolCepat
                  label="Hapus"
                  ikon="arrow-undo"
                  latar="#FFFFFF"
                  garis={warna.garis}
                  bayangan={warna.garis}
                  warnaTeks={warna.teks}
                  onPress={cepatHapus}
                  a11y="Hapus perintah terakhir"
                  nonaktif={daftarPerintah.length === 0}
                />
              </View>

              <Pressable
                onPress={() => setEditTeks((v) => !v)}
                style={styles.lipat}
                accessibilityRole="button"
                accessibilityState={{ expanded: editTeks }}
                accessibilityLabel="Edit sebagai teks"
              >
                <Ionicons name="code-slash-outline" size={18} color={warna.teksRedup} />
                <Text style={styles.lipatTeks}>Edit sebagai teks</Text>
                <Ionicons name={editTeks ? 'chevron-up' : 'chevron-down'} size={18} color={warna.teksRedup} />
              </Pressable>

              {editTeks && (
                <View style={styles.editTeks}>
                  <TextInput
                    style={styles.inputPerintah}
                    value={sim.perintah}
                    onChangeText={(t) => ubahSim({ perintah: t })}
                    multiline
                    maxLength={600}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder={`${namaTambah}(1)\n${namaTambah}(2)\n${namaAmbil}()`}
                    placeholderTextColor={warna.teksRedup}
                    accessibilityLabel="Daftar perintah, satu per baris"
                  />
                  <Text style={styles.catatan}>
                    Satu perintah per baris. Setiap nilai harus berbeda, dan jangan sampai mengambil dari
                    struktur yang kosong.
                  </Text>
                </View>
              )}
            </Kartu>

            <PratinjauKunci
              struktur={sim.struktur}
              keluar={pratinjau ? pratinjau.keluar : null}
              isiAkhir={pratinjau ? pratinjau.isiAkhir : null}
            />
          </>
        ) : (
          <>
            <Kartu style={styles.kartu}>
              <KolomIsian
                label="Pertanyaan"
                value={pg.pertanyaan}
                onChangeText={(t) => ubahPg({ pertanyaan: t })}
                multiline
                maxLength={BATAS.pertanyaanMaks}
                placeholder="Tulis pertanyaannya di sini"
              />
            </Kartu>

            <Kartu style={styles.kartu}>
              <Text style={styles.labelGrup}>Pilihan (ketuk huruf untuk menandai jawaban benar)</Text>
              {pg.opsi.map((o, i) => {
                const benar = i === pg.indeksBenar;
                const huruf = String.fromCharCode(65 + i);
                return (
                  <View key={i} style={styles.opsi}>
                    <View style={styles.opsiAtas}>
                      <Pressable
                        onPress={() => ubahPg({ indeksBenar: i })}
                        style={[styles.huruf, benar && styles.hurufBenar]}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: benar }}
                        accessibilityLabel={`Tandai pilihan ${huruf} sebagai jawaban benar`}
                      >
                        <Text style={[styles.hurufTeks, benar && { color: '#FFFFFF' }]}>{huruf}</Text>
                      </Pressable>
                      <View style={styles.kolom}>
                        <KolomIsian
                          label={`Pilihan ${huruf}`}
                          value={o.teks}
                          onChangeText={(t) => ubahOpsi(i, { teks: t })}
                          maxLength={BATAS.teksPilihanMaks}
                          placeholder={`Pilihan ${huruf}`}
                          aksen={benar ? warna.hijau : warna.biru}
                        />
                      </View>
                    </View>
                    <View style={styles.opsiAksi}>
                      {!benar && (
                        <Pressable
                          style={styles.tautan}
                          onPress={() => siklusMiskonsepsi(i)}
                          accessibilityRole="button"
                        >
                          <Text style={styles.tautanTeks}>
                            Miskonsepsi: {o.miskonsepsi ? INFO_MISKONSEPSI[o.miskonsepsi].judul : 'tidak ada'} ▸
                          </Text>
                        </Pressable>
                      )}
                      {pg.opsi.length > BATAS.pilihanMin && (
                        <Pressable style={styles.tautan} onPress={() => hapusOpsi(i)} accessibilityRole="button">
                          <Text style={[styles.tautanTeks, { color: '#B91C1C' }]}>Hapus pilihan {huruf}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
              {pg.opsi.length < BATAS.pilihanMaks && (
                <Tombol label="Tambah pilihan" varian="sekunder" ikon="add" onPress={tambahOpsi} />
              )}
            </Kartu>

            <Kartu style={styles.kartu}>
              <KolomIsian
                label="Penjelasan jawaban"
                value={pg.penjelasan}
                onChangeText={(t) => ubahPg({ penjelasan: t })}
                multiline
                maxLength={BATAS.penjelasanMaks}
                placeholder="Mengapa jawaban itu benar? (tampil setelah siswa menjawab)"
              />
            </Kartu>

            {kotakGalat}
          </>
        )}

        {daftarPeringatan.length > 0 && (
          <View style={styles.kotakPeringatan}>
            <Ionicons name="bulb-outline" size={20} color="#C2410C" />
            <View style={styles.kolom}>
              <Text style={styles.peringatanJudul}>Saran perbaikan (tidak menghalangi penyimpanan):</Text>
              {daftarPeringatan.map((g, i) => (
                <Text key={i} style={styles.peringatanTeks}>
                  • {g}
                </Text>
              ))}
            </View>
          </View>
        )}

        <Tombol
          label={sunting ? 'Simpan perubahan' : 'Simpan soal'}
          varian="utama"
          ikon="checkmark"
          tinggi={58}
          onPress={simpan}
          nonaktif={!hasil.ok}
          memuat={menyimpan}
          warnaNonaktif={{ latar: warna.hijauMuda, teks: warna.hijauTua }}
          accessibilityHint={hasil.ok ? undefined : 'Lengkapi soal dulu'}
        />
        {!sunting && (
          <View style={styles.info}>
            <Ionicons name="information-circle-outline" size={16} color={warna.teksRedup} />
            <Text style={[styles.catatan, styles.kolom]}>
              Soal baru langsung aktif dan bisa muncul di sesi Tebak semua siswa. Kamu bisa menonaktifkannya
              kapan saja dari daftar.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Grup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.grup}>
      <Text style={styles.labelGrup}>{label}</Text>
      <View style={styles.barisPilihan} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {children}
      </View>
    </View>
  );
}

const TINGGI_CEPAT = 52;
const TURUN_CEPAT = 3;

function TombolCepat({
  label,
  ikon,
  latar,
  garis,
  bayangan,
  warnaTeks,
  onPress,
  a11y,
  nonaktif = false,
}: {
  label: string;
  ikon?: ComponentProps<typeof Ionicons>['name'];
  latar: string;
  garis?: string;
  bayangan: string;
  warnaTeks: string;
  onPress: () => void;
  a11y: string;
  nonaktif?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={nonaktif}
      style={[styles.cepat, nonaktif && { opacity: 0.45 }]}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: nonaktif }}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.cepatBayangan, { backgroundColor: bayangan }]} />
          <View
            style={[
              styles.cepatMuka,
              { backgroundColor: latar },
              garis ? { borderWidth: 2, borderColor: garis } : null,
              pressed && { transform: [{ translateY: TURUN_CEPAT }] },
            ]}
          >
            {ikon && <Ionicons name={ikon} size={18} color={warnaTeks} />}
            <Text style={[styles.cepatTeks, { color: warnaTeks }]} numberOfLines={1} adjustsFontSizeToFit>
              {label}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  latar: { flex: 1, backgroundColor: warna.latar },
  isi: { padding: 20, paddingBottom: 48, gap: 16 },
  kolom: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kembali: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: warna.garis,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  judulLayar: { flex: 1, fontFamily: font.judul, fontSize: 22, color: warna.teks },

  kartu: { borderRadius: 22, padding: 16, gap: 14 },
  grup: { gap: 8 },
  labelGrup: { fontFamily: font.tebal, fontSize: 13, color: warna.teks },
  barisPilihan: { flexDirection: 'row', gap: 8 },
  catatan: { fontFamily: font.isi, fontSize: 12, lineHeight: 18, color: warna.teksRedup },

  judulBaris: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  judulKartu: { fontFamily: font.judul, fontSize: 15, color: warna.teks },
  pil: { backgroundColor: warna.garis, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pilTeks: { fontFamily: font.judul, fontSize: 12, color: warna.teksRedup },

  barisCepat: { flexDirection: 'row', gap: 8 },
  cepat: { flex: 1, height: TINGGI_CEPAT + TURUN_CEPAT },
  cepatBayangan: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: TURUN_CEPAT,
    height: TINGGI_CEPAT,
    borderRadius: 14,
  },
  cepatMuka: {
    height: TINGGI_CEPAT,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  cepatTeks: { flexShrink: 1, fontFamily: font.judul, fontSize: 14 },

  lipat: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: warna.kotakKode,
  },
  lipatTeks: { flex: 1, fontFamily: font.tebal, fontSize: 14, color: warna.teks },
  editTeks: { gap: 8 },
  inputPerintah: {
    minHeight: 130,
    textAlignVertical: 'top',
    fontFamily: fontKode,
    fontSize: 14,
    color: warna.teks,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: warna.garis,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  opsi: { gap: 4 },
  opsiAtas: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  huruf: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: warna.garis,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  hurufBenar: { backgroundColor: warna.hijau, borderColor: warna.hijau },
  hurufTeks: { fontFamily: font.judul, fontSize: 16, color: warna.teks },
  opsiAksi: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingLeft: 54 },
  tautan: { minHeight: 44, justifyContent: 'center' },
  tautanTeks: { fontFamily: font.tebal, fontSize: 13, color: warna.biru },

  kotakGalat: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
  },
  galatJudul: { fontFamily: font.judul, fontSize: 13, color: '#B91C1C', marginBottom: 2 },
  galatTeks: { fontFamily: font.isi, fontSize: 13, lineHeight: 19, color: '#B91C1C' },

  kotakPeringatan: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FED7AA',
    padding: 12,
  },
  peringatanJudul: { fontFamily: font.judul, fontSize: 13, color: '#9A3412', marginBottom: 2 },
  peringatanTeks: { fontFamily: font.isi, fontSize: 13, lineHeight: 19, color: warna.teks },

  info: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
});

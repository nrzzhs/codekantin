import { supabase } from './supabase';
import type { BarisSoal } from '../logic/soalGuru';
import type { BarisKelola, PayloadSoal } from '../logic/formSoal';

const KOLOM_SOAL =
  'id, jenis, tingkat, struktur, konteks, operasi, pertanyaan, pilihan, benar, penjelasan, aktif, versi';
const KOLOM_KELOLA = `${KOLOM_SOAL}, diubah`;

// Pesan yang ramah untuk galat aturan akses (RLS)
function pesanGalat(pesan: string): string {
  if (pesan.toLowerCase().includes('row-level security')) {
    return 'Akunmu bukan akun guru, atau soal ini bukan milikmu.';
  }
  return pesan;
}

// Dipakai siswa: semua soal aktif dari semua guru
export async function ambilSoalCloud(): Promise<BarisSoal[]> {
  const { data, error } = await supabase
    .from('soal')
    .select(KOLOM_SOAL)
    .eq('aktif', true)
    .order('diubah', { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as BarisSoal[];
}

// Dipakai guru: semua soal milik sendiri, termasuk yang nonaktif
export async function ambilSoalSaya(userId: string): Promise<BarisKelola[]> {
  const { data, error } = await supabase
    .from('soal')
    .select(KOLOM_KELOLA)
    .eq('guru_id', userId)
    .order('diubah', { ascending: false })
    .limit(300);
  if (error) throw new Error(pesanGalat(error.message));
  return (data ?? []) as unknown as BarisKelola[];
}

export async function tambahSoal(payload: PayloadSoal): Promise<string> {
  const { data, error } = await supabase.from('soal').insert(payload).select('id').single();
  if (error) throw new Error(pesanGalat(error.message));
  return String((data as { id: string }).id);
}

export async function ubahSoal(id: string, payload: PayloadSoal): Promise<void> {
  const { data, error } = await supabase.from('soal').update(payload).eq('id', id).select('id');
  if (error) throw new Error(pesanGalat(error.message));
  if (!data || data.length === 0) {
    throw new Error('Soal tidak ditemukan atau bukan milikmu.');
  }
}

export async function setAktif(id: string, aktif: boolean): Promise<void> {
  await ubahSoal(id, { aktif });
}

export async function hapusSoal(id: string): Promise<void> {
  const { data, error } = await supabase.from('soal').delete().eq('id', id).select('id');
  if (error) throw new Error(pesanGalat(error.message));
  if (!data || data.length === 0) {
    throw new Error('Soal tidak ditemukan atau bukan milikmu.');
  }
}
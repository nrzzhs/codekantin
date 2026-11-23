import { supabase } from './supabase';
import type { BarisSoal } from '../logic/soalGuru';

const KOLOM_SOAL =
  'id, jenis, tingkat, struktur, konteks, operasi, pertanyaan, pilihan, benar, penjelasan, aktif, versi';

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
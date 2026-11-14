export const XP_PER_BENAR = 10;
export const BONUS_XP_SEMPURNA = 20;
export const POIN_MAKS = 20;
export const MAKS_RIWAYAT = 50;

export type HasilRingkas = { idSoal: string; benar: boolean; miskonsepsi: string | null };

export type CatatanSesi = {
  sesiId: string;
  waktu: string;            // ISO
  hasil: HasilRingkas[];
  tersinkron: boolean;      // sudah tercatat di Supabase?
};

// Rumus yang sama persis dengan fungsi selesaikan_sesi_tebak di Supabase
export function hitungHadiah(benar: number, total: number): { xp: number; poin: number } {
  if (total <= 0 || benar < 0) return { xp: 0, poin: 0 };
  const b = Math.min(benar, total);
  return {
    xp: b * XP_PER_BENAR + (b === total ? BONUS_XP_SEMPURNA : 0),
    poin: Math.floor((b * POIN_MAKS) / total),
  };
}

export function jumlahBenar(hasil: HasilRingkas[]): number {
  return hasil.filter((h) => h.benar).length;
}

// Menambah catatan sesi. Tidak menggandakan sesi yang sama, dan tidak pernah
// membuang catatan yang belum tersinkron.
export function tambahCatatan(
  riwayat: CatatanSesi[],
  catatan: CatatanSesi,
  maks: number = MAKS_RIWAYAT,
): CatatanSesi[] {
  const dasar = Array.isArray(riwayat) ? riwayat : [];
  if (dasar.some((c) => c.sesiId === catatan.sesiId)) return dasar;
  const gabungan = [...dasar, catatan];
  let kelebihan = gabungan.length - maks;
  if (kelebihan <= 0) return gabungan;
  return gabungan.filter((c) => {
    if (kelebihan > 0 && c.tersinkron) {
      kelebihan--;
      return false;
    }
    return true;
  });
}

export function tandaiTersinkron(riwayat: CatatanSesi[], sesiId: string): CatatanSesi[] {
  const dasar = Array.isArray(riwayat) ? riwayat : [];
  return dasar.map((c) => (c.sesiId === sesiId ? { ...c, tersinkron: true } : c));
}

export function ringkasRiwayat(riwayat: CatatanSesi[]) {
  const daftar = Array.isArray(riwayat) ? riwayat : [];
  let benar = 0;
  let total = 0;
  const hitung = new Map<string, number>();
  for (const c of daftar) {
    benar += jumlahBenar(c.hasil);
    total += c.hasil.length;
    for (const h of c.hasil) {
      if (h.miskonsepsi) hitung.set(h.miskonsepsi, (hitung.get(h.miskonsepsi) ?? 0) + 1);
    }
  }
  const miskonsepsi = Array.from(hitung, ([jenis, jumlah]) => ({ jenis, jumlah })).sort(
    (a, b) => b.jumlah - a.jumlah || a.jenis.localeCompare(b.jenis),
  );
  return {
    sesi: daftar.length,
    benar,
    total,
    akurasi: total === 0 ? 0 : Math.round((benar / total) * 100),
    miskonsepsi,
  };
}
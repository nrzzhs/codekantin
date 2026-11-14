import {
  createContext,
  useContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useSimulator } from '../hooks/useSimulator';
import { useTersimpan } from '../hooks/useTersimpan';
import type { Miskonsepsi } from '../data/miskonsepsi';
import type { CatatanSesi } from '../logic/hadiah';

export const KAPASITAS = 5;

// ===== Bandingkan =====
export type StateBandingkan = { masuk: string[]; dikeluarkan: boolean };
const AWAL_BANDINGKAN: StateBandingkan = { masuk: [], dikeluarkan: false };

// ===== Tebak =====
export type HasilSoal = {
  idSoal: string;
  jawaban: string[];
  benar: boolean;
  miskonsepsi: Miskonsepsi | null;
};

export type SesiTebak = {
  sesiId: string;              // dipakai server agar sesi tidak dihitung dua kali
  idSoal: string[];            // soal dalam sesi ini, berurutan
  indeks: number;              // soal yang sedang dikerjakan (0-based)
  hasil: HasilSoal[];          // jawaban yang sudah diperiksa
  draft: (string | null)[];    // jawaban yang sedang diisi
  diperiksa: boolean;          // umpan balik sedang ditampilkan
};

type Nilai = {
  antrean: ReturnType<typeof useSimulator>;
  tumpukan: ReturnType<typeof useSimulator>;
  bandingkan: {
    nilai: StateBandingkan;
    setNilai: (n: StateBandingkan) => void;
    siap: boolean;
  };
  tebak: {
    nilai: SesiTebak | null;
    setNilai: (n: SesiTebak | null) => void;
    siap: boolean;
  };
  riwayatTebak: {
    nilai: CatatanSesi[];
    setNilai: Dispatch<SetStateAction<CatatanSesi[]>>;
    siap: boolean;
  };
};

const Konteks = createContext<Nilai | null>(null);

export function SimulatorProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const antrean = useSimulator('queue', KAPASITAS, `@codekantin/sim/${userId}/antrean`);
  const tumpukan = useSimulator('stack', KAPASITAS, `@codekantin/sim/${userId}/tumpukan`);
  const bandingkan = useTersimpan<StateBandingkan>(
    `@codekantin/sim/${userId}/bandingkan`,
    AWAL_BANDINGKAN,
  );
  const tebak = useTersimpan<SesiTebak | null>(`@codekantin/sim/${userId}/tebak`, null);
  const riwayatTebak = useTersimpan<CatatanSesi[]>(`@codekantin/attempts/${userId}`, []);

  return (
    <Konteks.Provider value={{ antrean, tumpukan, bandingkan, tebak, riwayatTebak }}>
      {children}
    </Konteks.Provider>
  );
}

function useKonteks(): Nilai {
  const nilai = useContext(Konteks);
  if (!nilai) throw new Error('Harus dipakai di dalam SimulatorProvider');
  return nilai;
}

export const useAntrean = () => useKonteks().antrean;
export const useTumpukan = () => useKonteks().tumpukan;
export const useBandingkan = () => useKonteks().bandingkan;
export const useTebak = () => useKonteks().tebak;
export const useRiwayatTebak = () => useKonteks().riwayatTebak;
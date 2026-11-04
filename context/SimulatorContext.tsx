import { createContext, useContext, type ReactNode } from 'react';
import { useSimulator } from '../hooks/useSimulator';
import { useTersimpan } from '../hooks/useTersimpan';

export const KAPASITAS = 5;

export type StateBandingkan = { masuk: string[]; dikeluarkan: boolean };
const AWAL_BANDINGKAN: StateBandingkan = { masuk: [], dikeluarkan: false };

type Nilai = {
  antrean: ReturnType<typeof useSimulator>;
  tumpukan: ReturnType<typeof useSimulator>;
  bandingkan: {
    nilai: StateBandingkan;
    setNilai: (n: StateBandingkan) => void;
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
  return (
    <Konteks.Provider value={{ antrean, tumpukan, bandingkan }}>{children}</Konteks.Provider>
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
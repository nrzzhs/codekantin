import { createContext, useContext, type ReactNode } from 'react';
import { useSimulator } from '../hooks/useSimulator';

export const KAPASITAS = 5;

type Nilai = {
  antrean: ReturnType<typeof useSimulator>;
  tumpukan: ReturnType<typeof useSimulator>;
};

const Konteks = createContext<Nilai | null>(null);

export function SimulatorProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const antrean = useSimulator('queue', KAPASITAS, `@codekantin/sim/${userId}/antrean`);
  const tumpukan = useSimulator('stack', KAPASITAS, `@codekantin/sim/${userId}/tumpukan`);
  return <Konteks.Provider value={{ antrean, tumpukan }}>{children}</Konteks.Provider>;
}

function useKonteks(): Nilai {
  const nilai = useContext(Konteks);
  if (!nilai) throw new Error('Harus dipakai di dalam SimulatorProvider');
  return nilai;
}

export const useAntrean = () => useKonteks().antrean;
export const useTumpukan = () => useKonteks().tumpukan;
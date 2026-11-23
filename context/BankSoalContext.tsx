import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Soal } from '../data/soal';
import { ubahDaftarBaris } from '../logic/soalGuru';
import { ambilSoalCloud } from '../lib/bankSoal';

const KUNCI_CACHE = '@codekantin/bank-soal';

type Nilai = {
  soalGuru: Soal[];
  siap: boolean;                                    // salinan di HP sudah dibaca
  memuat: boolean;
  galat: string | null;
  muatUlang: (batasMs?: number) => Promise<Soal[]>; // tidak pernah gagal, paling lama batasMs
};

const Konteks = createContext<Nilai | null>(null);

export function BankSoalProvider({ children }: { children: ReactNode }) {
  const [soalGuru, setSoalGuru] = useState<Soal[]>([]);
  const [siap, setSiap] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const terbaru = useRef<Soal[]>([]);

  // Semua soal divalidasi ulang di sini, apa pun sumbernya (server atau salinan di HP)
  const terapkan = useCallback((baris: unknown): Soal[] => {
    const soal = ubahDaftarBaris(baris);
    terbaru.current = soal;
    setSoalGuru(soal);
    return soal;
  }, []);

  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const teks = await AsyncStorage.getItem(KUNCI_CACHE);
        if (teks && !batal) terapkan(JSON.parse(teks));
      } catch {
        // salinan rusak: abaikan
      }
      if (!batal) setSiap(true);
    })();
    return () => {
      batal = true;
    };
  }, [terapkan]);

  const segarkan = useCallback(async (): Promise<Soal[]> => {
    setMemuat(true);
    setGalat(null);
    try {
      const baris = await ambilSoalCloud();
      AsyncStorage.setItem(KUNCI_CACHE, JSON.stringify(baris)).catch(() => {});
      return terapkan(baris);
    } catch (e: any) {
      setGalat(e?.message ?? 'Gagal memuat soal dari guru.');
      return terbaru.current;
    } finally {
      setMemuat(false);
    }
  }, [terapkan]);

  useEffect(() => {
    if (siap) segarkan();
  }, [siap, segarkan]);

  const muatUlang = useCallback(
    (batasMs: number = 2000): Promise<Soal[]> =>
      new Promise((selesai) => {
        const timer = setTimeout(() => selesai(terbaru.current), batasMs);
        segarkan().then((hasil) => {
          clearTimeout(timer);
          selesai(hasil);
        });
      }),
    [segarkan],
  );

  const nilai = useMemo(
    () => ({ soalGuru, siap, memuat, galat, muatUlang }),
    [soalGuru, siap, memuat, galat, muatUlang],
  );

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function useBankSoal(): Nilai {
  const nilai = useContext(Konteks);
  if (!nilai) throw new Error('Harus dipakai di dalam BankSoalProvider');
  return nilai;
}
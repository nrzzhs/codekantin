import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useTersimpan<T>(kunci: string, awal: T) {
  const [nilai, setNilai] = useState<T>(awal);
  const [siap, setSiap] = useState(false);

  // Muat data tersimpan saat pertama dibuka
  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const teks = await AsyncStorage.getItem(kunci);
        if (teks && !batal) setNilai(JSON.parse(teks) as T);
      } catch {
        // data rusak atau tidak terbaca: mulai dari awal
      }
      if (!batal) setSiap(true);
    })();
    return () => {
      batal = true;
    };
  }, [kunci]);

  // Simpan setiap ada perubahan
  useEffect(() => {
    if (!siap) return;
    AsyncStorage.setItem(kunci, JSON.stringify(nilai)).catch(() => {});
  }, [nilai, siap, kunci]);

  return { nilai, setNilai, siap };
}
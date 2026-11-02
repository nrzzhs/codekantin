import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from '../logic/Stack';
import { Queue } from '../logic/Queue';
import type { JenisStruktur } from '../logic/simulasi';

export type Snapshot = {
  isi: string[];            // stack: dasar → TOP, queue: FRONT → REAR
  pesan: string;
  galat: 'underflow' | 'overflow' | null;
  keluar: string | null;
};

const AWAL: Snapshot = {
  isi: [],
  pesan: 'Mulai dari struktur kosong.',
  galat: null,
  keluar: null,
};

const MAKS_RIWAYAT = 200; // batasi supaya penyimpanan tidak membengkak

type Tersimpan = { riwayat: Snapshot[]; penghitung: number };

export function useSimulator(
  jenis: JenisStruktur,
  kapasitas: number = Infinity,
  kunciSimpan?: string,
) {
  const stack = useRef(new Stack<string>(kapasitas));
  const queue = useRef(new Queue<string>(kapasitas));
  const [riwayat, setRiwayat] = useState<Snapshot[]>([AWAL]);
  const [indeks, setIndeks] = useState(0);
  const [penghitung, setPenghitung] = useState(0); // jumlah elemen yang pernah berhasil ditambah
  const [siap, setSiap] = useState(!kunciSimpan);

  const adalahStack = jenis === 'stack';
  const wadah = adalahStack ? 'tumpukan' : 'antrean';
  const diAkhir = indeks === riwayat.length - 1;

  const isiSaatIni = () => (adalahStack ? stack.current.toArray() : queue.current.toArray());

  // Muat simulasi tersimpan saat pertama dibuka
  useEffect(() => {
    if (!kunciSimpan) return;
    let batal = false;
    (async () => {
      try {
        const teks = await AsyncStorage.getItem(kunciSimpan);
        if (teks && !batal) {
          const data: Tersimpan = JSON.parse(teks);
          const terakhir = data.riwayat?.[data.riwayat.length - 1];
          if (terakhir && Array.isArray(terakhir.isi)) {
            stack.current.clear();
            queue.current.clear();
            for (const x of terakhir.isi) {
              if (adalahStack) stack.current.push(x);
              else queue.current.enqueue(x);
            }
            setRiwayat(data.riwayat);
            setIndeks(data.riwayat.length - 1);
            setPenghitung(data.penghitung ?? 0);
          }
        }
      } catch {
        // data rusak atau tidak terbaca: mulai dari kosong
      }
      if (!batal) setSiap(true);
    })();
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunciSimpan]);

  // Simpan setiap ada perubahan
  useEffect(() => {
    if (!kunciSimpan || !siap) return;
    const data: Tersimpan = { riwayat, penghitung };
    AsyncStorage.setItem(kunciSimpan, JSON.stringify(data)).catch(() => {});
  }, [riwayat, penghitung, siap, kunciSimpan]);

  function catat(snap: Snapshot) {
    const baru = [...riwayat, snap].slice(-MAKS_RIWAYAT);
    setRiwayat(baru);
    setIndeks(baru.length - 1);
  }

  // push / enqueue. Mengembalikan true kalau berhasil.
  function tambah(item: string): boolean {
    if (!siap || !diAkhir) return false; // saat replay, operasi dikunci
    const op = adalahStack ? `push(${item})` : `enqueue(${item})`;
    const berhasil = adalahStack ? stack.current.push(item) : queue.current.enqueue(item);
    if (berhasil) setPenghitung((n) => n + 1);
    catat({
      isi: isiSaatIni(),
      pesan: berhasil ? op : `${op} gagal: ${wadah} penuh (overflow).`,
      galat: berhasil ? null : 'overflow',
      keluar: null,
    });
    return berhasil;
  }

  // pop / dequeue. Mengembalikan elemen yang keluar, atau undefined kalau kosong.
  function ambil(): string | undefined {
    if (!siap || !diAkhir) return undefined;
    const op = adalahStack ? 'pop()' : 'dequeue()';
    const nilai = adalahStack ? stack.current.pop() : queue.current.dequeue();
    if (nilai === undefined) {
      catat({
        isi: isiSaatIni(),
        pesan: `${op} gagal: ${wadah} kosong (underflow).`,
        galat: 'underflow',
        keluar: null,
      });
    } else {
      catat({ isi: isiSaatIni(), pesan: `${op} → ${nilai}`, galat: null, keluar: nilai });
    }
    return nilai;
  }

  function reset() {
    stack.current.clear();
    queue.current.clear();
    setRiwayat([AWAL]);
    setIndeks(0);
    setPenghitung(0);
  }

  function mundur() {
    setIndeks((i) => Math.max(0, i - 1));
  }

  function maju() {
    setIndeks((i) => Math.min(riwayat.length - 1, i + 1));
  }

  return {
    tampil: riwayat[indeks],     // snapshot yang sedang ditampilkan
    indeks,
    totalLangkah: riwayat.length - 1,
    diAkhir,
    siap,
    penghitung,
    kapasitas,
    tambah,
    ambil,
    reset,
    mundur,
    maju,
  };
}
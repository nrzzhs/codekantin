import { StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition, useReducedMotion } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import Makanan from '../ilustrasi/Makanan';
import { KELUAR_TERBANG, MUNCUL_POP, uraikanBahan } from './bahan';
import { font, warna } from '../../lib/tema';

export type ItemPanel = { kunci: string; isi: string };

type Props = {
  jenis: 'queue' | 'stack';
  /** Urutan tampil dari atas ke bawah: Queue FRONT → REAR, Stack TOP → dasar. */
  item: ItemPanel[];
};

const GAYA = {
  queue: {
    latar: '#E0F2FE',
    teks: '#0369A1',
    judul: 'QUEUE',
    pil: 'FIFO',
    keterangan: 'keluar: yang paling awal',
  },
  stack: {
    latar: '#FFEDD5',
    teks: '#9A3412',
    judul: 'STACK',
    pil: 'LIFO',
    keterangan: 'keluar: yang paling akhir',
  },
};

/** Panel isi Queue atau Stack. Elemen baru muncul dengan "pop" dan keluar terangkat. */
export default function PanelStruktur({ jenis, item }: Props) {
  const kurangiGerak = useReducedMotion();
  const g = GAYA[jenis];
  const queue = jenis === 'queue';

  return (
    <View style={[styles.panel, { backgroundColor: g.latar }]}>
      <View style={styles.atas}>
        <Text style={[styles.judul, { color: g.teks }]}>{g.judul}</Text>
        <View style={styles.pil}>
          <Text style={[styles.pilTeks, { color: g.teks }]}>{g.pil}</Text>
        </View>
      </View>
      <View style={styles.keterangan}>
        <Ionicons name="arrow-up" size={14} color={g.teks} />
        <Text style={[styles.keteranganTeks, { color: g.teks }]}>{g.keterangan}</Text>
      </View>

      {item.length === 0 ? (
        <View style={styles.kosong}>
          <Text style={styles.kosongTeks}>kosong</Text>
        </View>
      ) : (
        <View style={styles.daftar}>
          {item.map((it, i) => {
            const { jenis: makanan, label } = uraikanBahan(it.isi);
            const atas = i === 0; // FRONT (queue) atau TOP (stack)
            const bawah = i === item.length - 1; // REAR (queue)
            const penanda = queue
              ? atas && bawah
                ? 'F/R'
                : atas
                  ? 'FRONT'
                  : bawah
                    ? 'REAR'
                    : null
              : atas
                ? 'TOP'
                : null;
            const ketA11y = queue
              ? atas && bawah
                ? ', FRONT dan REAR'
                : atas
                  ? ', FRONT'
                  : bawah
                    ? ', REAR'
                    : ''
              : atas
                ? ', TOP'
                : '';
            return (
              <Animated.View
                key={it.kunci}
                entering={kurangiGerak ? undefined : MUNCUL_POP}
                exiting={kurangiGerak ? undefined : KELUAR_TERBANG}
                layout={kurangiGerak ? undefined : LinearTransition.duration(220)}
                style={[
                  queue ? styles.kotak : styles.piring,
                  queue
                    ? { borderColor: atas ? '#0369A1' : '#BAE6FD' }
                    : { borderColor: atas ? '#C2410C' : '#FDBA8C' },
                ]}
                accessible
                accessibilityLabel={`${g.judul} posisi ${i + 1}: ${label}${ketA11y}`}
              >
                {makanan && <Makanan jenis={makanan} ukuran={18} />}
                <Text style={styles.nama} numberOfLines={1}>
                  {label}
                </Text>
                {penanda && <Text style={[styles.penanda, { color: g.teks }]}>{penanda}</Text>}
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, minHeight: 248, borderRadius: 22, padding: 12, gap: 6 },
  atas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  judul: { fontFamily: font.judul, fontSize: 14 },
  pil: { backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pilTeks: { fontFamily: font.judul, fontSize: 10 },
  keterangan: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  keteranganTeks: { flexShrink: 1, fontFamily: font.tebal, fontSize: 11 },
  daftar: { gap: 6, marginTop: 6 },
  kotak: {
    height: 34,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  piring: {
    height: 34,
    borderRadius: 999,
    borderWidth: 2,
    borderBottomWidth: 4,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  nama: { flex: 1, fontFamily: font.judul, fontSize: 13, color: warna.teks },
  penanda: { fontFamily: font.judul, fontSize: 9 },
  kosong: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  kosongTeks: { fontFamily: font.isi, fontSize: 13, color: warna.teksRedup },
});

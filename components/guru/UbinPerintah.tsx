import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Keyframe, useReducedMotion } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGoyang } from '../simulasi/goyang';
import { uraikanPerintah, warnaPerintah, type Struktur } from './perintah';
import { font, warna } from '../../lib/tema';

type Props = {
  perintah: string[];
  struktur: Struktur;
  /** Naikkan untuk menggoyang area (saat galat). */
  goyang: number;
};

const KOLOM = 4;
const JARAK = 6;

const POP = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.4 }] },
  60: { opacity: 1, transform: [{ scale: 1.1 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(280);

/** Area ubin perintah (grid 4 kolom) yang selalu mengikuti isi teks perintah. */
export default function UbinPerintah({ perintah, struktur, goyang }: Props) {
  const kurangiGerak = useReducedMotion();
  const gayaGoyang = useGoyang(goyang);
  const [lebar, setLebar] = useState(0);
  const lebarUbin = lebar > 0 ? (lebar - JARAK * (KOLOM - 1)) / KOLOM : 0;

  return (
    <Animated.View style={[styles.area, gayaGoyang]}>
      {perintah.length === 0 ? (
        <Text style={styles.kosong}>Ketuk tombol di bawah untuk menambah perintah</Text>
      ) : (
        <View style={styles.grid} onLayout={(e) => setLebar(e.nativeEvent.layout.width)}>
          {lebarUbin > 0 &&
            perintah.map((op, i) => {
              const info = uraikanPerintah(op);
              const w = warnaPerintah(info.jenis, struktur);
              return (
                <Animated.View
                  // Kunci = posisi + isi, supaya ubin baru (paling akhir) muncul dengan pop
                  key={`${i}-${op}`}
                  entering={kurangiGerak ? undefined : POP}
                  style={[styles.ubin, { width: lebarUbin, backgroundColor: w.latar, borderColor: w.garis }]}
                  accessible
                  accessibilityLabel={`Perintah ${i + 1}: ${info.label}`}
                >
                  <Text style={[styles.no, { color: w.teks }]}>{i + 1}</Text>
                  <Ionicons name={info.ikon} size={18} color={w.teks} />
                  <Text style={[styles.label, { color: w.teks }]} numberOfLines={1} adjustsFontSizeToFit>
                    {info.labelPendek}
                  </Text>
                </Animated.View>
              );
            })}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  area: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E7DCCF',
    borderRadius: 16,
    padding: 8,
    minHeight: 76,
    justifyContent: 'center',
  },
  kosong: {
    fontFamily: font.semi,
    fontSize: 13,
    color: warna.teksRedup,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: JARAK },
  ubin: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 3,
    alignItems: 'center',
    gap: 2,
  },
  no: { position: 'absolute', top: 3, left: 6, fontFamily: font.tebal, fontSize: 9 },
  label: { fontFamily: font.kode, fontSize: 11 },
});

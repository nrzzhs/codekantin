import { useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { JenisStruktur } from '../../logic/simulasi';
import { font, warna } from '../../lib/tema';

type Props = {
  struktur: JenisStruktur;
  konteks: string;
  operasi: string[];
};

const KOLOM = 4;
const JARAK = 8;

type Gaya = { latar: string; garis: string; ikon: ComponentProps<typeof Ionicons>['name']; warna: string };

const MASUK: Record<JenisStruktur, Gaya> = {
  stack: { latar: '#FFF7ED', garis: '#FED7AA', ikon: 'arrow-up', warna: '#C2410C' },
  queue: { latar: '#F0F9FF', garis: '#BAE6FD', ikon: 'person-add-outline', warna: '#0369A1' },
};
const KELUAR: Gaya = { latar: '#FEF2F2', garis: '#FCA5A5', ikon: 'arrow-down', warna: '#B91C1C' };

/** "push(1)" → "push 1", "pop()" → "pop" */
function labelPerintah(op: string): string {
  return op
    .trim()
    .replace(/\(\s*\)$/, '')
    .replace(/\(\s*(.*?)\s*\)$/, ' $1');
}

/** Kartu "ALUR PERINTAH DAPUR": skenario lalu ubin perintah dalam grid 4 kolom. */
export default function KartuAlur({ struktur, konteks, operasi }: Props) {
  const [lebar, setLebar] = useState(0);
  const lebarUbin = lebar > 0 ? (lebar - JARAK * (KOLOM - 1)) / KOLOM : 0;

  return (
    <View style={styles.kartu}>
      <Text style={styles.label} accessibilityRole="header">
        ALUR PERINTAH DAPUR
      </Text>
      <Text style={styles.konteks}>{konteks}</Text>
      <View style={styles.grid} onLayout={(e) => setLebar(e.nativeEvent.layout.width)}>
        {lebarUbin > 0 &&
          operasi.map((op, i) => {
            const keluar = /^\s*(pop|dequeue)/i.test(op);
            const g = keluar ? KELUAR : MASUK[struktur];
            const label = labelPerintah(op);
            return (
              <View
                key={`${op}-${i}`}
                style={[styles.ubin, { width: lebarUbin, backgroundColor: g.latar, borderColor: g.garis }]}
                accessible
                accessibilityLabel={`Langkah ${i + 1}: ${label}`}
              >
                <Text style={[styles.no, { color: g.warna }]}>{i + 1}</Text>
                <Ionicons name={g.ikon} size={22} color={g.warna} />
                <Text style={[styles.perintah, { color: g.warna }]} numberOfLines={1} adjustsFontSizeToFit>
                  {label}
                </Text>
              </View>
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: warna.garis,
    padding: 14,
    gap: 6,
  },
  label: { fontFamily: font.judul, fontSize: 12, letterSpacing: 0.6, color: warna.teksRedup },
  konteks: { fontFamily: font.isi, fontSize: 13, lineHeight: 19, color: warna.teksRedup },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: JARAK, marginTop: 6 },
  ubin: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingTop: 10,
    paddingHorizontal: 4,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 4,
  },
  no: { position: 'absolute', top: 4, left: 7, fontFamily: font.tebal, fontSize: 10 },
  perintah: { fontFamily: font.kodeTebal, fontSize: 12 },
});

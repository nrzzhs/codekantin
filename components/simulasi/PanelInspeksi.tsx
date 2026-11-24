import { StyleSheet, Text, View } from 'react-native';
import { font, warna } from '../../lib/tema';

/** Potongan nilai: teks dalam kutip (kuning), angka/null (merah muda), atau simbol (abu). */
export type Token = { jenis: 'teks' | 'angka' | 'simbol'; isi: string };

export const teks = (s: string): Token => ({ jenis: 'teks', isi: `"${s}"` });
export const angka = (n: number): Token => ({ jenis: 'angka', isi: String(n) });
export const kosong: Token = { jenis: 'angka', isi: 'null' };
export const simbol = (s: string): Token => ({ jenis: 'simbol', isi: s });

/** ["a", "b"] sebagai deretan token. */
export function daftar(isi: string[]): Token[] {
  const hasil: Token[] = [simbol('[')];
  isi.forEach((x, i) => {
    if (i > 0) hasil.push(simbol(', '));
    hasil.push(teks(x));
  });
  hasil.push(simbol(']'));
  return hasil;
}

type Props = {
  baris: { kunci: string; nilai: Token[] }[];
  label?: string;
};

const WARNA: Record<Token['jenis'], string> = {
  teks: '#FCD34D',
  angka: '#F9A8D4',
  simbol: '#7C8BA1',
};

/** Isi struktur data dalam gaya kode: kunci = nilai. */
export default function PanelInspeksi({ baris, label = 'Isi data' }: Props) {
  const ringkas = baris.map((b) => `${b.kunci} sama dengan ${b.nilai.map((t) => t.isi).join('')}`).join('. ');

  return (
    <View style={styles.panel} accessible accessibilityLabel={`${label}. ${ringkas}`}>
      {baris.map((b) => (
        <View key={b.kunci} style={styles.baris}>
          <Text style={styles.kunci}>{b.kunci}</Text>
          <Text style={styles.sama}>=</Text>
          <Text style={styles.nilai}>
            {b.nilai.map((t, i) => (
              <Text key={i} style={{ color: WARNA[t.jenis] }}>
                {t.isi}
              </Text>
            ))}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: warna.gelap, borderRadius: 20, padding: 14, gap: 6 },
  baris: { flexDirection: 'row', alignItems: 'flex-start' },
  kunci: { width: 44, fontFamily: font.kode, fontSize: 13, lineHeight: 20, color: '#5EEAD4' },
  sama: { width: 18, fontFamily: font.kode, fontSize: 13, lineHeight: 20, color: '#7C8BA1' },
  nilai: { flex: 1, fontFamily: font.kode, fontSize: 13, lineHeight: 20 },
});

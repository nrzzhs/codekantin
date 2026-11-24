import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import ItemAnimasi from '../ItemAnimasi';
import { useGoyang } from './goyang';
import { font, warna } from '../../lib/tema';

type Props = {
  /** dasar → TOP */
  isi: string[];
  kapasitas: number;
  /** Naikkan untuk menggoyang panggung (overflow/underflow). */
  goyang: number;
};

const ORANYE = '#C2410C';
const ORANYE_TUA = '#9A3412';
const LEBAR_LABEL = 50;
const JARAK_LABEL = 8;

/** Panggung tumpukan: rak dengan lima lapis piring, lapis 5 di atas dan lapis 1 di dasar. */
export default function PanggungTumpukan({ isi, kapasitas, goyang }: Props) {
  const gayaGoyang = useGoyang(goyang);
  const lapis = Array.from({ length: kapasitas }, (_, i) => kapasitas - i); // 5, 4, …, 1

  return (
    <Animated.View style={[styles.panggung, gayaGoyang]}>
      <View style={styles.lantai} />
      <View style={styles.push} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="arrow-down" size={22} color={ORANYE} />
        <Text style={styles.pushTeks}>push</Text>
      </View>
      <View style={styles.pilUkuran} accessible accessibilityLabel={`${isi.length} dari ${kapasitas} terisi`}>
        <Text style={styles.pilUkuranTeks}>
          {isi.length}/{kapasitas}
        </Text>
      </View>

      <View style={styles.kolom}>
        {lapis.map((n) => {
          const elemen = isi[n - 1];
          if (elemen === undefined) {
            return (
              <View key={`kosong-${n}`} style={styles.baris} accessible accessibilityLabel={`Lapis ${n}: kosong`}>
                <View style={styles.kolomLabel} />
                <View style={styles.kosong} />
              </View>
            );
          }
          const atas = n === isi.length;
          const dasar = n === 1 && isi.length > 1;
          // ItemAnimasi menjadi akar baris (key = nama elemen) agar animasi jatuh/terangkat berjalan
          return (
            <ItemAnimasi key={elemen} gaya="tumpukan">
              <View
                style={styles.baris}
                accessible
                accessibilityLabel={`Lapis ${n}: ${elemen}${atas ? ', TOP' : dasar ? ', DASAR' : ''}`}
              >
                <View style={styles.kolomLabel}>
                  {atas && (
                    <View style={[styles.penanda, styles.penandaAtas]}>
                      <Text style={[styles.penandaTeks, { color: '#FFFFFF' }]}>TOP</Text>
                    </View>
                  )}
                  {dasar && (
                    <View style={[styles.penanda, styles.penandaDasar]}>
                      <Text style={[styles.penandaTeks, { color: warna.teksRedup }]}>DASAR</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.piring, atas && styles.piringAtas]}>
                  <View style={[styles.cekung, { borderColor: atas ? ORANYE : '#FDBA8C' }]} />
                  <Text style={styles.piringTeks} numberOfLines={1}>
                    {elemen}
                  </Text>
                </View>
              </View>
            </ItemAnimasi>
          );
        })}
        <View style={styles.rak} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panggung: {
    height: 262,
    borderRadius: 24,
    backgroundColor: '#FFEDD5',
    overflow: 'hidden',
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
  },
  lantai: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 34, backgroundColor: '#FED7AA' },
  push: { position: 'absolute', top: 12, left: 14, flexDirection: 'row', alignItems: 'center', gap: 2 },
  pushTeks: { fontFamily: font.judul, fontSize: 10, color: ORANYE_TUA },
  pilUkuran: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pilUkuranTeks: { fontFamily: font.judul, fontSize: 12, color: ORANYE_TUA },

  kolom: { width: 250, maxWidth: '100%', alignSelf: 'center', gap: 4 },
  baris: { height: 36, flexDirection: 'row', alignItems: 'center', gap: JARAK_LABEL },
  kolomLabel: { width: LEBAR_LABEL, alignItems: 'flex-end' },
  penanda: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  penandaAtas: { backgroundColor: ORANYE },
  penandaDasar: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#C9BBAE', paddingVertical: 1 },
  penandaTeks: { fontFamily: font.judul, fontSize: 9 },

  piring: {
    flex: 1,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: ORANYE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  piringAtas: { backgroundColor: '#FFF7ED' },
  cekung: { width: 18, height: 8, borderRadius: 999, borderWidth: 2 },
  piringTeks: { flexShrink: 1, fontFamily: font.judul, fontSize: 12, color: ORANYE_TUA },
  kosong: {
    flex: 1,
    height: 34,
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E7B48F',
  },
  rak: { height: 10, borderRadius: 4, backgroundColor: ORANYE_TUA, marginLeft: LEBAR_LABEL + JARAK_LABEL },
});

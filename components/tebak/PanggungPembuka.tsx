import { StyleSheet, View } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';
import { Rect, Text as SvgText } from 'react-native-svg';
import KokiPiri from '../ilustrasi/KokiPiri';
import Konfeti from '../ilustrasi/Konfeti';
import { useAyun } from '../ilustrasi/gerak';
import { Bingkai, Lapisan } from '../ilustrasi/lapisan';
import { font, warna } from '../../lib/tema';

const TINGGI = 300;
const VB_KARTU = '0 0 56 74';

/** Panggung layar pembuka Tebak: Koki Piri melayang di samping kartu "?" yang bergoyang. */
export default function PanggungPembuka() {
  const sudut = useAyun(5, 900, { dari: -5 });
  const gayaKartu = useAnimatedStyle(() => ({ transform: [{ rotate: `${sudut.get()}deg` }] }));

  return (
    <View
      style={styles.panggung}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Konfeti tinggi={TINGGI} jumlah={12} />
      <View style={styles.isi}>
        <KokiPiri ukuran={140} />
        <Bingkai style={styles.kartu}>
          {/* Poros goyang di tengah dasar kartu */}
          <Lapisan viewBox={VB_KARTU} gaya={gayaKartu} asal="50% 94%">
            <Rect x={4} y={4} width={48} height={66} rx={10} fill={warna.ungu} />
            <Rect x={9} y={9} width={38} height={56} rx={7} fill="#8B5CF6" />
            <SvgText x={28} y={49} textAnchor="middle" fontFamily={font.judul} fontSize={34} fill="#FFFFFF">
              ?
            </SvgText>
          </Lapisan>
        </Bingkai>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panggung: {
    height: TINGGI,
    borderRadius: 28,
    backgroundColor: warna.unguMuda,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  isi: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  kartu: { width: 56, height: 74, marginBottom: 18 },
});

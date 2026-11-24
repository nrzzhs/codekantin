import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Makanan, { type JenisMakanan } from '../ilustrasi/Makanan';
import { useAyun } from '../ilustrasi/gerak';
import { font, warna } from '../../lib/tema';

const PressableAnimasi = Animated.createAnimatedComponent(Pressable);

type Props = {
  nama: string;
  jenis: JenisMakanan;
  /** Urutan ubin, untuk membuat ayunan makanan bergantian. */
  urutan: number;
  nonaktif: boolean;
  onPress: () => void;
};

const TINGGI = 96;
const TURUN = 4;
const PEGAS = { damping: 12, stiffness: 320 };

/** Ubin bahan dengan makanan yang mengambang; mengecil dan miring sedikit saat ditekan. */
export default function UbinBahan({ nama, jenis, urutan, nonaktif, onPress }: Props) {
  const kurangiGerak = useReducedMotion();
  const ayun = useAyun(-4, 900, { jeda: urutan * 250 });
  const tekan = useSharedValue(0);

  const gayaMakanan = useAnimatedStyle(() => ({ transform: [{ translateY: ayun.get() }] }));
  const gayaUbin = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.1 * tekan.get() }, { rotate: `${-3 * tekan.get()}deg` }],
  }));

  return (
    <PressableAnimasi
      onPress={onPress}
      onPressIn={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        if (!kurangiGerak) tekan.set(withSpring(1, PEGAS));
      }}
      onPressOut={() => {
        if (!kurangiGerak) tekan.set(withSpring(0, PEGAS));
      }}
      disabled={nonaktif}
      accessibilityRole="button"
      accessibilityLabel={`Tambah ${nama}`}
      accessibilityHint="Masuk ke Queue dan Stack sekaligus"
      accessibilityState={{ disabled: nonaktif }}
      style={[styles.wadah, nonaktif && styles.pudar, gayaUbin]}
    >
      <View style={styles.bayangan} />
      <View style={styles.muka}>
        <Animated.View style={gayaMakanan}>
          <Makanan jenis={jenis} ukuran={42} />
        </Animated.View>
        <Text style={styles.nama}>{nama}</Text>
      </View>
    </PressableAnimasi>
  );
}

const styles = StyleSheet.create({
  wadah: { flex: 1, height: TINGGI + TURUN },
  pudar: { opacity: 0.45 },
  bayangan: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: TURUN,
    height: TINGGI,
    borderRadius: 18,
    backgroundColor: warna.garis,
  },
  muka: {
    height: TINGGI,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: warna.garis,
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nama: { fontFamily: font.judul, fontSize: 14, color: warna.teks },
});

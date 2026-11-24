import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import { GambarPelanggan } from '../simulasi/PanggungAntrean';
import type { JenisStruktur } from '../../logic/simulasi';
import { font } from '../../lib/tema';

const PressableAnimasi = Animated.createAnimatedComponent(Pressable);

/** Gambar token tanpa interaksi: piring (stack) atau pelanggan dalam lingkaran (queue). */
export function GambarToken({
  struktur,
  nilai,
  urutan,
  ukuran = 84,
}: {
  struktur: JenisStruktur;
  nilai: string;
  /** Untuk memilih warna pelanggan. */
  urutan: number;
  ukuran?: number;
}) {
  const k = ukuran / 84;
  const pendek = nilai.length <= 2;

  if (struktur === 'stack') {
    return (
      <View style={{ width: ukuran, height: ukuran }}>
        <Svg width={ukuran} height={ukuran} viewBox="0 0 84 84">
          <Ellipse cx={42} cy={76} rx={28} ry={5} fill="#000000" fillOpacity={0.12} />
          <Circle cx={42} cy={40} r={34} fill="#FFFFFF" stroke="#C2410C" strokeWidth={4} />
          <Circle cx={42} cy={40} r={22} fill="#FFF7ED" stroke="#FDBA8C" strokeWidth={2} />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.tengahPiring, { paddingBottom: 8 * k }]}>
          <Text
            style={[styles.teksPiring, { fontSize: (pendek ? 22 : 13) * k }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {nilai}
          </Text>
        </View>
      </View>
    );
  }

  const lingkaran = 62 * k;
  return (
    <View style={{ width: ukuran, height: ukuran, alignItems: 'center' }}>
      <View
        style={[
          styles.lingkaran,
          { width: lingkaran, height: lingkaran, borderRadius: lingkaran / 2 },
        ]}
      >
        <GambarPelanggan nomor={urutan + 1} lebar={34 * k} />
      </View>
      {ukuran >= 60 && (
        <Text style={[styles.teksPelanggan, { fontSize: 14 * k }]} numberOfLines={1}>
          {nilai}
        </Text>
      )}
    </View>
  );
}

type Props = {
  struktur: JenisStruktur;
  nilai: string;
  urutan: number;
  /** Nama lengkap untuk pembaca layar, mis. "Piring 3". */
  label: string;
  dipakai: boolean;
  nonaktif: boolean;
  onPress: () => void;
};

/** Token pilihan besar 84 × 84 yang bisa diketuk untuk mengisi slot. */
export default function TokenPilihan({ struktur, nilai, urutan, label, dipakai, nonaktif, onPress }: Props) {
  const kurangiGerak = useReducedMotion();
  const skala = useSharedValue(1);
  const gaya = useAnimatedStyle(() => ({ transform: [{ scale: skala.get() }] }));
  const mati = dipakai || nonaktif;

  return (
    <PressableAnimasi
      onPress={onPress}
      onPressIn={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        if (!kurangiGerak) skala.set(withTiming(0.92, { duration: 80 }));
      }}
      onPressOut={() => {
        if (!kurangiGerak) skala.set(withTiming(1, { duration: 140 }));
      }}
      disabled={mati}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: mati }}
      accessibilityHint={dipakai ? 'Sudah dipakai' : 'Ketuk untuk mengisi slot kosong berikutnya'}
      style={[styles.token, dipakai && styles.dipakai, gaya]}
    >
      <GambarToken struktur={struktur} nilai={nilai} urutan={urutan} />
    </PressableAnimasi>
  );
}

const styles = StyleSheet.create({
  token: { width: 84, height: 84 },
  dipakai: { opacity: 0.35 },
  tengahPiring: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  teksPiring: { fontFamily: font.judul, color: '#9A3412' },
  lingkaran: {
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  teksPelanggan: { fontFamily: font.judul, color: '#0369A1', marginTop: 2 },
});

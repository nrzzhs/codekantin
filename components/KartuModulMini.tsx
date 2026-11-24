import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { bayanganKartu, font, warna as tema } from '../lib/tema';

export type WarnaModul = 'antrean' | 'tumpukan' | 'tebak' | 'bandingkan';

type Props = {
  judul: string;
  warna: WarnaModul;
  /** Chip kecil di kanan judul, mis. "3/5". */
  status?: string;
  labelTombol: string;
  ilustrasi: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
};

const PressableAnimasi = Animated.createAnimatedComponent(Pressable);

// Biru = Queue, oranye = Stack, ungu = Mode Tebak, toska = Bandingkan
const WARNA: Record<
  WarnaModul,
  { muda: string; teksChip: string; tombol: { latar: string; bayangan: string; teks: string; garis?: string } }
> = {
  antrean: {
    muda: tema.biruMuda,
    teksChip: tema.biru,
    tombol: { latar: tema.biru, bayangan: '#024B73', teks: '#FFFFFF' },
  },
  tumpukan: {
    muda: tema.oranyeMuda,
    teksChip: tema.persikTeks,
    tombol: { latar: tema.oranye, bayangan: '#8A2E08', teks: '#FFFFFF' },
  },
  tebak: {
    muda: tema.unguMuda,
    teksChip: tema.ungu,
    tombol: { latar: tema.ungu, bayangan: tema.unguTua, teks: '#FFFFFF' },
  },
  bandingkan: {
    muda: tema.hijauMuda,
    teksChip: tema.hijauTua,
    tombol: { latar: '#FFFFFF', bayangan: tema.garis, teks: tema.teks, garis: tema.garis },
  },
};

const PEGAS = { damping: 14, stiffness: 320 };

/** Kartu modul ringkas untuk grid 2×2 di Beranda. Seluruh kartu adalah satu tombol. */
export default function KartuModulMini({
  judul,
  warna,
  status,
  labelTombol,
  ilustrasi,
  onPress,
  accessibilityLabel,
}: Props) {
  const w = WARNA[warna];
  const kurangiGerak = useReducedMotion();
  const tekanan = useSharedValue(0); // 0 = lepas, 1 = ditekan

  const gaya = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - 0.05 * tekanan.get() },
      { rotate: `${-1 * tekanan.get()}deg` },
    ],
  }));

  function tekan(masuk: boolean) {
    if (masuk) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (!kurangiGerak) tekanan.set(withSpring(masuk ? 1 : 0, PEGAS));
  }

  const ikonTombol = warna === 'bandingkan' ? 'swap-vertical' : 'play';

  return (
    <PressableAnimasi
      onPress={onPress}
      onPressIn={() => tekan(true)}
      onPressOut={() => tekan(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.kartu, gaya]}
    >
      <View style={[styles.area, { backgroundColor: w.muda }]}>{ilustrasi}</View>

      <View style={styles.barisJudul}>
        <Text style={styles.judul} numberOfLines={1}>
          {judul}
        </Text>
        {status !== undefined && (
          <View style={[styles.chip, { backgroundColor: w.muda }]}>
            <Text style={[styles.chipTeks, { color: w.teksChip }]}>{status}</Text>
          </View>
        )}
      </View>

      {/* Hanya tampilan tombol; yang menerima ketukan adalah seluruh kartu */}
      <View style={styles.tombolWadah}>
        <View style={[styles.tombolBayangan, { backgroundColor: w.tombol.bayangan }]} />
        <View
          style={[
            styles.tombol,
            { backgroundColor: w.tombol.latar },
            w.tombol.garis ? { borderWidth: 2, borderColor: w.tombol.garis } : null,
          ]}
        >
          <Ionicons name={ikonTombol} size={16} color={w.tombol.teks} />
          <Text style={[styles.tombolTeks, { color: w.tombol.teks }]}>{labelTombol}</Text>
        </View>
      </View>
    </PressableAnimasi>
  );
}

const TINGGI_TOMBOL = 44;
const BAYANGAN_TOMBOL = 3;

const styles = StyleSheet.create({
  kartu: {
    flex: 1,
    backgroundColor: tema.kartu,
    borderWidth: 1,
    borderColor: tema.garis,
    borderRadius: 22,
    padding: 10,
    gap: 10,
    ...bayanganKartu,
  },
  area: {
    height: 112,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barisJudul: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  judul: { flex: 1, fontFamily: font.judul, fontSize: 17, color: tema.teks },
  chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  chipTeks: { fontFamily: font.judul, fontSize: 12 },
  tombolWadah: { height: TINGGI_TOMBOL + BAYANGAN_TOMBOL },
  tombolBayangan: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: BAYANGAN_TOMBOL,
    height: TINGGI_TOMBOL,
    borderRadius: 14,
  },
  tombol: {
    height: TINGGI_TOMBOL,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tombolTeks: { fontFamily: font.judul, fontSize: 15 },
});

import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SpinnerTombol } from '../Loading';
import { font, radius, warna } from '../../lib/tema';

export type VarianTombol = 'utama' | 'sekunder' | 'antrean' | 'tumpukan';

type Props = {
  label: string;
  onPress: () => void;
  varian?: VarianTombol;
  memuat?: boolean;
  nonaktif?: boolean;
  ikon?: ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  /** Tombol besar untuk operasi utama (tinggi 56). */
  besar?: boolean;
};

const TINGGI = 52;
const TINGGI_BESAR = 56;
const TURUN = 4; // jarak bayangan padat di bawah tombol

const WARNA: Record<VarianTombol, { latar: string; bayangan: string; teks: string; garis?: string }> = {
  utama: { latar: '#15803D', bayangan: '#0F5A2B', teks: '#FFFFFF' },
  antrean: { latar: '#0369A1', bayangan: '#024B73', teks: '#FFFFFF' },
  tumpukan: { latar: '#C2410C', bayangan: '#8A2E08', teks: '#FFFFFF' },
  sekunder: { latar: '#FFFFFF', bayangan: warna.garis, teks: warna.teks, garis: warna.garis },
};

const NONAKTIF = { latar: warna.garis, teks: warna.teksRedup };

export default function Tombol({
  label,
  onPress,
  varian = 'utama',
  memuat = false,
  nonaktif = false,
  ikon,
  accessibilityLabel,
  accessibilityHint,
  style,
  besar = false,
}: Props) {
  const kurangiGerak = useReducedMotion();
  const turun = useSharedValue(0);
  const tidakBisa = nonaktif || memuat;
  // Tombol nonaktif digambar "sudah tertekan" dan tanpa bayangan
  const datar = nonaktif && !memuat;
  const w = WARNA[varian];
  const latar = datar ? NONAKTIF.latar : w.latar;
  const teks = datar ? NONAKTIF.teks : w.teks;

  const gayaMuka = useAnimatedStyle(() => ({ transform: [{ translateY: turun.get() }] }));

  function tekan(masuk: boolean) {
    const tujuan = masuk ? TURUN - 1 : 0;
    turun.set(kurangiGerak ? tujuan : withTiming(tujuan, { duration: masuk ? 60 : 120 }));
    if (masuk) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => tekan(true)}
      onPressOut={() => tekan(false)}
      disabled={tidakBisa}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: tidakBisa, busy: memuat }}
      style={[styles.wadah, besar && styles.wadahBesar, style]}
    >
      {!datar && (
        <View style={[styles.bayangan, besar && styles.bentukBesar, { backgroundColor: w.bayangan }]} />
      )}
      <Animated.View
        style={[
          styles.muka,
          besar && styles.bentukBesar,
          { backgroundColor: latar, top: datar ? TURUN : 0 },
          w.garis && !datar ? { borderWidth: 2, borderColor: w.garis } : null,
          gayaMuka,
        ]}
      >
        {memuat ? (
          <SpinnerTombol warna={teks} ukuran={18} label={label} />
        ) : ikon ? (
          <Ionicons name={ikon} size={20} color={teks} />
        ) : null}
        <Text style={[styles.label, besar && styles.labelBesar, { color: teks }]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wadah: { height: TINGGI + TURUN, alignSelf: 'stretch' },
  bayangan: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: TURUN,
    height: TINGGI,
    borderRadius: radius.tombol,
  },
  muka: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TINGGI,
    borderRadius: radius.tombol,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  label: { fontFamily: font.tebal, fontSize: 16 },
  // Ukuran besar (tombol operasi simulasi): tinggi 56, radius 18, teks 17 ExtraBold
  wadahBesar: { height: TINGGI_BESAR + TURUN },
  bentukBesar: { height: TINGGI_BESAR, borderRadius: 18 },
  labelBesar: { fontFamily: font.judul, fontSize: 17 },
});

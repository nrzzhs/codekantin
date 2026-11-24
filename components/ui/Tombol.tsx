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

export type VarianTombol = 'utama' | 'sekunder' | 'antrean' | 'tumpukan' | 'tebak';

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
  /** Tombol besar untuk operasi utama (tinggi 56, radius 18, teks 17 ExtraBold). */
  besar?: boolean;
  /** Tinggi kustom (tanpa bayangan). Menimpa `besar`. */
  tinggi?: number;
  /** Radius sudut kustom. Menimpa `besar`. */
  sudut?: number;
};

const TINGGI = 52;
const TINGGI_BESAR = 56;
const TURUN = 4; // jarak bayangan padat di bawah tombol

type Warna = {
  latar: string;
  bayangan: string;
  teks: string;
  garis?: string;
  /** Warna saat nonaktif; bawaan latar #F1E7DC, teks #6B625B. */
  mati?: { latar: string; teks: string };
};

const WARNA: Record<VarianTombol, Warna> = {
  utama: { latar: '#15803D', bayangan: '#0F5A2B', teks: '#FFFFFF' },
  antrean: { latar: '#0369A1', bayangan: '#024B73', teks: '#FFFFFF' },
  tumpukan: { latar: '#C2410C', bayangan: '#8A2E08', teks: '#FFFFFF' },
  tebak: {
    latar: warna.ungu,
    bayangan: warna.unguTua,
    teks: '#FFFFFF',
    mati: { latar: warna.unguMuda, teks: warna.teksRedup },
  },
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
  tinggi,
  sudut,
}: Props) {
  const kurangiGerak = useReducedMotion();
  const turun = useSharedValue(0);
  const tidakBisa = nonaktif || memuat;
  // Tombol nonaktif digambar "sudah tertekan" dan tanpa bayangan
  const datar = nonaktif && !memuat;
  const w = WARNA[varian];
  const mati = w.mati ?? NONAKTIF;
  const latar = datar ? mati.latar : w.latar;
  const teks = datar ? mati.teks : w.teks;

  const h = tinggi ?? (besar ? TINGGI_BESAR : TINGGI);
  const r = sudut ?? (besar ? 18 : radius.tombol);
  const tebal = besar || tinggi !== undefined;
  const bentuk = { height: h, borderRadius: r };

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
      style={[styles.wadah, { height: h + TURUN }, style]}
    >
      {!datar && <View style={[styles.bayangan, bentuk, { backgroundColor: w.bayangan }]} />}
      <Animated.View
        style={[
          styles.muka,
          bentuk,
          { backgroundColor: latar, top: datar ? TURUN : 0 },
          w.garis && !datar ? { borderWidth: 2, borderColor: w.garis } : null,
          gayaMuka,
        ]}
      >
        {memuat ? (
          <SpinnerTombol warna={teks} ukuran={18} label={label} />
        ) : ikon ? (
          <Ionicons name={ikon} size={tebal ? 22 : 20} color={teks} />
        ) : null}
        <Text style={[styles.label, tebal && styles.labelBesar, { color: teks }]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wadah: { alignSelf: 'stretch' },
  bayangan: { position: 'absolute', left: 0, right: 0, top: TURUN },
  muka: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  label: { fontFamily: font.tebal, fontSize: 16, flexShrink: 1 },
  labelBesar: { fontFamily: font.judul, fontSize: 17 },
});

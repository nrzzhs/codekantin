import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { font, warna } from '../../lib/tema';

type Props = {
  nilai: boolean;
  onUbah: (nilai: boolean) => void;
  nonaktif?: boolean;
};

const LEBAR = 52;
const TINGGI = 30;
const KENOP = 24;
const JALAN = LEBAR - KENOP - (TINGGI - KENOP); // jarak geser kenop

/** Sakelar Aktif/Nonaktif: kenop bergeser dengan pegas. Seluruh area + label satu target sentuh. */
export default function SakelarAktif({ nilai, onUbah, nonaktif = false }: Props) {
  const kurangiGerak = useReducedMotion();
  const posisi = useSharedValue(nilai ? 1 : 0);

  useEffect(() => {
    posisi.set(kurangiGerak ? (nilai ? 1 : 0) : withSpring(nilai ? 1 : 0, { damping: 15, stiffness: 260 }));
  }, [nilai, kurangiGerak, posisi]);

  const gayaTrack = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(posisi.get(), [0, 1], ['#C9BBAE', warna.hijau]),
  }));
  const gayaKenop = useAnimatedStyle(() => ({ transform: [{ translateX: posisi.get() * JALAN }] }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onUbah(!nilai);
      }}
      disabled={nonaktif}
      style={[styles.wadah, nonaktif && styles.mati]}
      accessibilityRole="switch"
      accessibilityLabel="Soal aktif"
      accessibilityState={{ checked: nilai, disabled: nonaktif }}
      accessibilityHint="Soal aktif ikut muncul di Tebak siswa"
    >
      <Animated.View style={[styles.track, gayaTrack]}>
        <Animated.View style={[styles.kenop, gayaKenop]} />
      </Animated.View>
      <View>
        <Text style={[styles.label, { color: nilai ? warna.hijauTeks : warna.teksRedup }]}>
          {nilai ? 'Aktif' : 'Nonaktif'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wadah: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 8 },
  mati: { opacity: 0.6 },
  track: {
    width: LEBAR,
    height: TINGGI,
    borderRadius: 999,
    padding: (TINGGI - KENOP) / 2,
    justifyContent: 'center',
  },
  kenop: {
    width: KENOP,
    height: KENOP,
    borderRadius: KENOP / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1F1A17',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  label: { fontFamily: font.judul, fontSize: 14 },
});

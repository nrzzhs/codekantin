import type { ComponentProps } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, useReducedMotion } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { font, warna } from '../../lib/tema';

type Props = {
  teks: string;
  ikon?: ComponentProps<typeof Ionicons>['name'];
  /** Jarak dari atas (mis. safe area + 8). */
  atas?: number;
};

/** Toast hijau yang turun dari atas. Tampilkan/sembunyikan dengan merender komponen ini. */
export default function Toast({ teks, ikon = 'checkmark-circle-outline', atas = 8 }: Props) {
  const kurangiGerak = useReducedMotion();
  return (
    <Animated.View
      entering={kurangiGerak ? undefined : FadeInUp.duration(250)}
      exiting={kurangiGerak ? undefined : FadeOutUp.duration(200)}
      style={[styles.toast, { top: atas }]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Ionicons name={ikon} size={20} color="#FFFFFF" />
      <Text style={styles.teks}>{teks}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: warna.hijau,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#1F1A17',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    zIndex: 10,
  },
  teks: { fontFamily: font.judul, fontSize: 14, color: '#FFFFFF' },
});

import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { font, warna } from '../../lib/tema';

type Props = { onKembali: () => void; onUlangi: () => void };

/** Header: tombol kembali, judul "Bandingkan" + "Queue vs Stack", tombol ulangi. */
export default function HeaderBandingkan({ onKembali, onUlangi }: Props) {
  return (
    <View style={styles.baris}>
      <TombolIkon ikon="arrow-back" label="Kembali" onPress={onKembali} />
      <View style={styles.tengah}>
        <Text style={styles.judul} accessibilityRole="header">
          Bandingkan
        </Text>
        <Text style={styles.sub} accessibilityLabel="Queue versus Stack">
          <Text style={{ color: warna.biru }}>Queue</Text>
          <Text style={{ color: warna.teksRedup }}> vs </Text>
          <Text style={{ color: warna.persikTeks }}>Stack</Text>
        </Text>
      </View>
      <TombolIkon ikon="refresh" label="Ulangi simulasi" onPress={onUlangi} />
    </View>
  );
}

function TombolIkon({
  ikon,
  label,
  onPress,
}: {
  ikon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tombol, pressed && styles.tombolTekan]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={ikon} size={22} color={warna.teks} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baris: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tengah: { flex: 1, alignItems: 'center' },
  judul: { fontFamily: font.judul, fontSize: 22, color: warna.teks },
  sub: { fontFamily: font.judul, fontSize: 12 },
  tombol: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: warna.garis,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tombolTekan: { backgroundColor: warna.kotakKode },
});

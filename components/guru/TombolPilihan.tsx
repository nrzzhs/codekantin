import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { font, warna } from '../../lib/tema';

type Props = {
  label: string;
  /** Nama Ionicons, atau elemen ikon kustom (dapat warna lewat fungsi). */
  ikon: ComponentProps<typeof Ionicons>['name'] | ((warnaIkon: string) => ReactNode);
  terpilih: boolean;
  /** Warna latar saat terpilih (teks jadi putih). */
  warnaTerpilih: string;
  onPress: () => void;
  nonaktif?: boolean;
};

/** Tombol pilihan (radio) berikon. Terpilih: latar warna maknanya, teks putih. */
export default function TombolPilihan({ label, ikon, terpilih, warnaTerpilih, onPress, nonaktif = false }: Props) {
  const warnaIsi = terpilih ? '#FFFFFF' : warna.teks;
  return (
    <Pressable
      onPress={onPress}
      disabled={nonaktif}
      style={({ pressed }) => [
        styles.tombol,
        terpilih && { backgroundColor: warnaTerpilih, borderColor: warnaTerpilih },
        pressed && !terpilih && styles.tekan,
        nonaktif && !terpilih && styles.mati,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ checked: terpilih, disabled: nonaktif }}
      accessibilityLabel={label}
    >
      {typeof ikon === 'function' ? ikon(warnaIsi) : <Ionicons name={ikon} size={18} color={warnaIsi} />}
      <Text style={[styles.label, { color: warnaIsi }]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </Pressable>
  );
}

/** Ikon tingkat: 1, 2, atau 3 garis tegak. */
export function IkonTingkat({ jumlah, warnaIkon }: { jumlah: number; warnaIkon: string }) {
  return (
    <View style={styles.tingkat}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.garisTingkat,
            { height: 6 + i * 4, backgroundColor: warnaIkon, opacity: i < jumlah ? 1 : 0.25 },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tombol: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: warna.garis,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  tekan: { backgroundColor: warna.kotakKode },
  mati: { opacity: 0.45 },
  label: { flexShrink: 1, fontFamily: font.judul, fontSize: 14 },
  tingkat: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 16 },
  garisTingkat: { width: 3, borderRadius: 2 },
});

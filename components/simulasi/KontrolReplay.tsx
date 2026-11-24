import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { font, warna } from '../../lib/tema';

type Props = {
  indeks: number;
  total: number;
  onMundur: () => void;
  onMaju: () => void;
  /** Warna segmen yang sudah dilewati (#0369A1 / #C2410C). */
  aksen: string;
};

const MATI = '#C9BBAE';
const MAKS_SEGMEN = 12;

/** Tombol langkah mundur/maju dengan penanda langkah bersegmen. */
export default function KontrolReplay({ indeks, total, onMundur, onMaju, aksen }: Props) {
  const bisaMundur = indeks > 0;
  const bisaMaju = indeks < total;

  return (
    <View style={styles.baris}>
      <TombolLangkah
        ikon="play-skip-back"
        label="Langkah mundur"
        aktif={bisaMundur}
        onPress={onMundur}
      />

      <View style={styles.tengah}>
        <Text style={styles.teks}>
          Langkah {indeks}/{total}
        </Text>
        {total > 0 && total <= MAKS_SEGMEN ? (
          <View style={styles.segmen}>
            {Array.from({ length: total }, (_, i) => (
              <View
                key={i}
                style={[styles.potong, { backgroundColor: i < indeks ? aksen : warna.garis }]}
              />
            ))}
          </View>
        ) : (
          <View style={[styles.potong, styles.bar]}>
            <View
              style={[
                styles.barIsi,
                { backgroundColor: aksen, width: `${total > 0 ? (indeks / total) * 100 : 0}%` },
              ]}
            />
          </View>
        )}
      </View>

      <TombolLangkah ikon="play-skip-forward" label="Langkah maju" aktif={bisaMaju} onPress={onMaju} />
    </View>
  );
}

function TombolLangkah({
  ikon,
  label,
  aktif,
  onPress,
}: {
  ikon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  aktif: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!aktif}
      style={({ pressed }) => [styles.tombol, pressed && styles.tombolTekan]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !aktif }}
    >
      <Ionicons name={ikon} size={20} color={aktif ? warna.teksRedup : MATI} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baris: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tombol: {
    width: 48,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: warna.garis,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tombolTekan: { backgroundColor: warna.kotakKode },
  tengah: { flex: 1, alignItems: 'center', gap: 6 },
  teks: { fontFamily: font.tebal, fontSize: 13, color: warna.teksRedup },
  segmen: { flexDirection: 'row', gap: 3, alignSelf: 'stretch' },
  potong: { flex: 1, height: 6, borderRadius: 999 },
  bar: { alignSelf: 'stretch', flex: 0, backgroundColor: warna.garis, overflow: 'hidden' },
  barIsi: { height: '100%', borderRadius: 999 },
});

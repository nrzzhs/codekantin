import { useEffect, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { font, warna } from '../../lib/tema';

const PressableAnimasi = Animated.createAnimatedComponent(Pressable);

type Props = {
  poin: number;
  xp: number;
  level: number;
  /** Lencana berikutnya, atau null kalau sudah tertinggi. */
  berikutnya: { nama: string; xp: number } | null;
  /** 0–1 */
  progres: number;
};

/** Tiga kotak statistik (Poin, XP, Lencana) dan bar kemajuan XP. */
export default function StatistikProfil({ poin, xp, level, berikutnya, progres }: Props) {
  const kurangiGerak = useReducedMotion();
  const isi = useSharedValue(0);
  useEffect(() => {
    isi.set(kurangiGerak ? progres : withTiming(progres, { duration: 900 }));
  }, [progres, kurangiGerak, isi]);
  const gayaIsi = useAnimatedStyle(() => ({ width: `${isi.get() * 100}%` }));

  return (
    <View style={styles.wadah}>
      <View style={styles.grid}>
        <Kotak ikon="star" warnaIkon={warna.oranye} angka={`${poin}`} label="Poin" />
        <Kotak ikon="flash" warnaIkon={warna.hijau} angka={`${xp}`} label="XP" />
        <Kotak ikon="ribbon-outline" warnaIkon={warna.ungu} angka={`Lv ${level}`} label="Lencana" />
      </View>

      <View style={styles.progres}>
        <View style={styles.barisProgres}>
          <Text style={styles.teksProgres} numberOfLines={1}>
            {berikutnya ? `Menuju ${berikutnya.nama}` : 'Level tertinggi'}
          </Text>
          <Text style={styles.teksProgres}>{berikutnya ? `${xp} / ${berikutnya.xp} XP` : `${xp} XP`}</Text>
        </View>
        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityLabel={berikutnya ? `XP menuju ${berikutnya.nama}` : 'XP, level tertinggi'}
          accessibilityValue={{ min: 0, max: 100, now: Math.round(progres * 100) }}
        >
          <Animated.View style={[styles.trackIsi, gayaIsi]} />
        </View>
      </View>
    </View>
  );
}

function Kotak({
  ikon,
  warnaIkon,
  angka,
  label,
}: {
  ikon: ComponentProps<typeof Ionicons>['name'];
  warnaIkon: string;
  angka: string;
  label: string;
}) {
  const kurangiGerak = useReducedMotion();
  const skala = useSharedValue(1);
  const gaya = useAnimatedStyle(() => ({ transform: [{ scale: skala.get() }] }));

  return (
    // Hanya umpan balik sentuh (mengecil); tidak membuka apa pun
    <PressableAnimasi
      onPressIn={() => {
        if (!kurangiGerak) skala.set(withTiming(0.93, { duration: 90 }));
      }}
      onPressOut={() => {
        if (!kurangiGerak) skala.set(withTiming(1, { duration: 150 }));
      }}
      accessible
      accessibilityLabel={`${label}: ${angka}`}
      style={[styles.sel, gaya]}
    >
      <View style={styles.bayangan} />
      <View style={styles.kotak}>
        <Ionicons name={ikon} size={26} color={warnaIkon} />
        <Text style={styles.angka} numberOfLines={1} adjustsFontSizeToFit>
          {angka}
        </Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </PressableAnimasi>
  );
}

const TURUN = 4;

const styles = StyleSheet.create({
  wadah: { gap: 12 },
  grid: { flexDirection: 'row', gap: 10 },
  sel: { flex: 1, paddingBottom: TURUN },
  bayangan: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: TURUN,
    bottom: 0,
    borderRadius: 18,
    backgroundColor: warna.garis,
  },
  kotak: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: warna.garis,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  angka: { fontFamily: font.judul, fontSize: 20, color: warna.teks },
  label: { fontFamily: font.isi, fontSize: 12, color: warna.teksRedup },

  progres: { gap: 6 },
  barisProgres: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  teksProgres: { flexShrink: 1, fontFamily: font.tebal, fontSize: 12, color: warna.teksRedup },
  track: { height: 10, borderRadius: 999, backgroundColor: warna.garis, overflow: 'hidden' },
  trackIsi: { height: '100%', borderRadius: 999, backgroundColor: warna.hijau },
});

import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Warna merek CodeKantin (lihat codekantin-assets/README.md)
export const warnaCK = {
  biru: '#0B6FB8',
  oranye: '#F28C18',
  krem: '#FFF6EA',
  navy: '#0A2540',
};

const mulus = Easing.inOut(Easing.ease);

/** true kalau pengguna menyalakan "kurangi gerakan" di pengaturan HP. */
function useKurangiGerak() {
  const [kurangi, setKurangi] = useState(false);
  useEffect(() => {
    let aktif = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => aktif && setKurangi(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setKurangi);
    return () => {
      aktif = false;
      sub.remove();
    };
  }, []);
  return kurangi;
}

/** Nilai 0→1 yang berulang terus. Saat gerak dikurangi, diam di `nilaiDiam`. */
function useLoop(durasi: number, easing: (t: number) => number = Easing.linear, nilaiDiam = 0) {
  const kurangi = useKurangiGerak();
  const [nilai] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (kurangi) {
      nilai.setValue(nilaiDiam);
      return;
    }
    nilai.setValue(0);
    const anim = Animated.loop(
      Animated.timing(nilai, { toValue: 1, duration: durasi, easing, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [kurangi, durasi, easing, nilai, nilaiDiam]);
  return nilai;
}

/** Pergeseran naik-turun satu titik; jeda 0 / 0,15 / 0,3 detik dari siklus 1,2 detik. */
function lompatan(p: Animated.Value, urutan: number, tinggi: number) {
  const mulai = (urutan * 0.15) / 1.2;
  return p.interpolate({
    inputRange: [0, mulai, mulai + 0.3, mulai + 0.6, 1],
    outputRange: [0, 0, -tinggi, 0, 0],
    easing: mulus,
  });
}

const WARNA_TITIK = [warnaCK.oranye, warnaCK.biru, warnaCK.biru];

type SpinnerPiringProps = {
  /** Diameter total dalam dp. Bawaan 96. */
  ukuran?: number;
  /** Pakai true di atas latar biru/gelap agar lintasan cincin terlihat. */
  latarGelap?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/** Spinner piring: cincin oranye berputar mengelilingi piring berisi tiga titik memantul. */
export function SpinnerPiring({ ukuran = 96, latarGelap = false, label = 'Memuat', style }: SpinnerPiringProps) {
  const putar = useLoop(1400);
  const titik = useLoop(1200);
  // Satuan asli SVG: cincin luar berjari-jari 122 + tebal 10 → lebar 254
  const k = ukuran / 254;
  const lingkaran = (d: number) => ({ width: d * k, height: d * k, borderRadius: (d * k) / 2 });
  const rotasi = putar.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={[{ width: ukuran, height: ukuran, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <View
        style={[
          styles.abs,
          lingkaran(254),
          { borderWidth: 10 * k, borderColor: latarGelap ? 'rgba(255,255,255,0.16)' : '#E3E8EF' },
        ]}
      />
      <Animated.View
        style={[
          styles.abs,
          lingkaran(254),
          {
            borderWidth: 10 * k,
            borderColor: 'transparent',
            borderTopColor: warnaCK.oranye,
            transform: [{ rotate: rotasi }],
          },
        ]}
      />
      <View style={[styles.abs, lingkaran(188), { backgroundColor: 'rgba(0,0,0,0.12)', top: (33 + 14) * k }]} />
      <View style={[styles.abs, lingkaran(188), { backgroundColor: warnaCK.krem }]} />
      <View style={[styles.abs, lingkaran(152), { borderWidth: 8 * k, borderColor: warnaCK.biru }]} />
      <View style={[styles.baris, { gap: 10 * k }]}>
        {WARNA_TITIK.map((warna, i) => (
          <Animated.View
            key={i}
            style={[
              lingkaran(26),
              { backgroundColor: warna, transform: [{ translateY: lompatan(titik, i, 16 * k) }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

type TitikMemantulProps = {
  /** Pengali ukuran; 1 = 120×48 dp. */
  skala?: number;
  /** false untuk menghilangkan latar kapsul krem. */
  kapsul?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/** Tiga titik memantul (oranye, biru, biru), misalnya untuk "sedang memproses". */
export function TitikMemantul({ skala = 1, kapsul = true, label = 'Memproses', style }: TitikMemantulProps) {
  const p = useLoop(1200);
  const d = 14 * skala;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={[
        styles.baris,
        {
          gap: 8 * skala,
          paddingHorizontal: 31 * skala,
          paddingTop: 19 * skala,
          paddingBottom: 15 * skala,
          borderRadius: 999,
          alignSelf: 'center',
        },
        kapsul && { backgroundColor: warnaCK.krem },
        style,
      ]}
    >
      {WARNA_TITIK.map((warna, i) => (
        <Animated.View
          key={i}
          style={{
            width: d,
            height: d,
            borderRadius: d / 2,
            backgroundColor: warna,
            transform: [{ translateY: lompatan(p, i, 8 * skala) }],
          }}
        />
      ))}
    </View>
  );
}

type SpinnerTombolProps = {
  /** Warna cincin; bawaan putih untuk tombol biru/oranye. */
  warna?: string;
  ukuran?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/** Spinner kecil untuk di dalam tombol saat menyimpan/mengirim. */
export function SpinnerTombol({ warna = '#FFFFFF', ukuran = 18, label = 'Memuat', style }: SpinnerTombolProps) {
  const p = useLoop(900);
  const tebal = Math.max(2, Math.round(ukuran / 6));
  const bulat = { width: ukuran, height: ukuran, borderRadius: ukuran / 2, borderWidth: tebal };
  const rotasi = p.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} style={[{ width: ukuran, height: ukuran }, style]}>
      <View style={[styles.abs, bulat, { borderColor: warna, opacity: 0.3 }]} />
      <Animated.View
        style={[
          styles.abs,
          bulat,
          { borderColor: 'transparent', borderTopColor: warna, transform: [{ rotate: rotasi }] },
        ]}
      />
    </View>
  );
}

/**
 * Layar splash di dalam aplikasi: latar biru dengan logo di tengah (sama persis
 * dengan splash bawaan dari app.json, jadi peralihannya mulus) plus bilah memuat.
 */
export function LayarSplash({ pesan = 'Menyiapkan kantin…' }: { pesan?: string }) {
  const p = useLoop(1500, mulus, 0.45);
  const geser = p.interpolate({ inputRange: [0, 1], outputRange: [-64, 160] });
  return (
    <View style={styles.splash} accessible accessibilityRole="progressbar" accessibilityLabel={pesan}>
      <StatusBar style="light" />
      <Image source={require('../assets/splash-icon.png')} style={styles.splashLogo} />
      <View style={styles.splashInfo}>
        <Text style={styles.splashTeks}>{pesan}</Text>
        <View style={styles.bilah}>
          <Animated.View style={[styles.bilahIsi, { transform: [{ translateX: geser }] }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  baris: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  splash: {
    flex: 1,
    backgroundColor: warnaCK.biru,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: { width: 200, height: 200 },
  splashInfo: {
    position: 'absolute',
    top: '50%',
    marginTop: 112,
    alignItems: 'center',
    gap: 16,
  },
  splashTeks: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  bilah: {
    width: 160,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  bilahIsi: { width: 64, height: '100%', borderRadius: 999, backgroundColor: '#FFFFFF' },
});

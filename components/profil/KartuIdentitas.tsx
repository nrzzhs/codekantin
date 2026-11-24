import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import { SpinnerTombol } from '../Loading';
import { font, warna } from '../../lib/tema';

type Props = {
  nama: string;
  avatarUrl: string | null;
  fotoError: boolean;
  onFotoError: () => void;
  mengunggah: boolean;
  onUbahFoto: () => void;
  guru: boolean;
  lencana: string;
};

const AVATAR = 104;

/** Kartu identitas: avatar dengan tombol kamera, nama panggilan, pil peran dan lencana. */
export default function KartuIdentitas({
  nama,
  avatarUrl,
  fotoError,
  onFotoError,
  mengunggah,
  onUbahFoto,
  guru,
  lencana,
}: Props) {
  return (
    <View style={styles.kartu}>
      {/* Hiasan samar: dua piring dan dua titik */}
      <Svg
        width="100%"
        height={70}
        viewBox="0 0 320 70"
        preserveAspectRatio="xMidYMin slice"
        style={styles.hiasan}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Ellipse cx={46} cy={28} rx={30} ry={8} fill="none" stroke="#FDBA8C" strokeWidth={3} />
        <Ellipse cx={278} cy={40} rx={26} ry={7} fill="none" stroke="#FDBA8C" strokeWidth={3} />
        <Circle cx={96} cy={52} r={4} fill="#FDBA8C" />
        <Circle cx={232} cy={14} r={3} fill="#FDBA8C" />
      </Svg>

      <View style={styles.avatarWadah}>
        {/* Avatar ikut bisa diketuk; untuk pembaca layar, targetnya tombol kamera */}
        <Pressable onPress={onUbahFoto} disabled={mengunggah} accessible={false}>
          {avatarUrl && !fotoError ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} onError={onFotoError} />
          ) : (
            <View style={[styles.avatar, styles.avatarKosong]}>
              <Text style={styles.inisial}>{nama.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {mengunggah && (
            <View style={styles.memuat}>
              <SpinnerTombol ukuran={22} label="Mengunggah foto" />
            </View>
          )}
        </Pressable>
        <Pressable
          onPress={onUbahFoto}
          disabled={mengunggah}
          style={({ pressed }) => [styles.kamera, pressed && styles.kameraTekan]}
          accessibilityRole="button"
          accessibilityLabel="Ubah foto"
          accessibilityState={{ disabled: mengunggah, busy: mengunggah }}
        >
          <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <Text style={styles.nama} numberOfLines={1} accessibilityRole="header">
        {nama}
      </Text>

      <View style={styles.barisPil}>
        <View style={[styles.pil, { backgroundColor: warna.hijauMuda }]}>
          <Ionicons name={guru ? 'school-outline' : 'person-outline'} size={14} color={warna.hijauTua} />
          <Text style={[styles.pilTeks, { color: warna.hijauTua }]}>{guru ? 'Guru' : 'Siswa'}</Text>
        </View>
        <View style={[styles.pil, { backgroundColor: '#FFFFFF' }]} accessible accessibilityLabel={`Lencana: ${lencana}`}>
          <Ionicons name="ribbon-outline" size={14} color={warna.persikTeks} />
          <Text style={[styles.pilTeks, { color: warna.persikTeks }]}>{lencana}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: {
    backgroundColor: warna.persik,
    borderRadius: 28,
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 18,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  hiasan: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0.5 },
  avatarWadah: { width: AVATAR, height: AVATAR },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    shadowColor: '#1F1A17',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  avatarKosong: { backgroundColor: warna.biru, alignItems: 'center', justifyContent: 'center' },
  inisial: { fontFamily: font.judul, fontSize: 44, color: '#FFFFFF' },
  memuat: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: AVATAR / 2,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kamera: {
    position: 'absolute',
    right: -6,
    bottom: -2,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: warna.oranye,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kameraTekan: { backgroundColor: '#9A3412' },
  nama: { fontFamily: font.judul, fontSize: 22, color: warna.teks, marginTop: 4 },
  barisPil: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pilTeks: { fontFamily: font.judul, fontSize: 12 },
});

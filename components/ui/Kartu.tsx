import { StyleSheet, View, type ViewProps } from 'react-native';
import { bayanganKartu, radius, warna } from '../../lib/tema';

/** Wadah putih berbingkai tipis dengan bayangan lembut. */
export default function Kartu({ style, ...sisa }: ViewProps) {
  return <View {...sisa} style={[styles.kartu, style]} />;
}

const styles = StyleSheet.create({
  kartu: {
    backgroundColor: warna.kartu,
    borderRadius: radius.kartu,
    borderWidth: 1,
    borderColor: warna.garis,
    padding: 16,
    ...bayanganKartu,
  },
});

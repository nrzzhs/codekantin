import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { font, radius, warna } from '../../lib/tema';

type Props = Omit<TextInputProps, 'value' | 'onChangeText' | 'secureTextEntry' | 'style'> & {
  label: string;
  value: string;
  onChangeText: (teks: string) => void;
  ikon?: ComponentProps<typeof Ionicons>['name'];
  /** true untuk kolom password: teks disembunyikan + tombol mata. */
  rahasia?: boolean;
  /** Warna garis saat fokus. Bawaan biru. */
  aksen?: string;
  /** Teks kecil di kanan label, mis. penghitung "5/20". */
  labelKanan?: string;
};

export default function KolomIsian({
  label,
  value,
  onChangeText,
  ikon,
  rahasia = false,
  aksen = warna.biru,
  labelKanan,
  onFocus,
  onBlur,
  editable = true,
  accessibilityLabel,
  ...sisa
}: Props) {
  const [fokus, setFokus] = useState(false);
  const [tampil, setTampil] = useState(false);

  return (
    <View style={styles.wadah}>
      <View style={styles.barisLabel}>
        <Text style={styles.label} importantForAccessibility="no" accessibilityElementsHidden>
          {label}
        </Text>
        {labelKanan !== undefined && (
          <Text style={styles.labelKanan} accessibilityLabel={`${labelKanan.replace('/', ' dari ')} karakter`}>
            {labelKanan}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.kotak,
          fokus && { borderColor: aksen },
          !editable && styles.kotakMati,
        ]}
      >
        {ikon && <Ionicons name={ikon} size={20} color={warna.teksRedup} style={styles.ikon} />}
        <TextInput
          {...sisa}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          secureTextEntry={rahasia && !tampil}
          placeholderTextColor={warna.teksRedup}
          accessibilityLabel={accessibilityLabel ?? label}
          onFocus={(e) => {
            setFokus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFokus(false);
            onBlur?.(e);
          }}
          style={[styles.input, !ikon && { paddingLeft: 16 }, !rahasia && { paddingRight: 16 }]}
        />
        {rahasia && (
          <Pressable
            onPress={() => setTampil((t) => !t)}
            style={styles.mata}
            accessibilityRole="button"
            accessibilityLabel={tampil ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            <Ionicons name={tampil ? 'eye-off-outline' : 'eye-outline'} size={22} color={warna.teksRedup} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wadah: { gap: 6 },
  barisLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: font.tebal, fontSize: 13, color: warna.teks },
  labelKanan: { fontFamily: font.semi, fontSize: 12, color: warna.teksRedup },
  kotak: {
    height: 52,
    borderRadius: radius.input,
    borderWidth: 2,
    borderColor: warna.garis,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  kotakMati: { backgroundColor: warna.kotakKode },
  ikon: { marginLeft: 14 },
  input: {
    flex: 1,
    height: '100%',
    paddingLeft: 10,
    fontFamily: font.isi,
    fontSize: 16,
    color: warna.teks,
  },
  mata: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 2 },
});

import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type JenisMakanan = 'burger' | 'pizza' | 'donat';

type Props = { jenis: JenisMakanan; ukuran?: number };

/** Gambar makanan (viewBox 40 × 40) pengganti emoji 🍔 🍕 🍩. Dekoratif, tanpa label. */
export default function Makanan({ jenis, ukuran = 40 }: Props) {
  return (
    <Svg
      width={ukuran}
      height={ukuran}
      viewBox="0 0 40 40"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {jenis === 'burger' && (
        <>
          <Path d="M6 18a14 10 0 0 1 28 0z" fill="#F59E0B" />
          <Circle cx={14} cy={13} r={1.2} fill="#FFF7ED" />
          <Circle cx={20} cy={11} r={1.2} fill="#FFF7ED" />
          <Circle cx={26} cy={13} r={1.2} fill="#FFF7ED" />
          <Path d="M5 20h30l-3 3-3-3-3 3-3-3-3 3-3-3-3 3-3-3-3 3z" fill="#22C55E" />
          <Rect x={6} y={23} width={28} height={5} rx={2.5} fill="#7C2D12" />
          <Path d="M6 29h28a2 2 0 0 1-2 4H8a2 2 0 0 1-2-4z" fill="#F59E0B" />
        </>
      )}
      {jenis === 'pizza' && (
        <>
          <Path d="M6 8q14-6 28 0L20 36z" fill="#FCD34D" stroke="#F59E0B" strokeWidth={2} strokeLinejoin="round" />
          <Path d="M6 8q14-6 28 0" stroke="#C2410C" strokeWidth={4} strokeLinecap="round" fill="none" />
          <Circle cx={15} cy={13} r={3} fill="#DC2626" />
          <Circle cx={24} cy={15} r={3} fill="#DC2626" />
          <Circle cx={20} cy={23} r={2.5} fill="#DC2626" />
        </>
      )}
      {jenis === 'donat' && (
        <>
          <Circle cx={20} cy={21} r={15} fill="#D97706" />
          <Path
            d="M6 19a14 13 0 0 1 28 0c0 3-3 4-5 3s-3 2-6 2-4-3-6-2-4 1-6 0-5 0-5-3z"
            fill="#F472B6"
          />
          <Circle cx={20} cy={20} r={5} fill="#FFF8F0" />
          {/* Taburan */}
          <Path
            d="M11 13l2 1M27 12l-1 2M30 18l2-1M9 19l1 2M15 9l2-0.5M24 8l1.5 1"
            stroke="#FFFFFF"
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
}

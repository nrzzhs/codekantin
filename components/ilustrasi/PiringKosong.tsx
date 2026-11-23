import Svg, { Ellipse, Path } from 'react-native-svg';

type Props = { lebar?: number; tinggi?: number };

/** Piring kosong dengan uap tipis (dari tahap1-2/ilustrasi/piring-kosong.svg). */
export default function PiringKosong({ lebar = 120, tinggi = 90 }: Props) {
  return (
    <Svg
      width={lebar}
      height={tinggi}
      viewBox="0 0 120 90"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ellipse cx={60} cy={74} rx={46} ry={8} fill="#F1E7DC" />
      <Ellipse cx={60} cy={62} rx={40} ry={12} fill="#FFFFFF" stroke="#C2410C" strokeWidth={3} />
      <Ellipse cx={60} cy={60} rx={24} ry={6} fill="none" stroke="#FDE4D6" strokeWidth={3} />
      <Path
        d="M50 30c0-6 6-6 6-12M62 32c0-6 6-6 6-12"
        fill="none"
        stroke="#9A3412"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
    </Svg>
  );
}

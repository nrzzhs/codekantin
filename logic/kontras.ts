// Rasio kontras warna menurut WCAG 2.x
function saluran(nilai: number): number {
  const c = nilai / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminansRelatif(hex: string): number {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Warna tidak valid: ${hex}`);
  const r = saluran(parseInt(h.slice(0, 2), 16));
  const g = saluran(parseInt(h.slice(2, 4), 16));
  const b = saluran(parseInt(h.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function rasioKontras(a: string, b: string): number {
  const la = luminansRelatif(a);
  const lb = luminansRelatif(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const BATAS_TEKS_NORMAL = 4.5;
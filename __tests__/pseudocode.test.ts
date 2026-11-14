import { barisPseudocode, jejakBaris } from '../logic/pseudocode';
import type { OperasiSim } from '../logic/pseudocode';
import type { JenisStruktur } from '../logic/simulasi';

const JENIS: JenisStruktur[] = ['stack', 'queue'];
const OPERASI: OperasiSim[] = ['tambah', 'ambil'];

describe('Pseudocode', () => {
  test('nama prosedur sesuai struktur dan operasi', () => {
    expect(barisPseudocode('queue', 'tambah')[0]).toBe('prosedur enqueue(x)');
    expect(barisPseudocode('queue', 'ambil')[0]).toBe('prosedur dequeue()');
    expect(barisPseudocode('stack', 'tambah')[0]).toBe('prosedur push(x)');
    expect(barisPseudocode('stack', 'ambil')[0]).toBe('prosedur pop()');
  });

  test('jejak menunjuk baris yang ada, berurutan naik, dan dimulai dari baris pertama', () => {
    for (const j of JENIS) {
      for (const op of OPERASI) {
        for (const galat of [null, op === 'tambah' ? 'overflow' : 'underflow'] as const) {
          const jejak = jejakBaris(j, op, galat);
          const baris = barisPseudocode(j, op);
          expect(jejak[0]).toBe(0);
          expect(jejak.every((i) => i >= 0 && i < baris.length)).toBe(true);
          expect(jejak).toEqual([...jejak].sort((a, b) => a - b));
        }
      }
    }
  });

  test('jejak sukses berakhir di baris terakhir', () => {
    for (const j of JENIS) {
      for (const op of OPERASI) {
        const jejak = jejakBaris(j, op, null);
        expect(jejak[jejak.length - 1]).toBe(barisPseudocode(j, op).length - 1);
      }
    }
  });

  test('jejak galat berhenti di baris pesan overflow atau underflow', () => {
    for (const j of JENIS) {
      for (const op of OPERASI) {
        const kata = op === 'tambah' ? 'overflow' : 'underflow';
        const jejak = jejakBaris(j, op, kata);
        expect(barisPseudocode(j, op)[jejak[jejak.length - 1]]).toContain(kata);
        expect(jejak.length).toBeLessThan(jejakBaris(j, op, null).length);
      }
    }
  });

  test('baris yang dikembalikan adalah salinan', () => {
    const a = barisPseudocode('stack', 'tambah');
    a.push('rusak');
    expect(barisPseudocode('stack', 'tambah')).toHaveLength(5);
  });
});
import { describe, expect, it } from 'vitest';
import { IMPRESSUM } from '../src/impressum';

describe('Impressum', () => {
  it('enthält Anschrift, Telefon und E-Mail des Herausgebers', () => {
    expect(IMPRESSUM.address).toEqual(['Regionalmanagement KUUSK', 'Prof.-Sinwel-Weg 2', '6330 Kufstein']);
    expect(IMPRESSUM.phone).toBe('05372-21185');
    expect(IMPRESSUM.email).toBe('leader@rm-kuusk.at');
  });

  it('hat die drei Abschnitte und genau eine Stelle für den ECG-Link', () => {
    expect(IMPRESSUM.sections.map((s) => s.title)).toEqual([
      'Haftung für Inhalte dieser Webseite',
      'Haftung für Links auf dieser Webseite',
      'Urheberrechtshinweis',
    ]);
    const all = IMPRESSUM.sections.flatMap((s) => s.paragraphs).join('\n');
    expect(all.split('{ECG}')).toHaveLength(2);
    expect(IMPRESSUM.ecgUrl.startsWith('https://www.ris.bka.gv.at/')).toBe(true);
  });
});

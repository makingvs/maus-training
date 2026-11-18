// Speicher auf dem Gerät (localStorage): Kinder, Sterne, Stufen, Einstellungen der Lehrkraft.
import { LEVELS } from './levels';
import type { Difficulty, Profile } from './progress';

export type { Difficulty } from './progress';

/** Farben für die Avatare (MINT2Go-Farben). */
export const AVATAR_COLORS = ['#98C227', '#F0A030', '#E01070', '#38B8E8', '#3757A9', '#4D597C'];
export const MAX_NAME = 14;
export const MAX_PROFILES = 30;

export interface Settings {
  unlockAll: boolean;
  bigCursor: boolean;
}
export interface Data {
  v: 1;
  profiles: Profile[];
  settings: Settings;
  last?: string;
}
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const KEY = 'maus-training.v1';

/**
 * Stufen für unterschiedliche Altersgruppen:
 *  size = Größe der Ziele, pace = Tempo (Ballons schneller, Zielscheiben kürzer sichtbar).
 */
export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];
export const SIZE_SCALE: Record<Difficulty, number> = { easy: 1.25, normal: 1, hard: 0.75 };
export const PACE: Record<Difficulty, number> = { easy: 0.85, normal: 1, hard: 1.35 };
export const DIFFICULTY_LABEL: Record<Difficulty, { name: string; age: string }> = {
  easy: { name: 'Starter', age: 'ab 6 Jahre' },
  normal: { name: 'Fortgeschritten', age: 'ab 9 Jahre' },
  hard: { name: 'Profi', age: 'ab 12 Jahre' },
};

export const defaultSettings = (): Settings => ({ unlockAll: false, bigCursor: false });

export function sanitizeName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME).trim();
}

/** Anfangsbuchstabe für den Avatar. */
export const initial = (name: string): string => (Array.from(name.trim())[0] ?? '?').toUpperCase();

function normalize(raw: unknown): Data {
  const d: Data = { v: 1, profiles: [], settings: defaultSettings() };
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  const ids = new Set<string>();
  if (Array.isArray(r.profiles)) {
    for (const p of r.profiles) {
      if (!p || typeof p !== 'object') continue;
      const q = p as Record<string, unknown>;
      if (typeof q.id !== 'string' || typeof q.name !== 'string') continue;
      if (ids.has(q.id)) continue;
      ids.add(q.id);
      const stars: Record<number, number> = {};
      if (q.stars && typeof q.stars === 'object') {
        for (const l of LEVELS) {
          const v = (q.stars as Record<string, unknown>)[String(l.id)];
          if (typeof v === 'number' && v >= 1) stars[l.id] = Math.min(3, Math.floor(v));
        }
      }
      d.profiles.push({
        id: q.id,
        name: sanitizeName(q.name) || '?',
        color: typeof q.color === 'string' && AVATAR_COLORS.includes(q.color) ? q.color : AVATAR_COLORS[d.profiles.length % AVATAR_COLORS.length],
        level: DIFFICULTIES.includes(q.level as Difficulty) ? (q.level as Difficulty) : 'normal',
        stars,
        created: typeof q.created === 'number' ? q.created : 0,
      });
    }
  }
  const s = r.settings as Record<string, unknown> | undefined;
  if (s && typeof s === 'object') {
    d.settings.unlockAll = s.unlockAll === true;
    d.settings.bigCursor = s.bigCursor === true;
  }
  if (typeof r.last === 'string' && ids.has(r.last)) d.last = r.last;
  return d;
}

export class Store {
  data: Data;

  constructor(private storage: StorageLike | null) {
    this.data = this.read();
  }

  private read(): Data {
    try {
      const raw = this.storage?.getItem(KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch {
      /* kaputte Daten: neu anfangen */
    }
    return normalize(null);
  }

  private write(): void {
    try {
      this.storage?.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* Speicher voll oder gesperrt: Spiel läuft trotzdem weiter */
    }
  }

  get profiles(): Profile[] {
    return this.data.profiles;
  }
  get settings(): Settings {
    return this.data.settings;
  }
  profile(id: string | undefined): Profile | undefined {
    return this.data.profiles.find((p) => p.id === id);
  }

  addProfile(name: string, color: string, level: Difficulty = 'normal'): Profile | null {
    const n = sanitizeName(name);
    if (!n || !AVATAR_COLORS.includes(color) || !DIFFICULTIES.includes(level)) return null;
    if (this.data.profiles.length >= MAX_PROFILES) return null;
    const p: Profile = {
      id: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: n,
      color,
      level,
      stars: {},
      created: Date.now(),
    };
    this.data.profiles.push(p);
    this.data.last = p.id;
    this.write();
    return p;
  }

  removeProfile(id: string): void {
    this.data.profiles = this.data.profiles.filter((p) => p.id !== id);
    if (this.data.last === id) delete this.data.last;
    this.write();
  }

  resetProgress(id: string): void {
    const p = this.profile(id);
    if (p) p.stars = {};
    this.write();
  }

  setLevel(id: string, level: Difficulty): void {
    const p = this.profile(id);
    if (p && DIFFICULTIES.includes(level)) p.level = level;
    this.write();
  }

  /** Speichert nur Verbesserungen. Gibt zurück, ob sich etwas geändert hat. */
  recordResult(id: string, levelId: number, stars: number): boolean {
    const p = this.profile(id);
    if (!p) return false;
    const s = Math.max(1, Math.min(3, Math.floor(stars)));
    if ((p.stars[levelId] ?? 0) >= s) return false;
    p.stars[levelId] = s;
    this.write();
    return true;
  }

  setLast(id: string | undefined): void {
    if (id) this.data.last = id;
    else delete this.data.last;
    this.write();
  }

  setSettings(part: Partial<Settings>): void {
    this.data.settings = { ...this.data.settings, ...part };
    this.write();
  }
}

export function browserStorage(): StorageLike | null {
  try {
    const s = window.localStorage;
    s.getItem(KEY);
    return s;
  } catch {
    return null;
  }
}

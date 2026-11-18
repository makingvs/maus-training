/**
 * Passwort für den Lehrkraft-Bereich (zusätzlich zum langen Druck auf das Logo).
 * Hinweis: Das Spiel läuft komplett im Browser, das Passwort steht daher im Quelltext.
 * Es hält Kinder vom Lehrkraft-Bereich fern, ist aber kein Schutz gegen technisch versierte Personen.
 */
export const TEACHER_PASSWORD = 'LehrerIn';

/** Groß-/Kleinschreibung zählt, Leerzeichen am Rand werden ignoriert. */
export const checkPassword = (input: string): boolean => input.trim() === TEACHER_PASSWORD;

import { esc } from '../dom';
import { initial } from '../storage';

/** Runder Avatar mit Anfangsbuchstaben in der gewählten MINT2Go-Farbe. */
export const avatar = (name: string, color: string, cls = ''): string =>
  `<span class="avatar ${cls}" style="background:${color}">${esc(initial(name))}</span>`;

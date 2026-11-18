import { icon } from '../art';
import { el, esc } from '../dom';
import { IMPRESSUM } from '../impressum';
import { bigButton, openModal } from './dialog';

/** Kleiner Link "Impressum" für Fußbereiche (Startseite, Übersicht). */
export function impressumLink(host: HTMLElement): HTMLButtonElement {
  const b = el('button', 'impressum-link', 'Impressum');
  b.type = 'button';
  b.addEventListener('click', () => openImpressum(host));
  return b;
}

export function openImpressum(host: HTMLElement): void {
  openModal(
    host,
    (close) => {
      const box = el('div', 'legal');
      const a = IMPRESSUM;
      const ecg = `<a href="${a.ecgUrl}" target="_blank" rel="noopener noreferrer">§ 17 ECG</a>`;
      box.innerHTML =
        `<h2>Impressum</h2>` +
        `<p class="legal-address">${a.address.map(esc).join('<br>')}<br>Tel.: ${esc(a.phone)}<br>` +
        `<a href="mailto:${a.email}">${esc(a.email)}</a></p>` +
        a.sections
          .map(
            (s) =>
              `<h3>${esc(s.title)}</h3>` +
              s.paragraphs.map((p) => `<p>${esc(p).replace('{ECG}', ecg)}</p>`).join(''),
          )
          .join('');
      const row = el('div', 'actions');
      row.appendChild(bigButton('ok', icon('check'), 'Schließen', close));
      box.appendChild(row);
      return box;
    },
    'legal-modal',
  );
}

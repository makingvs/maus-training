// Lehrkraft-Bereich: versteckt hinter langem Druck auf das Logo und zusätzlich per Passwort gesichert.
import { checkPassword } from '../auth';
import { icon } from '../art';
import { el, esc } from '../dom';
import { MAX_STARS } from '../levels';
import { totalStars } from '../progress';
import { DIFFICULTIES, DIFFICULTY_LABEL } from '../storage';
import type { App } from './app';
import { avatar } from './avatar';
import { bigButton, confirmDialog, openModal } from './dialog';

export const applySettings = (app: App): void => {
  document.body.classList.toggle('big-cursor', app.store.settings.bigCursor);
};

/** Fragt das Passwort ab und öffnet bei richtiger Eingabe den Lehrkraft-Bereich. */
export function openTeacherGate(app: App, host: HTMLElement, onClose: () => void): void {
  openModal(
    host,
    (close) => {
      const box = el('div', 'pw');
      box.appendChild(el('h2', '', `${icon('lock')}<span>Lehrkraft-Bereich</span>`));
      box.appendChild(el('p', 'pw-hint', 'Bitte Passwort eingeben'));
      const input = el('input', 'name-input pw-input');
      input.type = 'password';
      input.autocomplete = 'off';
      input.placeholder = 'Passwort';
      const err = el('p', 'pw-err', '');
      const submit = (): void => {
        if (checkPassword(input.value)) {
          close();
          openTeacher(app, host, onClose);
          return;
        }
        err.textContent = 'Das Passwort stimmt nicht.';
        input.classList.remove('shake');
        void input.offsetWidth;
        input.classList.add('shake');
        input.select();
      };
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
        else err.textContent = '';
      });
      const row = el('div', 'actions');
      row.append(bigButton('no', icon('close'), 'Abbrechen', close), bigButton('ok', icon('check'), 'Öffnen', submit));
      box.append(input, err, row);
      window.setTimeout(() => input.focus(), 50);
      return box;
    },
    'pw-modal',
  );
}

function openTeacher(app: App, host: HTMLElement, onClose: () => void): void {
  openModal(
    host,
    (close) => {
      const box = el('div', 'teacher');
      const render = (): void => {
        const s = app.store.settings;
        box.innerHTML = '';
        box.appendChild(el('h2', '', `${icon('lock')}<span>Lehrkraft-Bereich</span>`));

        const seg = (label: string, hint: string, options: [boolean, string][], value: boolean, set: (v: boolean) => void): void => {
          const row = el('div', 'trow', `<div class="tlabel"><b>${label}</b><small>${hint}</small></div>`);
          const g = el('div', 'seg');
          for (const [v, t] of options) {
            const b = el('button', 'segbtn' + (v === value ? ' sel' : ''), t);
            b.type = 'button';
            b.addEventListener('click', () => {
              set(v);
              render();
            });
            g.appendChild(b);
          }
          row.appendChild(g);
          box.appendChild(row);
        };

        seg('Mauszeiger', 'Ein großer Zeiger ist leichter zu finden', [[false, 'Normal'], [true, 'Groß']], s.bigCursor, (v) => {
          app.store.setSettings({ bigCursor: v });
          applySettings(app);
        });
        seg('Alle Levels offen', 'Sonst wird jedes Level erst nach dem vorigen frei', [[false, 'Aus'], [true, 'An']], s.unlockAll, (v) =>
          app.store.setSettings({ unlockAll: v }),
        );

        box.appendChild(el('h3', '', 'Kinder und Stufen'));
        const list = el('div', 'tkids');
        if (app.store.profiles.length === 0) list.appendChild(el('p', 'tnone', 'Noch kein Kind angelegt.'));
        for (const p of app.store.profiles) {
          const r = el('div', 'tkid', `${avatar(p.name, p.color)}<b>${esc(p.name)}</b><small>${icon('star')} ${totalStars(p)} / ${MAX_STARS}</small>`);
          const lv = el('div', 'seg small');
          for (const d of DIFFICULTIES) {
            const b = el('button', 'segbtn' + (p.level === d ? ' sel' : ''), DIFFICULTY_LABEL[d].name);
            b.type = 'button';
            b.title = DIFFICULTY_LABEL[d].age;
            b.addEventListener('click', () => {
              app.store.setLevel(p.id, d);
              render();
            });
            lv.appendChild(b);
          }
          const reset = el('button', 'sqbtn', icon('reset'));
          reset.type = 'button';
          reset.title = 'Sterne zurücksetzen';
          reset.addEventListener('click', async () => {
            if (await confirmDialog(host, `Sterne von ${p.name} löschen?`)) {
              app.store.resetProgress(p.id);
              render();
            }
          });
          const del = el('button', 'sqbtn danger', icon('trash'));
          del.type = 'button';
          del.title = 'Profil löschen';
          del.addEventListener('click', async () => {
            if (await confirmDialog(host, `Profil von ${p.name} ganz löschen?`)) {
              app.store.removeProfile(p.id);
              render();
            }
          });
          r.append(lv, reset, del);
          list.appendChild(r);
        }
        box.appendChild(list);

        const row = el('div', 'actions');
        row.appendChild(
          bigButton('ok', icon('check'), 'Fertig', () => {
            close();
            onClose();
          }),
        );
        box.appendChild(row);
      };
      render();
      return box;
    },
    'wide',
  );
}

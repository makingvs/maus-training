// Startbildschirm: Wer spielt? Kinder wählen ihr Profil oder legen sich neu an.
import { cdLine, gearsMarkup, icon, logoMarkup } from '../art';
import { el, esc, longPress } from '../dom';
import { MAX_STARS } from '../levels';
import type { Difficulty } from '../progress';
import { totalStars } from '../progress';
import { AVATAR_COLORS, DIFFICULTY_LABEL, DIFFICULTIES, MAX_NAME, MAX_PROFILES } from '../storage';
import type { App, Screen } from './app';
import { avatar } from './avatar';
import { bigButton, openModal } from './dialog';
import { impressumLink } from './impressumDialog';
import { openTeacherGate } from './teacher';

export function profilesScreen(app: App): Screen {
  const root = el('div', 'screen s-home');
  root.insertAdjacentHTML('beforeend', gearsMarkup());

  const logo = el('div', 'home-logo', logoMarkup('big') + '<i class="ring"></i>');
  longPress(logo, 1500, () => openTeacherGate(app, root, () => app.showProfiles()));
  const title = el('div', 'home-head', `<h1>Maus-Training</h1><p>Wer spielt heute?</p>${cdLine()}`);
  const cards = el('div', 'cards');
  root.append(logo, title, cards, impressumLink(root));

  const last = app.store.data.last;
  const list = [...app.store.profiles].sort((a, b) => (a.id === last ? -1 : b.id === last ? 1 : a.created - b.created));
  for (const p of list) {
    const c = el(
      'button',
      'card kid',
      `${avatar(p.name, p.color, 'xl')}<b>${esc(p.name)}</b><small>${icon('star')}${totalStars(p)} / ${MAX_STARS}</small>`,
    );
    c.type = 'button';
    c.addEventListener('click', () => {
      app.store.setLast(p.id);
      app.showMap(p.id);
    });
    cards.appendChild(c);
  }
  if (app.store.profiles.length < MAX_PROFILES) {
    const add = el(
      'button',
      'card add' + (app.store.profiles.length === 0 ? ' pulse' : ''),
      `<span class="avatar xl plus">${icon('plus')}</span><b>Neu</b>`,
    );
    add.type = 'button';
    add.addEventListener('click', () => newKid(app, root));
    cards.appendChild(add);
  }

  // Beim allerersten Start gleich fragen
  if (app.store.profiles.length === 0) window.setTimeout(() => newKid(app, root), 350);

  return { el: root };
}

const LEVEL_TEXT: Record<Difficulty, string> = {
  easy: 'Große Ziele, ruhiges Tempo',
  normal: 'Mittlere Ziele, normales Tempo',
  hard: 'Kleine Ziele, hohes Tempo',
};

function newKid(app: App, host: HTMLElement): void {
  openModal(
    host,
    (close) => {
      const box = el('div', 'newkid');
      box.appendChild(el('h2', '', 'Neues Profil'));

      const input = el('input', 'name-input');
      input.type = 'text';
      input.maxLength = MAX_NAME;
      input.placeholder = 'Dein Name';
      input.autocomplete = 'off';
      input.spellcheck = false;
      box.appendChild(input);

      let color = AVATAR_COLORS[app.store.profiles.length % AVATAR_COLORS.length];
      box.appendChild(el('p', 'field-title', 'Deine Farbe'));
      const swatches = el('div', 'swatches');
      const swBtns: HTMLButtonElement[] = [];
      for (const c of AVATAR_COLORS) {
        const b = el('button', 'swatch' + (c === color ? ' sel' : ''));
        b.type = 'button';
        b.style.background = c;
        b.setAttribute('aria-label', 'Farbe ' + c);
        b.addEventListener('click', () => {
          color = c;
          swBtns.forEach((x) => x.classList.toggle('sel', x === b));
        });
        swBtns.push(b);
        swatches.appendChild(b);
      }
      box.appendChild(swatches);

      let level: Difficulty = 'normal';
      box.appendChild(el('p', 'field-title', 'Welche Stufe passt zu dir?'));
      const levels = el('div', 'levelpick');
      const lvBtns: HTMLButtonElement[] = [];
      for (const d of DIFFICULTIES) {
        const b = el(
          'button',
          'lvcard' + (d === level ? ' sel' : ''),
          `<b>${DIFFICULTY_LABEL[d].name}</b><span>${DIFFICULTY_LABEL[d].age}</span><small>${LEVEL_TEXT[d]}</small>`,
        );
        b.type = 'button';
        b.addEventListener('click', () => {
          level = d;
          lvBtns.forEach((x) => x.classList.toggle('sel', x === b));
        });
        lvBtns.push(b);
        levels.appendChild(b);
      }
      box.appendChild(levels);

      const row = el('div', 'actions');
      const ok = bigButton('ok', icon('check'), 'Los', () => submit());
      const no = bigButton('no', icon('close'), 'Zurück', close);
      row.append(no, ok);
      box.appendChild(row);

      const update = (): void => {
        ok.disabled = input.value.trim() === '';
      };
      const submit = (): void => {
        if (ok.disabled) return;
        const p = app.store.addProfile(input.value, color, level);
        if (!p) return;
        close();
        app.showMap(p.id);
      };
      input.addEventListener('input', update);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
      });
      update();
      window.setTimeout(() => input.focus(), 50);
      return box;
    },
    'newkid-modal',
  );
}

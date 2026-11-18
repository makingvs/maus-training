// Übersicht: 5 Welten mit je 3 Levels, Sterne, Urkunden.
import { gearsMarkup, icon, logoMarkup, worldIcon } from '../art';
import { el, esc, longPress } from '../dom';
import { MAX_STARS, WORLDS } from '../levels';
import { allDone, isUnlocked, nextToPlay, starsOf, totalStars, worldDone, worldStars } from '../progress';
import { DIFFICULTY_LABEL } from '../storage';
import type { App, Screen } from './app';
import { avatar } from './avatar';
import { openCertificate } from './certificate';
import { openTeacherGate } from './teacher';

const stars = (n: number): string =>
  [1, 2, 3].map((i) => `<span class="st ${i <= n ? 'on' : ''}">${icon('star')}</span>`).join('');

export function mapScreen(app: App, profileId: string): Screen {
  const profile = app.store.profile(profileId);
  if (!profile) {
    app.showProfiles();
    return { el: el('div') };
  }
  const unlockAll = app.store.settings.unlockAll;
  const root = el('div', 'screen s-map');
  root.insertAdjacentHTML('beforeend', gearsMarkup());

  const logo = el('div', 'map-logo', logoMarkup('small') + '<i class="ring"></i>');
  longPress(logo, 1500, () => openTeacherGate(app, root, () => app.showMap(profileId)));

  const kid = el(
    'button',
    'kidchip',
    `${avatar(profile.name, profile.color)}<span class="kc-text"><b>${esc(profile.name)}</b><small>${DIFFICULTY_LABEL[profile.level].name}</small></span>${icon('people')}`,
  );
  kid.type = 'button';
  kid.title = 'Profil wechseln';
  kid.addEventListener('click', () => app.showProfiles());

  const total = el('div', 'totalstars', `${icon('star')}<b>${totalStars(profile)}</b><small>/ ${MAX_STARS}</small>`);

  const top = el('div', 'topbar');
  top.append(kid, total, logo);

  const worlds = el('div', 'worlds');
  const next = nextToPlay(profile);
  for (const w of WORLDS) {
    const col = el('div', 'world');
    col.style.setProperty('--wc', w.color);
    col.appendChild(el('div', 'world-head', `<div class="world-icon">${worldIcon(w.icon)}</div><b>${w.title}</b>`));
    const lv = el('div', 'levels');
    for (const l of w.levels) {
      const open = isUnlocked(profile, l.id, unlockAll);
      const n = starsOf(profile, l.id);
      const b = el(
        'button',
        'level' + (open ? '' : ' locked') + (next?.id === l.id ? ' next' : '') + (n > 0 ? ' done' : ''),
        `<span class="num">${open ? l.id : icon('lock')}</span><span class="lv-text"><small>${l.title}</small><span class="stars">${stars(n)}</span></span>`,
      );
      b.type = 'button';
      b.disabled = !open;
      b.addEventListener('click', () => app.showLevel(profileId, l.id));
      lv.appendChild(b);
    }
    col.appendChild(lv);
    const done = worldDone(profile, w);
    const foot = el('div', 'world-foot');
    if (done) {
      const t = el('button', 'cert-btn', `${icon('trophy')}<span>Urkunde</span>`);
      t.type = 'button';
      t.addEventListener('click', () => openCertificate(profile, w.id));
      foot.appendChild(t);
    } else {
      foot.innerHTML = `<small class="wstars">${icon('star')} ${worldStars(profile, w)} / 9</small>`;
    }
    col.appendChild(foot);
    worlds.appendChild(col);
  }

  const bottom = el('div', 'bottombar');
  if (allDone(profile)) {
    const m = el('button', 'bigbtn ok master', `${icon('trophy')}<span>Maus-Profi-Urkunde</span>`);
    m.type = 'button';
    m.addEventListener('click', () => openCertificate(profile, 'all'));
    bottom.appendChild(m);
  } else if (next) {
    const go = el('button', 'bigbtn ok go', `${icon('next')}<span>${totalStars(profile) === 0 ? 'Start' : 'Weiter'}</span>`);
    go.type = 'button';
    go.addEventListener('click', () => app.showLevel(profileId, next.id));
    bottom.appendChild(go);
  }

  root.append(top, worlds, bottom);
  return { el: root };
}

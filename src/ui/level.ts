// Spielbildschirm: Kopfleiste, Startfenster, Spiel, Gewinn-Fenster.
import { icon, logoMarkup, mouseIcon, trophyArt } from '../art';
import { Disposer, confetti, el, esc } from '../dom';
import { mulberry32 } from '../geometry';
import { GAMES } from '../games';
import { PLAY } from '../games/common';
import type { GameCtx } from '../games/types';
import { levelById, nextLevel, worldById } from '../levels';
import { completesWorld, starsFor, type Profile } from '../progress';
import { PACE, SIZE_SCALE } from '../storage';
import { STAGE_H, STAGE_W, toStage, type App, type Screen } from './app';
import { openCertificate } from './certificate';
import { bigButton } from './dialog';

export function levelScreen(app: App, profileId: string, levelId: number): Screen {
  const level = levelById(levelId);
  const profile = app.store.profile(profileId);
  if (!level || !profile) {
    app.showProfiles();
    return { el: el('div') };
  }
  const world = worldById(level.world)!;
  const root = el('div', `screen s-level w${world.id}`);
  root.style.setProperty('--wc', world.color);
  const area = el('div', 'game-area');

  const back = el('button', 'hbtn', icon('home'));
  back.type = 'button';
  back.title = 'Zur Übersicht';
  back.addEventListener('click', () => app.showMap(profileId));
  const titleBox = el(
    'div',
    'hud-title',
    `<span class="hud-mouse">${mouseIcon(level.mouse)}</span><div><b>Level ${level.id} · ${level.title}</b><small>${level.short}</small></div>`,
  );
  const bar = el('i');
  const count = el('span', '', '');
  const prog = el('div', 'hud-progress');
  prog.append(el('div', 'bar'), count);
  prog.firstElementChild!.appendChild(bar);
  const hudLogo = el('div', 'hud-logo', logoMarkup('tiny'));
  const toast = el('div', 'toast');
  const hud = el('div', 'hud');
  hud.append(back, titleBox, prog, hudLogo);
  root.append(area, hud, toast);

  let dis: Disposer | null = null;
  const timers: number[] = [];
  let finished = false;
  let mistakes = 0;
  let startedAt = 0;
  let toastTimer = 0;

  const later = (fn: () => void, ms: number): void => {
    timers.push(window.setTimeout(fn, ms));
  };

  const say = (text: string): void => {
    toast.textContent = text;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3000);
  };

  const ctx = (): GameCtx => ({
    area,
    level,
    p: level.params,
    scale: SIZE_SCALE[profile.level],
    pace: PACE[profile.level],
    rng: mulberry32((Math.random() * 4294967296) >>> 0),
    play: PLAY,
    dis: dis!,
    toStage: (e) => toStage(area, e),
    say,
    progress(done, total) {
      if (finished) return; // nach dem Sieg zählt nichts mehr (z. B. noch fliegende Ballons)
      bar.style.width = (total > 0 ? Math.min(100, (done / total) * 100) : 0) + '%';
      count.textContent = level.game === 'path' ? '' : `${done}/${total}`;
    },
    mistake() {
      if (finished) return;
      mistakes++;
      root.classList.remove('oops');
      void root.offsetWidth;
      root.classList.add('oops');
    },
    win() {
      if (finished) return;
      finished = true;
      const seconds = (performance.now() - startedAt) / 1000;
      const earned = starsFor(level, mistakes, seconds);
      const before: Profile = { ...profile, stars: { ...profile.stars } };
      app.store.recordResult(profileId, levelId, earned);
      const worldNew = completesWorld(before, profile, levelId);
      toast.classList.remove('show');
      later(() => showWin(earned, worldNew), 900);
      later(() => dis?.dispose(), 1000);
    },
  });

  /* ---------- Startfenster ---------- */

  const intro = el('div', 'overlay intro');
  const card = el('div', 'card');
  card.innerHTML =
    `<div class="card-head"><span>Level ${level.id} · ${world.title}</span><b>${level.title}</b></div>` +
    `<div class="intro-mouse">${mouseIcon(level.mouse)}</div>` +
    `<p class="intro-text">${level.intro}</p>`;
  const go = bigButton('ok', icon('next'), 'Los geht’s', () => {
    intro.remove();
    dis = new Disposer();
    startedAt = performance.now();
    bar.style.width = '0%';
    GAMES[level.game](ctx());
  });
  go.classList.add('pulse');
  card.appendChild(go);
  intro.appendChild(card);
  root.appendChild(intro);

  /* ---------- Gewinn-Fenster ---------- */

  const showWin = (earned: number, worldNew: boolean): void => {
    const o = el('div', 'overlay win');
    const c = el('div', 'card');
    const hint =
      earned >= 3
        ? 'Perfekt!'
        : level.par && mistakes === 0
          ? 'Mit mehr Tempo gibt es mehr Sterne.'
          : 'Mit weniger Fehlern gibt es mehr Sterne.';
    c.innerHTML =
      `<div class="card-head"><span>Level ${level.id} · ${level.title}</span><b>Geschafft, ${esc(profile.name)}!</b></div>` +
      `<div class="win-stars">${[1, 2, 3].map((i) => `<span class="st ${i <= earned ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">${icon('star')}</span>`).join('')}</div>` +
      `<p class="win-hint">${hint}</p>`;
    const row = el('div', 'actions');
    row.append(bigButton('plain', icon('home'), 'Übersicht', () => app.showMap(profileId)));
    row.append(bigButton('plain', icon('replay'), 'Nochmal', () => app.showLevel(profileId, levelId)));
    const nl = nextLevel(levelId);
    row.append(
      bigButton('ok', icon('next'), nl ? 'Weiter' : 'Fertig', () => (nl ? app.showLevel(profileId, nl.id) : app.showMap(profileId))),
    );
    if (worldNew) {
      const t = el('div', 'world-win', `<span class="tr">${trophyArt()}</span><b>Welt „${world.title}“ geschafft!</b>`);
      const tb = bigButton('plain', icon('trophy'), 'Urkunde', () => openCertificate(profile, world.id));
      t.appendChild(tb);
      c.appendChild(t);
    }
    c.appendChild(row);
    o.appendChild(c);
    root.appendChild(o);
    confetti(root, worldNew ? 90 : 40);
  };

  area.style.width = STAGE_W + 'px';
  area.style.height = STAGE_H + 'px';

  return {
    el: root,
    dispose() {
      dis?.dispose();
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(toastTimer);
    },
  };
}

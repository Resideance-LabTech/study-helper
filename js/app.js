/* Study Helper — app shell: router, top bar, tab bar, badges, offline service worker */
(function () {
  'use strict';
  const SH = window.SH;
  const { h, $ } = SH;
  SH.CONTENT_VERSION = '2026.10.11';

  SH.installHelp = [
    '**Option A — single file (easiest, fully offline).** Copy `dist/StudyHelper.html` to your phone (USB cable, Google Drive, or email it to yourself and download it). Open it with Chrome or your file manager\'s HTML viewer. Everything runs offline and progress is saved on the phone.',
    '',
    '**Option B — install as an app.** Put the `app` folder on any free HTTPS host (for example GitHub Pages or Netlify Drop). Open the address once in Chrome on Android, then tap **⋮ → Add to Home screen → Install**. After the first visit it works completely **offline**, like a normal app.',
    '',
    '**Option C — over home Wi-Fi.** On the PC run `python serve.py --lan` and open the address it prints on your phone. The PC must stay on, so use A or B for studying on the go.',
    '',
    'Use **Save backup file** on this page to move your progress between devices.',
  ].join('\n');

  let curCourse = null;

  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = raw.split('?');
    const params = {};
    (qs || '').split('&').filter(Boolean).forEach((kv) => {
      const [k, v] = kv.split('=');
      params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return { parts: path.split('/').filter(Boolean), params };
  }

  function setCourse(cid) {
    if (!SH.courses[cid]) cid = SH.courseOrder[0];
    curCourse = cid;
    SH.store.setLastCourse(cid);
    document.body.dataset.course = cid;
    document.body.dataset.theme = SH.courses[cid].theme;
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = SH.courses[cid].themeColor || '#1f5e46';
    return cid;
  }

  function route() {
    const { parts, params } = parse();
    const view = $('#view');
    view.innerHTML = '';
    view.className = '';
    let tab = 'home';
    try {
      if (!parts.length) {
        location.replace('#/c/' + (SH.courses[SH.store.lastCourse] ? SH.store.lastCourse : SH.courseOrder[0]));
        return;
      }
      if (parts[0] === 'me') {
        setCourse(curCourse || SH.store.lastCourse);
        tab = 'me';
        SH.views.me(view);
      } else if (parts[0] === 'commands') {
        setCourse(curCourse || SH.store.lastCourse);
        tab = 'home';
        SH.views.commands(view);
      } else if (parts[0] === 'c') {
        const cid = setCourse(parts[1]);
        const sect = parts[2] || 'home';
        view.classList.add('v-' + sect);
        switch (sect) {
          case 'home': SH.views.home(view, cid); break;
          case 'lectures': tab = 'lectures'; SH.views.lectures(view, cid); break;
          case 'l': tab = 'lectures'; SH.views.lecture(view, cid, parts[3], parts[4], parts[5]); break;
          case 'loop': tab = 'loop'; SH.views.loop(view, cid, params); break;
          case 'games': tab = 'games'; SH.views.games(view, cid); break;
          case 'play': tab = 'games'; SH.views.play(view, cid, parts[3], parts[4], params); break;
          case 'cards': SH.views.cards(view, cid, params); break;
          case 'glossary': SH.views.glossary(view, cid); break;
          case 'formulas': SH.views.formulas(view, cid); break;
          case 'mistakes': SH.views.mistakes(view, cid); break;
          case 'exam': SH.views.exam(view, cid); break;
          case 'commands': SH.views.commands(view, cid); break;
          case 'search': SH.views.search(view, cid); break;
          case 'daily': SH.views.daily(view, cid); break;
          case 'mock': SH.views.mock(view, cid); break;
          default: SH.views.home(view, cid);
        }
      } else {
        location.replace('#/');
        return;
      }
    } catch (err) {
      console.error(err);
      view.appendChild(h('div', { class: 'empty' }, h('p', {}, 'This screen hit an error: ' + err.message), h('button', { class: 'btn', onclick: () => (location.hash = '#/') }, 'Go home')));
    }
    drawTop();
    drawTabs(tab);
    SH.scrollTop();
    view.focus({ preventScroll: true });
  }

  function drawTop() {
    const top = $('#topbar');
    top.innerHTML = '';
    const sw = h('div', { class: 'cswitch', role: 'tablist', 'aria-label': 'Course' });
    SH.courseOrder.forEach((cid) => {
      const C = SH.courses[cid];
      sw.appendChild(h('button', {
        role: 'tab', 'aria-selected': String(cid === curCourse), class: cid === curCourse ? 'on' : '',
        onclick: () => {
          const { parts } = parse();
          // keep the same section when switching course where it makes sense
          const sect = parts[0] === 'c' && ['loop', 'games', 'cards', 'glossary', 'formulas', 'mistakes', 'exam', 'lectures'].includes(parts[2]) ? '/' + parts[2] : '';
          location.hash = '#/c/' + cid + sect;
        },
      }, h('b', {}, C.code), h('small', {}, C.short || '')));
    });
    const goal = SH.store.settings().dailyGoal;
    const xp = SH.store.todayXP();
    const right = h('div', { class: 'tstats' },
      h('span', { class: 'streak', title: 'Day streak' }, '🔥', h('b', {}, String(SH.store.streak()))),
      h('span', { title: 'Today: ' + xp + ' / ' + goal + ' XP' }, SH.ui.ring(xp / goal, xp >= goal ? '✓' : String(xp), 38)),
      SH.store.settings().examMode ? h('span', { class: 'exam-flag', title: 'Exam mode: English only' }, 'EN') : null);
    top.append(sw, right);
  }

  function drawTabs(active) {
    const nav = $('#tabbar');
    nav.innerHTML = '';
    const c = curCourse;
    const tabs = [
      ['home', '⌂', 'Home', '/c/' + c],
      ['lectures', '❏', 'Lectures', '/c/' + c + '/lectures'],
      ['loop', '∞', 'Loop', '/c/' + c + '/loop'],
      ['games', '⚔', 'Games', '/c/' + c + '/games'],
      ['me', '☺', 'Me', '/me'],
    ];
    tabs.forEach(([id, icon, label, path]) => nav.appendChild(h('a', { href: '#' + path, class: 'tab tab-' + id + (id === active ? ' on' : ''), 'aria-current': id === active ? 'page' : null },
      h('span', { class: 'ti', 'aria-hidden': 'true' }, icon), h('span', { class: 'tlab' }, label))));
  }

  /* ---------- badges ---------- */
  function badgeList() {
    const s = SH.store;
    const per = SH.courseOrder.map((cid) => ({ cid, c: s.course(cid), C: SH.courses[cid] }));
    const answered = per.reduce((a, p) => a + Object.values(p.c.q).reduce((x, q) => x + q.n, 0), 0);
    const loopN = per.reduce((a, p) => a + (p.c.loopN || 0), 0);
    const bestCombo = Math.max(0, ...per.map((p) => p.c.best.combo || 0));
    const bosses = per.reduce((a, p) => a + Object.keys(p.c.badges).filter((k) => k.startsWith('boss.')).length, 0);
    const cards = per.reduce((a, p) => a + Object.values(p.c.cards).reduce((x, q) => x + q.n, 0), 0);
    const written = per.reduce((a, p) => a + SH.all(p.cid, 'written').filter((w) => p.c.q[w.uid] && p.c.q[w.uid].c).length, 0);
    const readAll = per.some((p) => p.C.lectures.some((L) => L.cards.length && L.cards.every((cc) => s.isRead(p.cid, cc.uid))));
    const sweep = per.some((p) => { const bl = p.C.lectures.filter((L) => L.mcq.length >= 6); return bl.length && bl.every((L) => p.c.badges['boss.' + L.id]); });
    const lv = Math.max(...per.map((p) => s.level(p.c.xp).n));
    return [
      { id: 'first', i: '🌱', n: 'First steps', d: 'Answer 10 questions', have: answered >= 10 },
      { id: 'q200', i: '📚', n: 'Bookworm', d: 'Answer 200 questions', have: answered >= 200 },
      { id: 'loop100', i: '∞', n: 'In the loop', d: '100 answers in the Knowledge loop', have: loopN >= 100 },
      { id: 'combo10', i: '🔥', n: 'On fire', d: '10 correct in a row', have: bestCombo >= 10 },
      { id: 'combo25', i: '☄️', n: 'Unstoppable', d: '25 correct in a row', have: bestCombo >= 25 },
      { id: 'streak3', i: '📅', n: 'Habit', d: '3-day streak', have: s.streakBest() >= 3 },
      { id: 'streak7', i: '🗓️', n: 'Week warrior', d: '7-day streak', have: s.streakBest() >= 7 },
      { id: 'boss1', i: '⚔️', n: 'Boss slayer', d: 'Defeat any boss', have: bosses >= 1 },
      { id: 'sweep', i: '👑', n: 'Clean sweep', d: 'Defeat every boss of one course', have: !!sweep },
      { id: 'reader', i: '📖', n: 'Cover to cover', d: 'Read every card of one lecture', have: readAll },
      { id: 'writer', i: '✍️', n: 'Exam writer', d: 'Pass the key-point check on 3 written answers', have: written >= 3 },
      { id: 'cards50', i: '🃏', n: 'Card shark', d: 'Review 50 flashcards', have: cards >= 50 },
      { id: 'lv5', i: '🎖️', n: 'Rising star', d: 'Reach level 5 in a course', have: lv >= 5 },
    ];
  }
  let knownBadges = null;
  function checkBadges() {
    const list = badgeList();
    const have = new Set(list.filter((b) => b.have).map((b) => b.id));
    if (knownBadges) {
      list.forEach((b) => {
        if (b.have && !knownBadges.has(b.id)) {
          SH.toast(b.i + ' Badge unlocked: ' + b.n, 'gold');
          SH.beep('great');
        }
      });
    }
    knownBadges = have;
  }

  function refreshTop() {
    drawTop();
    checkBadges();
  }

  SH.app = { route, refreshTop, badgeList, get course() { return curCourse; } };

  /* ---------- boot ---------- */
  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', () => {
    checkBadges();
    route();
  });
  if (document.readyState !== 'loading') {
    checkBadges();
    route();
  }

  // Offline support: service worker only works over http(s), not file://
  // Only over https (e.g. GitHub Pages) or when testing with ?sw=1, so local edits never get stuck in a cache.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || /[?&]sw=1/.test(location.search))) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();

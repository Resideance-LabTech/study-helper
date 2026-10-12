/* Study Helper — progress storage (localStorage, per course, survives content updates via stable ids) */
(function () {
  'use strict';
  const SH = window.SH;
  const KEY = 'studyhelper.v1';
  const BOX_DAYS = [0, 1, 2, 4, 8, 16, 32];

  const defaults = () => ({
    settings: { assist: 'tap', sound: true, haptics: true, ttsRate: 0.95, dailyGoal: 80, examMode: false },
    days: {},
    streak: { last: '', count: 0, best: 0 },
    courses: {},
    lastCourse: 'fite7407',
    created: Date.now(),
  });
  const courseDefaults = () => ({ xp: 0, q: {}, cards: {}, read: {}, done: {}, boss: {}, essays: {}, badges: {}, best: {}, combo: 0 });

  let data;
  try {
    data = JSON.parse(localStorage.getItem(KEY)) || defaults();
  } catch (e) {
    data = defaults();
  }
  data = Object.assign(defaults(), data);
  data.settings = Object.assign(defaults().settings, data.settings);

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (e) {
        /* storage full or blocked: keep working in memory */
      }
    }, 150);
  }
  window.addEventListener('pagehide', () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {}
  });

  function course(cid) {
    if (!data.courses[cid]) data.courses[cid] = courseDefaults();
    const c = data.courses[cid];
    for (const k in courseDefaults()) if (c[k] == null) c[k] = courseDefaults()[k];
    return c;
  }

  /* ----- XP, streak, levels ----- */
  function addXP(cid, n) {
    const c = course(cid);
    c.xp += n;
    const d = SH.today();
    data.days[d] = (data.days[d] || 0) + n;
    touchStreak();
    save();
    return c.xp;
  }
  function touchStreak() {
    const d = SH.today();
    const s = data.streak;
    if (s.last === d) return;
    if (s.last && SH.dayDiff(s.last, d) === 1) s.count += 1;
    else s.count = 1;
    s.last = d;
    s.best = Math.max(s.best, s.count);
  }
  function streak() {
    const s = data.streak;
    if (!s.last) return 0;
    const gap = SH.dayDiff(s.last, SH.today());
    return gap <= 1 ? s.count : 0;
  }
  const todayXP = () => data.days[SH.today()] || 0;

  function level(xp, titles) {
    // gentle curve: level n needs 60*n*(n+1)/2 XP
    let n = 0;
    while (60 * ((n + 1) * (n + 2)) / 2 <= xp) n++;
    const cur = (60 * (n * (n + 1))) / 2;
    const next = (60 * ((n + 1) * (n + 2))) / 2;
    const t = titles ? titles[Math.min(n, titles.length - 1)] : null;
    return { n: n + 1, cur, next, progress: (xp - cur) / (next - cur), title: t };
  }

  /* ----- question stats (used by Loop for adaptive repetition) ----- */
  function qstat(cid, qid) {
    const c = course(cid);
    return c.q[qid] || (c.q[qid] = { n: 0, c: 0, w: 0, box: 0, due: 0, last: 0 });
  }
  function recordAnswer(cid, qid, ok) {
    const s = qstat(cid, qid);
    s.n++;
    s.last = Date.now();
    if (ok) {
      s.c++;
      s.box = Math.min(s.box + 1, BOX_DAYS.length - 1);
    } else {
      s.w++;
      s.box = 0;
    }
    s.due = Date.now() + BOX_DAYS[s.box] * 86400000 * (ok ? 1 : 0) + (ok ? 0 : 60000);
    save();
    return s;
  }
  function mistakes(cid) {
    const c = course(cid);
    return Object.keys(c.q).filter((id) => c.q[id].w > 0 && c.q[id].box < 2);
  }

  /* ----- flashcards (Leitner) ----- */
  function card(cid, id) {
    const c = course(cid);
    return c.cards[id] || { box: 0, due: 0, n: 0 };
  }
  function rateCard(cid, id, grade) {
    // grade: 0 again, 1 hard, 2 good, 3 easy
    const c = course(cid);
    const s = c.cards[id] || { box: 0, due: 0, n: 0 };
    s.n++;
    if (grade === 0) s.box = 0;
    else if (grade === 1) s.box = Math.max(1, s.box);
    else if (grade === 2) s.box = Math.min(s.box + 1, BOX_DAYS.length - 1);
    else s.box = Math.min(s.box + 2, BOX_DAYS.length - 1);
    s.due = grade === 0 ? Date.now() + 60000 : Date.now() + BOX_DAYS[s.box] * 86400000;
    c.cards[id] = s;
    save();
  }

  /* ----- generic flags ----- */
  function markRead(cid, key) {
    course(cid).read[key] = Date.now();
    save();
  }
  const isRead = (cid, key) => !!course(cid).read[key];
  function setBest(cid, key, val) {
    const c = course(cid);
    if (!(key in c.best) || val > c.best[key]) {
      c.best[key] = val;
      save();
      return true;
    }
    return false;
  }
  const getBest = (cid, key) => course(cid).best[key];
  function badge(cid, id) {
    const c = course(cid);
    if (c.badges[id]) return false;
    c.badges[id] = Date.now();
    save();
    return true;
  }
  function essay(cid, qid, text) {
    const c = course(cid);
    if (text === undefined) return c.essays[qid] || '';
    c.essays[qid] = text;
    save();
  }

  const settings = () => data.settings;
  function setSetting(k, v) {
    data.settings[k] = v;
    save();
  }

  function exportJSON() {
    return JSON.stringify(data);
  }
  function importJSON(txt) {
    const d = JSON.parse(txt);
    if (!d || typeof d !== 'object' || !d.courses) throw new Error('This file is not a Study Helper backup.');
    data = Object.assign(defaults(), d);
    data.settings = Object.assign(defaults().settings, d.settings);
    localStorage.setItem(KEY, JSON.stringify(data));
  }
  function reset(cid) {
    if (cid) data.courses[cid] = courseDefaults();
    else data = defaults();
    localStorage.setItem(KEY, JSON.stringify(data));
  }
  function setLastCourse(cid) {
    if (data.lastCourse !== cid) {
      data.lastCourse = cid;
      save();
    }
  }

  SH.store = {
    course, addXP, streak, todayXP, level, qstat, recordAnswer, mistakes, card, rateCard, markRead, isRead,
    setBest, getBest, badge, essay, settings, setSetting, exportJSON, importJSON, reset, save,
    get lastCourse() { return data.lastCourse; }, setLastCourse,
    days: () => data.days, streakBest: () => data.streak.best, BOX_DAYS,
  };
})();

/* Study Helper — games: Boss battle, Term match, Process puzzle, True/false blitz, Calc lab */
(function () {
  'use strict';
  const SH = window.SH;
  const { h, shuffle, pick, fmt } = SH;

  function award(cid, n, label) {
    if (n <= 0) return;
    SH.store.addXP(cid, n);
    SH.app && SH.app.refreshTop();
    if (label) SH.toast('+' + n + ' XP · ' + label);
  }
  SH.award = award;

  function resultCard(cid, o) {
    const isBest = o.bestKey ? SH.store.setBest(cid, o.bestKey, o.score) : false;
    if (o.win) SH.ui.confetti();
    return h('div', { class: 'result' },
      SH.ui.stamp(o.win ? '勝' : '再嚟', o.win ? 'ok big' : 'no big'),
      h('h2', {}, o.title),
      o.sub ? h('p', { class: 'muted' }, o.sub) : null,
      h('div', { class: 'result-stats' },
        h('div', {}, h('b', {}, String(o.score)), h('span', {}, o.scoreLabel || 'Score')),
        h('div', {}, h('b', {}, '+' + (o.xp || 0)), h('span', {}, 'XP')),
        o.bestKey ? h('div', {}, h('b', {}, String(SH.store.getBest(cid, o.bestKey))), h('span', {}, isBest ? 'New best!' : 'Best')) : null),
      o.review && o.review.length ? h('details', { class: 'review' }, h('summary', {}, 'Review the ones you missed (' + o.review.length + ')'),
        h('ul', {}, o.review.map((r) => h('li', { class: 'md', html: SH.md(r) })))) : null,
      h('div', { class: 'row gap' },
        h('button', { class: 'btn primary', onclick: o.again }, 'Play again'),
        h('button', { class: 'btn', onclick: () => history.back() }, 'Back')));
  }

  /* ================= BOSS BATTLE ================= */
  function boss(root, cid, lid) {
    const C = SH.courses[cid];
    const L = lid ? SH.lecture(cid, lid) : null;
    const B = (L && L.boss) || { name: 'The Final Examiner', zh: '終極考官', emoji: '🧑‍⚖️', hp: 12 };
    const next = SH.quiz.picker(cid, { lectures: L ? [L.id] : null, calcShare: 0.2 });
    const st = { hp: B.hp || 10, max: B.hp || 10, hearts: 3, n: 0, right: 0, combo: 0, review: [], xp: 0 };
    const TIME = 30;
    let timer = null;

    root.innerHTML = '';
    const arena = h('div', { class: 'arena' });
    const bossEl = h('div', { class: 'boss' },
      h('div', { class: 'boss-face', 'aria-hidden': 'true' }, B.emoji),
      h('div', { class: 'boss-info' },
        h('div', { class: 'boss-name' }, B.name, h('span', { lang: 'zh-HK' }, ' ' + (B.zh || ''))),
        h('div', { class: 'hpbar' }, h('div', { class: 'hp-fill' })),
        h('div', { class: 'boss-line muted' }, B.taunt || 'Answer correctly to strike. Three mistakes and you are out.')));
    const hud = h('div', { class: 'hud' });
    const timeBar = h('div', { class: 'timebar' }, h('div', { class: 'time-fill' }));
    const stage = h('div', { class: 'stage' });
    arena.append(bossEl, hud, timeBar, stage);
    root.appendChild(arena);

    function drawHud() {
      bossEl.querySelector('.hp-fill').style.width = (st.hp / st.max) * 100 + '%';
      hud.innerHTML = '';
      hud.append(
        h('span', { class: 'hearts', 'aria-label': st.hearts + ' lives left' }, '♥'.repeat(st.hearts) + '♡'.repeat(3 - st.hearts)),
        h('span', {}, 'Combo ×' + st.combo),
        h('span', {}, st.right + '/' + st.n));
    }
    function startTimer(qel) {
      clearInterval(timer);
      const t0 = Date.now();
      const fill = timeBar.querySelector('.time-fill');
      timer = setInterval(() => {
        const left = 1 - (Date.now() - t0) / (TIME * 1000);
        fill.style.width = Math.max(0, left) * 100 + '%';
        if (!document.body.contains(qel)) return clearInterval(timer);
        if (left <= 0) {
          clearInterval(timer);
          // time out counts as wrong: choose an incorrect option
          const wrongIdx = qel._q.options.findIndex((o) => !o.ok);
          qel._choose(wrongIdx);
          SH.toast('Time is up!');
        }
      }, 100);
    }
    function ask() {
      if (st.hp <= 0 || st.hearts <= 0) return finish();
      drawHud();
      const q = next();
      const el = SH.quiz.card(q, (ok, info) => {
        clearInterval(timer);
        st.n++;
        if (ok) {
          st.right++;
          st.combo++;
          const dmg = st.combo >= 3 ? 2 : 1;
          st.hp = Math.max(0, st.hp - dmg);
          st.xp += 8 + (info.usedHint ? 0 : 4);
          bossEl.classList.remove('hit');
          void bossEl.offsetWidth;
          bossEl.classList.add('hit');
          if (dmg === 2) SH.toast('Critical hit! Combo ×' + st.combo);
        } else {
          st.combo = 0;
          st.hearts--;
          st.review.push(SH.qShort(q.q, 160) + ' → **' + q.options.find((o) => o.ok).text + '**');
          root.classList.remove('shake');
          void root.offsetWidth;
          root.classList.add('shake');
        }
        drawHud();
        const nb = h('button', { class: 'btn primary block', onclick: ask }, st.hp <= 0 || st.hearts <= 0 ? 'See result' : 'Next attack');
        el.appendChild(nb);
        nb.focus({ preventScroll: true });
      }, { noAutoZh: true });
      el._q = q;
      stage.innerHTML = '';
      stage.appendChild(el);
      startTimer(el);
    }
    function finish() {
      clearInterval(timer);
      const win = st.hp <= 0;
      const xp = st.xp + (win ? 40 : 0);
      award(cid, xp);
      if (win && L) SH.store.badge(cid, 'boss.' + L.id);
      root.innerHTML = '';
      root.appendChild(resultCard(cid, {
        win, title: win ? 'You defeated ' + B.name + '!' : B.name + ' wins this round',
        sub: win ? (B.defeat || 'The examiner nods. You know this lecture.') : 'Review the missed questions, then try again.',
        score: st.right, scoreLabel: 'Correct', xp, bestKey: 'boss.' + (L ? L.id : 'all'), review: st.review,
        again: () => boss(root, cid, lid),
      }));
    }
    ask();
  }

  /* ================= TERM MATCH ================= */
  function match(root, cid, lids, mode) {
    const terms = shuffle(SH.all(cid, 'terms', lids).filter((t) => t.zh && t.d));
    if (terms.length < 4) {
      root.innerHTML = '';
      root.appendChild(SH.ui.empty('This lecture needs at least 4 glossary terms for Term match.'));
      return;
    }
    mode = mode || 'zh';
    const ROUND = 5;
    let roundNo = 0;
    let score = 0;
    let misses = 0;
    let t0 = Date.now();
    const rounds = Math.min(3, Math.floor(terms.length / ROUND) || 1);

    function play() {
      const set = terms.slice(roundNo * ROUND, roundNo * ROUND + ROUND);
      if (set.length < 3) return done();
      root.innerHTML = '';
      root.appendChild(h('div', { class: 'game-head' },
        h('h3', {}, 'Term match · round ' + (roundNo + 1) + '/' + rounds),
        h('div', { class: 'seg' },
          h('button', { class: mode === 'zh' ? 'on' : '', onclick: () => { mode = 'zh'; play(); } }, 'EN ↔ 粵'),
          h('button', { class: mode === 'def' ? 'on' : '', onclick: () => { mode = 'def'; play(); } }, 'Term ↔ meaning'))));
      root.appendChild(h('p', { class: 'muted' }, 'Tap a term, then tap its match.'));
      const left = h('div', { class: 'mcol' });
      const right = h('div', { class: 'mcol' });
      let sel = null;
      let solved = 0;
      const L = shuffle(set).map((t) => h('button', { class: 'mtile', onclick: (e) => pickL(e.currentTarget, t) }, t.en));
      const R = shuffle(set).map((t) => h('button', { class: 'mtile ' + (mode === 'zh' ? 'zh' : 'def'), lang: mode === 'zh' ? 'zh-HK' : 'en', onclick: (e) => pickR(e.currentTarget, t) }, mode === 'zh' ? t.zh : t.d));
      left.append(...L);
      right.append(...R);
      root.appendChild(h('div', { class: 'mgrid' + (mode === 'def' ? ' wide' : '') }, left, right));
      function pickL(btn, t) {
        L.forEach((b) => b.classList.remove('sel'));
        btn.classList.add('sel');
        sel = { btn, t };
      }
      function pickR(btn, t) {
        if (!sel) {
          SH.toast('Pick a term on the left first');
          return;
        }
        if (sel.t.en === t.en) {
          sel.btn.classList.add('done');
          btn.classList.add('done');
          sel.btn.disabled = btn.disabled = true;
          score += 10;
          solved++;
          SH.beep('good');
          sel = null;
          if (solved === set.length) {
            roundNo++;
            setTimeout(roundNo < rounds ? play : done, 450);
          }
        } else {
          misses++;
          score = Math.max(0, score - 3);
          SH.beep('bad');
          SH.buzz(30);
          btn.classList.add('bad');
          setTimeout(() => btn.classList.remove('bad'), 400);
        }
      }
    }
    function done() {
      const secs = Math.round((Date.now() - t0) / 1000);
      const bonus = Math.max(0, 60 - secs);
      const total = score + bonus;
      const xp = Math.round(total / 3);
      award(cid, xp);
      root.innerHTML = '';
      root.appendChild(resultCard(cid, {
        win: misses <= 2, title: 'Matched in ' + secs + 's', sub: misses + ' wrong taps · speed bonus ' + bonus,
        score: total, xp, bestKey: 'match.' + (lids ? lids.join(',') : 'all'),
        again: () => { roundNo = 0; score = 0; misses = 0; t0 = Date.now(); shuffleTerms(); play(); },
      }));
    }
    function shuffleTerms() {
      const s = shuffle(terms);
      terms.length = 0;
      terms.push(...s);
    }
    play();
  }

  /* ================= PROCESS PUZZLE ================= */
  function order(root, cid, lids, startId) {
    let puzzles = SH.all(cid, 'orders', lids);
    if (!puzzles.length) {
      root.innerHTML = '';
      root.appendChild(SH.ui.empty('No process puzzles for this selection yet.'));
      return;
    }
    let idx = startId ? Math.max(0, puzzles.findIndex((p) => p.uid === startId)) : 0;
    if (!startId) puzzles = shuffle(puzzles);
    function play() {
      const P = puzzles[idx % puzzles.length];
      const steps = P.steps.map((s, i) => ({ i, en: s[0], zh: s[1] }));
      let pool = shuffle(steps);
      while (pool.length > 2 && pool.every((s, k) => s.i === k)) pool = shuffle(steps);
      const placed = [];
      root.innerHTML = '';
      root.appendChild(h('div', { class: 'game-head' }, h('h3', {}, 'Process puzzle'), h('span', { class: 'muted' }, (idx % puzzles.length) + 1 + ' / ' + puzzles.length)));
      root.appendChild(SH.ui.biTitle(P.t, 'h2'));
      if (P.hint) root.appendChild(SH.ui.bi(P.hint.en, P.hint.zh, { say: false }));
      root.appendChild(h('p', { class: 'muted' }, 'Tap the steps in the correct order. Tap a placed step to take it back.'));
      const target = h('ol', { class: 'otarget' });
      const src = h('div', { class: 'osrc' });
      const check = h('button', { class: 'btn primary block', disabled: true, onclick: verify }, 'Check order');
      root.append(target, src, check);
      const showZh = SH.ui.assist() === 'both';
      function draw() {
        target.innerHTML = '';
        src.innerHTML = '';
        placed.forEach((s, k) => target.appendChild(h('li', { class: 'ostep placed', onclick: () => { placed.splice(k, 1); pool.push(s); draw(); } },
          h('span', {}, s.en), showZh ? h('small', { lang: 'zh-HK' }, s.zh) : null)));
        for (let k = placed.length; k < steps.length; k++) target.appendChild(h('li', { class: 'ostep slot' }, ''));
        pool.forEach((s, k) => src.appendChild(h('button', { class: 'ostep', onclick: () => { pool.splice(k, 1); placed.push(s); draw(); } },
          h('span', {}, s.en), showZh ? h('small', { lang: 'zh-HK' }, s.zh) : null)));
        check.disabled = placed.length !== steps.length;
      }
      function verify() {
        let right = 0;
        const lis = Array.from(target.children);
        placed.forEach((s, k) => {
          const ok = s.i === k;
          if (ok) right++;
          lis[k].classList.add(ok ? 'ok' : 'no');
          lis[k].onclick = null;
        });
        const perfect = right === steps.length;
        SH.beep(perfect ? 'great' : 'bad');
        const xp = perfect ? 25 : right * 2;
        award(cid, xp, perfect ? 'Perfect order' : right + '/' + steps.length + ' in place');
        SH.store.recordAnswer(cid, P.uid, perfect);
        check.remove();
        const sol = h('div', { class: 'qexp' },
          SH.ui.stamp(perfect ? '啱' : '錯', perfect ? 'ok' : 'no'),
          h('h4', {}, 'Correct order'),
          h('ol', { class: 'steps' }, steps.map((s) => h('li', {}, SH.ui.bi(s.en, s.zh, { say: false, inline: true })))),
          P.why ? SH.ui.bi(P.why.en, P.why.zh, { say: false }) : null,
          h('div', { class: 'row gap' },
            h('button', { class: 'btn', onclick: play }, 'Try again'),
            h('button', { class: 'btn primary', onclick: () => { idx++; play(); } }, 'Next puzzle')));
        root.appendChild(sol);
      }
      draw();
    }
    play();
  }

  /* ================= TRUE / FALSE BLITZ (60 s) ================= */
  function blitz(root, cid, lids) {
    const tf = SH.all(cid, 'mcq', lids).filter((m) => m.o.length === 2 && /^true$/i.test(m.o[0]))
      .map((m) => ({ s: m.q, ok: m.a === 0, x: m.x }));
    const terms = SH.all(cid, 'terms', lids).filter((t) => t.zh);
    // generated statements: "X means Y" true/false
    function genStmt() {
      const t = pick(terms);
      if (Math.random() < 0.5) return { s: `**${t.en}** means 「${t.zh}」.`, ok: true, x: t.d };
      const o = pick(terms.filter((u) => u.en !== t.en));
      return { s: `**${t.en}** means 「${o.zh}」.`, ok: false, x: `${t.en} = ${t.zh}` };
    }
    if (tf.length + terms.length < 6) {
      root.innerHTML = '';
      root.appendChild(SH.ui.empty('Not enough statements for a blitz here yet.'));
      return;
    }
    let deck = shuffle(tf);
    const DUR = 60;
    let score = 0, n = 0, streak = 0, best = 0;
    const missed = [];
    const t0 = Date.now();
    root.innerHTML = '';
    const clock = h('div', { class: 'blitz-clock' }, String(DUR));
    const stEl = h('div', { class: 'blitz-score' });
    const card = h('div', { class: 'blitz-card md' });
    const yes = h('button', { class: 'btn tf-t', onclick: () => answer(true) }, 'True');
    const no = h('button', { class: 'btn tf-f', onclick: () => answer(false) }, 'False');
    root.append(h('div', { class: 'blitz-top' }, clock, stEl), card, h('div', { class: 'tf-row' }, no, yes),
      h('p', { class: 'muted center' }, 'Keyboard: ← false · → true'));
    let cur;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') answer(true);
      if (e.key === 'ArrowLeft') answer(false);
    };
    document.addEventListener('keydown', onKey);
    function draw() {
      stEl.textContent = score + ' pts · streak ' + streak;
      cur = deck.length && Math.random() < 0.65 ? deck.pop() : genStmt();
      card.innerHTML = SH.md(cur.s);
      card.classList.remove('flash-ok', 'flash-no');
    }
    function answer(v) {
      if (!cur) return;
      n++;
      const ok = v === cur.ok;
      if (ok) {
        streak++;
        best = Math.max(best, streak);
        score += 10 + Math.min(streak, 10);
        SH.beep('good');
      } else {
        streak = 0;
        missed.push(cur.s + ' → **' + (cur.ok ? 'True' : 'False') + '**' + (cur.x ? ' — ' + cur.x : ''));
        SH.beep('bad');
        SH.buzz(30);
      }
      card.classList.add(ok ? 'flash-ok' : 'flash-no');
      setTimeout(draw, 160);
    }
    const tick = setInterval(() => {
      if (!document.body.contains(clock)) {
        clearInterval(tick);
        document.removeEventListener('keydown', onKey);
        return;
      }
      const left = DUR - Math.floor((Date.now() - t0) / 1000);
      clock.textContent = String(Math.max(0, left));
      if (left <= 10) clock.classList.add('low');
      if (left <= 0) {
        clearInterval(tick);
        document.removeEventListener('keydown', onKey);
        const xp = Math.round(score / 6);
        award(cid, xp);
        root.innerHTML = '';
        root.appendChild(resultCard(cid, {
          win: missed.length <= n / 5 && n >= 10, title: n + ' statements in 60 seconds', sub: 'Longest streak: ' + best,
          score, xp, bestKey: 'blitz.' + (lids ? lids.join(',') : 'all'), review: missed, again: () => blitz(root, cid, lids),
        }));
      }
    }, 250);
    draw();
  }

  /* ================= CALC LAB (type the answer) ================= */
  function calc(root, cid, gid) {
    const g = SH.gens[gid];
    if (!g) {
      root.innerHTML = '';
      root.appendChild(SH.ui.empty('Unknown exercise.'));
      return;
    }
    let streak = 0;
    function play() {
      const r = g.make();
      root.innerHTML = '';
      root.appendChild(h('div', { class: 'game-head' }, SH.ui.biTitle(g.t, 'h3'), h('span', { class: 'chip' }, 'Streak ' + streak)));
      const qhtml = SH.md(r.q.en).replace(/<p>%%BOOK%%<\/p>/, r.book || '');
      const qEl = h('div', { class: 'qwrap' }, h('div', { class: 'qtext md', html: qhtml }),
        h('div', { class: 'qtools' }, SH.ui.sayBtn(r.q.en)),
        SH.ui.assist() !== 'off' ? SH.ui.bi('', r.q.zh, { say: false }) : null);
      // bi('' ...) renders the tap-to-show Cantonese only
      root.appendChild(qEl);
      const unitL = r.unit === '$' ? '$' : '';
      const unitR = r.unit === '%' ? '%' : r.unit && r.unit !== '$' ? r.unit : '';
      const input = h('input', { class: 'num-in', type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'Your answer', 'aria-label': 'Your answer' });
      const form = h('form', { class: 'num-form', onsubmit: (e) => { e.preventDefault(); check(); } },
        unitL ? h('span', { class: 'unit' }, unitL) : null, input, unitR ? h('span', { class: 'unit' }, unitR) : null,
        h('button', { class: 'btn primary', type: 'submit' }, 'Check'));
      root.appendChild(form);
      const actions = h('div', { class: 'row gap' },
        h('button', { class: 'btn ghost', onclick: () => reveal(false) }, 'Show steps'),
        h('button', { class: 'btn ghost', onclick: play }, 'New numbers'));
      root.appendChild(actions);
      const out = h('div', { class: 'qfb' });
      root.appendChild(out);
      setTimeout(() => input.focus({ preventScroll: true }), 50);
      let done = false;
      function check() {
        if (done) return;
        const v = parseFloat(String(input.value).replace(/[$,%\s]/g, ''));
        if (!isFinite(v)) {
          SH.toast('Type a number first');
          return;
        }
        const tol = Math.max(r.tol != null ? r.tol : 0.01, Math.abs(r.ans) * 0.0005, r.dp === 0 ? 0.5 : 0);
        const ok = Math.abs(v - r.ans) <= tol + 1e-9;
        reveal(ok);
      }
      function reveal(ok) {
        if (done) return;
        done = true;
        form.querySelector('button').disabled = true;
        input.disabled = true;
        streak = ok ? streak + 1 : 0;
        SH.beep(ok ? 'good' : 'bad');
        SH.store.recordAnswer(cid, 'calc.' + gid, ok);
        if (ok) award(cid, 12 + Math.min(streak, 5) * 2);
        out.appendChild(SH.ui.stamp(ok ? '啱' : '睇步驟', ok ? 'ok' : 'no'));
        out.appendChild(h('p', { class: 'ans' }, 'Answer: ', h('b', {}, SH.fmtVal(r.ans, r))));
        out.appendChild(SH.quiz.stepsEl(r.steps));
        out.appendChild(h('button', { class: 'btn primary block', onclick: play }, 'Next question'));
      }
    }
    play();
  }

  /* ================= SORT IT (two buckets) ================= */
  function sort(root, cid, lids, startId) {
    let sets = SH.all(cid, 'sorts', lids);
    if (!sets.length) {
      root.innerHTML = '';
      root.appendChild(SH.ui.empty('No sorting rounds for this selection yet.'));
      return;
    }
    if (startId) sets = sets.filter((s) => s.uid === startId).concat(sets.filter((s) => s.uid !== startId));
    let si = 0;
    function play() {
      const S = sets[si % sets.length];
      const items = shuffle(S.items.map((it) => ({ en: it[0], zh: it[1], b: it[2], tag: it[3] })));
      let k = 0, right = 0, streak = 0;
      const missed = [];
      root.innerHTML = '';
      root.appendChild(h('div', { class: 'game-head' }, h('h3', {}, 'Sort it'), h('span', { class: 'muted small' }, (si % sets.length) + 1 + ' / ' + sets.length)));
      root.appendChild(SH.ui.biTitle(S.t, 'h2'));
      const bar = h('div', { class: 'setbar' });
      const card = h('div', { class: 'sort-card' });
      const btns = h('div', { class: 'sort-btns' }, S.buckets.map((b, bi) => h('button', { class: 'btn sort-b sort-b' + bi, onclick: () => answer(bi) },
        h('b', {}, b.en), h('small', { lang: 'zh-HK' }, b.zh))));
      const fb = h('div', { class: 'sort-fb', 'aria-live': 'polite' });
      root.append(bar, card, btns, fb);
      function draw() {
        bar.innerHTML = '';
        bar.append(SH.ui.progressBar(k / items.length), h('span', { class: 'small muted' }, right + ' / ' + k));
        if (k >= items.length) return finish();
        const it = items[k];
        card.innerHTML = '';
        card.append(it.tag ? h('span', { class: 'qtag' }, it.tag) : null, h('p', { class: 'sort-en' }, '“' + it.en + '”'),
          SH.ui.assist() === 'both' ? h('p', { class: 'sort-zh', lang: 'zh-HK' }, it.zh) : null);
        card.classList.remove('flash-ok', 'flash-no');
      }
      function answer(bi) {
        if (k >= items.length) return;
        const it = items[k];
        const ok = bi === it.b;
        if (ok) { right++; streak++; SH.beep('good'); } else { streak = 0; SH.beep('bad'); SH.buzz(30); missed.push(it.en + ' → **' + S.buckets[it.b].en + '**'); }
        card.classList.add(ok ? 'flash-ok' : 'flash-no');
        fb.innerHTML = '';
        fb.append(h('span', { class: ok ? 'ok-t' : 'no-t' }, ok ? '✓ ' + (streak >= 3 ? streak + ' in a row!' : 'Correct') : '✗ It belongs to: ' + S.buckets[it.b].en), h('span', { class: 'muted small', lang: 'zh-HK' }, ' ' + it.zh));
        k++;
        setTimeout(draw, ok ? 350 : 900);
      }
      function finish() {
        const xp = right * 3 + (right === items.length ? 15 : 0);
        award(cid, xp);
        items.forEach(() => {});
        SH.store.recordAnswer(cid, S.uid, right >= items.length * 0.8);
        root.innerHTML = '';
        root.appendChild(resultCard(cid, {
          win: right >= items.length * 0.8, title: right + ' / ' + items.length + ' sorted correctly', sub: S.t.en,
          score: right, scoreLabel: 'Correct', xp, bestKey: 'sort.' + S.uid, review: missed,
          again: () => { si++; play(); },
        }));
        const againBtn = root.querySelector('.result .btn.primary');
        if (againBtn) againBtn.textContent = sets.length > 1 ? 'Next round' : 'Play again';
      }
      draw();
    }
    play();
  }

  SH.games = { boss, match, order, blitz, calc, sort, resultCard };
})();

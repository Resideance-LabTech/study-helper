/* Study Helper — screens */
(function () {
  'use strict';
  const SH = window.SH;
  const { h, md, shuffle, fmt } = SH;
  const ui = () => SH.ui;
  const go = (path) => (location.hash = '#' + path);
  const V = (SH.views = {});

  /* ---------- helpers ---------- */
  function lectureProgress(cid, L) {
    const read = L.cards.filter((c) => SH.store.isRead(cid, c.uid)).length;
    const qs = L.mcq;
    const st = SH.store.course(cid).q;
    const mastered = qs.filter((q) => st[q.uid] && st[q.uid].box >= 2).length;
    return {
      read, cards: L.cards.length, mastered, qs: qs.length,
      p: (L.cards.length ? read / L.cards.length : 0) * 0.4 + (qs.length ? mastered / qs.length : 0) * 0.6,
    };
  }
  V.lectureProgress = lectureProgress;

  const NEW_PER_DAY = 20;
  /* Due reviews first, then a limited number of new cards (in lecture order) so day one is not overwhelming */
  function dueCards(cid, lids) {
    const now = Date.now();
    const all = SH.all(cid, 'terms', lids);
    const reviews = all.filter((t) => { const c = SH.store.card(cid, t.uid); return c.n > 0 && c.due <= now; });
    const c = SH.store.course(cid);
    const key = 'newcards.' + SH.today();
    const usedNew = c.best[key] || 0;
    const fresh = all.filter((t) => SH.store.card(cid, t.uid).n === 0).slice(0, Math.max(0, NEW_PER_DAY - usedNew));
    const out = reviews.concat(fresh);
    out.reviews = reviews.length;
    out.fresh = fresh.length;
    return out;
  }
  V.dueCards = dueCards;

  function lectureChips(cid, selected, onChange, opts = {}) {
    const C = SH.courses[cid];
    const wrap = h('div', { class: 'chips scroll-x', role: 'group', 'aria-label': 'Choose lectures' });
    const all = h('button', { class: 'chip' + (!selected.length ? ' on' : ''), onclick: () => onChange([]) }, opts.allLabel || 'All lectures');
    wrap.appendChild(all);
    C.lectures.forEach((L) => {
      if (opts.need && !opts.need(L)) return;
      const on = selected.includes(L.id);
      wrap.appendChild(h('button', {
        class: 'chip' + (on ? ' on' : ''), title: L.title.en,
        onclick: () => onChange(opts.single ? [L.id] : on ? selected.filter((x) => x !== L.id) : selected.concat(L.id)),
      }, L.code));
    });
    return wrap;
  }

  function backHead(title, sub, right) {
    return h('div', { class: 'vhead' },
      h('button', { class: 'back', 'aria-label': 'Back', onclick: () => (history.length > 1 ? history.back() : go('/')) }, '‹'),
      h('div', { class: 'vhead-t' }, ui().biTitle(title, 'h1'), sub ? h('div', { class: 'muted small' }, sub) : null),
      right || null);
  }

  /* =============== HOME =============== */
  V.home = function (root, cid) {
    const C = SH.courses[cid];
    const st = SH.store.course(cid);
    const lv = SH.store.level(st.xp, C.levels);
    root.appendChild(h('section', { class: 'cover cover-' + C.theme },
      h('div', { class: 'cover-in' },
        h('div', { class: 'cover-code' }, C.code),
        h('h1', { class: 'cover-name' }, C.name.en),
        h('div', { class: 'cover-zh', lang: 'zh-HK' }, C.name.zh),
        h('div', { class: 'cover-level' },
          h('div', { class: 'lv-row' }, h('span', { class: 'lv-n' }, 'Lv ' + lv.n), h('span', { class: 'lv-t' }, lv.title ? lv.title.en : ''), h('span', { class: 'lv-zh', lang: 'zh-HK' }, lv.title ? lv.title.zh : '')),
          ui().progressBar(lv.progress, 'on-cover'),
          h('div', { class: 'small' }, fmt(st.xp, 0) + ' XP · next level at ' + fmt(lv.next, 0)))),
      C.theme === 'cert' ? h('div', { class: 'cover-seal', 'aria-hidden': 'true' }, '證') : h('div', { class: 'cover-lcd', 'aria-hidden': 'true' }, fmt(st.xp, 0))));

    // continue where you left off
    const nextL = C.lectures.find((L) => lectureProgress(cid, L).read < L.cards.length) || C.lectures[0];
    const dueList = dueCards(cid);
    const due = dueList.reviews + ' review · ' + dueList.fresh + ' new';
    const mis = SH.store.mistakes(cid).length;
    root.appendChild(h('section', { class: 'quick' },
      h('button', { class: 'qa qa-loop', onclick: () => go('/c/' + cid + '/loop') },
        h('span', { class: 'qa-i', 'aria-hidden': 'true' }, '∞'), h('span', { class: 'qa-t' }, 'Knowledge loop'), h('span', { class: 'qa-s' }, 'Endless MC · 無限練習')),
      h('button', { class: 'qa', onclick: () => go('/c/' + cid + '/l/' + nextL.id + '/learn') },
        h('span', { class: 'qa-i', 'aria-hidden': 'true' }, '▶'), h('span', { class: 'qa-t' }, 'Continue ' + nextL.code), h('span', { class: 'qa-s' }, nextL.title.en)),
      h('button', { class: 'qa', onclick: () => go('/c/' + cid + '/cards') },
        h('span', { class: 'qa-i', 'aria-hidden': 'true' }, '⧉'), h('span', { class: 'qa-t' }, 'Flashcards'), h('span', { class: 'qa-s' }, due)),
      h('button', { class: 'qa', onclick: () => go('/c/' + cid + '/mistakes') },
        h('span', { class: 'qa-i', 'aria-hidden': 'true' }, '✎'), h('span', { class: 'qa-t' }, 'Mistake book'), h('span', { class: 'qa-s' }, mis ? mis + ' to fix' : 'Nothing to fix')),
      h('button', { class: 'qa', onclick: () => go('/c/' + cid + '/exam') },
        h('span', { class: 'qa-i', 'aria-hidden': 'true' }, 'Aa'), h('span', { class: 'qa-t' }, 'Exam English'), h('span', { class: 'qa-s' }, 'Read & answer like a pro')),
      h('button', { class: 'qa', onclick: () => go('/c/' + cid + '/games') },
        h('span', { class: 'qa-i', 'aria-hidden': 'true' }, '⚔'), h('span', { class: 'qa-t' }, 'Games'), h('span', { class: 'qa-s' }, 'Boss battles & more')),
      h('button', { class: 'qa', onclick: () => go('/c/' + cid + '/glossary') },
        h('span', { class: 'qa-i', 'aria-hidden': 'true' }, '詞'), h('span', { class: 'qa-t' }, 'Glossary'), h('span', { class: 'qa-s' }, SH.all(cid, 'terms').length + ' terms · 詞彙表'))));

    // daily challenge
    const dkey = 'daily.' + SH.today();
    const doneDaily = SH.store.getBest(cid, dkey) != null;
    root.appendChild(h('section', { class: 'daily' + (doneDaily ? ' done' : '') },
      h('div', {}, h('h3', {}, doneDaily ? 'Daily challenge done' : 'Daily challenge'), h('p', { class: 'muted small' }, doneDaily ? 'Score ' + SH.store.getBest(cid, dkey) + '/10. Come back tomorrow for a new set.' : '10 mixed questions from every lecture. Double XP.')),
      h('button', { class: 'btn ' + (doneDaily ? '' : 'primary'), onclick: () => go('/c/' + cid + '/daily') }, doneDaily ? 'Replay' : 'Start')));

    // mock exam
    const mockBest = SH.store.getBest(cid, 'mock');
    root.appendChild(h('section', { class: 'daily mock' },
      h('div', {}, h('h3', {}, 'Mock exam 模擬考試'), h('p', { class: 'muted small' }, '20 questions · 25 minutes · English only · answers shown at the end' + (mockBest != null ? ' · best ' + mockBest + '/20' : ''))),
      h('button', { class: 'btn', onclick: () => go('/c/' + cid + '/mock') }, 'Sit it')));

    // weak spots
    const weak = weakSpots(cid);
    root.appendChild(ui().sectionHead({ en: 'Your weak spots', zh: '弱項' }));
    if (!weak.length) root.appendChild(h('p', { class: 'muted small' }, 'Answer at least 5 questions in a lecture (Loop, quizzes or games) and your weakest topics will appear here.'));
    else root.appendChild(h('div', { class: 'weak' }, weak.slice(0, 3).map((w) => h('button', { class: 'weak-row', onclick: () => go('/c/' + cid + '/loop?l=' + w.L.id) },
      h('span', { class: 'qtag' }, w.L.code), h('span', { class: 'weak-t' }, w.L.title.en), h('span', { class: 'weak-p' }, Math.round(w.acc * 100) + '%'),
      ui().progressBar(w.acc, w.acc < 0.6 ? 'bad' : '')))));

    // lectures overview
    root.appendChild(ui().sectionHead({ en: 'Lectures', zh: '課堂' }, h('button', { class: 'link', onclick: () => go('/c/' + cid + '/lectures') }, 'See all')));
    const list = h('div', { class: 'llist' });
    C.lectures.forEach((L) => list.appendChild(lectureRow(cid, L)));
    root.appendChild(list);

    if (C.exam) root.appendChild(h('section', { class: 'note' }, ui().biTitle({ en: 'How you are assessed', zh: '評核方法' }, 'h3'), ui().bi(C.exam.en, C.exam.zh, { say: false })));
    root.appendChild(h('div', { class: 'row gap wrap foot-links' },
      h('button', { class: 'link', onclick: () => go('/c/' + cid + '/glossary') }, 'Glossary 詞彙表'),
      h('button', { class: 'link', onclick: () => go('/c/' + cid + '/formulas') }, 'Formula sheet 公式'),
      h('button', { class: 'link', onclick: () => go('/c/' + cid + '/search') }, 'Search 搜尋')));
  };

  function weakSpots(cid) {
    const st = SH.store.course(cid).q;
    const agg = {};
    for (const uid in st) {
      const m = uid.match(/^[^:]+:([^.]+)\./);
      if (!m) continue;
      const a = (agg[m[1]] = agg[m[1]] || { n: 0, c: 0 });
      a.n += st[uid].n;
      a.c += st[uid].c;
    }
    return Object.entries(agg)
      .map(([lid, a]) => ({ L: SH.lecture(cid, lid), n: a.n, acc: a.n ? a.c / a.n : 0 }))
      .filter((x) => x.L && x.n >= 5)
      .sort((a, b) => a.acc - b.acc);
  }
  V.weakSpots = weakSpots;

  function lectureRow(cid, L) {
    const p = lectureProgress(cid, L);
    return h('button', { class: 'lrow', onclick: () => go('/c/' + cid + '/l/' + L.id + '/learn') },
      ui().ring(p.p, L.code, 46),
      h('span', { class: 'lrow-t' }, h('span', { class: 'lrow-en' }, L.title.en), h('span', { class: 'lrow-zh', lang: 'zh-HK' }, L.title.zh),
        h('span', { class: 'lrow-s muted small' }, `${p.read}/${p.cards} cards read · ${p.mastered}/${p.qs} questions mastered`)),
      h('span', { class: 'chev', 'aria-hidden': 'true' }, '›'));
  }

  V.lectures = function (root, cid) {
    const C = SH.courses[cid];
    root.appendChild(backHead({ en: 'Lectures', zh: '課堂' }, C.code + ' ' + C.name.en));
    const list = h('div', { class: 'llist' });
    C.lectures.forEach((L) => list.appendChild(lectureRow(cid, L)));
    root.appendChild(list);
    root.appendChild(h('p', { class: 'muted small center' }, 'Content is built from your lecture notes. Each card shows the slide it came from.'));
  };

  /* =============== LECTURE =============== */
  const LTABS = [
    ['learn', 'Learn', '學'], ['story', 'Story', '故事'], ['examples', 'Examples', '例子'], ['practice', 'Calculate', '計數'], ['exam', 'Exam', '考試'], ['quiz', 'Quiz', '測驗'],
  ];
  V.lecture = function (root, cid, lid, tab, sub) {
    const L = SH.lecture(cid, lid);
    if (!L) return root.appendChild(ui().empty('Lecture not found.'));
    tab = tab || 'learn';
    root.appendChild(backHead(L.title, L.code + ' · ' + SH.courses[cid].code));
    const tabs = h('div', { class: 'ltabs scroll-x', role: 'tablist' });
    const have = {
      learn: L.cards.length, story: L.stories.length, examples: L.examples.length, practice: L.gens.length, exam: L.written.length, quiz: L.mcq.length,
    };
    LTABS.forEach(([k, en, zh]) => {
      if (!have[k]) return;
      tabs.appendChild(h('button', { role: 'tab', 'aria-selected': String(k === tab), class: k === tab ? 'on' : '', onclick: () => go(`/c/${cid}/l/${lid}/${k}`) },
        h('span', {}, en), h('small', { lang: 'zh-HK' }, zh)));
    });
    root.appendChild(tabs);
    const body = h('div', { class: 'lbody' });
    root.appendChild(body);
    ({ learn: learnTab, story: storyTab, examples: examplesTab, practice: practiceTab, exam: examTab, quiz: quizTab }[tab] || learnTab)(body, cid, L, sub);
  };

  /* ----- Learn: one concept card at a time ----- */
  function learnTab(root, cid, L, sub) {
    if (!L.cards.length) return root.appendChild(ui().empty('No concept cards yet.'));
    let i = Math.max(0, L.cards.findIndex((c) => c.id === sub));
    if (!sub) {
      const firstUnread = L.cards.findIndex((c) => !SH.store.isRead(cid, c.uid));
      i = firstUnread >= 0 ? firstUnread : 0;
    }
    if (L.intro && i === 0) root.appendChild(h('div', { class: 'intro' }, ui().bi(L.intro.en, L.intro.zh, { say: false }),
      L.src && L.src.length ? h('div', { class: 'srcs small muted' }, 'Built from: ' + L.src.join(' · ')) : null));
    const holder = h('div', {});
    root.appendChild(holder);
    function draw() {
      const c = L.cards[i];
      holder.innerHTML = '';
      const dots = h('div', { class: 'dots', 'aria-label': 'Card ' + (i + 1) + ' of ' + L.cards.length },
        L.cards.map((cc, k) => h('button', { class: 'dot' + (k === i ? ' on' : '') + (SH.store.isRead(cid, cc.uid) ? ' read' : ''), 'aria-label': 'Card ' + (k + 1), onclick: () => { i = k; draw(); } })));
      const card = h('article', { class: 'ccard' },
        h('div', { class: 'ccard-top' }, h('span', { class: 'muted small' }, (i + 1) + ' / ' + L.cards.length), c.s ? h('span', { class: 'src' }, c.s) : null),
        ui().biTitle(c.t, 'h2'),
        ui().bi(c.en, c.zh),
        c.f ? (Array.isArray(c.f) ? c.f : [c.f]).map((f) => ui().formula(f)) : null,
        c.lab && SH.labs && SH.labs[c.lab] ? SH.labs[c.lab]() : null,
        c.ex ? h('div', { class: 'ccard-ex' }, h('h4', {}, 'Example 例子'), ui().bi(c.ex.en, c.ex.zh, { say: false })) : null,
        c.tip ? h('div', { class: 'ccard-tip' }, h('h4', {}, 'Exam tip 考試貼士'), ui().bi(c.tip.en, c.tip.zh, { say: false })) : null,
        c.mem ? h('div', { class: 'ccard-mem' }, h('h4', {}, 'Memory hook 記憶法'), ui().bi(c.mem.en, c.mem.zh, { say: false })) : null);
      ui().linkTerms(card, L.terms, cid);
      const wasRead = SH.store.isRead(cid, c.uid);
      SH.store.markRead(cid, c.uid);
      if (!wasRead) SH.award(cid, 3);
      const nav = h('div', { class: 'cnav' },
        h('button', { class: 'btn', disabled: i === 0, onclick: () => { i--; draw(); SH.scrollTop(); } }, '‹ Back'),
        i < L.cards.length - 1
          ? h('button', { class: 'btn primary', onclick: () => { i++; draw(); SH.scrollTop(); } }, 'Next ›')
          : h('button', { class: 'btn primary', onclick: () => go(`/c/${cid}/l/${L.id}/quiz`) }, 'Test yourself ›'));
      holder.append(dots, card, nav);
      // swipe
      let x0 = null;
      card.addEventListener('touchstart', (e) => (x0 = e.target.closest('.lab, input, select, .formula, .step-html') ? null : e.touches[0].clientX), { passive: true });
      card.addEventListener('touchend', (e) => {
        if (x0 == null) return;
        const dx = e.changedTouches[0].clientX - x0;
        x0 = null;
        if (Math.abs(dx) > 70) {
          if (dx < 0 && i < L.cards.length - 1) { i++; draw(); }
          else if (dx > 0 && i > 0) { i--; draw(); }
        }
      });
    }
    draw();
    if (L.terms.length) {
      root.appendChild(h('details', { class: 'panel' }, h('summary', {}, 'Key terms in this lecture (' + L.terms.length + ')'),
        h('div', { class: 'tlist' }, L.terms.map((t) => h('button', { class: 'tl', onclick: () => ui().termPop(t, cid) }, h('b', {}, t.en), h('span', { lang: 'zh-HK' }, t.zh))))));
    }
  }

  /* ----- Story: dialogue between the course characters ----- */
  function storyTab(root, cid, L) {
    const C = SH.courses[cid];
    let enOnly = false;
    const holder = h('div', {});
    const toggle = h('div', { class: 'seg' },
      h('button', { class: 'on', onclick: (e) => { enOnly = false; setSeg(e); draw(); } }, 'English + 粵語'),
      h('button', { onclick: (e) => { enOnly = true; setSeg(e); draw(); } }, 'English only'));
    function setSeg(e) { Array.from(toggle.children).forEach((b) => b.classList.toggle('on', b === e.currentTarget)); }
    root.append(h('div', { class: 'row between' }, h('p', { class: 'muted small' }, 'Read the story first in both languages, then again in English only.'), toggle), holder);
    function draw() {
      holder.innerHTML = '';
      L.stories.forEach((S) => {
        const box = h('article', { class: 'story' }, ui().biTitle(S.t, 'h2'));
        if (S.scene) box.appendChild(h('p', { class: 'scene' }, h('span', {}, S.scene.en), !enOnly ? h('span', { lang: 'zh-HK', class: 'muted' }, ' ' + S.scene.zh) : null));
        S.lines.forEach(([who, en, zh]) => {
          const p = (C.cast && C.cast[who]) || { name: who, avatar: '🙂' };
          const side = p.side || 'l';
          box.appendChild(h('div', { class: 'bubble-row ' + side },
            h('div', { class: 'avatar', 'aria-hidden': 'true' }, p.avatar),
            h('div', { class: 'bubble' },
              h('div', { class: 'who' }, p.name),
              h('div', { class: 'b-en', html: SH.inline(en) }),
              !enOnly && zh ? h('div', { class: 'b-zh', lang: 'zh-HK', html: SH.inline(zh) }) : null,
              h('div', { class: 'b-tools' }, ui().sayBtn(en)))));
        });
        if (S.moral) box.appendChild(h('div', { class: 'moral' }, h('h4', {}, 'The point 重點'), ui().bi(S.moral.en, enOnly ? '' : S.moral.zh, { say: false })));
        ui().linkTerms(box, L.terms, cid);
        holder.appendChild(box);
        SH.store.markRead(cid, S.uid);
      });
    }
    draw();
  }

  /* ----- Worked examples: reveal step by step ----- */
  function examplesTab(root, cid, L) {
    L.examples.forEach((E) => {
      const box = h('article', { class: 'example' }, ui().biTitle(E.t, 'h2'), ui().bi(E.q.en, E.q.zh));
      if (E.html) box.appendChild(h('div', { class: 'step-html', html: E.html }));
      const ol = h('ol', { class: 'steps reveal' });
      let shown = 0;
      const btn = h('button', { class: 'btn primary', onclick: () => {
        const s = E.steps[shown++];
        ol.appendChild(h('li', {}, ui().bi(s.en, s.zh, { say: false, inline: !!s.f }), s.f ? ui().formula(s.f) : null, s.html ? h('div', { class: 'step-html', html: s.html }) : null));
        if (shown >= E.steps.length) {
          btn.remove();
          allBtn.remove();
          if (E.ans) box.appendChild(h('div', { class: 'ansbox' }, h('b', {}, 'Answer: '), h('span', { html: SH.inline(E.ans) })));
          if (E.say) box.appendChild(h('div', { class: 'ccard-tip' }, h('h4', {}, 'How to write it in the exam'), ui().bi(E.say.en, E.say.zh)));
          SH.store.markRead(cid, E.uid);
        } else btn.textContent = 'Next step (' + (shown + 1) + '/' + E.steps.length + ')';
      } }, 'Show step 1/' + E.steps.length);
      const allBtn = h('button', { class: 'btn ghost', onclick: () => { while (shown < E.steps.length) btn.click(); } }, 'Show all');
      box.append(ol, h('div', { class: 'row gap' }, btn, allBtn));
      ui().linkTerms(box, L.terms, cid);
      root.appendChild(box);
    });
  }

  /* ----- Calculation practice for this lecture ----- */
  function practiceTab(root, cid, L) {
    root.appendChild(h('p', { class: 'muted' }, 'New numbers every time. Type your answer, then check the worked steps. 每次都係新數字。'));
    const grid = h('div', { class: 'glist' });
    L.gens.forEach((gid) => {
      const g = SH.gens[gid];
      if (!g) return;
      const s = SH.store.course(cid).q['calc.' + gid];
      grid.appendChild(h('button', { class: 'gitem', onclick: () => go(`/c/${cid}/play/calc/${gid}`) },
        h('span', { class: 'gi-i', 'aria-hidden': 'true' }, '÷'),
        h('span', {}, h('b', {}, g.t.en), h('small', { lang: 'zh-HK' }, g.t.zh), s ? h('small', { class: 'muted' }, `${s.c}/${s.n} correct`) : null)));
    });
    root.appendChild(grid);
  }

  /* ----- Exam: written questions ----- */
  function examTab(root, cid, L, sub) {
    if (sub) {
      const W = L.written.find((w) => w.id === sub);
      if (W) return SH.exam.written(root, cid, W);
    }
    root.appendChild(h('p', { class: 'muted' }, 'Exam-style questions in English. Decode the question, plan, write, then compare with the model answer.'));
    L.written.forEach((W) => {
      const s = SH.store.course(cid).q[W.uid];
      root.appendChild(h('button', { class: 'wrow', onclick: () => go(`/c/${cid}/l/${L.id}/exam/${W.id}`) },
        h('span', { class: 'wcmd' }, W.cmd || '?'),
        h('span', { class: 'wq md', html: SH.inline(W.q.split('\n')[0]) }),
        h('span', { class: 'wm muted small' }, (W.marks || '') + 'm' + (s && s.c ? ' ✓' : ''))));
    });
    if (L.orders.length) {
      root.appendChild(ui().sectionHead({ en: 'Process puzzles', zh: '流程排序' }));
      L.orders.forEach((P) => root.appendChild(h('button', { class: 'wrow', onclick: () => go(`/c/${cid}/play/order/${encodeURIComponent(P.uid)}`) },
        h('span', { class: 'wcmd' }, 'Order'), h('span', { class: 'wq' }, P.t.en), h('span', { class: 'wm muted small' }, P.steps.length + ' steps'))));
    }
  }

  /* ----- Quiz: 10 questions from this lecture ----- */
  function quizTab(root, cid, L) {
    runSet(root, cid, { lectures: [L.id], count: 10, title: L.code + ' quiz', bestKey: 'quiz.' + L.id, xpEach: 6, calc: true });
  }

  /* generic fixed-length quiz set */
  function runSet(root, cid, o) {
    const next = SH.quiz.picker(cid, { lectures: o.lectures, calcShare: o.calcShare || 0.15, calc: o.calc !== false });
    let i = 0, right = 0;
    const review = [];
    let xp = 0;
    const holder = h('div', {});
    root.appendChild(holder);
    function ask() {
      holder.innerHTML = '';
      if (i >= o.count) return finish();
      holder.appendChild(h('div', { class: 'setbar' }, ui().progressBar(i / o.count), h('span', { class: 'small muted' }, (i + 1) + ' / ' + o.count)));
      const q = next();
      const el = SH.quiz.card(q, (ok, info) => {
        i++;
        if (ok) { right++; xp += o.xpEach + (info.usedHint ? 0 : 2); }
        else review.push(SH.qShort(q.q, 160) + ' → **' + q.options.find((x) => x.ok).text + '**');
        const nb = h('button', { class: 'btn primary block', onclick: ask }, i >= o.count ? 'See result' : 'Next');
        el.appendChild(nb);
      });
      holder.appendChild(el);
    }
    function finish() {
      const total = Math.round(xp * (o.mult || 1));
      SH.award(cid, total);
      if (o.onFinish) o.onFinish(right);
      holder.appendChild(SH.games.resultCard(cid, {
        win: right >= o.count * 0.7, title: o.title + ': ' + right + '/' + o.count,
        sub: right >= o.count * 0.7 ? 'Nice work. 做得好！' : 'Read the cards again, then retry. 再溫一次就得！',
        score: right, scoreLabel: 'Correct', xp: total, bestKey: o.bestKey, review,
        again: () => { root.innerHTML = ''; runSet(root, cid, o); },
      }));
    }
    ask();
  }
  V.runSet = runSet;

  V.daily = function (root, cid) {
    root.appendChild(backHead({ en: 'Daily challenge', zh: '每日挑戰' }, 'Double XP · ' + SH.today()));
    const body = h('div', {});
    root.appendChild(body);
    runSet(body, cid, { count: 10, title: 'Daily challenge', bestKey: 'daily.' + SH.today(), xpEach: 6, mult: 2, calcShare: 0.25 });
  };

  /* =============== MOCK EXAM =============== */
  V.mock = function (root, cid) {
    const C = SH.courses[cid];
    const COUNT = 20, MINUTES = 25;
    root.appendChild(backHead({ en: 'Mock exam', zh: '模擬考試' }, C.code + ' · exam conditions'));
    const body = h('div', {});
    root.appendChild(body);
    body.appendChild(h('div', { class: 'note' }, ui().bi(
      '**' + COUNT + ' questions in ' + MINUTES + ' minutes**, mixed from every lecture (including calculations). Cantonese help is switched off and you will only see the answers **at the end**, just like the real exam. Read every question carefully: watch for **NOT**, **EXCEPT** and **always**.',
      '**' + MINUTES + ' 分鐘 ' + COUNT + ' 題**，包括所有課堂同計數題。考試期間冇廣東話提示，**最後**先睇答案，同真考試一樣。小心 NOT、EXCEPT、always 呢啲字。', { say: false, force: 'both' })));
    body.appendChild(h('button', { class: 'btn primary block', onclick: start }, 'Start the mock exam'));
    let timer = null;
    function start() {
      const next = SH.quiz.picker(cid, { calcShare: 0.25 });
      const qs = [];
      const seen = new Set();
      let guard = 0;
      while (qs.length < COUNT && guard++ < 400) {
        const q = next();
        if (seen.has(q.uid) && q.kind !== 'calc') continue;
        seen.add(q.uid);
        qs.push(q);
      }
      const answers = new Array(qs.length).fill(null);
      const t0 = Date.now();
      let i = 0;
      body.innerHTML = '';
      const bar = h('div', { class: 'setbar' });
      const clock = h('b', { class: 'mock-clock' });
      const stage = h('div', {});
      const navRow = h('div', { class: 'row between' });
      body.append(h('div', { class: 'row between' }, h('span', { class: 'muted small' }, 'Time left'), clock), bar, stage, navRow);
      function tick() {
        const left = MINUTES * 60 - Math.floor((Date.now() - t0) / 1000);
        if (!document.body.contains(clock)) return clearInterval(timer);
        clock.textContent = Math.floor(Math.max(0, left) / 60) + ':' + String(Math.max(0, left) % 60).padStart(2, '0');
        clock.classList.toggle('low', left < 120);
        if (left <= 0) { clearInterval(timer); finish(true); }
      }
      timer = setInterval(tick, 500);
      tick();
      function show() {
        bar.innerHTML = '';
        bar.append(ui().progressBar(answers.filter((a) => a !== null).length / qs.length), h('span', { class: 'small muted' }, (i + 1) + ' / ' + qs.length));
        stage.innerHTML = '';
        const q = qs[i];
        const el = SH.quiz.card(q, (ok, info) => {
          answers[i] = { ok, picked: info.picked };
          setTimeout(() => { if (i < qs.length - 1) { i++; show(); } else drawNav(); }, 250);
        }, { silent: true, noZh: true, noAutoZh: true });
        if (answers[i]) el.querySelectorAll('.opt').forEach((b, k) => { b.disabled = true; if (k === answers[i].picked) b.classList.add('picked'); });
        stage.appendChild(el);
        drawNav();
        SH.scrollTop();
      }
      function drawNav() {
        navRow.innerHTML = '';
        navRow.append(
          h('button', { class: 'btn', disabled: i === 0, onclick: () => { i--; show(); } }, '‹ Previous'),
          i < qs.length - 1 ? h('button', { class: 'btn', onclick: () => { i++; show(); } }, 'Skip ›') : null,
          h('button', { class: 'btn primary', onclick: () => {
            const left = answers.filter((a) => a === null).length;
            if (!left || confirm(left + ' question(s) unanswered. Hand in anyway?')) finish(false);
          } }, 'Hand in'));
      }
      function finish(timeUp) {
        clearInterval(timer);
        const right = answers.filter((a) => a && a.ok).length;
        const mins = Math.max(1, Math.round((Date.now() - t0) / 60000));
        const xp = right * 8 + (right >= 16 ? 40 : 0);
        SH.award(cid, xp);
        const isBest = SH.store.setBest(cid, 'mock', right);
        body.innerHTML = '';
        if (right >= 14) ui().confetti();
        const per = {};
        qs.forEach((q, k) => {
          const L = SH.lecture(cid, q.lecture);
          const key = L ? L.code : '?';
          per[key] = per[key] || { n: 0, c: 0 };
          per[key].n++;
          if (answers[k] && answers[k].ok) per[key].c++;
        });
        body.appendChild(h('div', { class: 'result' },
          ui().stamp(right >= 14 ? '合格' : '再溫', right >= 14 ? 'ok big' : 'no big'),
          h('h2', {}, right + ' / ' + qs.length + (timeUp ? ' (time up)' : '')),
          h('p', { class: 'muted' }, mins + ' min · ' + Math.round((right / qs.length) * 100) + '% · +' + xp + ' XP' + (isBest ? ' · new best!' : '')),
          h('table', { class: 'tbl mock-tbl' }, h('tr', {}, h('th', {}, 'Lecture'), h('th', {}, 'Correct')),
            Object.entries(per).sort().map(([k, v]) => h('tr', { class: v.c / v.n < 0.6 ? 'weakrow' : '' }, h('td', {}, k), h('td', {}, v.c + ' / ' + v.n))))));
        body.appendChild(ui().sectionHead({ en: 'Answers and explanations', zh: '答案同解釋' }));
        qs.forEach((q, k) => {
          const a = answers[k];
          const right1 = q.options.find((o) => o.ok);
          body.appendChild(h('details', { class: 'panel ' + (a && a.ok ? 'ans-ok' : 'ans-no'), open: !(a && a.ok) },
            h('summary', {}, (a && a.ok ? '✓ ' : a ? '✗ ' : '— ') + (k + 1) + '. ', h('span', { html: SH.inline(SH.qShort(q.q, 120)) })),
            h('div', { class: 'md', html: SH.md(q.q).replace(/<p>%%BOOK%%<\/p>/, q.html || '') }),
            a ? h('p', {}, 'Your answer: ', h('b', { html: SH.inline(q.options[a.picked].text) })) : h('p', { class: 'muted' }, 'Not answered'),
            h('p', {}, 'Correct answer: ', h('b', { html: SH.inline(right1.text) })),
            ui().bi(q.x || '', q.xz || '', { say: false }),
            q.steps ? SH.quiz.stepsEl(q.steps) : null));
        });
        body.appendChild(h('div', { class: 'row gap' },
          h('button', { class: 'btn primary', onclick: () => { root.innerHTML = ''; V.mock(root, cid); } }, 'Another mock exam'),
          h('button', { class: 'btn', onclick: () => go('/c/' + cid + '/mistakes') }, 'Mistake book')));
        SH.scrollTop();
      }
      show();
    }
  };

  /* =============== LOOP (endless MC) =============== */
  V.loop = function (root, cid, params) {
    const C = SH.courses[cid];
    let lids = params.l ? params.l.split(',') : [];
    let onlyMis = params.m === '1';
    const stats = { n: 0, right: 0, combo: 0, best: 0, xp: 0 };
    const head = h('div', { class: 'loop-head' });
    const filters = h('div', {});
    const stage = h('div', { class: 'stage' });
    root.append(head, filters, stage);
    let next;
    function rebuild() {
      next = SH.quiz.picker(cid, { lectures: lids, only: onlyMis ? 'mistakes' : null, calcShare: 0.18 });
      filters.innerHTML = '';
      filters.appendChild(lectureChips(cid, lids, (v) => { lids = v; rebuild(); ask(); }));
      filters.appendChild(h('div', { class: 'row gap wrap' },
        h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: onlyMis, onchange: (e) => { onlyMis = e.target.checked; rebuild(); ask(); } }), h('span', {}, 'Mistakes first')),
        h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: SH.store.settings().examMode, onchange: (e) => { SH.store.setSetting('examMode', e.target.checked); SH.app.refreshTop(); ask(); } }), h('span', {}, 'Exam mode (English only)'))));
    }
    function drawHead() {
      head.innerHTML = '';
      const acc = stats.n ? Math.round((stats.right / stats.n) * 100) : 0;
      head.append(
        h('div', { class: 'loop-title' }, h('span', { class: 'inf', 'aria-hidden': 'true' }, '∞'), h('div', {}, h('h1', {}, 'Knowledge loop'), h('div', { class: 'muted small' }, C.code + ' · questions you miss come back sooner'))),
        h('div', { class: 'loop-stats' },
          h('div', { class: 'combo' + (stats.combo >= 5 ? ' hot' : '') }, h('b', {}, '×' + stats.combo), h('span', {}, 'combo')),
          h('div', {}, h('b', {}, String(stats.n)), h('span', {}, 'answered')),
          h('div', {}, h('b', {}, acc + '%'), h('span', {}, 'accuracy')),
          h('div', {}, h('b', {}, '+' + stats.xp), h('span', {}, 'XP'))));
    }
    function ask() {
      drawHead();
      const q = next();
      stage.innerHTML = '';
      if (!q) {
        stage.appendChild(ui().empty('No questions match these filters.'));
        return;
      }
      const el = SH.quiz.card(q, (ok, info) => {
        stats.n++;
        if (ok) {
          stats.right++;
          stats.combo++;
          stats.best = Math.max(stats.best, stats.combo);
          const gain = 5 + Math.min(stats.combo, 10) + (info.usedHint ? -2 : 0);
          stats.xp += gain;
          SH.store.addXP(cid, gain);
          if ([5, 10, 20, 30, 50].includes(stats.combo)) {
            SH.toast('🔥 ' + stats.combo + ' in a row!');
            SH.beep('great');
            if (stats.combo >= 10) ui().confetti();
          }
          SH.store.setBest(cid, 'combo', stats.combo);
        } else stats.combo = 0;
        const c = SH.store.course(cid);
        c.loopN = (c.loopN || 0) + 1;
        SH.store.save();
        SH.app.refreshTop();
        drawHead();
        const nb = h('button', { class: 'btn primary block', onclick: ask }, 'Next question');
        el.appendChild(nb);
        setTimeout(() => nb.focus({ preventScroll: true }), 30);
      });
      stage.appendChild(el);
    }
    rebuild();
    ask();
  };

  /* =============== GAMES HUB =============== */
  V.games = function (root, cid) {
    const C = SH.courses[cid];
    root.appendChild(h('div', { class: 'vhead plain' }, h('div', { class: 'vhead-t' }, ui().biTitle({ en: 'Games', zh: '遊戲' }, 'h1'), h('div', { class: 'muted small' }, C.code + ' · play to remember'))));
    // boss row
    root.appendChild(ui().sectionHead({ en: 'Boss battles', zh: '打大佬' }));
    const bosses = h('div', { class: 'bosses scroll-x' });
    C.lectures.filter((L) => L.mcq.length >= 6).forEach((L) => {
      const beat = SH.store.course(cid).badges['boss.' + L.id];
      const B = L.boss || { name: L.code + ' boss', emoji: '👾' };
      bosses.appendChild(h('button', { class: 'bosscard' + (beat ? ' beat' : ''), onclick: () => go(`/c/${cid}/play/boss/${L.id}`) },
        h('span', { class: 'bc-e', 'aria-hidden': 'true' }, B.emoji), h('b', {}, B.name), h('small', {}, L.code + (beat ? ' · defeated' : ''))));
    });
    bosses.appendChild(h('button', { class: 'bosscard final', onclick: () => go(`/c/${cid}/play/boss/all`) },
      h('span', { class: 'bc-e', 'aria-hidden': 'true' }, C.finalBoss ? C.finalBoss.emoji : '🧑‍⚖️'), h('b', {}, C.finalBoss ? C.finalBoss.name : 'Final examiner'), h('small', {}, 'All lectures')));
    root.appendChild(bosses);

    const games = [
      ['match', '⇄', 'Term match', '配對詞彙', 'Pair English terms with Cantonese or with definitions, against the clock.'],
      ['blitz', '⚡', 'True / false blitz', '對錯快打', '60 seconds. How many statements can you judge?'],
      ['order', '☰', 'Process puzzle', '流程排序', 'Put the steps of a banking process in the right order.'],
      ['cmd', 'Aa', 'Command word drill', '題目指令字', 'What does the question really ask you to do?'],
      ['calc', '÷', 'Calculation lab', '計數實驗室', 'Endless calculations with new numbers and worked steps.'],
    ];
    root.appendChild(ui().sectionHead({ en: 'Quick games', zh: '小遊戲' }));
    const grid = h('div', { class: 'glist' });
    games.forEach(([id, ic, en, zh, d]) => grid.appendChild(h('button', { class: 'gitem', onclick: () => go(`/c/${cid}/play/${id}`) },
      h('span', { class: 'gi-i', 'aria-hidden': 'true' }, ic), h('span', {}, h('b', {}, en), h('small', { lang: 'zh-HK' }, zh), h('small', { class: 'muted' }, d)))));
    root.appendChild(grid);
  };

  /* =============== PLAY (game runner) =============== */
  V.play = function (root, cid, gid, arg, params) {
    const titles = { boss: ['Boss battle', '打大佬'], match: ['Term match', '配對詞彙'], blitz: ['True / false blitz', '對錯快打'], order: ['Process puzzle', '流程排序'], cmd: ['Command word drill', '題目指令字'], calc: ['Calculation lab', '計數實驗室'] };
    const t = titles[gid] || ['Game', '遊戲'];
    const needScope = ['match', 'blitz', 'order'].includes(gid) && !arg;
    let lids = params.l ? params.l.split(',') : [];
    root.appendChild(backHead({ en: t[0], zh: t[1] }, SH.courses[cid].code));
    const scope = h('div', {});
    const stage = h('div', { class: 'stage' });
    root.append(scope, stage);
    function start() {
      stage.innerHTML = '';
      const l = lids.length ? lids : null;
      if (gid === 'boss') SH.games.boss(stage, cid, arg === 'all' ? null : arg);
      else if (gid === 'match') SH.games.match(stage, cid, l);
      else if (gid === 'blitz') SH.games.blitz(stage, cid, l);
      else if (gid === 'order') SH.games.order(stage, cid, l, arg ? decodeURIComponent(arg) : null);
      else if (gid === 'cmd') SH.exam.cmdDrill(stage, cid);
      else if (gid === 'calc') {
        if (arg) SH.games.calc(stage, cid, arg);
        else calcMenu(stage, cid);
      }
    }
    const need = (L) => (gid === 'order' ? L.orders.length : gid === 'match' ? L.terms.length >= 4 : L.terms.length || L.mcq.length);
    function drawScope() {
      scope.innerHTML = '';
      scope.appendChild(lectureChips(cid, lids, (v) => { lids = v; drawScope(); start(); }, { need }));
    }
    if (needScope) drawScope();
    start();
  };

  function calcMenu(root, cid) {
    const C = SH.courses[cid];
    root.appendChild(h('p', { class: 'muted' }, 'Pick a calculation type. Every attempt uses fresh numbers.'));
    C.lectures.forEach((L) => {
      if (!L.gens.length) return;
      root.appendChild(h('h4', { class: 'glabel' }, L.code + ' · ' + L.title.en));
      const grid = h('div', { class: 'glist' });
      L.gens.forEach((gid) => {
        const g = SH.gens[gid];
        if (!g) return;
        grid.appendChild(h('button', { class: 'gitem', onclick: () => go(`/c/${cid}/play/calc/${gid}`) }, h('span', { class: 'gi-i', 'aria-hidden': 'true' }, '÷'), h('span', {}, h('b', {}, g.t.en), h('small', { lang: 'zh-HK' }, g.t.zh))));
      });
      root.appendChild(grid);
    });
  }

  /* =============== FLASHCARDS =============== */
  V.cards = function (root, cid, params) {
    let lids = params.l ? params.l.split(',') : [];
    root.appendChild(backHead({ en: 'Flashcards', zh: '記憶卡' }, 'Spaced repetition: cards you know come back later, cards you miss come back soon.'));
    const scope = h('div', {});
    const stage = h('div', {});
    root.append(scope, stage);
    function drawScope() {
      scope.innerHTML = '';
      scope.appendChild(lectureChips(cid, lids, (v) => { lids = v; drawScope(); start(); }, { need: (L) => L.terms.length }));
    }
    let front = 'en';
    function start() {
      // reviews first (weakest box first, shuffled within), then today's new cards in lecture order
      const dc = dueCards(cid, lids.length ? lids : null);
      const deck = shuffle(dc.slice(0, dc.reviews)).sort((a, b) => SH.store.card(cid, a.uid).box - SH.store.card(cid, b.uid).box).concat(dc.slice(dc.reviews));
      let i = 0;
      let done = 0;
      function draw() {
        stage.innerHTML = '';
        const total = SH.all(cid, 'terms', lids.length ? lids : null).length;
        if (i >= deck.length) {
          const learned = SH.all(cid, 'terms', lids.length ? lids : null).filter((t) => SH.store.card(cid, t.uid).box >= 3).length;
          stage.appendChild(h('div', { class: 'result' }, ui().stamp('完', 'ok big'), h('h2', {}, done ? 'All due cards reviewed' : 'Nothing due right now'),
            h('p', { class: 'muted' }, `${learned} of ${total} terms are well learned. Come back tomorrow for the next review.`),
            h('button', { class: 'btn', onclick: () => { practiceAll(); } }, 'Practise all cards anyway')));
          return;
        }
        const t = deck[i];
        const L = SH.lecture(cid, t.lecture);
        const flip = h('div', { class: 'flip' });
        const frontEl = front === 'en'
          ? h('div', { class: 'face front' }, h('span', { class: 'muted small' }, L ? L.code : ''), h('div', { class: 'fc-term' }, t.en), ui().sayBtn(t.en), h('p', { class: 'muted small' }, 'Say what it means, then tap to flip'))
          : h('div', { class: 'face front' }, h('span', { class: 'muted small' }, L ? L.code : ''), h('div', { class: 'fc-zh', lang: 'zh-HK' }, t.zh), h('p', { class: 'muted small' }, 'Say the English term, then tap to flip'));
        const backEl = h('div', { class: 'face back' },
          h('div', { class: 'fc-term sm' }, t.en, ' ', ui().sayBtn(t.en)),
          h('div', { class: 'fc-zh', lang: 'zh-HK' }, t.zh),
          t.d ? h('div', { class: 'md', html: md(t.d) }) : null,
          t.dz ? h('div', { class: 'md muted', lang: 'zh-HK', html: md(t.dz) }) : null,
          t.ex ? h('div', { class: 'md small', html: md('*e.g.* ' + t.ex) }) : null);
        flip.append(frontEl, backEl);
        const grades = h('div', { class: 'grades', hidden: true },
          [['Again', 0, '唔記得'], ['Hard', 1, '有啲難'], ['Good', 2, '記得'], ['Easy', 3, '好易']].map(([lab, g, zh]) =>
            h('button', { class: 'btn g' + g, onclick: () => {
              if (SH.store.card(cid, t.uid).n === 0) { const cc = SH.store.course(cid); const k = 'newcards.' + SH.today(); cc.best[k] = (cc.best[k] || 0) + 1; }
              SH.store.rateCard(cid, t.uid, g); if (g >= 2) SH.award(cid, 2); done++; if (g === 0) deck.push(t); i++; draw();
            } }, h('span', {}, lab), h('small', { lang: 'zh-HK' }, zh))));
        flip.addEventListener('click', () => { flip.classList.add('flipped'); grades.hidden = false; });
        stage.append(
          h('div', { class: 'row between' }, h('span', { class: 'muted small' }, (i + 1) + ' / ' + deck.length + ' due'),
            h('div', { class: 'seg' },
              h('button', { class: front === 'en' ? 'on' : '', onclick: () => { front = 'en'; draw(); } }, 'EN → 粵'),
              h('button', { class: front === 'zh' ? 'on' : '', onclick: () => { front = 'zh'; draw(); } }, '粵 → EN'))),
          flip, grades);
      }
      function practiceAll() {
        deck.length = 0;
        deck.push(...shuffle(SH.all(cid, 'terms', lids.length ? lids : null)));
        i = 0;
        draw();
      }
      draw();
    }
    drawScope();
    start();
  };

  /* =============== GLOSSARY =============== */
  V.glossary = function (root, cid) {
    const C = SH.courses[cid];
    root.appendChild(backHead({ en: 'Glossary', zh: '詞彙表' }, C.code + ' · ' + SH.all(cid, 'terms').length + ' terms'));
    const q = h('input', { class: 'search', type: 'search', placeholder: 'Search English or 中文…', 'aria-label': 'Search terms' });
    const list = h('div', { class: 'glossary' });
    root.append(q, list);
    function draw() {
      const s = q.value.trim().toLowerCase();
      list.innerHTML = '';
      C.lectures.forEach((L) => {
        const ts = L.terms.filter((t) => !s || (t.en + ' ' + t.zh + ' ' + (t.d || '')).toLowerCase().includes(s)).sort((a, b) => a.en.localeCompare(b.en));
        if (!ts.length) return;
        list.appendChild(h('h4', { class: 'glabel' }, L.code + ' · ' + L.title.en));
        ts.forEach((t) => list.appendChild(h('button', { class: 'gl', onclick: () => ui().termPop(t, cid) }, h('b', {}, t.en), h('span', { lang: 'zh-HK' }, t.zh), h('small', { class: 'muted' }, t.d))));
      });
      if (!list.children.length) list.appendChild(ui().empty('No term matches “' + q.value + '”.'));
    }
    q.addEventListener('input', draw);
    draw();
  };

  /* =============== FORMULAS =============== */
  V.formulas = function (root, cid) {
    const C = SH.courses[cid];
    root.appendChild(backHead({ en: 'Formula sheet', zh: '公式表' }, C.code));
    const fs = C.formulas || [];
    if (!fs.length) return root.appendChild(ui().empty('No formulas for this course yet.'));
    let group = null;
    fs.forEach((f) => {
      if (f.g && f.g !== group) {
        group = f.g;
        root.appendChild(h('h4', { class: 'glabel' }, group));
      }
      root.appendChild(h('div', { class: 'fcard' },
        h('div', { class: 'row between' }, h('b', {}, f.n.en), h('span', { lang: 'zh-HK', class: 'muted' }, f.n.zh)),
        ui().formula(f.f),
        f.v ? h('div', { class: 'small md', html: md(f.v) }) : null,
        f.zh ? h('div', { class: 'small muted', lang: 'zh-HK', html: SH.inline(f.zh) }) : null,
        f.gen ? h('button', { class: 'link', onclick: () => go(`/c/${cid}/play/calc/${f.gen}`) }, 'Practise this ›') : null));
    });
  };

  /* =============== MISTAKES =============== */
  V.mistakes = function (root, cid) {
    root.appendChild(backHead({ en: 'Mistake book', zh: '錯題簿' }, 'Questions you missed recently. Get each one right twice to clear it.'));
    const ids = new Set(SH.store.mistakes(cid));
    const qs = SH.quiz.pool(cid).qs.filter((q) => ids.has(q.uid));
    if (!qs.length) return root.appendChild(ui().empty('No mistakes to fix. Play the Knowledge loop to find weak spots.', h('button', { class: 'btn primary', onclick: () => go('/c/' + cid + '/loop') }, 'Open the loop')));
    root.appendChild(h('button', { class: 'btn primary block', onclick: () => go('/c/' + cid + '/loop?m=1') }, 'Retry all ' + qs.length + ' in the loop'));
    qs.forEach((q) => {
      const L = SH.lecture(cid, q.lecture);
      const right = q.options.find((o) => o.ok);
      root.appendChild(h('details', { class: 'panel' },
        h('summary', {}, h('span', { class: 'qtag' }, L ? L.code : ''), ' ', h('span', { html: SH.inline(SH.qShort(q.q, 140)) })),
        h('div', { class: 'md', html: md(q.q) }),
        h('p', {}, 'Answer: ', h('b', { html: SH.inline(right ? right.text : '') })),
        ui().bi(q.x || '', q.xz || '', { say: false })));
    });
  };

  /* =============== EXAM ENGLISH HUB =============== */
  V.exam = function (root, cid) {
    const C = SH.courses[cid];
    root.appendChild(backHead({ en: 'Exam English', zh: '考試英文' }, 'Read the question right, then answer in clear English'));
    root.appendChild(h('div', { class: 'note' }, ui().bi(
      'Three habits that win marks: **(1)** find the command word and do exactly that; **(2)** count the marks and give enough points; **(3)** one idea per sentence, linked with words like *because*, *therefore* and *however*.',
      '三個攞分習慣：(1) 搵出指令字，題目叫你做乜就做乜；(2) 睇分數決定寫幾多點；(3) 一句講一個重點，用 because、therefore、however 等連接詞串起。', { say: false })));
    root.appendChild(h('div', { class: 'row gap wrap' },
      h('button', { class: 'btn primary', onclick: () => go(`/c/${cid}/play/cmd`) }, 'Command word drill'),
      h('button', { class: 'btn', onclick: () => go(`/c/${cid}/commands`) }, 'Command word guide')));
    if (C.examPhrases) {
      root.appendChild(h('details', { class: 'panel' }, h('summary', {}, 'Linking words & phrases 連接詞'),
        C.examPhrases.map((g) => h('div', {}, h('h4', {}, g.g), h('ul', { class: 'phrases' }, g.p.map((p) => h('li', {}, h('span', { html: SH.inline(p) }), ui().sayBtn(p.replace(/\*/g, '')))))))));
    }
    C.lectures.forEach((L) => {
      if (!L.written.length) return;
      root.appendChild(h('h4', { class: 'glabel' }, L.code + ' · ' + L.title.en));
      L.written.forEach((W) => {
        const s = SH.store.course(cid).q[W.uid];
        root.appendChild(h('button', { class: 'wrow', onclick: () => go(`/c/${cid}/l/${L.id}/exam/${W.id}`) },
          h('span', { class: 'wcmd' }, W.cmd || '?'), h('span', { class: 'wq', html: SH.inline(W.q.split('\n')[0]) }), h('span', { class: 'wm muted small' }, (W.marks || '') + 'm' + (s && s.c ? ' ✓' : ''))));
      });
    });
  };

  V.commands = function (root) {
    root.appendChild(backHead({ en: 'Command word guide', zh: '指令字指南' }, 'What each exam verb asks you to do'));
    SH.commandWords.forEach((c) => root.appendChild(h('div', { class: 'fcard' },
      h('div', { class: 'row between' }, h('b', { class: 'cmdw' }, c.w), h('span', { lang: 'zh-HK' }, c.zh), ui().sayBtn(c.w)),
      ui().bi(c.d, c.dz, { say: false, force: 'both' }),
      h('p', { class: 'starter' }, 'Frame: ', h('i', {}, c.starter)))));
  };

  /* =============== SEARCH =============== */
  V.search = function (root, cid) {
    const C = SH.courses[cid];
    root.appendChild(backHead({ en: 'Search', zh: '搜尋' }, C.code));
    const q = h('input', { class: 'search', type: 'search', placeholder: 'e.g. custody, 結算, accrued interest', 'aria-label': 'Search' });
    const out = h('div', {});
    root.append(q, out);
    q.addEventListener('input', () => {
      const s = q.value.trim().toLowerCase();
      out.innerHTML = '';
      if (s.length < 2) return;
      const hits = [];
      C.lectures.forEach((L) => {
        L.cards.forEach((c) => (c.t.en + c.t.zh + c.en + c.zh).toLowerCase().includes(s) && hits.push(['Card', L, c.t.en, `/c/${cid}/l/${L.id}/learn/${c.id}`]));
        L.terms.forEach((t) => (t.en + t.zh + (t.d || '')).toLowerCase().includes(s) && hits.push(['Term', L, t.en + ' · ' + t.zh, null, t]));
        L.written.forEach((w) => w.q.toLowerCase().includes(s) && hits.push(['Exam', L, w.q, `/c/${cid}/l/${L.id}/exam/${w.id}`]));
        L.stories.forEach((st) => (st.t.en + st.t.zh + JSON.stringify(st.lines)).toLowerCase().includes(s) && hits.push(['Story', L, st.t.en, `/c/${cid}/l/${L.id}/story`]));
      });
      if (!hits.length) out.appendChild(ui().empty('Nothing found for “' + q.value + '”.'));
      hits.slice(0, 60).forEach(([kind, L, label, path, t]) => out.appendChild(h('button', { class: 'wrow', onclick: () => (t ? ui().termPop(t, cid) : go(path)) },
        h('span', { class: 'wcmd' }, kind), h('span', { class: 'wq', html: SH.inline(label.slice(0, 160)) }), h('span', { class: 'wm muted small' }, L.code))));
    });
    setTimeout(() => q.focus(), 50);
  };

  /* =============== ME: stats, badges, settings =============== */
  V.me = function (root) {
    root.appendChild(h('div', { class: 'vhead plain' }, h('div', { class: 'vhead-t' }, ui().biTitle({ en: 'Me', zh: '我的進度' }, 'h1'))));
    const s = SH.store;
    // stats
    const box = h('div', { class: 'mestats' });
    SH.courseOrder.forEach((cid) => {
      const C = SH.courses[cid];
      const c = s.course(cid);
      const lv = s.level(c.xp, C.levels);
      const answered = Object.values(c.q).reduce((a, q) => a + q.n, 0);
      const correct = Object.values(c.q).reduce((a, q) => a + q.c, 0);
      box.appendChild(h('button', { class: 'mestat theme-' + C.theme, onclick: () => go('/c/' + cid) },
        h('b', {}, C.code), h('span', {}, 'Lv ' + lv.n + ' ' + (lv.title ? lv.title.en : '')), h('span', { class: 'small' }, fmt(c.xp, 0) + ' XP · ' + answered + ' answers · ' + (answered ? Math.round((correct / answered) * 100) : 0) + '% correct')));
    });
    root.appendChild(box);
    root.appendChild(h('div', { class: 'row gap streakrow' }, h('div', {}, h('b', {}, '🔥 ' + s.streak()), h('span', { class: 'muted small' }, ' day streak')), h('div', {}, h('b', {}, String(s.streakBest())), h('span', { class: 'muted small' }, ' best'))));
    // 5-week heatmap
    const days = s.days();
    const heat = h('div', { class: 'heat', 'aria-label': 'XP per day, last 5 weeks' });
    const goal = s.settings().dailyGoal;
    for (let k = 34; k >= 0; k--) {
      const d = new Date(Date.now() - k * 86400000);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const v = days[key] || 0;
      const lvl = v === 0 ? 0 : v < goal / 2 ? 1 : v < goal ? 2 : 3;
      heat.appendChild(h('span', { class: 'hc l' + lvl, title: key + ': ' + v + ' XP' }));
    }
    root.appendChild(ui().sectionHead({ en: 'Last 5 weeks', zh: '最近五星期' }));
    root.appendChild(heat);

    // badges
    root.appendChild(ui().sectionHead({ en: 'Badges', zh: '徽章' }));
    const bwrap = h('div', { class: 'badges' });
    SH.app.badgeList().forEach((b) => bwrap.appendChild(h('div', { class: 'badge' + (b.have ? ' have' : ''), title: b.d },
      h('span', { class: 'b-i', 'aria-hidden': 'true' }, b.i), h('b', {}, b.n), h('small', {}, b.d))));
    root.appendChild(bwrap);

    // settings
    root.appendChild(ui().sectionHead({ en: 'Settings', zh: '設定' }));
    const st = s.settings();
    const set = h('div', { class: 'settings' },
      h('label', {}, h('span', {}, 'Cantonese help 廣東話輔助'),
        h('select', { onchange: (e) => { s.setSetting('assist', e.target.value); SH.app.refreshTop(); } },
          [['both', 'Always show 一直顯示'], ['tap', 'Tap to show 撳先顯示'], ['off', 'Off (English only) 關閉']].map(([v, l]) => h('option', { value: v, selected: st.assist === v }, l)))),
      h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: st.examMode, onchange: (e) => { s.setSetting('examMode', e.target.checked); SH.app.refreshTop(); } }), h('span', {}, 'Exam mode: hide all Cantonese')),
      h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: st.sound, onchange: (e) => s.setSetting('sound', e.target.checked) }), h('span', {}, 'Sound effects')),
      h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: st.haptics, onchange: (e) => s.setSetting('haptics', e.target.checked) }), h('span', {}, 'Vibration')),
      h('label', {}, h('span', {}, 'Speech speed 朗讀速度'), h('input', { type: 'range', min: 0.6, max: 1.3, step: 0.05, value: st.ttsRate, onchange: (e) => { s.setSetting('ttsRate', Number(e.target.value)); SH.speak('This is the reading speed.'); } })),
      h('label', {}, h('span', {}, 'Daily XP goal 每日目標'), h('select', { onchange: (e) => { s.setSetting('dailyGoal', Number(e.target.value)); SH.app.refreshTop(); } },
        [40, 80, 150, 250].map((v) => h('option', { value: v, selected: st.dailyGoal === v }, v + ' XP')))));
    root.appendChild(set);

    // backup
    root.appendChild(ui().sectionHead({ en: 'Backup', zh: '備份' }));
    const file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          s.importJSON(r.result);
          SH.toast('Progress restored');
          SH.app.route();
        } catch (err) {
          SH.toast(err.message || 'This file could not be read.', 'bad');
        }
      };
      r.readAsText(f);
    } });
    root.appendChild(h('div', { class: 'row gap wrap' },
      h('button', { class: 'btn', onclick: () => {
        const blob = new Blob([s.exportJSON()], { type: 'application/json' });
        const a = h('a', { href: URL.createObjectURL(blob), download: 'study-helper-backup-' + SH.today() + '.json' });
        document.body.appendChild(a);
        a.click();
        a.remove();
      } }, 'Save backup file'),
      h('button', { class: 'btn', onclick: () => file.click() }, 'Restore from file'), file));
    root.appendChild(h('details', { class: 'panel' }, h('summary', {}, 'Reset progress'),
      h('p', { class: 'muted small' }, 'This clears XP, answers and flashcard history on this device. Save a backup first if you may want it back.'),
      h('div', { class: 'row gap wrap' }, SH.courseOrder.map((cid) => h('button', { class: 'btn danger', onclick: () => { if (confirm('Reset all progress for ' + SH.courses[cid].code + '?')) { s.reset(cid); SH.toast('Progress reset'); SH.app.route(); } } }, 'Reset ' + SH.courses[cid].code)))));
    root.appendChild(h('details', { class: 'panel' }, h('summary', {}, 'Install on your Android phone'),
      h('div', { class: 'md', html: md(SH.installHelp) })));
    root.appendChild(h('p', { class: 'muted small center' }, 'Study Helper · works offline · content v' + SH.CONTENT_VERSION));
  };
})();

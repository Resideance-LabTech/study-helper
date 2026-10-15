/* Study Helper — question pool, adaptive picker and the MC question card */
(function () {
  'use strict';
  const SH = window.SH;
  const { h, shuffle, pick, fmt, md, round } = SH;
  SH.gens = SH.gens || {};

  /* ---------- formatting numbers for generated questions ---------- */
  function fmtVal(v, g) {
    const dp = g.dp == null ? 2 : g.dp;
    if (g.unit === '%') return fmt(v, dp) + '%';
    if (g.unit === '$') return (round(v, dp) < 0 ? '−$' : '$') + fmt(Math.abs(v), dp);
    if (g.unit) return fmt(v, dp) + ' ' + g.unit;
    return fmt(v, dp);
  }
  SH.fmtVal = fmtVal;

  /* ---------- build question objects ---------- */
  function fromMCQ(m, cid) {
    const opts = m.o.map((t, i) => ({ text: t, ok: Array.isArray(m.a) ? m.a.includes(i) : i === m.a, zh: m.oz ? m.oz[i] : null }));
    const tf = m.o.length === 2 && /^true$/i.test(m.o[0]);
    return {
      uid: m.uid, kind: tf ? 'tf' : 'mcq', lecture: m.lecture, cid,
      q: m.q, qz: m.qz, options: tf ? opts : shuffle(opts), x: m.x, xz: m.xz, src: m.s, d: m.d || 1,
    };
  }

  function termQuestions(cid, lids) {
    const terms = SH.all(cid, 'terms', lids).filter((t) => t.d);
    const out = [];
    if (terms.length < 4) return out;
    for (const t of terms) {
      const others = shuffle(terms.filter((o) => o.en !== t.en)).slice(0, 3);
      // definition -> term
      out.push({
        uid: t.uid + '~def', kind: 'term', lecture: t.lecture, cid,
        q: 'Which term matches this description?\n\n“' + t.d + '”',
        qz: '邊個名詞符合呢個描述？' + (t.dz ? '\n\n「' + t.dz + '」' : ''),
        options: shuffle([{ text: t.en, ok: true, zh: t.zh }, ...others.map((o) => ({ text: o.en, ok: false, zh: o.zh }))]),
        x: '**' + t.en + '** — ' + t.d, xz: t.zh + (t.dz ? '：' + t.dz : ''), d: 1,
      });
      // term -> Cantonese meaning (fast vocabulary check)
      if (t.zh) {
        out.push({
          uid: t.uid + '~zh', kind: 'vocab', lecture: t.lecture, cid,
          q: 'What does **' + t.en + '** mean?', qz: '「' + t.en + '」即係乜嘢？',
          options: shuffle([{ text: t.zh, ok: true }, ...others.map((o) => ({ text: o.zh, ok: false }))]),
          x: '**' + t.en + '** = ' + t.zh + '. ' + t.d, xz: t.dz || '', d: 1, zhOptions: true,
        });
      }
    }
    return out;
  }

  function genQuestion(cid, gid, lecture) {
    const g = SH.gens[gid];
    if (!g) return null;
    const r = g.make();
    const right = fmtVal(r.ans, r);
    const seen = new Set([right]);
    const wrongs = [];
    for (const w of shuffle(r.wrong || [])) {
      const s = fmtVal(w, r);
      const tolW = Math.max(r.tol != null ? r.tol : 0, Math.abs(r.ans) * 0.0005);
      if (!seen.has(s) && isFinite(w) && Math.abs(w - r.ans) > tolW) {
        seen.add(s);
        wrongs.push(s);
      }
      if (wrongs.length === 3) break;
    }
    // pad with nearby values if a generator gave too few distractors
    let k = 1;
    const dp = r.dp == null ? 2 : r.dp;
    const base = Math.abs(r.ans) > 1e-9 ? Math.max(Math.abs(r.ans) * 0.07, Math.pow(10, -dp) * 3) : Math.max(Math.pow(10, -dp) * 5, dp === 0 ? 5 : 0.5);
    while (wrongs.length < 3 && k < 20) {
      const s = fmtVal(r.ans + (k % 2 ? 1 : -1) * base * Math.ceil(k / 2), r);
      if (!seen.has(s)) {
        seen.add(s);
        wrongs.push(s);
      }
      k++;
    }
    return {
      uid: cid + ':gen.' + gid, kind: 'calc', lecture, cid, gen: gid,
      q: r.q.en, qz: r.q.zh,
      options: shuffle([{ text: right, ok: true }, ...wrongs.map((w) => ({ text: w, ok: false }))]),
      steps: r.steps, x: 'Answer: **' + right + '**', xz: '', d: 2, html: r.book || '', raw: r,
    };
  }

  /* Pool: all question sources for a course, optionally filtered by lectures */
  function pool(cid, opts = {}) {
    const C = SH.courses[cid];
    const lids = opts.lectures && opts.lectures.length ? opts.lectures : null;
    let qs = SH.all(cid, 'mcq', lids).map((m) => fromMCQ(m, cid));
    if (opts.terms !== false) qs = qs.concat(termQuestions(cid, lids));
    const gens = [];
    if (opts.calc !== false)
      C.lectures.filter((l) => !lids || lids.includes(l.id)).forEach((l) => l.gens.forEach((g) => SH.gens[g] && SH.gens[g].mc !== false && gens.push({ g, l: l.id })));
    return { qs, gens };
  }

  /* Adaptive weighted pick: missed & new questions come back more often; mastered ones rarely */
  function weight(cid, uid) {
    const s = SH.store.course(cid).q[uid];
    if (!s || !s.n) return 3;
    const now = Date.now();
    if (s.box === 0) return now >= s.due ? 7 : 1.5;
    if (now >= s.due) return 2.5;
    return 0.5 / s.box;
  }
  function picker(cid, opts = {}) {
    const P = pool(cid, opts);
    const recent = [];
    return function next() {
      const useGen = P.gens.length && (P.qs.length === 0 || Math.random() < (opts.calcShare || 0.18));
      if (useGen) {
        const g = pick(P.gens);
        const q = genQuestion(cid, g.g, g.l);
        if (q) return q;
      }
      let cands = P.qs.filter((q) => !recent.includes(q.uid));
      if (!cands.length) cands = P.qs;
      if (opts.only === 'mistakes') {
        const mis = new Set(SH.store.mistakes(cid));
        const m = cands.filter((q) => mis.has(q.uid));
        if (m.length) cands = m;
      }
      const ws = cands.map((q) => weight(cid, q.uid));
      let r = Math.random() * ws.reduce((a, b) => a + b, 0);
      let chosen = cands[0];
      for (let i = 0; i < cands.length; i++) {
        r -= ws[i];
        if (r <= 0) {
          chosen = cands[i];
          break;
        }
      }
      recent.push(chosen.uid);
      if (recent.length > Math.min(12, Math.floor(P.qs.length / 2))) recent.shift();
      // re-shuffle options each time it appears (except true/false)
      if (chosen.kind !== 'tf') chosen = Object.assign({}, chosen, { options: shuffle(chosen.options) });
      return chosen;
    };
  }

  /* Highlight the words that matter when reading an English question */
  function decodeHTML(text) {
    const sw = SH.signalWords;
    const all = [
      ...sw.command.map((w) => [w, 'sig-cmd']),
      ...sw.limit.map((w) => [w, 'sig-lim']),
      ...sw.contrast.map((w) => [w, 'sig-con']),
      ['not', 'sig-neg'], ['except', 'sig-neg'], ['never', 'sig-neg'], ['incorrect', 'sig-neg'], ['false', 'sig-neg'], ['least', 'sig-neg'], ['cannot', 'sig-neg'],
      ['always', 'sig-neg'], ['only', 'sig-lim'], ['most', 'sig-lim'], ['best', 'sig-lim'],
    ];
    let html = md(text);
    for (const [w, cls] of all) {
      const re = new RegExp('(^|[\\s(“"])(' + w.replace(/ /g, '\\s') + ')(?=[\\s,.?:;)”"]|$)', 'gi');
      html = html.replace(re, (m0, pre, word) => pre + '<span class="' + cls + '">' + word + '</span>');
    }
    return html;
  }

  /* ---------- The MC card ---------- */
  function card(q, onAnswer, o = {}) {
    const ui = SH.ui;
    const mode = ui.assist();
    const L = SH.lecture(q.cid, q.lecture);
    const root = h('div', { class: 'qcard kind-' + q.kind });
    const meta = h('div', { class: 'qmeta' },
      L ? h('span', { class: 'qtag' }, L.code) : null,
      h('span', { class: 'qkind' }, { mcq: 'Multiple choice', tf: 'True or false', term: 'Term', vocab: 'Vocabulary', calc: 'Calculation' }[q.kind] || ''),
      o.extraMeta || null);
    root.appendChild(meta);

    const qHTML = (dec) => (dec ? decodeHTML(q.q) : md(q.q)).replace(/<p>%%BOOK%%<\/p>/, q.html || '');
    const qText = h('div', { class: 'qtext md', html: qHTML(false) });
    const qWrap = h('div', { class: 'qwrap' }, qText);
    const tools = h('div', { class: 'qtools' });
    tools.appendChild(ui.sayBtn(q.q));
    let decoded = false;
    tools.appendChild(h('button', {
      class: 'tool', type: 'button', title: 'Highlight key words', onclick: (e) => {
        decoded = !decoded;
        qText.innerHTML = qHTML(decoded);
        e.currentTarget.classList.toggle('on', decoded);
        if (decoded && !SH.store.isRead(q.cid, 'tip.decode')) {
          SH.store.markRead(q.cid, 'tip.decode');
          SH.toast('Blue = task word · Amber = limits · Red = traps like NOT / EXCEPT');
        }
      },
    }, '🔍 Decode'));
    let zhShown = false;
    const zhBox = h('div', { class: 'qzh md', lang: 'zh-HK', hidden: true, html: md(q.qz || '') });
    if (q.qz && mode !== 'off' && !o.noZh) {
      const zbtn = h('button', {
        class: 'tool', type: 'button', onclick: (e) => {
          zhShown = !zhShown;
          zhBox.hidden = !zhShown;
          e.currentTarget.classList.toggle('on', zhShown);
          if (zhShown) usedHint = true;
        },
      }, '粵 Hint');
      tools.appendChild(zbtn);
      if (mode === 'both' && !o.noAutoZh) {
        zhBox.hidden = false;
        zhShown = true;
        zbtn.classList.add('on');
      }
    }
    let usedHint = false;
    qWrap.appendChild(tools);
    qWrap.appendChild(zhBox);
    root.appendChild(qWrap);

    const optsEl = h('div', { class: 'opts', role: 'group', 'aria-label': 'Answer options' });
    const letters = 'ABCDEF';
    let answered = false;
    const btns = q.options.map((op, i) => {
      const b = h('button', { class: 'opt' + (q.zhOptions ? ' zh-opt' : ''), type: 'button', onclick: () => choose(i) },
        h('span', { class: 'opt-l' }, q.kind === 'tf' ? (i === 0 ? 'T' : 'F') : letters[i]),
        h('span', { class: 'opt-t', html: SH.inline(op.text) }),
        op.zh && mode === 'both' && !q.zhOptions ? h('span', { class: 'opt-zh', lang: 'zh-HK' }, op.zh) : null);
      optsEl.appendChild(b);
      return b;
    });
    root.appendChild(optsEl);
    const fb = h('div', { class: 'qfb', 'aria-live': 'polite' });
    root.appendChild(fb);

    function choose(i) {
      if (answered) return;
      answered = true;
      const ok = q.options[i].ok;
      if (o.silent) {
        btns.forEach((b, k) => { b.disabled = true; if (k === i) b.classList.add('picked'); });
        if (q.kind !== 'calc' && !q.noRecord) SH.store.recordAnswer(q.cid, q.uid, ok);
        onAnswer && onAnswer(ok, { usedHint, q, picked: i });
        return;
      }
      btns.forEach((b, k) => {
        b.disabled = true;
        if (q.options[k].ok) b.classList.add('right');
        else if (k === i) b.classList.add('wrong');
      });
      if (q.kind !== 'calc' && !q.noRecord) SH.store.recordAnswer(q.cid, q.uid, ok);
      SH.beep(ok ? 'good' : 'bad');
      SH.buzz(ok ? 15 : [40, 40, 40]);
      fb.appendChild(ui.stamp(ok ? '啱' : '錯', ok ? 'ok' : 'no'));
      const exp = h('div', { class: 'qexp' });
      if (q.x || q.xz) exp.appendChild(ui.bi(q.x || '', q.xz || '', { say: false }));
      if (q.steps && q.steps.length) exp.appendChild(stepsEl(q.steps));
      if (q.src) exp.appendChild(h('div', { class: 'qsrc' }, 'Source: ' + (L ? L.code + ', ' : '') + q.src));
      fb.appendChild(exp);
      if (o.onExplain) o.onExplain(exp);
      onAnswer && onAnswer(ok, { usedHint, q });
      // bring the explanation and the Next button into view on small screens
      setTimeout(() => {
        const nb = root.querySelector('.btn.primary.block');
        (nb || fb).scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }, 60);
    }
    root._choose = choose;
    root._answered = () => answered;

    // Keyboard: 1–4 or A–D to answer, T/F for true-false, Enter for the next question
    const onKey = (e) => {
      if (!document.body.contains(root)) return document.removeEventListener('keydown', onKey);
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      if (!answered) {
        let k = -1;
        if (/^[1-6]$/.test(e.key)) k = Number(e.key) - 1;
        else if (/^[a-fA-F]$/.test(e.key) && q.kind !== 'tf') k = e.key.toLowerCase().charCodeAt(0) - 97;
        else if (q.kind === 'tf' && /^[tT]$/.test(e.key)) k = 0;
        else if (q.kind === 'tf' && /^[fF]$/.test(e.key)) k = 1;
        if (k >= 0 && k < q.options.length) { e.preventDefault(); choose(k); }
      } else if (e.key === 'Enter') {
        const nb = root.querySelector('.btn.primary.block');
        if (nb && document.activeElement !== nb) { e.preventDefault(); nb.click(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return root;
  }

  function stepsEl(steps) {
    const ol = h('ol', { class: 'steps' });
    for (const s of steps) {
      ol.appendChild(h('li', {},
        s.en ? SH.ui.bi(s.en, s.zh, { say: false, inline: true }) : null,
        s.f ? SH.ui.formula(s.f) : null,
        s.html ? h('div', { class: 'step-html', html: s.html }) : null));
    }
    return ol;
  }

  SH.quiz = { pool, picker, card, genQuestion, termQuestions, fromMCQ, stepsEl, decodeHTML, fmtVal };
})();

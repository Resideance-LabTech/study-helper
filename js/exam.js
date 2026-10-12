/* Study Helper — Exam English trainer: decode the question, plan, write, self-check, model answer, answer builder, cloze */
(function () {
  'use strict';
  const SH = window.SH;
  const { h, shuffle, md } = SH;

  function cmdInfo(word) {
    const w = String(word || '').toLowerCase();
    return SH.commandWords.find((c) => c.w.toLowerCase().split(/\s*\/\s*/).some((x) => w === x || w.startsWith(x)));
  }

  function splitSentences(text) {
    return String(text)
      .replace(/\n+/g, ' ')
      .split(/(?<=[.!?])\s+(?=[A-Z(“"])/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /* A key point is covered when EVERY keyword group matches; "|" separates alternatives inside a group.
     Words must start at a word boundary, and short keywords (≤ 3 letters, e.g. "par", "sec") must also end at one
     (an "s" plural is allowed), so "sec" does not match "securities" and "par" does not match "part". */
  const kwCache = {};
  function kwRegex(alt) {
    if (kwCache[alt]) return kwCache[alt];
    const a = alt.toLowerCase().trim();
    const esc = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startB = /^[a-z0-9]/.test(a) ? '(?<![a-z0-9])' : '';
    const endB = /[a-z]$/.test(a) && a.replace(/[^a-z]/g, '').length <= 3 ? 's?(?![a-z])' : '';
    return (kwCache[alt] = new RegExp(startB + esc + endB));
  }
  function pointHit(p, text) {
    const t = ' ' + String(text).toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ') + ' ';
    const groups = p.kw || [];
    return groups.length > 0 && groups.every((k) => k.split('|').some((alt) => alt.trim() && kwRegex(alt).test(t)));
  }

  /* --------- a full written-question workspace --------- */
  function written(root, cid, W) {
    const ui = SH.ui;
    root.innerHTML = '';
    const L = SH.lecture(cid, W.lecture);
    root.appendChild(h('div', { class: 'qmeta' }, h('span', { class: 'qtag' }, L ? L.code : ''), h('span', { class: 'qkind' }, 'Written answer · ' + (W.marks || '?') + ' marks')));

    // 1. Question + decode
    const qText = h('div', { class: 'qtext md', html: md(W.q) });
    let decoded = false;
    const qBox = h('div', { class: 'qwrap exam-q' }, qText,
      h('div', { class: 'qtools' },
        ui.sayBtn(W.q),
        h('button', { class: 'tool', onclick: (e) => { decoded = !decoded; qText.innerHTML = decoded ? SH.quiz.decodeHTML(W.q) : md(W.q); e.currentTarget.classList.toggle('on', decoded); } }, '🔍 Decode')),
      W.qz && ui.assist() !== 'off' ? ui.bi('', W.qz, { say: false }) : null);
    root.appendChild(qBox);

    // 2. What the examiner wants
    const ci = cmdInfo(W.cmd);
    const nPts = W.points ? W.points.length : 0;
    const want = h('details', { class: 'panel', open: !SH.store.isRead(cid, 'w.' + W.uid) },
      h('summary', {}, 'What the examiner wants 考官想見到乜'),
      ci ? h('div', { class: 'cmdbox' },
        h('div', {}, h('b', { class: 'cmdw' }, ci.w), ' ', h('span', { lang: 'zh-HK' }, ci.zh)),
        ui.bi(ci.d, ci.dz, { say: false }),
        h('p', { class: 'starter' }, 'Sentence frame: ', h('i', {}, ci.starter))) : null,
      W.marks ? h('p', { class: 'muted' }, `${W.marks} marks → aim for about ${Math.max(2, Math.round(W.marks / 2))} clear points, each with a reason or example. (${W.marks} 分 ≈ ${Math.max(2, Math.round(W.marks / 2))} 個重點，每點要有原因或者例子。)`) : null,
      W.plan && W.plan.length ? h('div', {}, h('h4', {}, 'Answer plan 答題結構'),
        h('ol', { class: 'plan' }, W.plan.map((p) => h('li', {}, ui.bi(p.en, p.zh, { say: false, inline: true }))))) : null);
    want.addEventListener('toggle', () => SH.store.markRead(cid, 'w.' + W.uid));
    root.appendChild(want);

    // 3. Phrase bank
    if (W.phrases && W.phrases.length) {
      root.appendChild(h('details', { class: 'panel' }, h('summary', {}, 'Useful phrases 實用句式'),
        h('ul', { class: 'phrases' }, W.phrases.map((p) => h('li', {}, h('span', { html: SH.inline(p) }), ui.sayBtn(p.replace(/\*/g, '')))))));
    }

    // 4. Write
    const ta = h('textarea', { class: 'essay', rows: 8, placeholder: 'Write your answer in English here. It is saved on this device.', 'aria-label': 'Your answer' });
    ta.value = SH.store.essay(cid, W.uid);
    const wc = h('span', { class: 'muted' });
    const updWC = () => (wc.textContent = (ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0) + ' words');
    ta.addEventListener('input', () => { SH.store.essay(cid, W.uid, ta.value); updWC(); });
    updWC();
    const checkOut = h('div', { class: 'checkout' });
    root.appendChild(h('div', { class: 'panel open' }, h('h4', {}, 'Your answer'), ta,
      h('div', { class: 'row between' }, wc,
        h('button', { class: 'btn primary', onclick: () => selfCheck() }, 'Check key points')),
      checkOut));

    function selfCheck() {
      checkOut.innerHTML = '';
      if (!ta.value.trim()) {
        checkOut.appendChild(h('p', { class: 'muted' }, 'Write something first, even 2–3 sentences. Then check which key points you covered.'));
        return;
      }
      let hit = 0;
      const ul = h('ul', { class: 'kp' });
      W.points.forEach((p) => {
        const ok = pointHit(p, ta.value);
        if (ok) hit++;
        ul.appendChild(h('li', { class: ok ? 'ok' : 'miss' }, h('span', { class: 'kp-i' }, ok ? '✓' : '○'), ui.bi(p.en, p.zh, { say: false, inline: true })));
      });
      const pctv = nPts ? hit / nPts : 0;
      checkOut.append(
        h('p', {}, h('b', {}, `${hit} / ${nPts} key points found`), ' — ', pctv >= 0.75 ? 'strong answer.' : pctv >= 0.5 ? 'good start; add the missing points.' : 'add more of the key ideas below.'),
        ul,
        h('p', { class: 'muted small' }, 'This checks for key words only. A real examiner also rewards clear sentences and correct reasoning.'));
      SH.store.recordAnswer(cid, W.uid, pctv >= 0.6);
      if (pctv >= 0.6) SH.award(cid, 15 + hit * 3, 'Written answer');
    }

    // 5. Model answer
    const sentences = splitSentences(W.model || '');
    root.appendChild(h('details', { class: 'panel' }, h('summary', {}, 'Model answer 參考答案'),
      h('div', { class: 'model' }, sentences.map((s) => h('p', {}, h('span', { html: SH.inline(s) }), ' ', ui.sayBtn(s)))),
      W.modelZh ? ui.bi('', W.modelZh, { say: false, force: 'both' }) : null,
      h('div', { class: 'row gap' },
        sentences.length >= 3 ? h('button', { class: 'btn', onclick: () => builder(root, cid, W) }, 'Rebuild it (answer builder)') : null,
        h('button', { class: 'btn', onclick: () => cloze(root, cid, W) }, 'Fill the gaps'))));
  }

  /* --------- Answer builder: put the model answer back in order --------- */
  function builder(root, cid, W) {
    const ui = SH.ui;
    const sentences = splitSentences(W.model).map((s, i) => ({ s, i }));
    let pool = shuffle(sentences);
    while (pool.length > 2 && pool.every((x, k) => x.i === k)) pool = shuffle(sentences);
    const placed = [];
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'game-head' }, h('h3', {}, 'Answer builder'), h('button', { class: 'btn ghost', onclick: () => written(root, cid, W) }, 'Back to question')));
    root.appendChild(h('div', { class: 'qtext md small', html: md(W.q) }));
    root.appendChild(h('p', { class: 'muted' }, 'A good answer flows: topic sentence → explanation → example → conclusion. Tap the sentences in order. 留意連接詞 (First, However, Therefore...) 係線索。'));
    const target = h('ol', { class: 'otarget' });
    const src = h('div', { class: 'osrc' });
    const btn = h('button', { class: 'btn primary block', disabled: true, onclick: verify }, 'Check');
    root.append(target, src, btn);
    function draw() {
      target.innerHTML = '';
      src.innerHTML = '';
      placed.forEach((x, k) => target.appendChild(h('li', { class: 'ostep placed', onclick: () => { placed.splice(k, 1); pool.push(x); draw(); } }, h('span', { html: SH.inline(x.s) }))));
      pool.forEach((x, k) => src.appendChild(h('button', { class: 'ostep', onclick: () => { pool.splice(k, 1); placed.push(x); draw(); } }, h('span', { html: SH.inline(x.s) }))));
      btn.disabled = placed.length !== sentences.length;
    }
    function verify() {
      let right = 0;
      Array.from(target.children).forEach((li, k) => {
        const ok = placed[k].i === k;
        right += ok ? 1 : 0;
        li.classList.add(ok ? 'ok' : 'no');
        li.onclick = null;
      });
      btn.remove();
      const perfect = right === sentences.length;
      SH.beep(perfect ? 'great' : 'bad');
      SH.award(cid, perfect ? 20 : right * 2, perfect ? 'Perfect flow' : null);
      root.appendChild(h('div', { class: 'qexp' }, ui.stamp(perfect ? '啱' : '再試', perfect ? 'ok' : 'no'),
        h('p', {}, `${right} of ${sentences.length} sentences in the right place.`),
        h('div', { class: 'row gap' }, h('button', { class: 'btn', onclick: () => builder(root, cid, W) }, 'Again'), h('button', { class: 'btn primary', onclick: () => written(root, cid, W) }, 'Back to question'))));
    }
    draw();
  }

  /* --------- Cloze: fill the key words back into the model answer --------- */
  function cloze(root, cid, W, textOverride) {
    const ui = SH.ui;
    const text = textOverride || W.model;
    const L = SH.lecture(cid, W.lecture);
    // candidate words: glossary terms of the lecture + key-point keywords that appear in the text
    const cands = new Set();
    (L ? L.terms : []).forEach((t) => t.en.length > 3 && new RegExp('\\b' + t.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(text) && cands.add(t.en));
    (W.points || []).forEach((p) => (p.kw || []).forEach((k) => k.split('|').forEach((a) => a.length > 3 && text.toLowerCase().includes(a.toLowerCase()) && cands.add(a))));
    const words = shuffle(Array.from(cands)).slice(0, 6);
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'game-head' }, h('h3', {}, 'Fill the gaps'), h('button', { class: 'btn ghost', onclick: () => written(root, cid, W) }, 'Back to question')));
    if (words.length < 2) {
      root.appendChild(ui.empty('Not enough key words in this answer for a gap fill.'));
      return;
    }
    let html = SH.esc(text);
    const blanks = [];
    words.forEach((w) => {
      const re = new RegExp('\\b(' + SH.esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')\\b', 'i');
      const m = html.match(re);
      if (m && !blanks.find((b) => b.w.toLowerCase() === m[1].toLowerCase())) {
        const k = blanks.length;
        blanks.push({ w: m[1] });
        html = html.replace(re, `<span class="gap" data-k="${k}">______</span>`);
      }
    });
    html = html.replace(/\*\*([^*]+)\*\*/g, '$1');
    const para = h('div', { class: 'cloze-text', html: '<p>' + html + '</p>' });
    root.appendChild(para);
    const bank = h('div', { class: 'wordbank' });
    root.appendChild(h('p', { class: 'muted' }, 'Tap a gap, then tap the word that belongs there.'));
    root.appendChild(bank);
    let active = null;
    const gaps = SH.$$('.gap', para);
    gaps.forEach((g) => g.addEventListener('click', () => { gaps.forEach((x) => x.classList.remove('active')); g.classList.add('active'); active = g; }));
    if (gaps[0]) { gaps[0].classList.add('active'); active = gaps[0]; }
    let filled = 0, errors = 0;
    shuffle(blanks.map((b, k) => ({ w: b.w, k }))).forEach((b) => {
      const btn = h('button', { class: 'chip big', onclick: () => {
        if (!active) return;
        const k = Number(active.dataset.k);
        if (blanks[k].w.toLowerCase() === b.w.toLowerCase()) {
          active.textContent = blanks[k].w;
          active.classList.remove('active');
          active.classList.add('filled');
          btn.disabled = true;
          filled++;
          SH.beep('good');
          active = gaps.find((g) => !g.classList.contains('filled')) || null;
          if (active) active.classList.add('active');
          if (filled === blanks.length) {
            const xp = Math.max(4, 16 - errors * 3);
            SH.award(cid, xp, errors ? null : 'No mistakes');
            root.appendChild(h('div', { class: 'qexp' }, ui.stamp(errors ? '完成' : '啱', 'ok'),
              h('p', {}, errors ? errors + ' wrong tries. Read the full paragraph aloud once to remember it.' : 'Perfect. Now read the paragraph aloud once.'),
              ui.sayBtn(text.replace(/\*\*/g, ''))));
          }
        } else {
          errors++;
          SH.beep('bad');
          active.classList.add('bad');
          setTimeout(() => active && active.classList.remove('bad'), 400);
        }
      } }, b.w);
      bank.appendChild(btn);
    });
  }

  /* --------- Command word drill: which command word fits this task? --------- */
  function cmdDrill(root, cid) {
    const ws = SH.all(cid, 'written').filter((w) => w.cmd);
    if (ws.length < 3) {
      root.innerHTML = '';
      root.appendChild(SH.ui.empty('More written questions are needed for this drill.'));
      return;
    }
    let n = 0, right = 0;
    function play() {
      const W = SH.pick(ws);
      const ci = cmdInfo(W.cmd);
      if (!ci) return play();
      const others = shuffle(SH.commandWords.filter((c) => c.w !== ci.w)).slice(0, 3);
      root.innerHTML = '';
      root.appendChild(h('div', { class: 'game-head' }, h('h3', {}, 'What is this question asking?'), h('span', { class: 'chip' }, right + '/' + n)));
      root.appendChild(h('div', { class: 'qwrap' }, h('div', { class: 'qtext md', html: md(W.q) })));
      root.appendChild(h('p', { class: 'muted' }, 'Choose what a full-mark answer must do. 揀出答呢題要做嘅嘢。'));
      const opts = shuffle([ci, ...others]);
      const box = h('div', { class: 'opts' });
      opts.forEach((c) => box.appendChild(h('button', { class: 'opt', onclick: (e) => {
        n++;
        const ok = c === ci;
        if (ok) right++;
        SH.beep(ok ? 'good' : 'bad');
        Array.from(box.children).forEach((b, k) => { b.disabled = true; if (opts[k] === ci) b.classList.add('right'); });
        if (!ok) e.currentTarget.classList.add('wrong');
        if (ok) SH.award(cid, 5);
        root.appendChild(h('div', { class: 'qexp' }, h('p', {}, h('b', {}, ci.w), ' — ', ci.d), h('p', { lang: 'zh-HK', class: 'muted' }, ci.dz),
          h('button', { class: 'btn primary block', onclick: play }, 'Next')));
      } }, h('span', { class: 'opt-t' }, c.d))));
      root.appendChild(box);
    }
    play();
  }

  SH.exam = { written, builder, cloze, cmdDrill, cmdInfo, splitSentences, pointHit };
})();

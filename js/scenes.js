/* Study Helper — animated lessons ("Watch"): hand-made SVG scenes with subtitles and optional narration.
   A scene = a base drawing of shapes + a list of frames. Each frame moves / shows / recolours / relabels
   shapes by id, with CSS transitions doing the animation. Everything is offline. */
(function () {
  'use strict';
  const SH = window.SH;
  const { h } = SH;
  const scenes = (SH.scenes = {});
  const order = [];

  SH.addScene = function (sc) {
    scenes[sc.id] = sc;
    order.push(sc.id);
  };
  SH.scenesFor = function (cid, lids) {
    return order.map((id) => scenes[id]).filter((s) => s.course === cid && (!lids || !lids.length || lids.includes(s.lecture)));
  };

  /* ---------- drawing helpers used by scene files ----------
     Every helper returns an SVG string. Movable things are <g class="mv" id="..."> placed with a CSS transform. */
  const X = (s) => SH.esc(s);
  const D = (SH.draw = {
    // static box with a label (not movable unless id given)
    box(id, x, y, w, hgt, label, cls, sub) {
      return `<g class="mv ${cls || ''}" id="${id}" style="transform:translate(${x}px,${y}px)">
        <rect class="sc-box" width="${w}" height="${hgt}" rx="10"/>
        <text class="sc-lbl" x="${w / 2}" y="${sub ? hgt / 2 - 3 : hgt / 2 + 4}" text-anchor="middle">${X(label)}</text>
        ${sub ? `<text class="sc-sub" x="${w / 2}" y="${hgt / 2 + 12}" text-anchor="middle">${X(sub)}</text>` : ''}</g>`;
    },
    // round token (coin / certificate / message)
    tok(id, x, y, label, tone, r) {
      r = r || 15;
      return `<g class="mv tok ${tone || 'a'}" id="${id}" style="transform:translate(${x}px,${y}px)">
        <circle r="${r}" class="sc-tok"/><text class="sc-tokt" y="4" text-anchor="middle">${X(label)}</text></g>`;
    },
    // rectangle "chip" token (a document, a share certificate, an order ticket)
    chip(id, x, y, label, tone, w) {
      w = w || 58;
      return `<g class="mv chipt ${tone || 'a'}" id="${id}" style="transform:translate(${x}px,${y}px)">
        <rect class="sc-chip" x="${-w / 2}" y="-12" width="${w}" height="24" rx="6"/><text class="sc-chipt" y="4" text-anchor="middle">${X(label)}</text></g>`;
    },
    arrow(id, x1, y1, x2, y2, cls) {
      return `<g class="mv ${cls || ''}" id="${id}"><line class="sc-arrow" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#sc-head)"/></g>`;
    },
    text(id, x, y, str, cls, anchor) {
      return `<g class="mv" id="${id}" style="transform:translate(${x}px,${y}px)"><text class="${cls || 'sc-lbl'}" text-anchor="${anchor || 'middle'}">${X(str)}</text></g>`;
    },
    // horizontal bar (for amounts); width is set by scale later
    bar(id, x, y, w, hgt, tone, label) {
      return `<g class="mv barg ${tone || 'a'}" id="${id}" style="transform:translate(${x}px,${y}px)">
        <rect class="sc-bar" width="${w}" height="${hgt}" rx="4"/>${label ? `<text class="sc-sub" x="4" y="${hgt + 12}">${X(label)}</text>` : ''}</g>`;
    },
    raw(str) { return str; },
  });

  /* ---------- player ---------- */
  function mount(id, opts = {}) {
    const sc = scenes[id];
    if (!sc) return h('div', { class: 'empty' }, 'Animation not found.');
    const W = sc.w || 340, H = sc.h || 220;
    const wrap = h('div', { class: 'scene' + (opts.compact ? ' compact' : '') });
    const head = h('div', { class: 'scene-head' }, h('span', { class: 'scene-badge' }, '▶ Watch'), SH.ui.biTitle(sc.t, 'h4'));
    const stage = h('div', { class: 'scene-stage', html:
      `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${X(sc.t.en)}"><defs><marker id="sc-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="sc-headp"/></marker></defs>${sc.base(D)}</svg>` });
    const cap = h('div', { class: 'scene-cap', 'aria-live': 'polite' });
    const dots = h('div', { class: 'scene-dots' });
    let i = -1, playing = false, timer = null, narrate = false;
    const svg = stage.querySelector('svg');

    function apply(set) {
      for (const key in set) {
        const el = svg.querySelector('#' + CSS.escape(key));
        if (!el) continue;
        const v = set[key];
        if ('x' in v || 'y' in v || 's' in v) {
          const cur = el.__pos || parsePos(el);
          const nx = 'x' in v ? v.x : cur.x, ny = 'y' in v ? v.y : cur.y, ns = 's' in v ? v.s : cur.s;
          el.__pos = { x: nx, y: ny, s: ns };
          el.style.transform = `translate(${nx}px,${ny}px) scale(${ns})`;
        }
        if ('o' in v) el.style.opacity = v.o;
        if ('txt' in v) { const t = el.querySelector('text'); if (t) t.textContent = v.txt; }
        if ('sub' in v) { const t = el.querySelectorAll('text')[1]; if (t) t.textContent = v.sub; }
        if ('tone' in v) { el.classList.remove('a', 'g', 's', 'n', 'ok', 'bad'); el.classList.add(v.tone); }
        if ('w' in v) { const r = el.querySelector('rect'); if (r) r.setAttribute('width', Math.max(0, v.w)); }
        if ('pulse' in v) { el.classList.remove('pulse'); void el.getBBox; if (v.pulse) setTimeout(() => el.classList.add('pulse'), 20); }
      }
    }
    function parsePos(el) {
      const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(el.getAttribute('style') || '');
      return m ? { x: +m[1], y: +m[2], s: 1 } : { x: 0, y: 0, s: 1 };
    }
    function reset() {
      stage.querySelector('svg').innerHTML = `<defs><marker id="sc-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="sc-headp"/></marker></defs>${sc.base(D)}`;
      if (sc.init) apply(sc.init);
    }
    function go(n) {
      clearTimeout(timer);
      if (n < 0) n = 0;
      if (n >= sc.frames.length) { stop(); return; }
      if (n < i || i === -1) { reset(); for (let k = 0; k < n; k++) apply(sc.frames[k].set || {}); }
      else for (let k = i + 1; k < n; k++) apply(sc.frames[k].set || {});
      i = n;
      const f = sc.frames[i];
      apply(f.set || {});
      cap.innerHTML = '';
      cap.append(h('div', { class: 'cap-en', html: SH.inline(f.en) }));
      if (SH.ui.assist() !== 'off' && f.zh) cap.append(h('div', { class: 'cap-zh', lang: 'zh-HK', html: SH.inline(f.zh) }));
      Array.from(dots.children).forEach((d, k) => d.classList.toggle('on', k === i));
      if (playing) schedule(f);
    }
    function schedule(f) {
      const words = String(f.en).split(/\s+/).length;
      const ms = Math.max(3200, words * 330 + 900);
      if (narrate && window.speechSynthesis) {
        try {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(String(f.en).replace(/[*=`$\\{}]/g, ''));
          u.lang = 'en-GB';
          u.rate = SH.store.settings().ttsRate || 0.95;
          u.onend = () => { if (playing) timer = setTimeout(() => go(i + 1), 500); };
          speechSynthesis.speak(u);
          return;
        } catch (e) { /* fall back to timing */ }
      }
      timer = setTimeout(() => go(i + 1), ms);
    }
    function play() {
      playing = true;
      playBtn.textContent = '⏸';
      playBtn.setAttribute('aria-label', 'Pause');
      if (i >= sc.frames.length - 1 || i === -1) { i = -1; go(0); } else schedule(sc.frames[i]);
    }
    function stop() {
      playing = false;
      clearTimeout(timer);
      try { if (narrate) speechSynthesis.cancel(); } catch (e) {}
      playBtn.textContent = '▶';
      playBtn.setAttribute('aria-label', 'Play');
    }
    sc.frames.forEach((_, k) => dots.appendChild(h('button', { class: 'sdot', 'aria-label': 'Step ' + (k + 1), onclick: () => { stop(); go(k); } })));
    const playBtn = h('button', { class: 'btn primary scene-play', 'aria-label': 'Play', onclick: () => (playing ? stop() : play()) }, '▶');
    const ctr = h('div', { class: 'scene-ctr' },
      h('button', { class: 'btn', 'aria-label': 'Previous step', onclick: () => { stop(); go(i - 1); } }, '‹'),
      playBtn,
      h('button', { class: 'btn', 'aria-label': 'Next step', onclick: () => { stop(); go(i + 1); } }, '›'),
      h('label', { class: 'switch small' }, h('input', { type: 'checkbox', onchange: (e) => { narrate = e.target.checked; } }), h('span', {}, '🔊 Narrate')));
    wrap.append(head, stage, cap, dots, ctr);
    reset();
    go(0);
    // stop narration/timers when the scene leaves the page
    const obs = new MutationObserver(() => { if (!document.body.contains(wrap)) { stop(); obs.disconnect(); } });
    obs.observe(document.body, { childList: true, subtree: true });
    if (opts.onWatched) wrap.addEventListener('click', () => opts.onWatched(), { once: true });
    return wrap;
  }

  function list(root, cid, lids, startId) {
    const all = SH.scenesFor(cid, lids);
    root.innerHTML = '';
    if (!all.length) return root.appendChild(SH.ui.empty('No animations for this selection yet.'));
    let cur = Math.max(0, all.findIndex((s) => s.id === startId));
    const holder = h('div', {});
    const picker = h('div', { class: 'chips scroll-x' });
    function draw() {
      holder.innerHTML = '';
      holder.appendChild(mount(all[cur].id));
      Array.from(picker.children).forEach((b, k) => b.classList.toggle('on', k === cur));
      if (!SH.store.isRead(cid, 'scene.' + all[cur].id)) { SH.store.markRead(cid, 'scene.' + all[cur].id); SH.award(cid, 4); }
    }
    all.forEach((s, k) => {
      const L = SH.lecture(cid, s.lecture);
      picker.appendChild(h('button', { class: 'chip', onclick: () => { cur = k; draw(); } }, (L ? L.code + ' · ' : '') + s.t.en));
    });
    root.append(picker, holder);
    draw();
  }

  SH.scenePlayer = { mount, list };
})();

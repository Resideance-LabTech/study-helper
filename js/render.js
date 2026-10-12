/* Study Helper — shared render components: bilingual blocks, term links, formulas, stamps */
(function () {
  'use strict';
  const SH = window.SH;
  const { h, md, inline, speak } = SH;

  const assist = () => (SH.store.settings().examMode ? 'off' : SH.store.settings().assist);

  /* A speaker button that reads English (or Cantonese) aloud */
  function sayBtn(text, lang, label) {
    return h('button', {
      class: 'say',
      type: 'button',
      'aria-label': label || (lang === 'zh-HK' ? '用廣東話讀出' : 'Read aloud in English'),
      onclick: (e) => {
        e.stopPropagation();
        speak(text, lang || 'en-GB');
      },
    }, lang === 'zh-HK' ? '粵🔊' : '🔊');
  }

  /* Bilingual block: English is primary. Cantonese shows below / on tap / never, by setting. */
  function bi(en, zh, opts = {}) {
    const mode = opts.force || assist();
    const wrap = h('div', { class: 'bi ' + (opts.cls || '') });
    const enEl = h('div', { class: 'bi-en md', html: opts.inline ? `<p>${inline(en)}</p>` : md(en) });
    wrap.appendChild(enEl);
    if (opts.say !== false && en) enEl.prepend(sayBtn(en));
    if (!zh || mode === 'off') return wrap;
    const zhEl = h('div', { class: 'bi-zh md', lang: 'zh-HK', html: opts.inline ? `<p>${inline(zh)}</p>` : md(zh) });
    if (mode === 'both') {
      wrap.appendChild(zhEl);
    } else {
      zhEl.hidden = true;
      const openLabel = opts.inline ? '粵' : '粵 睇廣東話';
      const closeLabel = opts.inline ? '粵 ✕' : '收起廣東話';
      const btn = h('button', {
        class: 'zh-toggle' + (opts.inline ? ' mini' : ''),
        type: 'button',
        'aria-expanded': 'false',
        'aria-label': 'Show Cantonese',
        onclick: (e) => {
          e.stopPropagation();
          zhEl.hidden = !zhEl.hidden;
          btn.setAttribute('aria-expanded', String(!zhEl.hidden));
          btn.textContent = zhEl.hidden ? openLabel : closeLabel;
        },
      }, openLabel);
      wrap.appendChild(btn);
      wrap.appendChild(zhEl);
    }
    return wrap;
  }

  /* Title in both languages (short text, always both unless exam mode) */
  function biTitle(t, tag = 'h2', cls) {
    if (!t) return null;
    const en = typeof t === 'string' ? t : t.en;
    const zh = typeof t === 'string' ? '' : t.zh;
    return h(tag, { class: 'bt ' + (cls || '') }, h('span', { class: 'bt-en' }, en), zh && assist() !== 'off' ? h('span', { class: 'bt-zh', lang: 'zh-HK' }, zh) : null);
  }

  /* Wrap known glossary terms inside rendered text so they can be tapped */
  function linkTerms(root, terms, cid) {
    if (!terms || !terms.length) return root;
    const list = terms
      .filter((t) => t.en && t.en.length > 2)
      .map((t) => ({ t, re: t.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }))
      .sort((a, b) => b.t.en.length - a.t.en.length);
    if (!list.length) return root;
    const re = new RegExp('\\b(' + list.map((x) => x.re).join('|') + ')(s|es)?\\b', 'i');
    const used = new Set();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        n.parentElement.closest('.bi-en') && !n.parentElement.closest('button, .term, code, .fx, .bi-zh') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      let cur = node;
      let m;
      let guard = 0;
      while (cur && (m = cur.nodeValue.match(re)) && guard++ < 6) {
        const term = list.find((x) => x.t.en.toLowerCase() === m[1].toLowerCase());
        if (!term || used.has(term.t.en)) {
          // only link first occurrence; skip further ones in this node
          break;
        }
        used.add(term.t.en);
        const after = cur.splitText(m.index);
        const rest = after.splitText(m[0].length);
        const btn = h('button', { class: 'term', type: 'button', onclick: (e) => { e.stopPropagation(); termPop(term.t, cid); } }, after.nodeValue);
        after.replaceWith(btn);
        cur = rest;
      }
    }
    return root;
  }

  function termPop(t, cid) {
    SH.modal(
      h('div', { class: 'term-pop' },
        h('div', { class: 'tp-head' },
          h('h3', {}, t.en),
          sayBtn(t.en)),
        t.zh ? h('div', { class: 'tp-zh', lang: 'zh-HK' }, t.zh) : null,
        t.d ? h('div', { class: 'md tp-d', html: md(t.d) }) : null,
        t.dz ? h('div', { class: 'md tp-dz', lang: 'zh-HK', html: md(t.dz) }) : null,
        t.ex ? h('div', { class: 'md tp-ex', html: md('*Example:* ' + t.ex) }) : null,
        t.lecture ? h('div', { class: 'tp-src' }, 'From ' + (SH.lecture(cid, t.lecture) || {}).code) : null),
      { cls: 'sheet' });
  }

  /* Red seal stamp used for feedback & badges */
  function stamp(text, kind) {
    return h('div', { class: 'stamp ' + (kind || '') }, h('span', {}, text));
  }

  function formula(src) {
    return h('div', { class: 'formula', html: SH.fx(src) });
  }

  function chip(text, cls, onclick) {
    return h(onclick ? 'button' : 'span', { class: 'chip ' + (cls || ''), type: onclick ? 'button' : null, onclick }, text);
  }

  function progressBar(p, cls) {
    return h('div', { class: 'pbar ' + (cls || ''), role: 'progressbar', 'aria-valuenow': Math.round(p * 100), 'aria-valuemin': 0, 'aria-valuemax': 100 },
      h('div', { class: 'pbar-fill', style: { width: SH.clamp(p * 100, 0, 100) + '%' } }));
  }

  function ring(p, label, size = 44) {
    const r = size / 2 - 4;
    const c = 2 * Math.PI * r;
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="4"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - SH.clamp(p, 0, 1))}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
    return h('div', { class: 'ring' }, h('span', { html: svg }), h('span', { class: 'ring-label' }, label));
  }

  function empty(msg, action) {
    return h('div', { class: 'empty' }, h('p', {}, msg), action || null);
  }

  /* Section header with optional right-side control */
  function sectionHead(title, right) {
    return h('div', { class: 'shead' }, biTitle(title, 'h3'), right || null);
  }

  /* Confetti burst for big wins (respects reduced motion) */
  function confetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layer = h('div', { class: 'confetti', 'aria-hidden': 'true' });
    const colors = ['var(--accent)', 'var(--seal)', 'var(--gold)', 'var(--ink)'];
    for (let i = 0; i < 36; i++) {
      layer.appendChild(h('i', { style: { left: Math.random() * 100 + '%', background: colors[i % 4], animationDelay: Math.random() * 0.3 + 's', transform: `rotate(${Math.random() * 360}deg)` } }));
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1800);
  }

  SH.ui = { bi, biTitle, sayBtn, linkTerms, termPop, stamp, formula, chip, progressBar, ring, empty, sectionHead, confetti, assist };
})();

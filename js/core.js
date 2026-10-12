/* Study Helper — core utilities (no build step, classic script so it also runs from file://) */
(function () {
  'use strict';
  const SH = (window.SH = window.SH || {});

  /* ---------- DOM ---------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    append(el, kids);
    return el;
  }
  function append(el, kids) {
    for (const c of kids) {
      if (c == null || c === false) continue;
      if (Array.isArray(c)) append(el, c);
      else if (c instanceof Node) el.appendChild(c);
      else el.appendChild(document.createTextNode(String(c)));
    }
  }
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- random / math ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rint = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const round = (x, d = 2) => {
    const p = Math.pow(10, d);
    return Math.round((x + Number.EPSILON * Math.sign(x)) * p) / p;
  };
  function fmt(x, d = 2) {
    if (typeof x !== 'number' || !isFinite(x)) return String(x);
    let v = round(x, d);
    if (v === 0) v = 0; // avoid "-0"
    return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  const pct = (x, d = 2) => fmt(x * 100, d) + '%';
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /* ---------- text ---------- */
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Formula mini-language -> HTML.
     Supports \frac{a}{b}, x^{n}, x_{n}, \sum, \times, \cdot, \sqrt{x}, \Delta, greek letters, \le \ge \approx \ne \infty */
  const SYM = {
    times: '×', cdot: '·', sum: 'Σ', Delta: 'Δ', delta: 'δ', sigma: 'σ', mu: 'μ', Gamma: 'Γ', gamma: 'γ',
    Theta: 'Θ', theta: 'θ', rho: 'ρ', nu: 'ν', pi: 'π', alpha: 'α', beta: 'β', lambda: 'λ', phi: 'φ', Phi: 'Φ',
    le: '≤', ge: '≥', approx: '≈', ne: '≠', infty: '∞', to: '→', pm: '±', div: '÷', ln: 'ln', max: 'max', min: 'min', partial: '∂',
  };
  function fx(src) {
    let i = 0;
    const s = String(src);
    function group() {
      // read {...} returning html
      if (s[i] !== '{') {
        // single token
        const ch = s[i++];
        return esc(ch || '');
      }
      i++; // {
      const out = seq('}');
      i++; // }
      return out;
    }
    function seq(end) {
      let out = '';
      while (i < s.length && s[i] !== end) {
        const c = s[i];
        if (c === '\\') {
          i++;
          let name = '';
          while (i < s.length && /[a-zA-Z]/.test(s[i])) name += s[i++];
          if (name === 'frac') {
            const a = group();
            const b = group();
            out += `<span class="fx-frac"><span class="fx-num">${a}</span><span class="fx-den">${b}</span></span>`;
          } else if (name === 'sqrt') {
            out += `<span class="fx-sqrt">√<span class="fx-rad">${group()}</span></span>`;
          } else if (name === 'text') {
            out += `<span class="fx-text">${group()}</span>`;
          } else if (SYM[name]) {
            out += `<span class="fx-sym">${SYM[name]}</span>`;
          } else if (name === '') {
            out += esc(s[i++] || '');
          } else out += esc(name);
        } else if (c === '^') {
          i++;
          out += `<sup>${group()}</sup>`;
        } else if (c === '_') {
          i++;
          out += `<sub>${group()}</sub>`;
        } else if (c === '{') {
          out += group();
        } else {
          out += esc(c);
          i++;
        }
      }
      return out;
    }
    return `<span class="fx">${seq(undefined)}</span>`;
  }

  /* Markdown-lite -> HTML. Paragraphs, "- " bullets, "1. " lists, **bold**, *em*, ==mark==, `code`, $formula$ */
  function inline(t) {
    // pull formulas out first
    const parts = String(t).split(/(\$[^$]+\$)/g);
    return parts
      .map((p) => {
        if (p.startsWith('$') && p.endsWith('$') && p.length > 2) return fx(p.slice(1, -1));
        return esc(p)
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/==([^=]+)==/g, '<mark>$1</mark>')
          .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
          .replace(/`([^`]+)`/g, '<code>$1</code>');
      })
      .join('');
  }
  function md(text) {
    if (!text) return '';
    const lines = String(text).split('\n');
    let html = '';
    let list = null;
    let para = [];
    const flushPara = () => {
      if (para.length) {
        html += `<p>${inline(para.join(' '))}</p>`;
        para = [];
      }
    };
    const flushList = () => {
      if (list) {
        html += `<${list.type}>${list.items.map((x) => `<li>${inline(x)}</li>`).join('')}</${list.type}>`;
        list = null;
      }
    };
    for (const raw of lines) {
      const line = raw.trim();
      let m;
      if (!line) {
        flushPara();
        flushList();
      } else if ((m = line.match(/^[-•]\s+(.*)/))) {
        flushPara();
        if (!list || list.type !== 'ul') {
          flushList();
          list = { type: 'ul', items: [] };
        }
        list.items.push(m[1]);
      } else if ((m = line.match(/^\d+[.)]\s+(.*)/))) {
        flushPara();
        if (!list || list.type !== 'ol') {
          flushList();
          list = { type: 'ol', items: [] };
        }
        list.items.push(m[1]);
      } else if ((m = line.match(/^#{1,3}\s+(.*)/))) {
        flushPara();
        flushList();
        html += `<h4>${inline(m[1])}</h4>`;
      } else {
        flushList();
        para.push(line);
      }
    }
    flushPara();
    flushList();
    return html;
  }
  const mdEl = (text, cls) => h('div', { class: 'md ' + (cls || ''), html: md(text) });

  /* ---------- speech (works offline when the phone has the voice installed) ---------- */
  let voices = [];
  function loadVoices() {
    try {
      voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    } catch (e) {
      voices = [];
    }
  }
  if (window.speechSynthesis) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }
  function speak(text, lang) {
    if (!window.speechSynthesis) {
      toast('Speech is not available on this device');
      return;
    }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/[*=`$\\{}]/g, ''));
      u.lang = lang || 'en-GB';
      const want = u.lang.toLowerCase();
      const v =
        voices.find((v) => v.lang.toLowerCase() === want) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(want.slice(0, 2)) && (want !== 'zh-hk' || /hk|yue|canton/i.test(v.lang + v.name)));
      if (v) u.voice = v;
      u.rate = SH.store ? SH.store.settings().ttsRate || 0.95 : 0.95;
      speechSynthesis.speak(u);
    } catch (e) {
      /* ignore */
    }
  }

  /* ---------- toast & modal ---------- */
  function toast(msg, kind) {
    const layer = $('#toast-layer');
    if (!layer) return;
    const t = h('div', { class: 'toast ' + (kind || '') }, msg);
    layer.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }
  function modal(content, opts = {}) {
    const layer = $('#modal-layer');
    const close = () => {
      wrap.remove();
      document.removeEventListener('keydown', onKey);
      opts.onClose && opts.onClose();
    };
    const onKey = (e) => e.key === 'Escape' && close();
    const box = h('div', { class: 'modal-box ' + (opts.cls || ''), role: 'dialog', 'aria-modal': 'true' });
    const wrap = h('div', { class: 'modal-wrap', onclick: (e) => e.target === wrap && close() }, box);
    box.appendChild(h('button', { class: 'modal-x', 'aria-label': 'Close', onclick: close }, '✕'));
    box.appendChild(typeof content === 'function' ? content(close) : content);
    layer.appendChild(wrap);
    document.addEventListener('keydown', onKey);
    return close;
  }

  /* ---------- haptics / sound ---------- */
  function buzz(pattern) {
    try {
      if (SH.store && !SH.store.settings().haptics) return;
      navigator.vibrate && navigator.vibrate(pattern);
    } catch (e) {}
  }
  let actx = null;
  function beep(kind) {
    try {
      if (!SH.store || !SH.store.settings().sound) return;
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = kind === 'good' ? [660, 880] : kind === 'great' ? [660, 880, 1175] : kind === 'bad' ? [220, 165] : [440];
      notes.forEach((f, k) => {
        const o = actx.createOscillator();
        const g = actx.createGain();
        o.type = kind === 'bad' ? 'triangle' : 'sine';
        o.frequency.value = f;
        const t0 = actx.currentTime + k * 0.09;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        o.connect(g).connect(actx.destination);
        o.start(t0);
        o.stop(t0 + 0.18);
      });
    } catch (e) {}
  }

  /* ---------- dates ---------- */
  const today = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

  /* One-line version of a question for lists and reviews */
  function qShort(text, n) {
    const t = String(text).replace('%%BOOK%%', '[order book]').replace(/\s*\n+\s*/g, ' ').trim();
    return n && t.length > n ? t.slice(0, n - 1) + '…' : t;
  }

  function scrollTop() {
    window.scrollTo(0, 0);
    const v = document.getElementById('view');
    if (v) v.scrollTop = 0;
  }

  Object.assign(SH, { qShort, scrollTop, h, $, $$, rnd, rint, pick, shuffle, round, fmt, pct, clamp, esc, fx, md, mdEl, inline, speak, toast, modal, buzz, beep, today, dayDiff });
})();

/* Study Helper — interactive labs embedded in concept cards (COMP7802) */
(function () {
  'use strict';
  const SH = window.SH;
  const { h, fmt } = SH;
  const L = (SH.labs = {});

  function slider(label, min, max, step, value, onInput, suffix) {
    const out = h('b', {}, fmt(value, step < 1 ? 2 : 0) + (suffix || ''));
    const inp = h('input', { type: 'range', min, max, step, value, 'aria-label': label });
    inp.addEventListener('input', () => {
      out.textContent = fmt(Number(inp.value), step < 1 ? 2 : 0) + (suffix || '');
      onInput(Number(inp.value));
    });
    return h('label', { class: 'lab-sl' }, h('span', {}, label), inp, out);
  }

  /* ---------- Payoff diagram ---------- */
  L.payoff = function () {
    const st = { strat: 'long straddle', K1: 100, K2: 110, prem: 8 };
    const strats = ['long call', 'short call', 'long put', 'short put', 'long straddle', 'short straddle', 'long strangle', 'short strangle'];
    const zh = { 'long call': '買認購', 'short call': '沽認購', 'long put': '買認沽', 'short put': '沽認沽', 'long straddle': '買跨式', 'short straddle': '沽跨式', 'long strangle': '買勒束式', 'short strangle': '沽勒束式' };
    const svgBox = h('div', { class: 'lab-chart' });
    const info = h('div', { class: 'lab-info small' });
    const sel = h('select', { 'aria-label': 'Strategy', onchange: (e) => { st.strat = e.target.value; draw(); } },
      strats.map((s) => h('option', { value: s, selected: s === st.strat }, s + ' · ' + zh[s])));
    const k2wrap = h('div', {}, slider('Call strike (strangle)', 100, 140, 1, st.K2, (v) => { st.K2 = v; draw(); }));
    function draw() {
      k2wrap.hidden = !st.strat.includes('strangle');
      if (st.K2 < st.K1) st.K2 = st.K1;
      const W = 320, H = 200, pad = 28;
      const xs = [], lo = 50, hi = 160;
      let ymin = Infinity, ymax = -Infinity;
      for (let s = lo; s <= hi; s += 1) {
        const y = SH.optPayoff(st.strat, s, st.K1, st.K2, st.prem);
        xs.push([s, y]);
        ymin = Math.min(ymin, y);
        ymax = Math.max(ymax, y);
      }
      ymin = Math.min(ymin, -5);
      ymax = Math.max(ymax, 5);
      const X = (s) => pad + ((s - lo) / (hi - lo)) * (W - pad * 1.5);
      const Y = (y) => H - pad - ((y - ymin) / (ymax - ymin)) * (H - pad * 1.6);
      const path = xs.map(([s, y], i) => (i ? 'L' : 'M') + X(s).toFixed(1) + ' ' + Y(y).toFixed(1)).join(' ');
      // break-evens
      const be = [];
      for (let i = 1; i < xs.length; i++) {
        const [s0, y0] = xs[i - 1], [, y1] = xs[i];
        if (y0 === 0 && (i === 1 || xs[i - 2][1] !== 0)) be.push(s0);
        else if (y0 !== 0 && y1 !== 0 && Math.sign(y0) !== Math.sign(y1)) be.push(Math.round((s0 + y0 / (y0 - y1)) * 10) / 10);
      }
      const isShort = st.strat.startsWith('short');
      svgBox.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Profit at expiry for a ${st.strat}">
        <line x1="${pad}" x2="${W - pad / 2}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--muted)" stroke-dasharray="3 3"/>
        <line x1="${X(st.K1)}" x2="${X(st.K1)}" y1="${pad / 2}" y2="${H - pad}" stroke="var(--line)"/>
        ${st.strat.includes('strangle') ? `<line x1="${X(st.K2)}" x2="${X(st.K2)}" y1="${pad / 2}" y2="${H - pad}" stroke="var(--line)"/>` : ''}
        <path d="${path}" fill="none" stroke="${isShort ? 'var(--seal)' : 'var(--accent)'}" stroke-width="3" stroke-linejoin="round"/>
        <text x="${W - pad / 2}" y="${Y(0) - 4}" text-anchor="end" font-size="10" fill="var(--muted)">profit 0</text>
        <text x="${X(st.K1)}" y="${H - pad + 12}" text-anchor="middle" font-size="10" fill="var(--muted)">K ${st.K1}</text>
        ${st.strat.includes('strangle') ? `<text x="${X(st.K2)}" y="${H - pad + 22}" text-anchor="middle" font-size="10" fill="var(--muted)">K ${st.K2}</text>` : ''}
        ${be.map((b) => `<circle cx="${X(b)}" cy="${Y(0)}" r="4" fill="var(--gold)"/><text x="${X(b)}" y="${Y(0) + 16}" text-anchor="middle" font-size="10" fill="var(--ink)">${b}</text>`).join('')}
        <text x="${pad}" y="${H - 4}" font-size="10" fill="var(--muted)">S_T ${lo}</text>
        <text x="${W - pad / 2}" y="${H - 4}" text-anchor="end" font-size="10" fill="var(--muted)">${hi}</text>
      </svg>`;
      const maxP = Math.max(...xs.map((p) => p[1])), minP = Math.min(...xs.map((p) => p[1]));
      const unlimitedUp = ['long call', 'long straddle', 'long strangle'].includes(st.strat);
      const unlimitedDown = ['short call', 'short straddle', 'short strangle'].includes(st.strat);
      info.innerHTML = `Break-even: <b>${be.length ? be.join(' and ') : '—'}</b> · Max profit: <b>${unlimitedUp ? 'unlimited ↑' : fmt(maxP, 0)}</b> · Max loss: <b>${unlimitedDown ? 'unlimited ↓' : fmt(minP, 0)}</b>`;
    }
    const box = h('div', { class: 'lab' },
      h('h4', {}, 'Payoff lab 回報實驗室'),
      h('p', { class: 'small muted' }, 'Profit at expiry (premium included). Change the strategy and strikes.'),
      sel,
      slider('Strike / put strike K', 70, 130, 1, st.K1, (v) => { st.K1 = v; draw(); }),
      k2wrap,
      slider('Total premium', 1, 25, 1, st.prem, (v) => { st.prem = v; draw(); }),
      svgBox, info);
    draw();
    return box;
  };

  /* ---------- Binomial tree ---------- */
  function binomTree(S, X, r, sig, T, n, call, american) {
    const dt = T / n, u = Math.exp(sig * Math.sqrt(dt)), d = 1 / u, p = (Math.exp(r * dt) - d) / (u - d), disc = Math.exp(-r * dt);
    const stock = [], opt = [];
    for (let i = 0; i <= n; i++) {
      stock[i] = [];
      for (let j = 0; j <= i; j++) stock[i][j] = S * Math.pow(u, i - j) * Math.pow(d, j);
    }
    opt[n] = stock[n].map((s) => Math.max(0, call ? s - X : X - s));
    for (let i = n - 1; i >= 0; i--) {
      opt[i] = [];
      for (let j = 0; j <= i; j++) {
        let v = disc * (p * opt[i + 1][j] + (1 - p) * opt[i + 1][j + 1]);
        if (american) v = Math.max(v, call ? stock[i][j] - X : X - stock[i][j]);
        opt[i][j] = v;
      }
    }
    return { stock, opt, u, d, p, price: opt[0][0] };
  }
  SH.binomTree = binomTree;

  L.binomial = function () {
    const st = { S: 70, X: 80, r: 0.12, sig: 0.2, T: 0.25, n: 3, call: true, am: false };
    const svgBox = h('div', { class: 'lab-chart' });
    const info = h('div', { class: 'lab-info small' });
    function draw() {
      const t = binomTree(st.S, st.X, st.r, st.sig, st.T, st.n, st.call, st.am);
      const bs = SH.bs(st.S, st.X, st.r, st.sig, st.T);
      const W = 330, H = 40 + st.n * 46, colW = (W - 60) / Math.max(1, st.n);
      let s = '';
      const pos = (i, j) => [30 + i * colW, H / 2 + (j - i / 2) * 44];
      for (let i = 0; i < st.n; i++) for (let j = 0; j <= i; j++) {
        const [x1, y1] = pos(i, j), [xa, ya] = pos(i + 1, j), [xb, yb] = pos(i + 1, j + 1);
        s += `<line x1="${x1}" y1="${y1}" x2="${xa}" y2="${ya}" stroke="var(--line)"/><line x1="${x1}" y1="${y1}" x2="${xb}" y2="${yb}" stroke="var(--line)"/>`;
      }
      for (let i = 0; i <= st.n; i++) for (let j = 0; j <= i; j++) {
        const [x, y] = pos(i, j);
        s += `<circle cx="${x}" cy="${y}" r="3" fill="var(--accent)"/><text x="${x}" y="${y - 6}" text-anchor="middle" font-size="9" fill="var(--ink)">${fmt(t.stock[i][j], 1)}</text><text x="${x}" y="${y + 13}" text-anchor="middle" font-size="9" fill="var(--gold)">${fmt(t.opt[i][j], 2)}</text>`;
      }
      svgBox.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Binomial tree">${s}</svg>`;
      info.innerHTML = `u = ${fmt(t.u, 4)} · d = ${fmt(t.d, 4)} · p = ${fmt(t.p, 4)}<br><b>${st.am ? 'American' : 'European'} ${st.call ? 'call' : 'put'}: ${fmt(t.price, 4)}</b> · Black-Scholes (European): ${fmt(st.call ? bs.C : bs.P, 4)}<br><span class="muted">Top number = stock price, gold number = option value. Values are computed backwards from the right.</span>`;
    }
    const seg = h('div', { class: 'seg' },
      h('button', { class: 'on', onclick: (e) => { st.call = true; segOn(e); draw(); } }, 'Call'),
      h('button', { onclick: (e) => { st.call = false; segOn(e); draw(); } }, 'Put'));
    function segOn(e) { Array.from(seg.children).forEach((b) => b.classList.toggle('on', b === e.currentTarget)); }
    const box = h('div', { class: 'lab' },
      h('h4', {}, 'Binomial tree lab 二項式樹實驗室'),
      h('p', { class: 'small muted' }, 'Lecture example: S = 70, X = 80, r = 12%, σ = 20%, 3 months. Increase the steps to see convergence to Black-Scholes.'),
      h('div', { class: 'row gap wrap' }, seg, h('label', { class: 'switch' }, h('input', { type: 'checkbox', onchange: (e) => { st.am = e.target.checked; draw(); } }), h('span', {}, 'American'))),
      slider('Steps n', 1, 6, 1, st.n, (v) => { st.n = v; draw(); }),
      slider('Stock S', 50, 100, 1, st.S, (v) => { st.S = v; draw(); }),
      slider('Volatility σ', 0.05, 0.6, 0.01, st.sig, (v) => { st.sig = v; draw(); }),
      svgBox, info);
    draw();
    return box;
  };

  /* ---------- Monte Carlo ---------- */
  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  L.montecarlo = function () {
    const st = { S: 100, X: 100, r: 0.05, sig: 0.25, T: 1, N: 2000 };
    const svgBox = h('div', { class: 'lab-chart' });
    const info = h('div', { class: 'lab-info small' });
    function run() {
      const steps = 50, dt = st.T / steps;
      const drift = (st.r - (st.sig * st.sig) / 2) * dt, vol = st.sig * Math.sqrt(dt);
      let sum = 0;
      const show = [];
      let mn = st.S, mx = st.S;
      for (let k = 0; k < st.N; k++) {
        let s = st.S;
        const path = k < 25 ? [s] : null;
        for (let i = 0; i < steps; i++) {
          s *= Math.exp(drift + vol * gauss());
          if (path) { path.push(s); mn = Math.min(mn, s); mx = Math.max(mx, s); }
        }
        if (path) show.push(path);
        sum += Math.max(0, s - st.X);
      }
      const mc = Math.exp(-st.r * st.T) * (sum / st.N);
      const bsC = SH.bs(st.S, st.X, st.r, st.sig, st.T).C;
      const W = 320, H = 180, pad = 22;
      const X = (i) => pad + (i / steps) * (W - pad * 1.5);
      const Y = (v) => H - pad - ((v - mn) / (mx - mn || 1)) * (H - pad * 1.6);
      const lines = show.map((p, k) => `<path d="${p.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ')}" fill="none" stroke="${k % 2 ? 'var(--accent)' : 'var(--gold)'}" stroke-opacity="0.55" stroke-width="1.2"/>`).join('');
      svgBox.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Simulated price paths">
        <line x1="${pad}" x2="${W - pad / 2}" y1="${Y(st.X)}" y2="${Y(st.X)}" stroke="var(--seal)" stroke-dasharray="4 3"/>
        <text x="${W - pad / 2}" y="${Y(st.X) - 4}" text-anchor="end" font-size="10" fill="var(--seal)">strike ${st.X}</text>${lines}</svg>`;
      info.innerHTML = `<b>Monte Carlo call ≈ ${fmt(mc, 3)}</b> (${st.N} paths) · Black-Scholes = ${fmt(bsC, 3)} · difference ${fmt(mc - bsC, 3)}<br><span class="muted">Each run uses new random numbers, so the estimate changes slightly. More paths → closer to Black-Scholes.</span>`;
    }
    const box = h('div', { class: 'lab' },
      h('h4', {}, 'Monte Carlo lab 蒙地卡羅實驗室'),
      h('p', { class: 'small muted' }, 'Simulates S(t+Δt) = S(t)·exp[(r − σ²/2)Δt + σε√Δt] and prices a European call. Showing 25 sample paths.'),
      slider('Paths', 200, 10000, 200, st.N, (v) => { st.N = v; }),
      slider('Volatility σ', 0.05, 0.6, 0.01, st.sig, (v) => { st.sig = v; }),
      slider('Strike X', 70, 130, 1, st.X, (v) => { st.X = v; }),
      h('button', { class: 'btn primary', onclick: run }, 'Run simulation'),
      svgBox, info);
    run();
    return box;
  };
})();

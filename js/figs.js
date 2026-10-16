/* Study Helper — static hand-drawn diagrams for concept cards (SVG, theme-aware, offline). */
(function () {
  'use strict';
  const SH = window.SH;
  const E = (s) => SH.esc(s);
  const svg = (w, hgt, body, label) => `<svg viewBox="0 0 ${w} ${hgt}" role="img" aria-label="${E(label)}"><defs><marker id="fg-h" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="sc-headp"/></marker></defs>${body}</svg>`;
  const box = (x, y, w, hgt, t, sub, cls) => `<g class="${cls || ''}" transform="translate(${x},${y})"><rect class="sc-box" width="${w}" height="${hgt}" rx="9"/><text class="sc-lbl" x="${w / 2}" y="${sub ? hgt / 2 - 2 : hgt / 2 + 4}" text-anchor="middle">${E(t)}</text>${sub ? `<text class="sc-sub" x="${w / 2}" y="${hgt / 2 + 12}" text-anchor="middle">${E(sub)}</text>` : ''}</g>`;
  const arr = (x1, y1, x2, y2) => `<line class="sc-arrow" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#fg-h)"/>`;
  const txt = (x, y, t, cls, anchor) => `<text class="${cls || 'sc-note'}" x="${x}" y="${y}" text-anchor="${anchor || 'middle'}">${E(t)}</text>`;
  const pill = (x, y, w, t, tone) => `<g class="chipt ${tone || 'a'}" transform="translate(${x},${y})"><rect class="sc-chip" x="${-w / 2}" y="-11" width="${w}" height="22" rx="6"/><text class="sc-chipt" y="4" text-anchor="middle">${E(t)}</text></g>`;

  const F = (SH.figs = {});

  /* FITE7407 L2: three views on holdings */
  F.views3 = () => svg(340, 150,
    box(8, 20, 100, 60, 'By customer', 'each depot') + box(120, 20, 100, 60, 'By security', 'total per ISIN') + box(232, 20, 100, 60, 'By depository', 'where it is held') +
    txt(58, 100, 'Who owns it?') + txt(170, 100, 'How much in total?') + txt(282, 100, 'Where is it?') +
    pill(170, 130, 230, 'Reconcile view 3 with the depositories\' lists', 's'), 'Three views on holdings');

  /* FITE7407 L4: three pillars of banking business */
  F.banking3 = () => svg(340, 170,
    box(8, 16, 100, 46, 'Distribution banks', 'sell it') + box(120, 16, 100, 46, 'Product banks', 'make it') + box(232, 16, 100, 46, 'Transaction banks', 'process it', 'hl') +
    txt(58, 82, 'advice · branches') + txt(58, 96, 'brands · loans') + txt(170, 82, 'fund houses') + txt(170, 96, 'investment banks') + txt(282, 82, 'custody · settlement') + txt(282, 96, 'white-label services') +
    arr(108, 39, 118, 39) + arr(220, 39, 230, 39) +
    pill(170, 140, 260, '"Banking is necessary, banks are not"', 'g'), 'Three pillars of banking');

  /* FITE7407 L4: risk map of a transaction bank (slide 27 layout) */
  F.riskmap = () => svg(340, 210,
    box(4, 88, 64, 40, 'Risks of', 'the bank') +
    box(82, 30, 82, 40, 'General', 'entrepreneurial') + box(82, 146, 82, 40, 'Bank-specific', 'risks') +
    arr(68, 100, 80, 56) + arr(68, 116, 80, 160) +
    box(178, 14, 74, 28, 'Operational') + box(178, 56, 74, 28, 'Economic') +
    box(178, 110, 74, 22, 'Strategic') + box(178, 136, 74, 22, 'Market price') + box(178, 162, 74, 22, 'Customer') + box(178, 188, 74, 20, 'Liquidity') +
    arr(164, 44, 176, 28) + arr(164, 54, 176, 70) + arr(164, 166, 176, 122) + arr(164, 166, 176, 196) +
    txt(296, 14, 'Level 4', 'sc-note') + ['Process', 'Staff', 'Technology', 'External', 'Law-related', 'Project'].map((t, k) => txt(296, 30 + k * 13, t, 'sc-sub')).join('') + arr(252, 28, 262, 28) +
    txt(296, 170, 'Currency / FX', 'sc-sub') + txt(296, 206, '(slide layout)', 'sc-sub'), 'Risk categories of a transaction bank');

  /* FITE7407 L5: value chain */
  F.valuechain = () => svg(340, 160,
    box(8, 18, 324, 44, 'Visible to customers: advice · marketing · sales') +
    box(8, 92, 324, 44, 'Hidden: sourcing · R&D · production') +
    pill(250, 76, 150, 'white-label outsourcing', 'g') + pill(90, 150, 150, 'likely to outsource', 'a') + arr(90, 140, 90, 138), 'The value chain');

  /* FITE7407 L5: accountability vs responsibility */
  F.accountability = () => svg(340, 170,
    box(8, 20, 140, 130, 'Outsourcing institution', 'ACCOUNTABILITY') + box(192, 20, 140, 130, 'Service provider', 'RESPONSIBILITY') +
    txt(78, 112, 'risk management', 'sc-sub') + txt(78, 126, 'internal controls', 'sc-sub') + txt(78, 140, 'internal audit', 'sc-sub') +
    txt(262, 112, 'business process A', 'sc-sub') + txt(262, 126, 'business process B', 'sc-sub') + txt(262, 140, '…', 'sc-sub') +
    arr(150, 70, 190, 70) + txt(170, 62, 'contract') + arr(190, 92, 150, 92) + txt(170, 104, 'reports'), 'Accountability vs responsibility');

  /* COMP7802 L2: day-count club */
  F.daycount = () => svg(340, 150,
    box(8, 14, 156, 120, 'ACT/360', 'most money markets') + box(176, 14, 156, 120, 'ACT/365', 'the exceptions') +
    ['USD', 'EUR', 'CHF', '…'].map((t, k) => pill(46 + (k % 2) * 80, 88 + Math.floor(k / 2) * 28, 60, t, 'n')).join('') +
    ['GBP', 'HKD', 'SGD', 'MYR', 'TWD', 'THB', 'ZAR'].map((t, k) => pill(206 + (k % 3) * 50, 82 + Math.floor(k / 3) * 22, 44, t, 'a')).join('') +
    txt(254, 148, '+ JPY CAD AUD NZD (domestic only)', 'sc-sub'), 'Day count conventions');

  /* COMP7802 L5: yield curve shapes */
  F.curves = () => svg(340, 150,
    `<line class="sc-arrow" x1="20" y1="130" x2="330" y2="130"/><line class="sc-arrow" x1="20" y1="130" x2="20" y2="12"/>` +
    `<path d="M24 110 C 90 70, 180 50, 326 40" fill="none" stroke="var(--accent)" stroke-width="3"/>` +
    `<path d="M24 80 C 120 80, 220 80, 326 80" fill="none" stroke="var(--gold)" stroke-width="3" stroke-dasharray="6 4"/>` +
    `<path d="M24 40 C 90 60, 180 90, 326 105" fill="none" stroke="var(--seal)" stroke-width="3"/>` +
    txt(290, 34, 'positive', 'sc-lbl') + txt(290, 74, 'flat', 'sc-lbl') + txt(290, 122, 'negative', 'sc-lbl') + txt(170, 146, 'maturity →') + txt(30, 10, 'rate', 'sc-note', 'start'), 'Yield curve shapes');

  /* COMP7802 L4: swap legs */
  F.swaplegs = () => svg(340, 150,
    box(8, 40, 110, 64, 'Company A', 'borrowed fixed 8%') + box(222, 40, 110, 64, 'Company B', 'borrowed SOFR+0.8%') +
    arr(120, 60, 220, 60) + txt(170, 52, 'SOFR (floating)', 'sc-lbl') + arr(220, 88, 120, 88) + txt(170, 104, '8.3% (fixed)', 'sc-lbl') +
    txt(63, 126, 'net: SOFR − 0.3%', 'sc-lbl') + txt(277, 126, 'net: 9.1% fixed', 'sc-lbl') + txt(170, 146, 'Total gain 0.8% = (9.5 − 8.0) − (0.8 − 0.1)'), 'Interest rate swap legs');

  /* COMP7802 L3: FRA timeline */
  F.fratime = () => svg(340, 120,
    `<line class="sc-arrow" x1="14" y1="60" x2="330" y2="60" marker-end="url(#fg-h)"/>` +
    [[40, 'Trade date', 'FRA rate fixed', 0], [128, 'Fixing date', 'reference set', 0], [170, 'Settlement', 'paid, discounted', 1], [300, 'Maturity', 'period ends', 0]].map(([x, a, b, low]) =>
      `<line x1="${x}" y1="52" x2="${x}" y2="68" class="sc-arrow"/>` + (low ? txt(x, 84, a, 'sc-lbl') + txt(x, 95, b, 'sc-sub') : txt(x, 30, a, 'sc-lbl') + txt(x, 43, b, 'sc-sub'))).join('') +
    `<rect x="160" y="96" width="150" height="10" rx="4" fill="var(--accent)" opacity=".5"/>` + txt(235, 118, 'FRA period (e.g. 3 v 6)'), 'FRA timeline');

  /* COMP7802 L8: the Greeks at a glance */
  F.greeks = () => svg(340, 168,
    [['Δ Delta', '∂V / ∂S', 'share price'], ['Γ Gamma', '∂Δ / ∂S', 'change of delta'], ['ν Vega', '∂V / ∂σ', 'volatility'], ['Θ Theta', '∂V / ∂t', 'time decay'], ['ρ Rho', '∂V / ∂r', 'interest rate']].map(([a, b, c], k) =>
      box(8, 6 + k * 32, 324, 28, '', '') + txt(20, 24 + k * 32, a, 'sc-lbl', 'start') + txt(150, 24 + k * 32, b, 'sc-lbl') + txt(320, 24 + k * 32, c, 'sc-sub', 'end')).join(''), 'Option Greeks');

  /* COMP7802 L9: VaR determinants */
  F.vardet = () => svg(340, 150,
    box(8, 20, 100, 70, 'Distribution', 'of returns') + box(120, 20, 100, 70, 'Confidence', '95% · 99%') + box(232, 20, 100, 70, 'Horizon', '1 day · 10 days') +
    pill(170, 116, 300, 'e.g. 99% one-day VaR = $2m', 'g') + txt(170, 144, 'Same horizon and confidence before comparing!'), 'VaR determinants');
})();

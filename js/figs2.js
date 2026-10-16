/* Study Helper — diagram toolkit + per-topic diagrams (part 2). Hand-drawn SVG, theme-aware, offline.
   Templates lay themselves out in a 340-wide view box and wrap text, so each diagram is a few lines of data. */
(function () {
  'use strict';
  const SH = window.SH;
  const E = (s) => SH.esc(String(s));
  const W = 340;

  /* ---------- primitives ---------- */
  function wrap(str, max) {
    const words = String(str || '').split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  const svg = (hgt, body, label) => `<svg viewBox="0 0 ${W} ${Math.ceil(hgt)}" role="img" aria-label="${E(label)}"><defs><marker id="f2-h" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="sc-headp"/></marker></defs>${body}</svg>`;
  const arr = (x1, y1, x2, y2, dash) => `<line class="sc-arrow" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#f2-h)"${dash ? ' stroke-dasharray="4 3"' : ''}/>`;
  const line = (x1, y1, x2, y2) => `<line class="sc-arrow" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const txt = (x, y, t, cls, anchor) => `<text class="${cls || 'sc-note'}" x="${x}" y="${y}" text-anchor="${anchor || 'middle'}">${E(t)}</text>`;
  const pill = (x, y, w, t, tone) => `<g class="chipt ${tone || 'a'}" transform="translate(${x},${y})"><rect class="sc-chip" x="${-w / 2}" y="-11" width="${w}" height="22" rx="6"/><text class="sc-chipt" y="4" text-anchor="middle">${E(t)}</text></g>`;
  /* box with wrapped title (11px) and sub (9.5px); returns {s, h} */
  function tbox(x, y, w, title, sub, cls, minH, pad) {
    pad = pad || 0;
    const tl = wrap(title, Math.max(6, Math.floor((w - 10) / 6.1)));
    const sl = sub ? wrap(sub, Math.max(8, Math.floor((w - 10) / 5.0))) : [];
    const hgt = Math.max(minH || 0, 10 + pad + tl.length * 14.5 + sl.length * 12.5 + 6);
    let yy = y + pad + (hgt - pad - (tl.length * 14.5 + sl.length * 12.5)) / 2 + 10;
    let s = `<g class="${cls || ''}"><rect class="sc-box" x="${x}" y="${y}" width="${w}" height="${hgt}" rx="9"/>`;
    tl.forEach((l) => { s += txt(x + w / 2, yy, l, 'sc-lbl'); yy += 14.5; });
    sl.forEach((l) => { s += txt(x + w / 2, yy - 1, l, 'sc-sub'); yy += 12.5; });
    return { s: s + '</g>', h: hgt };
  }
  const head = (t) => (t ? txt(W / 2, 14, t, 'sc-note') : '');
  const cls = (it) => (it[2] === 'hl' ? 'hl' : '');

  /* ---------- templates ---------- */
  const T = (SH.figT = {});
  /* steps in reading order, `cols` per row, arrows between them */
  T.flow = (title, items, o = {}) => {
    const cols = o.cols || Math.min(3, items.length), gap = 16, w = (W - 8 - gap * (cols - 1)) / cols;
    let y = title ? 24 : 6, s = head(title);
    for (let r = 0; r < items.length; r += cols) {
      const row = items.slice(r, r + cols).map((it, k) => tbox(4 + k * (w + gap), y, w, it[0], it[1], cls(it)));
      const rh = Math.max(...row.map((b) => b.h));
      row.forEach((b, k) => {
        s += tbox(4 + k * (w + gap), y, w, items[r + k][0], items[r + k][1], cls(items[r + k]), rh).s;
        if (k < row.length - 1) s += arr(4 + k * (w + gap) + w + 1, y + rh / 2, 4 + (k + 1) * (w + gap) - 1, y + rh / 2);
      });
      if (r + cols < items.length) {
        // connector: down from the last box, across to the first column, down into the next row
        const xs = 4 + (row.length - 1) * (w + gap) + w / 2, xf = 4 + w / 2, yb = y + rh;
        s += line(xs, yb, xs, yb + 8) + line(xs, yb + 8, xf, yb + 8) + arr(xf, yb + 8, xf, yb + 19);
        y = yb + 20;
      } else y += rh;
    }
    if (o.note) { s += pill(W / 2, y + 18, Math.min(330, o.note.length * 5.6 + 24), o.note, o.tone || 'g'); y += 32; }
    return svg(y + 6, s, title || items.map((i) => i[0]).join(', '));
  };
  /* side-by-side columns: heads [[title, sub, tone]], each column a list of lines */
  T.cols = (title, heads, colsItems, o = {}) => {
    const n = heads.length, gap = 8, w = (W - 8 - gap * (n - 1)) / n;
    let y = title ? 22 : 4, s = head(title);
    const hb = heads.map((hd, k) => tbox(4 + k * (w + gap), y, w, hd[0], hd[1], 'hl'));
    const hh = Math.max(...hb.map((b) => b.h));
    heads.forEach((hd, k) => { s += tbox(4 + k * (w + gap), y, w, hd[0], hd[1], 'hl', hh).s; });
    y += hh + 6;
    const rows = Math.max(...colsItems.map((c) => c.length));
    for (let r = 0; r < rows; r++) {
      const bs = colsItems.map((c, k) => (c[r] != null ? tbox(4 + k * (w + gap), y, w, Array.isArray(c[r]) ? c[r][0] : c[r], Array.isArray(c[r]) ? c[r][1] : '', '') : null));
      const rh = Math.max(...bs.map((b) => (b ? b.h : 0)));
      colsItems.forEach((c, k) => { if (c[r] != null) s += tbox(4 + k * (w + gap), y, w, Array.isArray(c[r]) ? c[r][0] : c[r], Array.isArray(c[r]) ? c[r][1] : '', '', rh).s; });
      y += rh + 5;
    }
    if (o.note) { s += pill(W / 2, y + 12, Math.min(330, o.note.length * 5.6 + 24), o.note, o.tone || 'g'); y += 26; }
    return svg(y + 4, s, title || heads.map((x) => x[0]).join(' vs '));
  };
  /* a root box with branches below it: items [[title, sub, 'hl'?]] laid out `cols` per row */
  T.tree = (title, root, items, o = {}) => {
    const cols = o.cols || Math.min(3, items.length), gap = 8, w = (W - 8 - gap * (cols - 1)) / cols;
    let y = title ? 22 : 4, s = head(title);
    const rw = Math.min(220, W - 40);
    const rb = tbox((W - rw) / 2, y, rw, root[0], root[1], 'hl');
    s += rb.s; y += rb.h;
    const busY = y + 10;
    s += line(W / 2, y, W / 2, busY);
    let first = true;
    for (let r = 0; r < items.length; r += cols) {
      const row = items.slice(r, r + cols);
      const off = (W - (row.length * w + (row.length - 1) * gap)) / 2;
      const bs = row.map((it, k) => tbox(off + k * (w + gap), 0, w, it[0], it[1], cls(it)));
      const rh = Math.max(...bs.map((b) => b.h));
      const top = first ? busY + 12 : y + 8;
      if (first) s += line(off + w / 2, busY, off + (row.length - 1) * (w + gap) + w / 2, busY);
      row.forEach((it, k) => {
        const cx = off + k * (w + gap) + w / 2;
        if (first) s += arr(cx, busY, cx, top - 1);
        s += tbox(off + k * (w + gap), top, w, it[0], it[1], cls(it), rh).s;
      });
      y = top + rh;
      first = false;
    }
    if (o.note) { s += pill(W / 2, y + 16, Math.min(330, o.note.length * 5.6 + 24), o.note, o.tone || 'g'); y += 28; }
    return svg(y + 6, s, title || root[0]);
  };
  /* timeline: points [[pos 0..1, label, sub]], spans [[from, to, label, tone]] */
  T.time = (title, points, spans = [], o = {}) => {
    const x0 = 22, x1 = W - 22, X = (p) => x0 + (x1 - x0) * p;
    let s = head(title), y = title ? 52 : 34;
    s += arr(x0 - 10, y, x1 + 12, y);
    points.forEach(([p, a, b], k) => {
      const up = o.alt ? k % 2 === 0 : true;
      s += line(X(p), y - 6, X(p), y + 6) + txt(X(p), up ? y - 12 : y + 22, a, 'sc-lbl') + (b ? txt(X(p), up ? y + 18 : y + 34, b, 'sc-sub') : '');
    });
    let yy = y + (o.alt ? 44 : 32);
    spans.forEach(([f, t, lab, tone]) => {
      s += `<rect x="${X(f)}" y="${yy}" width="${X(t) - X(f)}" height="9" rx="4" fill="var(--${tone || 'accent'})" opacity=".55"/>` + txt((X(f) + X(t)) / 2, yy + 21, lab, 'sc-sub');
      yy += 28;
    });
    if (o.note) { s += pill(W / 2, yy + 10, Math.min(330, o.note.length * 5.6 + 24), o.note, o.tone || 'g'); yy += 26; }
    return svg(yy + 4, s, title || 'timeline');
  };
  /* horizontal bars: [[label, value, tone, valueLabel]] */
  T.bars = (title, items, o = {}) => {
    const max = o.max || Math.max(...items.map((i) => i[1]));
    let s = head(title), y = title ? 26 : 8;
    const lw = o.lw || 110, vw = Math.max(...items.map((i) => String(i[3] != null ? i[3] : i[1]).length)) * 5.1 + 10, bw = W - lw - vw;
    items.forEach(([lab, v, tone, vl]) => {
      s += txt(lw - 6, y + 12, lab, 'sc-lbl', 'end') + `<rect x="${lw}" y="${y + 2}" width="${Math.max(2, (bw * v) / max)}" height="14" rx="4" fill="var(--${tone || 'accent'})"/>` + txt(lw + (bw * v) / max + 5, y + 13, vl != null ? vl : v, 'sc-sub', 'start');
      y += 24;
    });
    if (o.note) { s += pill(W / 2, y + 12, Math.min(330, o.note.length * 5.6 + 24), o.note, o.tone || 'g'); y += 26; }
    return svg(y + 4, s, title || 'bars');
  };
  /* x/y chart with paths: series [[pointsArray [[x,y]...] in 0..1, colorVar, label, dash]] */
  T.chart = (title, series, o = {}) => {
    const L = 34, R = W - 14, top = title ? 26 : 10, bot = top + (o.h || 120);
    const X = (p) => L + (R - L) * p, Y = (p) => bot - (bot - top) * p;
    let s = head(title) + arr(L, bot, R + 6, bot) + arr(L, bot, L, top - 6);
    if (o.xl) s += txt((L + R) / 2, bot + 24, o.xl, 'sc-sub');
    if (o.yl) s += txt(L - 4, top - 10, o.yl, 'sc-sub', 'start');
    (o.ticks || []).forEach(([p, t]) => { s += line(X(p), bot, X(p), bot + 4) + txt(X(p), bot + 13, t, 'sc-sub'); });
    (o.hlines || []).forEach(([p, t]) => { s += `<line x1="${L}" y1="${Y(p)}" x2="${R}" y2="${Y(p)}" stroke="var(--muted)" stroke-dasharray="3 3" stroke-width="1"/>` + txt(L + 3, Y(p) - 3, t, 'sc-sub', 'start'); });
    series.forEach(([pts, col, lab, dash, lp]) => {
      const P = pts.map(([x, y]) => [X(x), Y(y)]);
      let d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
      for (let k = 1; k < P.length; k++) {
        if (o.sharp || P.length < 3) { d += ' L' + P[k][0].toFixed(1) + ' ' + P[k][1].toFixed(1); continue; }
        // Catmull-Rom → cubic Bézier: a smooth curve through every point
        const p0 = P[k - 2] || P[k - 1], p1 = P[k - 1], p2 = P[k], p3 = P[k + 1] || p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
      }
      s += `<path d="${d}" fill="none" stroke="var(--${col})" stroke-width="2.6"${dash ? ' stroke-dasharray="6 4"' : ''} stroke-linejoin="round"/>`;
      if (lab) { const p = lp || pts[pts.length - 1]; s += `<text class="sc-lbl" x="${X(p[0])}" y="${Y(p[1]) - 6}" text-anchor="${p[0] > 0.8 ? 'end' : 'middle'}" style="fill:var(--${col})">${E(lab)}</text>`; }
    });
    (o.marks || []).forEach(([x, y, t, tone]) => { s += `<circle cx="${X(x)}" cy="${Y(y)}" r="4" fill="var(--${tone || 'seal'})"/>` + (t ? (x > 0.7 ? txt(X(x) - 7, Y(y) - 7, t, 'sc-sub', 'end') : txt(X(x) + 6, Y(y) - 6, t, 'sc-sub', 'start')) : ''); });
    let hgt = bot + (o.xl ? 30 : 18);
    if (o.note) { s += pill(W / 2, hgt + 8, Math.min(330, o.note.length * 5.6 + 24), o.note, o.tone || 'g'); hgt += 24; }
    return svg(hgt, s, title || 'chart');
  };
  /* a grid of tagged cards: [[tag, title, sub, tone]] */
  T.grid = (title, items, o = {}) => {
    const cols = o.cols || 2, gap = 8, w = (W - 8 - gap * (cols - 1)) / cols;
    let y = title ? 22 : 4, s = head(title);
    for (let r = 0; r < items.length; r += cols) {
      const row = items.slice(r, r + cols);
      const bs = row.map((it) => tbox(0, 0, w, it[1], it[2], '', 0, 8));
      const rh = Math.max(...bs.map((b) => b.h)) + 12;
      row.forEach((it, k) => {
        const x = 4 + k * (w + gap);
        s += tbox(x, y + 8, w, it[1], it[2], it[3] === 'hl' ? 'hl' : '', rh - 8, 8).s;
        if (it[0]) s += pill(x + 14 + it[0].length * 2.9, y + 8, it[0].length * 5.8 + 14, it[0], it[3] && it[3] !== 'hl' ? it[3] : 'a');
      });
      y += rh + 6;
    }
    if (o.note) { s += pill(W / 2, y + 10, Math.min(330, o.note.length * 5.6 + 24), o.note, o.tone || 'g'); y += 24; }
    return svg(y + 2, s, title || 'grid');
  };
  T.raw = (hgt, body, label) => svg(hgt, body, label);
  T.p = { txt, pill, arr, line, tbox };

  const F = SH.figs;
  const add = (o) => Object.assign(F, o);

  /* ======================= FITE7407 L1A ======================= */
  add({
    'f1.c1': () => T.tree('A security is a certificate for…', ['Security', 'issued by companies or governments'],
      [['Ownership', 'equity: shares'], ['Repayment of a loan', 'debt: bonds']],
      { note: 'Negotiable (tradeable) · Fungible (units are identical)' }),
    'f1.c2': () => T.tree('Grouped by the underlying', ['What stands behind it?'],
      [['Cash', 'cheques, swaps, coupons'], ['Goods', 'warehouse warrant, bill of lading'], ['Capital rights', 'receivables, ownership rights', 'hl']],
      { note: 'Course focus: fungible, negotiable securities on cash or capital' }),
    'f1.c3': () => T.flow('A classic paper security had two parts', [['Certificate', 'the right itself (e.g. share)'], ['Coupon sheet', 'cut off a coupon to collect interest / dividend']],
      { note: 'Same type = same rights → standardised → easy to trade' }),
    'f1.c5': () => T.grid('Four types of custody', [
      ['Pool', 'Collective custody', 'own a share of the pool; get back a similar piece', 'a'],
      ['Numbered', 'Individualised custody', 'the bank keeps your exact numbered pieces', 'g'],
      ['Abroad', 'Foreign custody', 'held by a bank in another country → a receivable right', 'n'],
      ['On chain', 'Digital / DLT custody', 'for securities issued on a distributed ledger', 's']]),
    'f1.c6': () => T.cols('Selling a security', [['Bearer / collective', 'no name on a register'], ['Registered', 'name on the register']],
      [['1. Agree price & ownership transfer', '2. Hand over certificate or transfer receivable rights at the depot bank'],
        ['1. Agree hand-over of certificates', '2. Hand over endorsed certificates', '3. Register the new owner with the issuer']]),
    'f1.c7': () => T.tree('An obligation (bond) gives receivable rights on', ['Obligation = debt security', 'bearer or registered owner'],
      [['Repayment', 'of the loan'], ['Interest', 'fixed or variable']],
      { note: 'Prospectus sets: pieces, nominal, interest, term, repayment, collateral' }),
    'f1.c8': () => T.grid('Four kinds of interest — relative to what?', [
      ['Nominal', 'Face value', 'the coupon rate', 'a'], ['Actual', 'Purchase price', 'what you paid', 'g'],
      ['Effective', 'Remaining period', 'yield over the time left', 'n'], ['Accrued', 'Since last coupon', 'buyer pays it to the seller', 's']]),
    'f1.c9': () => T.flow('The accrued-interest tax bucket', [['Buy a bond', 'pay accrued interest → enter as negative gain'], ['Hold', 'coupon received'], ['Net', 'coupon − accrued paid', 'hl']],
      { note: 'Only the resulting difference is taxable' }),
    'f1.c10': () => T.grid('Four ways a bond is repaid', [
      ['End', 'Full repayment', 'face value at the end of the term', 'a'], ['Steps', 'Regular redemption', 'parts repaid at intervals', 'g'],
      ['Lottery', 'Drawing by lot', 'random serial numbers repaid', 'n'], ['Constant', 'Annuity', 'same total payment; repayment share grows', 's']]),
    'f1.c11': () => T.grid('Risks of holding a bond', [
      ['Default', 'Credit risk', 'issuer cannot pay interest or face value', 's'], ['Rates ↑', 'Interest rate risk', 'fixed coupon → price falls when rates rise', 'g'],
      ['Called', 'Termination risk', 'repaid early when rates are low → reinvest low', 'n'], ['FX', 'Other risks', 'e.g. foreign exchange for foreign bonds', 'a']]),
    'f1.c12': () => T.cols('Shares: two classes', [['Common stock', 'legal & statutory rights'], ['Preferential shares', 'special rights']],
      [['Voting rights ✓', 'Dividend as decided'], ['Often higher dividend', 'Usually no voting rights']],
      { note: 'Both: certificate of shared ownership · bearer or registered' }),
    'f1.c13': () => T.cols('Who knows the owner?', [['Bearer shares', ''], ['Registered shares', '']],
      [['Transfer receivable rights at the depot bank', 'Issuer does NOT know its owners'],
        ['Also endorse + register with the company', 'Proceeds after endorsement', 'Voting only after registration']],
      { note: 'Restricted transferability: transfer needs the company\'s agreement', tone: 's' }),
    'f1.c14': () => T.flow('How a fund works', [['Investors', 'small amounts'], ['Fund house', 'offers & sells funds'], ['Fund manager', 'picks securities & ratios', 'hl'], ['Many instruments', 'diversified portfolio']],
      { cols: 2, note: 'Fund share = co-ownership of the fund capital' }),
    'f1.c15': () => T.cols('Types of funds', [['Open fund', ''], ['Open real estate', ''], ['Closed fund', '']],
      [['Shares issued continuously', 'Redeem any time', 'Capital variable'], ['Commercial property', 'Keeps liquid cash ratio', 'Valued each trading day'], ['Subscribe once', 'Fixed capital', 'No redemption — sell to others']]),
  });

  /* ======================= FITE7407 L1B ======================= */
  add({
    'f1b.c1': () => T.cols('Two kinds of exchange', [['Physical exchange', 'trading floor'], ['Computer exchange', 'e.g. XETRA']],
      [['Dealers and brokers', 'Spoken words, finger signs'], ['Electronic automatic matching', 'Price set & deal closed by the system']],
      { note: 'Both: a market with rules where buyers meet sellers' }),
    'f1b.c3': () => T.grid('Who is on the exchange?', [
      ['Members', 'Regular participants', 'banks, financial institutions', 'a'], ['Staff', 'Other participants', 'trade in the name of a member', 'n'],
      ['Price', 'Lead brokers', 'determine prices in segments', 'g'], ['Liquidity', 'Designated sponsors / DMMs', 'bridge gaps in supply & demand', 's']]),
    'f1b.c4': () => T.bars('German segments: how strict?', [['Official market', 100, 'accent', 'strictest'], ['Regulated market', 55, 'gold', 'reduced'], ['"Free" market', 18, 'muted', 'minimal']],
      { lw: 104, note: 'Official: BaFin prospectus · IFRS · ≥ 25% free float · ≥ 3 years' }),
    'f1b.c5': () => T.flow('Getting into the Hang Seng Index', [['Universe', 'primary listing on SEHK Main Board'], ['Eligibility', 'top 90% market cap AND top 90% turnover'], ['Selection', 'usually 24-month listing history', 'hl']],
      { note: 'Companies that stop complying are replaced' }),
    'f1b.c7': () => T.cols('How a price is found', [['Auction (spot price)', 'not continuously traded'], ['Continuous trading', '1:1 trades']],
      [['Collect all orders', 'Principle of largest execution', 'Skontro leader writes contract note'], ['Lead broker or system quotes bid/ask', 'Deal at that price for that trade']],
      { note: 'Shares: currency units · Bonds: % of face value' }),
    'f1b.c9': () => T.cols('Price notes', [['Trades executed', ''], ['No turnover', '']],
      [['Market cleared', 'Buying interest continued', 'Further offers existed', 'Scaling-down: some orders filled in part'], ['Only demand', 'Only supply', 'No price determined', 'Price estimated']]),
    'f1b.c10': () => T.flow('A floor trade: ABCD bid 34.00 / ask 34.80', [['Dealer', '"500 ABCD for you" (wants to sell)'], ['Lead broker', '"200 ABCD from you"'], ['Deal', '200 shares at 34.00', 'hl']],
      { note: 'A contract note records the trade for settlement' }),
    'f1b.c11': () => T.cols('IOC vs FOK — order for 1,000, only 600 available', [['IOC', 'Immediate or Cancel'], ['FOK', 'Fill or Kill']],
      [['600 execute now', '400 are deleted', 'Partial fill allowed'], ['Nothing executes', 'Whole order deleted', 'All or nothing']]),
    'f1b.c12': () => T.bars('How long does an order live?', [['Market, IOC, FOK, GFD', 1, 'muted', 'same day'], ['Limit order', 20, 'gold', 'month end'], ['Good-till-date', 89, 'accent', '≤ T+89'], ['Good-till-cancelled', 100, 'seal', 'until done']],
      { lw: 122, note: 'GTC: until executed, cancelled or the system maximum' }),
    'f1b.c13': () => T.chart('Stop orders: price falls through the stop', [[[[0, 0.85], [0.25, 0.75], [0.45, 0.62], [0.55, 0.5], [0.75, 0.38], [1, 0.3]], 'accent', 'price']],
      { h: 110, hlines: [[0.5, 'stop price']], marks: [[0.55, 0.5, 'stop hit']], xl: 'time', note: 'Stop-market → market order · Stop-limit → limit order' }),
    'f1b.c14': () => T.flow('Before the bank takes an order', [['Duties', 'expertise · customer interest · no conflicts'], ['KYC profile', 'risk class, experience, business, countries'], ['Order data', 'identity, beneficiary, static data', 'hl']],
      { note: 'Traceability: record orders, executions and staff' }),
    'f1b.c15': () => T.cols('Three trade types', [['Commission', 'bank = fiduciary'], ['Fixed price', 'bank = counterparty'], ['Internalised', 'bank = "exchange"']],
      [['Customer → bank → exchange → counterparty', 'Reported as commission trade'], ['Customer ↔ bank\'s own books', 'Negotiated fixed price'], ['Customer A ↔ bank ↔ customer B', 'Both beat the exchange price (no fees)']]),
    'f1b.c17': () => T.time('Trade date to settlement', [[0.05, 'T', 'trade'], [0.5, 'T+1', 'checks, funding, matching'], [0.95, 'T+2', 'DvP settlement']],
      [[0.05, 0.95, 'counterparty & settlement risk window', 'seal']], { note: 'T+0 would shrink the risk but needs real-time systems' }),
  });

  /* ======================= FITE7407 Tutorial 1 ======================= */
  add({
    'ft1.c1': () => T.time('NPV brings every cash flow to today', [[0.04, 'Today', 'NPV = Σ PV'], [0.36, 'Year 1', 'C / (1+r)'], [0.66, 'Year 2', 'C / (1+r)²'], [0.96, 'Year 3', 'C / (1+r)³']],
      [], { note: 'Compare alternatives on one time scale' }),
    'ft1.c2': () => T.time('One-year investor', [[0.05, 'Today', 'pay P₀'], [0.95, 'Year 1', 'get Div₁ + P₁']], [[0.05, 0.95, 'discount at the cost of capital rₑ', 'gold']],
      { note: 'P₀ = (Div₁ + P₁) / (1 + rₑ)' }),
    'ft1.c3': () => T.time('Dividend discount model', [[0.04, '0', 'P₀'], [0.3, '1', 'Div₁'], [0.55, '2', 'Div₂'], [0.75, '…', ''], [0.96, 'N', 'Divₙ + Pₙ']], [],
      { note: 'P₀ = Σ Divₜ / (1 + rₑ)ᵗ + Pₙ / (1 + rₑ)ᴺ' }),
    'ft1.c4': () => T.time('Zero bond: no coupons', [[0.05, 'Today', 'price P'], [0.95, 'Maturity', 'face value FV']], [[0.05, 0.95, 'grows at YTM', 'accent']],
      { note: 'P = FV / (1 + YTM)ⁿ' }),
    'ft1.c5': () => T.time('Coupon bond = annuity + face value', [[0.04, 'Today', 'price P'], [0.3, '1', 'C'], [0.55, '2', 'C'], [0.96, 'n', 'C + FV']], [[0.3, 0.96, 'coupons: an annuity', 'gold']],
      { note: 'P = PV(coupons) + FV / (1 + YTM)ⁿ' }),
    'ft1.c6': () => T.bars('Coupon vs market rate (FV = 100)', [['Coupon > YTM', 115, 'accent', 'premium P > FV'], ['Coupon = YTM', 100, 'gold', 'par P = FV'], ['Coupon < YTM', 85, 'seal', 'discount P < FV']],
      { lw: 88, max: 115 }),
    'ft1.c7': () => T.chart('Dirty price saw-tooth', [[[[0, 0.3], [0.33, 0.62], [0.33, 0.3], [0.66, 0.62], [0.66, 0.3], [1, 0.62]], 'accent', 'dirty'], [[[0, 0.3], [1, 0.3]], 'gold', 'clean', true, [0.12, 0.3]]],
      { h: 100, sharp: true, ticks: [[0, 'coupon'], [0.33, 'coupon'], [0.66, 'coupon']], xl: 'accrued interest builds up, then drops on the coupon date' }),
    'ft1.c8': () => T.cols('Both pay $24 per share', [['Old owner', '6 shares at $25'], ['New investor', '0 shares']],
      [['Uses 6 free rights', 'Buys 1 young share at $18', '(6×25 + 18) / 7 = $24'], ['Buys 6 rights at $1', 'Buys 1 young share at $18', '6 + 18 = $24']],
      { note: 'V = (25 − 18) / (6 + 1) = $1' }),
  });

  /* ======================= FITE7407 L2 ======================= */
  add({
    'f2.c1': () => T.flow('Who keeps the shareholder list?', [['Small company', 'a simple list of owners'], ['Growing company', 'daily trading, owners abroad'], ['Custody chain', 'depot banks + depositories keep track', 'hl']],
      { note: 'Company, regulators and tax authorities need to know' }),
    'f2.c2': () => T.cols('A depot bank\'s jobs come from two sources', [['Customer-induced', ''], ['Externally triggered', '']],
      [['Buy / sell', 'OTC deliveries', 'Transfers (e.g. to spouse)'], ['Corporate actions', 'AGMs, coupons, dividends', 'Tax, reporting, statistics']],
      { note: 'Safe-keep + administer + reconcile holdings' }),
    'f2.c4': () => T.grid('Every booking must state', [['Who', 'Sender & receiver', 'name, address, description', 'a'], ['What', 'Currency & nominal', 'and the ISIN', 'g'],
      ['When', 'Transaction & booking date', '', 'n'], ['Remarks', 'Special flags', 'trade inhibition, dormant, deceased', 's']],
      { note: 'Each booking changes ownership → heavily regulated' }),
    'f2.c5': () => T.flow('Delivering positions to another bank', [['Instruction', 'DVP or DFP'], ['Checks', 'enough units? blocked? pledged?'], ['Depository', 'where are they held?'], ['Matching engine', 'delivery meets receipt', 'hl'], ['FX + cash', 'if needed'], ['Booked', 'both depots updated']],
      { note: 'Receiving DVP: check customer cash first' }),
    'f2.c7': () => T.cols('Transfer inside the same bank', [['Checks', ''], ['Execution', '']],
      [['Authorised person?', 'Holding sufficient?', 'Blocked or pledged?'], ['Internal booking only', 'No depository booking', 'Bank\'s market position unchanged']]),
    'f2.c8': () => T.flow('Depot reconciliation with the customer', [['Bank\'s books', 'all positions'], ['Full listing', 'at least once a year', 'hl'], ['Customer', 'checks it']],
      { note: 'Keep proof & audit trail for claims' }),
    'f2.c9': () => T.flow('Depository reconciliation', [['Request', 'full listing via SWIFT'], ['Compare', 'with in-house view'], ['Breaks?', 'in-flight trade or booking error', 'hl']],
      { note: 'Done by a neutral team — segregation of duties' }),
    'f2.c10': () => T.tree('Where event information comes from', ['Depot bank'], [['Data providers', 'Reuters, Bloomberg, WM'], ['Clearing houses', 'e.g. Clearstream'], ['Depositories', 'settlement & tax info'], ['Issuers', 'official publishing organs']],
      { cols: 4 }),
    'f2.c11': () => T.flow('Life of a corporate action', [['Issuer publishes', 'set by local law'], ['Custodian prepares', 'immediately'], ['Customer instruction', 'if there is a choice'], ['Executed on time', 'non-trade event on depots', 'hl']], { cols: 2 }),
    'f2.c13': () => T.cols('Capital increases not "against cash"', [['From reserves', 'no new money'], ['Conditional', 'only if rights exercised']],
      [['Free reserves → corporate capital', 'Gratis (bonus) shares booked', 'Partial rights: buy or sell'], ['Convertible bonds, options, employee shares', 'Number of new shares not known in advance']]),
    'f2.c14': () => T.flow('Restructuring with a capital reduction', [['Losses', 'capital no longer matches assets'], ['Reduce capital', 'shareholders bear a partial loss'], ['Increase against cash', 'consortium banks take part', 'hl']],
      { note: 'Result: fewer shares, higher share price' }),
    'f2.c15': () => T.grid('Share swaps and compensation', [['A → B', 'Profit extrusion', 'B takes A\'s profit → compensation', 'a'], ['95%', 'Company embedding', 'minority taken over, paid in shares', 'g'],
      ['Cash', 'Squeeze-out', 'main holder becomes sole owner, pays cash', 's'], ['Join', 'Merger', 'new company or inclusion, shares at a ratio', 'n']],
      { note: 'Depot bank: receive info → execute swap → inform customers' }),
    'f2.c16': () => T.flow('Hostile takeover', [['Secret buying', 'stake grows quietly'], ['Offer', 'well above market, cash or shares', 'hl'], ['Against management', 'then like a share swap']]),
    'f2.c17': () => T.cols('Split vs reverse split (value unchanged)', [['Split 1:5', ''], ['Reverse split 4:1', '']],
      [['100 shares × $50', '→ 500 shares × $10', 'Expensive share made affordable'], ['400 shares × $1', '→ 100 shares × $4', 'Fractions → tradeable rights']]),
    'f2.c19': () => T.time('AGM timeline', [[0.06, 'Publish', '≥ 1 month ahead'], [0.38, 'Documents', 'agenda + forms'], [0.68, 'Record date', 'e.g. 21 days before'], [0.95, 'AGM', 'vote / proxy']],
      [[0.38, 0.95, 'customers instruct, order tickets or authorise the bank', 'gold']], { alt: true, note: 'Stage = directors · audience = owners' }),
  });

  /* ======================= FITE7407 L3 ======================= */
  add({
    'f3.c1': () => T.tree('The depot bank must credit on time and correctly', ['Holdings'], [['Shares', '→ dividends'], ['Bonds', '→ interest'], ['Fund shares', '→ investment returns']],
      { note: 'Physical coupons: cut them · obey local and overseas tax law' }),
    'f3.c3': () => T.flow('Processing a coupon payment', [['Static data', 'dates from the prospectus'], ['Evening before', 'register entitled holdings'], ['Pay date', 'or next banking day', 'hl'], ['Tax', 'withholding tax'], ['Reporting & FX', 'cross-border'], ['Advice', 'to the customer']]),
    'f3.c4': () => T.cols('Funds and tax', [['Transparent fund', 'shows its return mix'], ['Non-transparent fund', 'no details']],
      [['Bank calculates & pays the tax', 'on interest & dividend parts'], ['Customer must declare', 'the returns personally']],
      { note: 'Accumulating fund: advice declares the taxable amount' }),
    'f3.c5': () => T.flow('Repaying a bond', [['Publish', '2–3 months ahead'], ['Vault pieces', 'segregate & submit to paying agent'], ['Pay date', 'remove securities, credit cash', 'hl']],
      { note: 'Group tender = whole ISIN · individual = serial numbers' }),
    'f3.c6': () => T.tree('Banks must report to', ['Financial institution'], [['Tax authorities', 'local and foreign'], ['Market supervisor', 'central bank, exchange monitor']],
      { note: 'Tax · customer protection · insider trading · market structure' }),
    'f3.c7': () => T.time('Insider-trading reporting', [[0.06, 'Trade', 'day T'], [0.38, 'T+1', 'anonymised report'], [0.68, 'Suspicion', 'regulator asks'], [0.94, 'Clear names', 'customer not told']],
      [[0.06, 0.94, 'data must be reproducible for 6 years', 'seal']], { alt: true }),
    'f3.c8': () => T.cols('Foreign trade reporting', [['Who', ''], ['How', '']],
      [['Residents trading abroad', 'Foreigners trading domestic securities'], ['Statistical, monthly', 'By the 5th–7th business day']]),
    'f3.c10': () => T.cols('Depot statistics: holdings listed by', [['Sector', ''], ['Security', '']],
      [['Private households', 'Public bodies', 'Insurers, funds…'], ['Client- or bank-owned', 'Units / nominal', 'Securities lending flags']],
      { note: 'Issuers may use it to study their owners' }),
    'f3.c11': () => T.cols('Who is taxed on what?', [['Resident', ''], ['Non-resident', '']],
      [['All income', 'local + foreign'], ['Only local income', 'local trades & holdings']],
      { note: 'Taxed in the year of entitlement, not pay-out' }),
    'f3.c12': () => T.grid('Taxes a bank deducts', [['Speculation', 'Sell–buy price gains', 'which buy price? FIFO / average', 'a'], ['Dividends', 'Capital gains tax', 'double-taxation relief?', 'g'],
      ['Bonds', 'Tax on interest', 'fixed-income in the depot', 'n'], ['Universal', 'Withholding tax', 'one rate replaces the others', 's']]),
  });

  /* ======================= FITE7407 L4 ======================= */
  add({
    'f4.c1': () => T.tree('Banking sectors by ownership', ['Banks'], [['Private', 'e.g. HSBC, Deutsche Bank'], ['Public', 'city, county, federal'], ['Cooperative', 'agricultural, community']]),
    'f4.c3': () => T.flow('From universal bank to specialists', [['Universal bank', 'does everything — obsolete'], ['Segmentation', 'non-banks & FinTechs enter'], ['Transaction banks', 'sell processing as a commodity', 'hl']]),
    'f4.c4': () => T.time('Basel accords', [[0.08, '1988', 'Basel I'], [0.45, '2004 / 2006', 'Basel II'], [0.9, 'later', 'Basel III']],
      [[0.08, 0.45, 'limit insolvency risk', 'muted'], [0.45, 0.9, 'measure risks → cover with own capital', 'accent']]),
    'f4.c6': () => T.grid('Basel III adds', [['Capital', 'Higher minimum capital', '', 'a'], ['Leverage', 'Leverage cap', 'activity vs size', 'g'],
      ['Liquidity', '30-day stress test', 'enough liquidity', 's'], ['KYC', 'Relief for good client knowledge', '', 'n']]),
    'f4.c7': () => T.flow('Sarbanes-Oxley (2002)', [['PCAOB', 'sets audit rules'], ['Sec. 302', 'quarterly results'], ['Sec. 404', 'yearly control confirmation', 'hl']],
      { note: 'Reaches outsourcing providers of SEC-listed firms' }),
    'f4.c8': () => T.cols('SAS 70 reports', [['Type I', ''], ['Type II', '']],
      [['Control is documented', 'Control exists'], ['Everything in Type I', 'PLUS: control really executed', 'over at least 6 months']],
      { note: 'Who? How? Why? Where documented?' }),
    'f4.c9': () => T.cols('MiFID I → MiFID II', [['MiFID I', ''], ['MiFID II', '']],
      [['"Reasonable steps"', 'Fewer reported fields'], ['"All sufficient steps"', 'Yearly top-5 venues, free', 'Trader + algorithm reported']]),
    'f4.c10': () => T.flow('GDPR roles', [['Controller', 'decides how & why', 'hl'], ['Processor', 'acts on its behalf']],
      { note: 'Art. 5: lawful · purpose · minimal · accurate · limited · secure' }),
    'f4.c11': () => T.flow('FATCA', [['Identify', 'US taxpayer accounts'], ['Classify', 'extra data fields'], ['Report', 'to US tax authorities', 'hl']]),
    'f4.c14': () => T.chart('Aggregated risk vs maximum loss cap', [
      [[[0, 0.02], [0.12, 0.45], [0.22, 0.9], [0.32, 0.6], [0.5, 0.25], [0.7, 0.08], [1, 0.01]], 'accent', 'at risk', false, [0.3, 0.75]],
      [[[0, 0.02], [0.18, 0.4], [0.3, 0.7], [0.45, 0.5], [0.65, 0.22], [0.85, 0.07], [1, 0.02]], 'gold', 'max loss cap', true, [0.6, 0.33]]],
      { h: 110, xl: 'damage per year →', marks: [[0.7, 0.08, ''], [0.88, 0.06, '']], note: 'Safe if VaR(at risk) < VaR(MLC) at 99.9%' }),
  });

  /* ======================= FITE7407 L5 ======================= */
  add({
    'f5.c1': () => T.grid('Why outsource?', [['Cost', 'Lower, plannable costs', '', 'a'], ['Focus', 'Core competencies', '', 'g'], ['Specialist', 'Commodity processes to a provider', '', 'n'], ['Risk', 'Less tech investment risk', 'and no peak-load cost', 's']]),
    'f5.c2': () => T.chart('Insourcing: economies of scale', [[[[0.02, 0.95], [0.15, 0.6], [0.3, 0.42], [0.5, 0.3], [0.75, 0.22], [1, 0.18]], 'accent', 'cost per transaction', false, [0.55, 0.3]]],
      { h: 100, xl: 'volume processed →', note: 'Combine many clients → lower marginal cost' }),
    'f5.c4': () => T.grid('Typical project risks', [['Scope', 'Wrong processes', 'cost pressure picks unsuitable ones', 's'], ['People', 'Staff told too late', '', 's'],
      ['Data', 'Unknown cost base', '', 'g'], ['Plan', 'No recovery plan', '', 'g'], ['Vendor', 'Too few vendors', 'unclear expectations', 'n'], ['Price', 'Only initial price', 'non-transparent offers', 'n']]),
    'f5.c6': () => T.grid('Step 1 · Initiation', [['Inform', 'Employees & unions', 'show future perspectives', 'a'], ['Roles', 'Internal team', '+ a neutral organiser', 'g'], ['Plan', 'RFP timeline', 'critical path, milestones', 'n']], { cols: 3 }),
    'f5.c7': () => T.flow('Step 2 · Analysis', [['As-is processes', 'verify docs vs reality'], ['Outsourcable?', 'visible? core? manual vs auto?'], ['Volumes & costs', 'direct + indirect', 'hl']]),
    'f5.c8': () => T.flow('Step 3 · Concept & RFP', [['Requirements', 'service + SLA + interfaces'], ['Screen market', 'capacity, clients, depth'], ['Publish RFP', 'NDA, workshops, deadlines', 'hl']]),
    'f5.c9': () => T.flow('Steps 4 & 5', [['Compare', 'costs, RoI, payback, risks'], ['Alternatives', 'efficiency programme / shared service'], ['Board decides', 'contracts + execution project', 'hl']]),
    'f5.c12': () => T.cols('Securities processing: a good candidate', [['Success factors', ''], ['Why it fits', '']],
      [['Fast systems', 'High STP', 'Many markets', 'Few cancellations'], ['Hidden from customers', 'Technology-bound', 'Volumes swing', 'Cost pressure']]),
    'f5.c13': () => T.cols('Each process step = system + service', [['System', 'the software'], ['Service', 'the staff work']],
      [['e.g. provider\'s settlement system', 'Outsource: yes / no'], ['e.g. own staff for exceptions', 'Outsource: yes / no']],
      { note: 'Decide how much of each, step by step' }),
    'f5.c14': () => T.cols('Research & advice: two views', [['Outsourcer (bank)', ''], ['Insourcer (provider)', '']],
      [['Loses analysis know-how', 'Keeps CRM as core', 'Can switch supplier'], ['Sells analysis many times', 'Sees customer data', 'Benchmark pressure']]),
    'f5.c15': () => T.cols('Custody & print: two views', [['Outsourcer (bank)', ''], ['Insourcer (provider)', '']],
      [['Complex services (AGMs)', 'Print = customer-facing'], ['Set up once for all clients', 'White-label, reuse designs']],
      { note: 'Custody is a stable income for the insourcer' }),
    'f5.c16': () => T.grid('Inside the outsourcing contract', [['Scope', 'Services & systems', '', 'a'], ['Steer', 'Instruction & monitoring', '', 'a'], ['Audit', 'Internal & year-end audits', '', 'g'],
      ['Security', 'Data privacy', '', 'g'], ['Secrecy', 'NDA for all staff & subcontractors', '', 's'], ['Abroad', 'Audits at the remote site', '', 'n']]),
    'f5.c17': () => T.cols('Collaboration duties', [['Insourcer', 'provider'], ['Outsourcer', 'bank']],
      [['Project org & milestones', 'Dress rehearsals', 'Prove capacity', 'Reporting, SLA meetings'], ['Project org & staff', 'Data transfers & rehearsals', 'Manage the old provider', 'Own evergreening']]),
    'f5.c18': () => T.grid('Running the deal', [['SLA', 'Service levels', 'volumes, times, availability, escalation', 'a'], ['± $', 'Bonus / malus', 'early bonus · penalty for missed SLAs', 'g'],
      ['Report', 'Monitoring', 'incidents, breaks, risk indicators', 'n'], ['Price', 'Price scheme', 'flat · per item · scaled; caps', 's']],
      { note: 'Insourcer wants a lower cap · outsourcer an upper cap' }),
  });

  /* ======================= FITE7407 R1 ======================= */
  // Real prices from the reading: F = $1,000, market rate 8%, 20 years, annual coupons
  const bondPath = (cpn) => {
    const F = 1000, i = 0.08, pts = [];
    for (let t = 0; t <= 20; t++) { const n = 20 - t; const P = n ? (cpn * F * (1 - Math.pow(1 + i, -n))) / i + F * Math.pow(1 + i, -n) : F; pts.push([t / 20, (P - 780) / 440]); }
    return pts;
  };
  add({
    'fr1.c1': () => T.chart('Pull to par (8% market rate, 20 years)', [[bondPath(0.10), 'accent', 'premium 10%', false, [0.6, 0.82]], [bondPath(0.08), 'gold', 'par 8%', true, [0.5, 0.5]], [bondPath(0.06), 'seal', 'discount 6%', false, [0.6, 0.06]]],
      { h: 130, ticks: [[0, 'now'], [0.5, '10 y'], [0.97, '20 y']], marks: [[1, 0.5, '']], note: 'Unchanged rates → every bond ends at $1,000' }),
    'fr1.c3': () => T.bars('Price fall of the 10% premium bond', [['First year', 4.29, 'gold', '−$4.29'], ['Last year', 18.52, 'seal', '−$18.52']],
      { lw: 80, note: 'Perpetual limit P = cr × F / i, e.g. $1,500 for 12%' }),
    'fr1.c4': () => T.tree('Any bond price change', ['ΔP'], [['Passage of time', 'pull to par (time decay)'], ['Interest-rate change', 'yield moves']],
      { note: 'Like the time decay of option prices' }),
    'fr1.c5': () => T.flow('Why QE matters here', [['QE after 2008', 'rates at record lows'], ['Old bonds', 'high coupons → premium'], ['Time decay', 'prices fall faster and faster', 'hl']],
      { note: 'Not the manager\'s fault — explain it to clients' }),
  });

  /* ======================= COMP7802 helpers ======================= */
  const Nc = (x) => { const t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp((-x * x) / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; };
  const npdf = (x) => 0.3989423 * Math.exp((-x * x) / 2);
  const bs = (S, X, r, s, T) => { const d1 = (Math.log(S / X) + (r + (s * s) / 2) * T) / (s * Math.sqrt(T)), d2 = d1 - s * Math.sqrt(T); return { c: S * Nc(d1) - X * Math.exp(-r * T) * Nc(d2), g: npdf(d1) / (S * s * Math.sqrt(T)), v: S * Math.sqrt(T) * npdf(d1) }; };
  const series = (f, a, b, n) => { const out = []; for (let k = 0; k <= n; k++) { const x = a + ((b - a) * k) / n; out.push([k / n, f(x)]); } return out; };
  const norm = (pts, max) => pts.map(([x, y]) => [x, y / max]);
  /* stacked horizontal bars: rows [label, [[value, colorVar, text], …]] */
  const stack = (title, rows, max, o = {}) => {
    const { txt, pill } = T.p; const lw = o.lw || 92, bw = W - lw - 14;
    let s = title ? txt(W / 2, 14, title, 'sc-note') : '', y = title ? 24 : 6;
    rows.forEach(([lab, parts]) => {
      s += txt(lw - 6, y + 13, lab, 'sc-lbl', 'end');
      let x = lw;
      parts.forEach(([v, col, t]) => { const w = (bw * v) / max; s += `<rect x="${x}" y="${y + 2}" width="${Math.max(0, w)}" height="16" rx="3" fill="var(--${col})"/>` + (t && w > 22 ? `<text class="sc-chipt" x="${x + w / 2}" y="${y + 14}" text-anchor="middle">${SH.esc(t)}</text>` : ''); x += w; });
      y += 24;
    });
    if (o.legend) { let lx = lw; o.legend.forEach(([col, t]) => { s += `<rect x="${lx}" y="${y + 4}" width="10" height="10" rx="2" fill="var(--${col})"/>` + txt(lx + 14, y + 13, t, 'sc-sub', 'start'); lx += 14 + t.length * 5.2 + 14; }); y += 20; }
    if (o.note) { s += pill(W / 2, y + 12, Math.min(330, o.note.length * 5.6 + 24), o.note, o.tone || 'g'); y += 26; }
    return T.raw(y + 4, s, title || 'stacked bars');
  };

  /* ======================= COMP7802 L1 ======================= */
  add({
    'c1.c1': () => T.time('Simple interest: interest on the principal only', [[0.05, 'Today', '$100'], [0.95, '1 year', '$104']], [[0.05, 0.95, '$100 × 4% × 365/365 = $4', 'accent']],
      { note: 'FV = PV(1 + i × days/year) · year = 365 or 360' }),
    'c1.c3': () => T.bars('4% nominal, paid quarterly and reinvested', [['After Q1', 101, 'muted', '$101.00'], ['After Q2', 102.01, 'muted', '$102.01'], ['After Q3', 103.0301, 'muted', '$103.03'], ['After Q4', 104.0604, 'accent', '$104.06']],
      { lw: 70, max: 104.1, note: 'Nominal 4% → effective 4.06% = (1 + 0.04/4)⁴ − 1' }),
    'c1.c4': () => T.time('HK$1,000,000 one-month deposit', [[0.08, '22 Aug 2025', 'deposit'], [0.86, '+31 days', 'interest HK$212.33']], [[0.05, 0.95, '1,000,000 × 0.25% × 31/365', 'gold']],
      { note: 'HKD uses ACT/365' }),
    'c1.c5': () => T.bars('153 days at 10.2% — as an annual rate', [['Quoted (simple)', 10.2, 'muted', '10.20%'], ['Compounded', 10.5038, 'accent', '10.5038%']],
      { lw: 96, max: 10.6, note: '(1 + 0.102 × 153/365)^(365/153) − 1' }),
    'c1.c6': () => T.bars('The same money, three ways to quote it', [['Annual', 9.3, 'muted', '9.300%'], ['Daily (365)', 8.894, 'gold', '8.894%'], ['Continuous', 8.8926, 'accent', '8.8926%']],
      { lw: 86, max: 9.4, note: 'More frequent compounding → lower quoted rate · r = ln(1 + i)' }),
    'c1.c8': () => T.cols('Which yield formula?', [['Short-term simple', ''], ['Short-term compound', ''], ['Long-term', '']],
      [['(FV/PV − 1) × year/days', 'e.g. 6.53%'], ['(FV/PV)^(year/days) − 1', ''], ['(FV/PV)^(1/N) − 1', '']],
      { note: '$138 → $139.58 in 64 days: simple yield 6.53%' }),
    'c1.c9': () => T.chart('Discount factor at 8.5% (annual)', [[[[0, 1], [1 / 3, 1 / 1.085], [2 / 3, 1 / 1.085 ** 2], [1, 1 / 1.085 ** 3]].map(([x, y]) => [x, (y - 0.7) / 0.3]), 'accent', 'DF', false, [0.45, 0.62]]],
      { h: 100, ticks: [[0, 'now'], [1 / 3, '1 y'], [2 / 3, '2 y'], [1, '3 y']], marks: [[1, (0.7829 - 0.7) / 0.3, '0.7829']], note: '$100 in 3 years = $78.29 today' }),
    'c1.c10': () => T.bars('Both cost $1,000 — which earns more?', [['$50 × 6 + $1,000', 5, 'muted', 'IRR 5.0000%'], ['$200 × 6 years', 5.4718, 'accent', 'IRR 5.4718%']],
      { lw: 104, max: 5.6, note: 'IRR = the rate that makes NPV = 0' }),
  });

  /* ======================= COMP7802 L2 ======================= */
  add({
    'c2.c1': () => T.tree('Money market: short-term IOUs, < 1 year', ['Money market', 'no trading floor · phone & screens'],
      [['Borrowers', 'corporates, banks, govts'], ['Investors', 'pension funds, insurers'], ['Dealers', 'quote bid & offer'], ['Brokers', 'best bid & offer']], { cols: 4 }),
    'c2.c2': () => T.grid('What moves the value of debt', [['Default', 'Credit risk', 'higher for longer terms', 's'], ['Spread', 'Liquidity risk', 'not traded → wide bid/offer', 'g'], ['Markets', 'Market risk', 'changing conditions', 'n'], ['Curve', 'Yield curve', 'up-sloping → rates expected to rise', 'a']]),
    'c2.c3': () => T.cols('Rating scales (S&P / Moody\'s)', [['Long-term', ''], ['Short-term', '']],
      [['AAA / Aaa — best', 'AA / Aa — high', 'A / A — upper-medium', 'BBB / Baa — medium'], ['A1+ / P1', 'A1 / P1', 'A2 / P2', 'A3 / P3']]),
    'c2.c4': () => T.tree('Instruments by issuer', ['Money-market instruments'], [['Government', 'T-bill · repo'], ['Bank', 'time deposit · CD · BA · repo'], ['Corporation', 'commercial paper']],
      { note: 'Eurodollar = USD deposited outside the US' }),
    'c2.c5': () => T.flow('How LIBOR was fixed', [['Panel banks', 'submit borrowing cost, 11:00'], ['Trim', 'drop top & bottom 25%'], ['Average', 'the rest → published', 'hl']],
      { note: 'Manipulated 2005–08 · ceased 2021 / USD June 2023', tone: 's' }),
    'c2.c6': () => T.cols('LIBOR vs SOFR', [['LIBOR', 'old'], ['SOFR', 'new (US)']],
      [['Bank quotes (estimates)', 'Unsecured', 'Term rates built in'], ['Real repo transactions', 'Secured by Treasuries', 'Term SOFR from futures']],
      { note: 'SOFR published each morning by the Fed for the previous day' }),
    'c2.c8': () => T.time('Short dates', [[0.04, 'Today', ''], [0.24, 'Tomorrow', ''], [0.44, 'Spot', 'T+2'], [0.62, 'Spot+1', ''], [0.96, 'Spot+7', '']],
      [[0.04, 0.24, 'O/N', 'accent'], [0.24, 0.44, 'T/N', 'gold'], [0.44, 0.62, 'S/N', 'seal'], [0.44, 0.96, 'S/W', 'muted']], { note: 'Borrow at the higher rate · deposit at the lower' }),
    'c2.c9': () => T.cols('Time deposit vs CD', [['Time deposit', ''], ['Certificate of deposit', '']],
      [['Quoted as a rate', 'Not negotiable', 'No registration'], ['Quoted as a yield', 'Negotiable — sell before maturity', 'Usually bearer']]),
    'c2.c11': () => T.time('China CITIC 2.85% CD (per 100)', [[0.07, '18 Feb 14', 'issue'], [0.38, '11 Mar 14', 'buy 100.375 + 0.164'], [0.92, '18 Feb 15', 'get 102.85']],
      [[0.07, 0.38, '21 days accrued', 'gold'], [0.38, 0.92, '344 days → yield 2.44%', 'accent']], { note: 'Timeline not to scale' }),
    'c2.c13': () => T.flow('Banker\'s acceptance', [['Importer', 'L/C from Bank I'], ['Exporter', 'ships, presents draft'], ['Bank I accepts', 'pay in 60 days', 'hl'], ['Bank X sells it', 'to an investor'], ['Maturity', 'Bank I pays the investor']], { cols: 3 }),
  });

  /* ======================= COMP7802 L3 ======================= */
  add({
    'c3.c1': () => T.time('Forward-forward from two deposits (ACT/365)', [[0.04, 'Today', '$1'], [0.5, 'Day 91', '1.03241 at 13%'], [0.88, 'Day 183', '1.06568 at 13.1%']],
      [[0.5, 0.88, 'forward rate days 91–183 = 12.79%', 'seal']], { alt: true, note: 'f = (1.06568 / 1.03241 − 1) × 365/92' }),
    'c3.c4': () => T.cols('FRA settlement: who pays?', [['L > FRA rate', ''], ['L < FRA rate', '']],
      [['Amount negative', 'Buyer RECEIVES', '(rates rose: compensated)'], ['Amount positive', 'Buyer PAYS', '(cheaper refinancing)']],
      { note: 'Paid at the start, so discount by 1 + L × days/year' }),
    'c3.c5': () => T.time('A 9-month strip (360-day year)', [[0.04, 't0', '1'], [0.36, 't3', '1.021722'], [0.66, 't6', '1.043933'], [0.96, 't9', '1.066891']],
      [[0.04, 0.36, 'cash 8.5%', 'accent'], [0.36, 0.66, '3v6 FRA 8.6%', 'gold'], [0.66, 0.96, '6v9 FRA 8.7%', 'seal']], { note: 'Fixed 9-month rate = 8.79%' }),
    'c3.c7': () => T.flow('One HIBOR future, price 95.25 → 95.15', [['Rate', '4.75% → 4.85%'], ['Price', 'down 10 ticks'], ['Loss (long)', '10 × HK$125 = HK$1,250', 'hl']],
      { note: 'Tick = 5,000,000 × 0.0001 × ¼ = HK$125' }),
    'c3.c8': () => T.cols('FRA vs futures', [['FRA (OTC)', ''], ['Futures', '']],
      [['Any amount & date', 'Settlement discounted', 'Counterparty risk'], ['Standard size & dates', 'Not discounted · margin', 'Clearing house · liquid']],
      { note: 'Sold an FRA? Hedge by selling futures' }),
    'c3.c9': () => T.time('Futures strip on 17 March', [[0.15, 'June', '91.75 → 8.25%'], [0.5, 'September', '91.50 → 8.50%'], [0.85, 'December', '91.25 → 8.75%']], [],
      { note: '3v6 FRA = 8.25% · hedge: sell 10 June futures' }),
    'c3.c10': () => T.flow('FRA vs futures arbitrage', [['Buy 2v5 FRA', 'pay 7.27%, receive L'], ['Buy futures', '92.68 → gain 7.32% − L'], ['Net', '≈ +0.05% whatever L does', 'hl']]),
  });

  /* ======================= COMP7802 L4 ======================= */
  add({
    'c4.c3': () => T.grid('Types of swap', [['Fixed ↔ float', 'Coupon swap', 'plain vanilla', 'a'], ['Float ↔ float', 'Basis swap', 'e.g. 6M vs 3M LIBOR', 'g'], ['Index', 'Index swap', 'e.g. FTSE % rise vs LIBOR + 0.03%', 'n']], { cols: 3 }),
    'c4.c4': () => T.flow('Valuing a swap', [['Add notionals', 'hypothetical, start & end'], ['Fixed leg', '= fixed-rate bond'], ['Floating leg', '= FRN, worth par on reset'], ['Value', 'PV(fixed) − PV(float)', 'hl']],
      { cols: 2, note: 'Par swap rate r = (1 − Dₙ) / Σ tᵢDᵢ' }),
    'c4.c5': () => T.time('1-year swap from a strip (360)', [[0.04, '0', '1'], [0.27, '3M', '1.03555'], [0.5, '6M', '1.06806'], [0.73, '9M', '1.09929'], [0.96, '12M', '1.13090']], [],
      { alt: true, note: 'DFs = 1 / growth → swap rate ≈ 12.35%' }),
    'c4.c6': () => T.chart('4-year HIBOR swap: discount factors', [[series((q) => 1 - (q / 16) * 0.1463 - 0.0006 * q * (16 - q) / 16, 1, 16, 15).map(([x, y]) => [x, (y - 0.84) / 0.16]), 'accent', 'Dᵢ', false, [0.5, 0.6]]],
      { h: 100, ticks: [[0, 'Q1'], [1, 'Q16']], marks: [[0, (0.99204 - 0.84) / 0.16, '0.99204'], [1, (0.8537 - 0.84) / 0.16, '0.85370']], note: 'r = (1 − 0.85370) / 3.694463 = 3.9600%' }),
    'c4.c7': () => T.bars('Existing swap on 27 Mar 2002 (receive 7.4%)', [['PV fixed leg', 9973812, 'accent', '9,973,812'], ['PV floating leg', 10156696, 'seal', '10,156,696']],
      { lw: 92, note: 'Value = −182,884 (market rates above 7.4%)', tone: 's' }),
    'c4.c8': () => T.time('Reversing the swap on 23 Jul 2002', [[0.05, '2002', 'pay 8.25%'], [0.5, '2003', '−85,000'], [0.95, '2004', '−85,000']], [[0.05, 0.95, 'LIBOR legs cancel', 'muted']],
      { note: 'NPV = −85,000 × (0.9250 + 0.8530) = −151,130' }),
  });

  /* ======================= COMP7802 L5 ======================= */
  add({
    'c5.c2': () => T.time('Benchmark points of the curve', [[0.03, 'ON', ''], [0.15, '3M', ''], [0.3, '1Y', ''], [0.55, '5Y', ''], [0.97, '30Y', '']],
      [[0.03, 0.15, 'cash deposits', 'accent'], [0.1, 0.3, 'FRAs / futures', 'gold'], [0.3, 0.97, 'swap rates 2Y–30Y', 'seal']], { note: 'Dates in between: interpolate' }),
    'c5.c3': () => T.cols('Recap: discount factors from each instrument', [['Cash', ''], ['FRA', ''], ['Swap', '']],
      [['D = 1/(1 + rt)'], ['D_E = D_S/(1 + rt)'], ['Dₙ = (1 − rΣtᵢDᵢ)/(1 + rtₙ)']],
      { note: 'Forward f = (D₁/D₂ − 1) × year/period' }),
    'c5.c4': () => T.time('Base date and spot date', [[0.1, '17 Jul 06', 'base (quotes)'], [0.9, '19 Jul 06', 'spot = +2 days']], [[0.1, 0.9, 'all instruments start from spot', 'gold']],
      { note: 'Use mid rates, e.g. 3M (3.16 + 3.21)/2 = 3.185%' }),
    'c5.c5': () => T.time('3M cash → first discount factor', [[0.05, '19 Jul', 'spot'], [0.95, '19 Oct', 'D = 0.992036']], [[0.05, 0.95, '92 days at 3.185%', 'accent']],
      { note: 'D = 1 / (1 + 0.03185 × 92/365)' }),
    'c5.c7': () => T.bars('Bootstrapped discount factors', [['3M (cash)', 0.992036, 'accent', '0.992036'], ['6M (3x6 FRA)', 0.983017, 'gold', '0.983017'], ['9M (6x9 FRA)', 0.974035, 'gold', '0.974035'], ['1Y (swap)', 0.964385, 'seal', '0.964385'], ['15M (interp.)', 0.955223, 'muted', '0.955223']],
      { lw: 92, max: 1 }),
    'c5.c8': () => T.flow('From discount factor to zero rate', [['D', 'e.g. 0.999915, 1 day'], ['ZC = (1/D)^(365/days) − 1', 'annual compounding'], ['3.154%', '', 'hl']]),
  });

  /* ======================= COMP7802 L6 ======================= */
  const callPts = series((S) => bs(S, 100, 0.05, 0.25, 0.5).c, 60, 140, 40);
  add({
    'c6.c1': () => T.cols('Option = right vs obligation', [['Buyer (holder)', 'pays premium'], ['Seller (writer)', 'receives premium']],
      [['Call: right to BUY at X', 'Put: right to SELL at X'], ['Must sell if call exercised', 'Must buy if put exercised']]),
    'c6.c2': () => T.cols('How options differ', [['Exercise', ''], ['Settlement', ''], ['Venue', '']],
      [['European: on expiry', 'American: any time'], ['Physical delivery', 'Cash difference'], ['Exchange: standard, margin', 'OTC: custom']]),
    'c6.c3': () => T.chart('Call price = intrinsic + time value (X = 100)', [[norm(callPts, 42), 'accent', 'option price', false, [0.25, 0.22]], [norm(series((S) => Math.max(0, S - 100), 60, 140, 40), 42), 'gold', 'intrinsic', true, [0.85, 0.72]]],
      { h: 110, sharp: false, ticks: [[0, '60'], [0.5, 'S = X'], [1, '140']], xl: 'share price S', note: 'Gap = time value · largest at the money' }),
    'c6.c4': () => stack('HSI 19,000: premium split', [['Call 18,800', [[200, 'accent', '200'], [343, 'gold', '343']]], ['Call 19,000', [[415, 'gold', '415']]], ['Call 19,200', [[308, 'gold', '308']]],
      ['Put 18,800', [[165, 'gold', '165']]], ['Put 19,000', [[239, 'gold', '239']]], ['Put 19,200', [[200, 'accent', '200'], [133, 'gold', '133']]]], 545,
    { legend: [['accent', 'intrinsic value'], ['gold', 'time value']], note: 'At the money → largest time value' }),
    'c6.c5': () => T.grid('Four basic positions', [['Bullish', 'Buy call', 'pay 543', 'a'], ['Not bullish', 'Sell call', 'receive 543 · loss unlimited', 's'], ['Bearish', 'Buy put', 'pay 165', 'g'], ['Not bearish', 'Sell put', 'receive 165', 'n']],
      { note: 'Higher volatility → calls AND puts cost more' }),
    'c6.c7': () => T.cols('Hong Kong structured products', [['Derivative warrant', ''], ['CBBC', '']],
      [['Issued by a bank', 'Works like a call or put', 'Time decay, expiry'], ['Tracks with leverage', 'Has a call price', 'Hit it → called back early']]),
  });

  /* ======================= COMP7802 L7 ======================= */
  add({
    'c7.c1': () => T.cols('Two portfolios, same payoff', [['Call + bond PV(X)', ''], ['Put + share', '']],
      [['S_T ≤ X → X', 'S_T > X → S_T'], ['S_T ≤ X → X', 'S_T > X → S_T']],
      { note: 'C + Xe^(−rT) = P + S₀' }),
    'c7.c2': () => stack('Parity arbitrage today (S 110, X 100)', [['Cash in', [[5, 'accent', '+5 put'], [110, 'accent', '+110 short share']]], ['Cash out', [[6.87, 'seal', ''], [95.12, 'seal', '−95.12 bond']]]], 120,
      { lw: 70, note: 'Net today +13.00 · everything cancels at maturity' }),
    'c7.c5': () => T.bars('S 70, X 80, 3 months', [['Call, 2 steps', 0.21, 'muted', '$0.21'], ['Call, 3 steps', 0.59, 'muted', '$0.59'], ['Put, 2 steps', 7.85, 'gold', '$7.85'], ['Put, 3 steps', 8.23, 'gold', '$8.23'], ['American put', 10, 'accent', '$10']],
      { lw: 96, max: 10, note: 'Early exercise is worth it: 80 − 70 = 10 now' }),
    'c7.c6': () => T.flow('Black-Scholes in three steps', [['Inputs', 'S, X, T, σ, r'], ['d₁, d₂', 'd₂ = d₁ − σ√T'], ['C = S·N(d₁) − Xe^(−rT)·N(d₂)', '', 'hl']],
      { note: 'N(d₁) = delta · N(d₂) = prob. of finishing in the money' }),
    'c7.c7': () => T.cols('Black-Scholes', [['Assumes', ''], ['Reality', '']],
      [['Lognormal prices', 'Constant r and σ', 'No costs, no dividends', 'European'], ['Crashes happen', 'σ and r move', 'Very sensitive to σ', 'Uses past σ for the future']]),
    'c7.c8': () => T.grid('Four kinds of volatility', [['Past', 'Historical', 'measured from past prices', 'n'], ['Unknown', 'Future', 'actual, until expiry', 's'], ['Market', 'Implied', 'backed out of an option price', 'a'], ['Model', 'Forecasted', 'estimated', 'g']],
      { note: 'The only input you cannot observe directly' }),
  });

  /* ======================= COMP7802 L8 ======================= */
  add({
    'c8.c3': () => T.bars('Hedging short 500 calls', [['Delta 0.6564', 328.2, 'gold', '328.2 shares'], ['Delta 0.8', 400, 'accent', '400 shares']],
      { lw: 86, max: 400, note: 'Stock to $160 → buy 71.8 more shares' }),
    'c8.c4': () => stack('Position delta (× 1,000 shares)', [['Long calls', [[290, 'accent', '+290']]], ['Short puts', [[1950, 'accent', '+1,950']]], ['Short calls', [[1800, 'seal', '−1,800']]], ['Net', [[440, 'gold', '+440']]]], 1950,
      { lw: 80, note: 'Net +440,000 → bullish · sell 440,000 shares to neutralise' }),
    'c8.c5': () => T.chart('Gamma peaks at the money', [[norm(series((S) => bs(S, 100, 0.05, 0.25, 0.08).g, 70, 130, 40), 0.06), 'seal', 'near expiry', false, [0.5, 0.92]], [norm(series((S) => bs(S, 100, 0.05, 0.25, 1).g, 70, 130, 40), 0.06), 'accent', 'long-dated', false, [0.82, 0.32]]],
      { h: 110, ticks: [[0, '70'], [0.5, 'X'], [1, '130']], xl: 'share price', note: 'Big gamma → rebalance the hedge often' }),
    'c8.c6': () => T.chart('Vega is highest at the money', [[norm(series((S) => bs(S, 100, 0.05, 0.25, 1).v, 60, 140, 40), 40), 'accent', 'long-dated', false, [0.82, 0.62]], [norm(series((S) => bs(S, 100, 0.05, 0.25, 0.08).v, 60, 140, 40), 40), 'seal', 'near expiry', false, [0.62, 0.32]]],
      { h: 110, ticks: [[0, '60'], [0.5, 'X'], [1, '140']], xl: 'share price', note: 'Long options = positive vega' }),
    'c8.c7': () => T.chart('Theta: an at-the-money call melts faster near expiry', [[norm(series((d) => bs(100, 100, 0.05, 0.25, Math.max(0.0005, d / 365)).c, 180, 0, 40), 8.5), 'accent', 'call value', false, [0.3, 0.84]]],
      { h: 100, ticks: [[0, '180 days'], [1, 'expiry']], xl: 'time passes →', note: 'Long option: negative theta' }),
    'c8.c8': () => T.grid('Rho', [['Calls', 'Positive', 'higher r → lower PV of strike', 'a'], ['Puts', 'Negative', '', 's'], ['Longer', 'Grows with maturity', '', 'g'], ['ITM', 'Largest in the money', 'smallest out of the money', 'n']]),
  });

  /* ======================= COMP7802 L9 ======================= */
  add({
    'c9.c1': () => T.flow('Risk management loop', [['Identify', ''], ['Measure', ''], ['Control', ''], ['Monitor', 'actual vs desired risk', 'hl']],
      { cols: 4, note: 'No return without risk' }),
    'c9.c2': () => T.grid('Key sources of risk', [['FX · rates · prices', 'Market', '', 'a'], ['Default', 'Credit', '', 's'], ['Price concession', 'Liquidity', '', 'g'], ['Systems', 'Operational', '', 'n'],
      ['Valuation', 'Model', '', 'n'], ['Mid-payment', 'Settlement', '', 's'], ['Rules', 'Regulatory / legal / tax', '', 'g'], ['Government', 'Sovereign / political', '', 'a']]),
    'c9.c3': () => T.tree('Agricultural company A', ['Company A', 'grows crops, buys fertiliser, borrows'],
      [['Commodity price', 'crops & fertiliser'], ['Interest rate', 'borrowing cost'], ['Credit', 'customers on credit'], ['Operational', 'weather, crop failure']], { cols: 4, note: 'Little FX risk: domestic currency' }),
    'c9.c4': () => T.cols('Traditional market-risk measures', [['Instrument', ''], ['1st order', ''], ['2nd order', '']],
      [['Stock', 'Bond', 'Option'], ['Beta', 'Duration', 'Delta'], ['—', 'Convexity', 'Gamma']]),
  });

  /* ======================= COMP7802 readings ======================= */
  const walk = () => { let v = 0.5, seed = 7; const pts = []; for (let k = 0; k <= 60; k++) { seed = (seed * 9301 + 49297) % 233280; v += (seed / 233280 - 0.48) * 0.09; pts.push([k / 60, Math.max(0.05, Math.min(0.95, v + k * 0.004))]); } return pts; };
  add({
    'cr1.c1': () => T.time('CITIC RMB CD term sheet', [[0.07, '10 Feb 14', 'trade'], [0.36, '18 Feb 14', 'interest starts'], [0.92, '18 Feb 15', 'par + 2.85%']], [[0.36, 0.92, 'ACT/365 fixed · modified following', 'gold']],
      { note: 'Baa2, senior unsecured · not a protected deposit' }),
    'cr1.c2': () => T.bars('Per 100 face value', [['Bank buys at', 99.4375, 'muted', '99.4375'], ['Bank sells at', 100.375, 'gold', '100.375'], ['+ accrued', 100.539, 'gold', '100.539'], ['Paid at maturity', 102.85, 'accent', '102.85']],
      { lw: 100, max: 103, note: '(102.85 / 100.539 − 1) × 365/344 = 2.44%' }),
    'cr1.c3': () => T.grid('HIBOR futures spec', [['Size', 'HK$5,000,000', '', 'a'], ['Tick', '1 bp = HK$125', '', 'g'], ['Price', '100 − rate', 'cash settled', 'n'], ['Dates', 'Last trade: 2 days before 3rd Wed', '', 's']]),
    'cr1.c4': () => T.flow('CME Term SOFR', [['SOFR futures', '13 one-month + 5 three-month'], ['Overnight path', 'consistent with futures'], ['Average', '1, 3, 6, 12 months', 'hl']],
      { note: 'Forward-looking · administered by CME (FCA-regulated)' }),
    'cr2.c1': () => T.flow('Financial modelling loop', [['Objective', 'e.g. option premium'], ['Inputs & outputs', ''], ['Build model', 'e.g. Black-Scholes'], ['Implement', 'e.g. Excel'], ['Present & validate', '', 'hl']],
      { cols: 3, note: 'Then refine and repeat' }),
    'cr2.c2': () => T.chart('dS = μS dt + σS dz', [[walk(), 'accent', 'price path', false, [0.55, 0.9]], [[[0, 0.5], [1, 0.74]], 'gold', 'drift μ', true, [0.92, 0.7]]],
      { h: 100, sharp: true, xl: 'time', note: 'Random shocks: Δz = ε√Δt, independent steps' }),
    'cr2.c4': () => T.flow('Why delta = N(d₁)', [['Differentiate C', 'chain rule on d₁, d₂'], ['Key identity', 'e^(−rT)K·φ(d₂) = S·φ(d₁)'], ['Δ = N(d₁)', 'bracket = 0', 'hl']]),
    'cr2.c5': () => T.cols('Three yields from bonds', [['Zero-coupon', ''], ['Par yield', ''], ['YTM', '']],
      [['One cash flow → DF directly', 'Bootstrapped from coupon bonds'], ['Bond priced at 100', 'i·ΣDF + DF_N = 1'], ['One rate for all flows', '']]),
  });

  /* ======================= FITE7407 L1B (last two) ======================= */
  add({
    'f1b.c2': () => T.grid('Exchanges and their rules', [['Asia', 'HKEX · Shanghai · Shenzhen', '', 'a'], ['Germany', 'Frankfurt (XETRA)', '+ former floors', 'g'], ['USA', 'NYSE · Nasdaq', 'Chicago for options & futures', 'n'],
      ['Hours', 'Fixed trading hours', 'big news often after the close', 's'], ['Auctions', 'Opening & closing auctions', 'different pricing method', 'a'], ['Oversight', 'Board + regulator', 'listing, fair prices, sanctions', 'g']]),
    'f1b.c6': () => T.flow('From security data to settlement', [['Data providers', 'issuer, dates, nominal… (for a fee)'], ['ISIN', 'one ID per security'], ['Trading system', 'e.g. XETRA: low cost, no broker fee', 'hl'], ['Clearstream', 'clearing & settlement']], { cols: 2 }),
  });
})();

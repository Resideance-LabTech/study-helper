/* COMP7802 calculation generators — fresh numbers every time.
   Each make() returns { q:{en,zh}, ans, unit, dp, steps:[{en,zh,f,html}], wrong:[...], tol } */
(function () {
  'use strict';
  const SH = window.SH;
  const { rint, pick, round, fmt, shuffle } = SH;
  const G = (SH.gens = SH.gens || {});
  const money = (x, d = 2) => '$' + fmt(x, d);
  const P = (x, d = 2) => fmt(x * 100, d) + '%';

  /* standard normal CDF (Abramowitz & Stegun 7.1.26 via erf), accurate to ~1e-7 */
  function N(x) {
    const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
    return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
  }
  SH.normCdf = N;
  function bs(S, X, r, sig, T) {
    const d1 = (Math.log(S / X) + (r + (sig * sig) / 2) * T) / (sig * Math.sqrt(T));
    const d2 = d1 - sig * Math.sqrt(T);
    const C = S * N(d1) - X * Math.exp(-r * T) * N(d2);
    const Pp = X * Math.exp(-r * T) * N(-d2) - S * N(-d1);
    return { d1, d2, C, P: Pp, Nd1: N(d1), Nd2: N(d2) };
  }
  SH.bs = bs;

  const C = 'comp7802';

  /* ================= L1 Basic financial arithmetic ================= */
  G['comp.simple'] = {
    course: C, t: { en: 'Simple interest: total proceeds', zh: '單利：本利和' },
    make() {
      const P0 = pick([1000, 5000, 10000, 100000, 1000000]);
      const r = rint(10, 90) / 1000;
      const d = rint(30, 300);
      const base = pick([365, 360]);
      const cur = base === 365 ? 'HKD' : 'USD';
      const fv = P0 * (1 + (r * d) / base);
      return {
        q: { en: `You deposit **${cur} ${fmt(P0, 0)}** for **${d} days** at **${fmt(r * 100, 1)}%** simple interest. ${cur} money markets use **ACT/${base}**. What are the total proceeds at maturity?`, zh: `你存 ${cur} ${fmt(P0, 0)}，${d} 日，單利 ${fmt(r * 100, 1)}%。${cur} 貨幣市場用 ACT/${base}。到期本利和係幾多？` },
        ans: fv, unit: '$', dp: 2,
        steps: [
          { en: 'Simple interest: principal × (1 + rate × days/year).', zh: '單利：本金 × (1 + 利率 × 日數/年)。', f: 'FV = P(1 + i \\times \\frac{days}{year})' },
          { en: `Use ${base} days for ${cur}.`, zh: `${cur} 用 ${base} 日。`, f: `FV = ${fmt(P0, 0)} \\times (1 + ${r} \\times \\frac{${d}}{${base}}) = ${fmt(fv)}` },
        ],
        wrong: [P0 * (1 + (r * d) / (base === 365 ? 360 : 365)), P0 * Math.pow(1 + r, d / base), P0 * r * d / base, P0 * (1 + r)],
      };
    },
  };

  G['comp.effective'] = {
    course: C, t: { en: 'Nominal → effective rate', zh: '名義利率 → 實際利率' },
    make() {
      const i = rint(20, 120) / 1000;
      const n = pick([2, 4, 12, 365]);
      const names = { 2: 'semi-annual', 4: 'quarterly', 12: 'monthly', 365: 'daily' };
      const zhn = { 2: '每半年', 4: '每季', 12: '每月', 365: '每日' };
      const eff = Math.pow(1 + i / n, n) - 1;
      return {
        q: { en: `A deposit pays **${fmt(i * 100, 1)}%** per annum (nominal) with **${names[n]}** compounding, reinvested at the same rate. What is the **effective** annual rate?`, zh: `存款年利率 ${fmt(i * 100, 1)}%（名義），${zhn[n]}複利再投資。實際年利率係幾多？` },
        ans: eff * 100, unit: '%', dp: 4, tol: 0.0006,
        steps: [
          { en: 'Effective rate = (1 + nominal/n)ⁿ − 1, where n = compounding periods per year.', zh: '實際利率 = (1 + 名義/n)ⁿ − 1，n = 每年複利次數。', f: 'effective = (1 + \\frac{nominal}{n})^{n} - 1' },
          { en: 'Substitute.', zh: '代入。', f: `(1 + \\frac{${i}}{${n}})^{${n}} - 1 = ${fmt(eff * 100, 4)}\\%` },
        ],
        wrong: [i * 100, (Math.pow(1 + i, 1 / n) - 1) * n * 100, (i / n) * 100, (Math.pow(1 + i / n, n - 1) - 1) * 100],
      };
    },
  };

  G['comp.nominal'] = {
    course: C, t: { en: 'Effective → equivalent nominal rate', zh: '實際利率 → 等值名義利率' },
    make() {
      const e = rint(20, 100) / 1000;
      const n = pick([2, 4, 12]);
      const names = { 2: 'semi-annual', 4: 'quarterly', 12: 'monthly' };
      const nom = (Math.pow(1 + e, 1 / n) - 1) * n;
      return {
        q: { en: `**${fmt(e * 100, 1)}%** is quoted for a 1-year deposit with all interest paid at maturity. What is the **${names[n]}** equivalent nominal rate?`, zh: `一年期存款報 ${fmt(e * 100, 1)}%，利息到期一次過派。等值嘅${{ 2: '半年', 4: '季度', 12: '每月' }[n]}複利名義利率係幾多？` },
        ans: nom * 100, unit: '%', dp: 4, tol: 0.0006,
        steps: [
          { en: 'Nominal = [(1 + effective)^(1/n) − 1] × n. Lecture example: 5% → quarterly 4.91%.', zh: '名義 = [(1 + 實際)^(1/n) − 1] × n。講義例子：5% → 季度 4.91%。', f: 'nominal = [(1 + effective)^{1/n} - 1] \\times n' },
          { en: 'Substitute.', zh: '代入。', f: `[(1 + ${e})^{1/${n}} - 1] \\times ${n} = ${fmt(nom * 100, 4)}\\%` },
        ],
        wrong: [e * 100, (e / n) * 100, (Math.pow(1 + e / n, n) - 1) * 100, (Math.pow(1 + e, n) - 1) * 100 / n],
      };
    },
  };

  G['comp.annualcomp'] = {
    course: C, t: { en: 'Short-term rate → annually compounded rate', zh: '短期利率 → 年複利率' },
    make() {
      const d = rint(30, 200);
      const i = rint(20, 120) / 1000;
      const ac = Math.pow(1 + (i * d) / 365, 365 / d) - 1;
      return {
        q: { en: `The interest rate for a **${d}-day** investment is **${fmt(i * 100, 2)}%** (ACT/365). What is the equivalent **annually compounded** rate (compound yield)?`, zh: `${d} 日投資利率 ${fmt(i * 100, 2)}%（ACT/365）。等值年複利率（複合收益率）係幾多？` },
        ans: ac * 100, unit: '%', dp: 4, tol: 0.0006,
        steps: [
          { en: 'Grow the short-term return to a full year by compounding: [1 + i × d/365]^(365/d) − 1. Lecture: 153 days at 10.2% → 10.5038%.', zh: '用複利將短期回報伸延到一年。講義：153 日 10.2% → 10.5038%。', f: 'AC = (1 + i \\times \\frac{d}{365})^{365/d} - 1' },
          { en: 'Substitute.', zh: '代入。', f: `(1 + ${i} \\times \\frac{${d}}{365})^{365/${d}} - 1 = ${fmt(ac * 100, 4)}\\%` },
        ],
        wrong: [i * 100, (Math.pow(1 + i, d / 365) - 1) * 100, ((i * d) / 365) * 100, (Math.pow(1 + (i * d) / 360, 360 / d) - 1) * 100],
      };
    },
  };

  G['comp.continuous'] = {
    course: C, t: { en: 'Continuous and daily compounding', zh: '連續複利同每日複利' },
    make() {
      const i = rint(20, 120) / 1000;
      const daily = Math.random() < 0.4;
      if (daily) {
        const rd = (Math.pow(1 + i, 1 / 365) - 1) * 365;
        return {
          q: { en: `What is the equivalent rate with **daily compounding** for an annual (annually compounded) rate of **${fmt(i * 100, 1)}%**?`, zh: `年複利 ${fmt(i * 100, 1)}% 等值嘅**每日複利**利率係幾多？` },
          ans: rd * 100, unit: '%', dp: 3, tol: 0.0006,
          steps: [
            { en: 'Solve (1 + r/365)³⁶⁵ = 1 + i. Lecture: 9.3% → 8.894%.', zh: '解 (1 + r/365)³⁶⁵ = 1 + i。講義：9.3% → 8.894%。', f: 'r = [(1 + i)^{1/365} - 1] \\times 365' },
            { en: 'Substitute.', zh: '代入。', f: `[(1 + ${i})^{1/365} - 1] \\times 365 = ${fmt(rd * 100, 3)}\\%` },
          ],
          wrong: [i * 100, (i / 365) * 100, (Math.pow(1 + i / 365, 365) - 1) * 100, (Math.pow(1 + i, 1 / 365) - 1) * 100],
        };
      }
      const rc = Math.log(1 + i);
      return {
        q: { en: `What is the equivalent **continuously compounded** rate for an annual rate of **${fmt(i * 100, 1)}%**?`, zh: `年利率 ${fmt(i * 100, 1)}% 等值嘅**連續複利**利率係幾多？` },
        ans: rc * 100, unit: '%', dp: 4, tol: 0.0006,
        steps: [
          { en: 'As n → ∞, (1 + r/n)ⁿ → eʳ. So eʳ = 1 + i and r = ln(1 + i). Lecture: 9.3% → 8.8926%.', zh: 'n 趨向無限，(1 + r/n)ⁿ → eʳ，所以 r = ln(1 + i)。講義：9.3% → 8.8926%。', f: 'r_{c} = \\ln(1 + i)' },
          { en: 'Substitute.', zh: '代入。', f: `\\ln(1 + ${i}) = ${fmt(rc * 100, 4)}\\%` },
        ],
        wrong: [i * 100, (Math.exp(i) - 1) * 100, (Math.pow(1 + i, 1 / 365) - 1) * 36500 + 0.01, (i / (1 + i)) * 100],
      };
    },
  };

  G['comp.pv'] = {
    course: C, t: { en: 'Present value and discount factors', zh: '現值同折現因子' },
    make() {
      const kind = pick(['simple', 'compound', 'cont']);
      const FV = pick([100, 1000, 10000, 1000000]);
      if (kind === 'simple') {
        const i = rint(10, 80) / 1000, d = rint(30, 330);
        const df = 1 / (1 + (i * d) / 365);
        return {
          q: { en: `What is the present value of **$${fmt(FV, 0)}** received in **${d} days**, discounted at **${fmt(i * 100, 1)}%** simple interest (ACT/365)?`, zh: `${d} 日後收 $${fmt(FV, 0)}，用單利 ${fmt(i * 100, 1)}%（ACT/365）折現，現值係幾多？` },
          ans: FV * df, unit: '$', dp: 2,
          steps: [
            { en: 'Simple discount factor = 1 / (1 + i × days/year).', zh: '單利折現因子 = 1 / (1 + i × 日數/年)。', f: `DF = \\frac{1}{1 + ${i} \\times \\frac{${d}}{365}} = ${fmt(df, 6)}` },
            { en: 'PV = FV × DF.', zh: '現值 = 終值 × 折現因子。', f: `PV = ${fmt(FV, 0)} \\times ${fmt(df, 6)} = ${fmt(FV * df)}` },
          ],
          wrong: [FV * (1 - (i * d) / 365), FV / Math.pow(1 + i, d / 365), FV * (1 + (i * d) / 365), FV / (1 + (i * d) / 360)],
        };
      }
      if (kind === 'compound') {
        const i = rint(20, 100) / 1000, n = rint(2, 10);
        const df = 1 / Math.pow(1 + i, n);
        return {
          q: { en: `What is the **${n}-year discount factor** for a ${n}-year rate of **${fmt(i * 100, 1)}%** compounded annually, and hence the PV of $${fmt(FV, 0)} in ${n} years? (Give the PV.)`, zh: `${n} 年利率 ${fmt(i * 100, 1)}%（年複利）嘅折現因子係幾多？由此計 ${n} 年後 $${fmt(FV, 0)} 嘅現值。（答現值）` },
          ans: FV * df, unit: '$', dp: 2,
          steps: [
            { en: 'Compound discount factor = 1 / (1 + i)ⁿ. Lecture: 3 years at 8.5% → 0.7829, so $100 → $78.29.', zh: '複利折現因子 = 1/(1 + i)ⁿ。講義：3 年 8.5% → 0.7829。', f: `DF = \\frac{1}{(1+${i})^{${n}}} = ${fmt(df, 4)}` },
            { en: 'PV = FV × DF.', zh: '現值 = 終值 × DF。', f: `PV = ${fmt(FV, 0)} \\times ${fmt(df, 4)} = ${fmt(FV * df)}` },
          ],
          wrong: [FV / (1 + i * n), FV * (1 - i * n), FV * Math.exp(-i * n), FV / Math.pow(1 + i, n - 1)],
        };
      }
      const r = rint(10, 80) / 1000, T = rint(1, 8) / 2;
      const df = Math.exp(-r * T);
      return {
        q: { en: `With a **continuously compounded** rate of **${fmt(r * 100, 1)}%**, what is the PV of $${fmt(FV, 0)} due in **${T} years**?`, zh: `連續複利 ${fmt(r * 100, 1)}%，${T} 年後 $${fmt(FV, 0)} 嘅現值係幾多？` },
        ans: FV * df, unit: '$', dp: 2,
        steps: [{ en: 'Continuous discount factor = e^(−rT).', zh: '連續複利折現因子 = e^(−rT)。', f: `PV = ${fmt(FV, 0)} \\times e^{-${r} \\times ${T}} = ${fmt(FV * df)}` }],
        wrong: [FV / Math.pow(1 + r, T), FV * (1 - r * T), FV / (1 + r * T), FV * Math.exp(r * T)],
      };
    },
  };

  G['comp.yield'] = {
    course: C, t: { en: 'Simple yield on a short-term investment', zh: '短期投資單利收益率' },
    make() {
      const pv = rint(100, 5000);
      const d = rint(20, 300);
      const y0 = rint(15, 90) / 1000;
      const fv = round(pv * (1 + (y0 * d) / 365), 2);
      const y = (fv / pv - 1) * (365 / d);
      return {
        q: { en: `I invest **$${fmt(pv)}** now. After **${d} days** I receive back a total (principal + interest) of **$${fmt(fv)}**. What is my **simple yield** (ACT/365)?`, zh: `我而家投資 $${fmt(pv)}，${d} 日後收返本利 $${fmt(fv)}。單利收益率（ACT/365）係幾多？` },
        ans: y * 100, unit: '%', dp: 2,
        steps: [
          { en: 'Simple yield = (FV/PV − 1) × year/days. Lecture: $138 → $139.58 in 64 days = 6.53%.', zh: '單利收益率 = (FV/PV − 1) × 年/日數。講義：$138 → $139.58，64 日 = 6.53%。', f: 'y = (\\frac{FV}{PV} - 1) \\times \\frac{year}{days}' },
          { en: 'Substitute.', zh: '代入。', f: `(\\frac{${fmt(fv)}}{${fmt(pv)}} - 1) \\times \\frac{365}{${d}} = ${fmt(y * 100)}\\%` },
        ],
        wrong: [(fv / pv - 1) * 100, (fv / pv - 1) * (360 / d) * 100, (Math.pow(fv / pv, 365 / d) - 1) * 100, ((fv - pv) / fv) * (365 / d) * 100],
      };
    },
  };

  G['comp.npv'] = {
    course: C, t: { en: 'NPV of uneven cash flows', zh: '唔均等現金流嘅 NPV' },
    make() {
      const r = rint(30, 120) / 1000;
      const cfs = [rint(50, 200), -rint(5, 60), rint(80, 250)];
      if (Math.random() < 0.5) cfs[1] = rint(5, 60);
      const pv = cfs.map((c, k) => c / Math.pow(1 + r, k + 1));
      const npv = pv.reduce((a, b) => a + b, 0);
      const list = cfs.map((c, k) => `year ${k + 1}: **${c >= 0 ? '+' : '−'}$${Math.abs(c)}**`).join(', ');
      return {
        q: { en: `A project has cash flows ${list}. Discounting at **${fmt(r * 100, 1)}%** (annual compounding), what is the **NPV**?`, zh: `項目現金流：第 1 年 ${cfs[0]}、第 2 年 ${cfs[1]}、第 3 年 ${cfs[2]}。用 ${fmt(r * 100, 1)}% 折現，NPV 係幾多？` },
        ans: npv, unit: '$', dp: 2,
        steps: [
          { en: 'NPV = sum of all present values. Watch the sign of each cash flow. Lecture: +83, −10, +150 at 7.5%.', zh: 'NPV = 所有現值相加，小心正負號。講義：+83、−10、+150，7.5%。', f: `NPV = \\frac{${cfs[0]}}{${fmt(1 + r, 3)}} ${cfs[1] < 0 ? '-' : '+'} \\frac{${Math.abs(cfs[1])}}{${fmt(1 + r, 3)}^{2}} + \\frac{${cfs[2]}}{${fmt(1 + r, 3)}^{3}}` },
          { en: `= ${pv.map((v) => fmt(v)).join(' + ').replace('+ -', '− ')} = ${fmt(npv)}`, zh: `= ${fmt(npv)}` },
        ],
        wrong: [cfs.reduce((a, b) => a + b, 0), npv - 2 * pv[1], cfs.reduce((a, c, k) => a + c / (1 + r * (k + 1)), 0), npv * (1 + r)],
      };
    },
  };

  function irr(cfs, price) {
    let lo = -0.5, hi = 1;
    for (let k = 0; k < 200; k++) {
      const mid = (lo + hi) / 2;
      const v = cfs.reduce((a, c, i) => a + c / Math.pow(1 + mid, i + 1), 0) - price;
      if (v > 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }
  SH.irr = irr;
  G['comp.irr'] = {
    course: C, t: { en: 'Internal rate of return (IRR)', zh: '內部回報率 (IRR)' },
    make() {
      const price = 1000;
      const n = rint(3, 6);
      const coupon = rint(3, 9) * 10;
      const annuity = Math.random() < 0.4;
      let cfs;
      if (annuity) {
        const r0 = rint(30, 90) / 1000;
        const pmt = Math.round((price * r0) / (1 - Math.pow(1 + r0, -n)));
        cfs = Array(n).fill(pmt);
      } else {
        cfs = Array(n).fill(coupon);
        cfs[n - 1] += price;
      }
      const r = irr(cfs, price);
      const desc = annuity ? `pays **$${cfs[0]}** at the end of each year for **${n} years** (nothing else)` : `pays **$${coupon}** each year for **${n} years** plus **$1,000** back at the end`;
      return {
        q: { en: `An investment costs **$1,000** today and ${desc}. What is its **IRR**?`, zh: annuity ? `投資今日 $1,000，之後 ${n} 年每年尾收 $${cfs[0]}。IRR 係幾多？` : `投資今日 $1,000，之後 ${n} 年每年收 $${coupon}，最後再收返 $1,000。IRR 係幾多？` },
        ans: r * 100, unit: '%', dp: 2, tol: 0.02,
        steps: [
          { en: 'IRR is the single rate that makes the PV of all future cash flows equal to the price (NPV = 0). Lecture: $50 coupons + $1,000 → IRR 5%; six $200 payments → 5.4718%.', zh: 'IRR 係令未來現金流現值等於價錢（NPV = 0）嘅單一利率。講義：每年 $50 + $1,000 → 5%；六次 $200 → 5.4718%。', f: '1000 = \\sum_{t=1}^{n} \\frac{CF_{t}}{(1 + IRR)^{t}}' },
          { en: annuity ? 'Solve by trial and error (or Excel IRR / RATE).' : 'When the price equals the face value, the IRR equals the coupon rate.', zh: annuity ? '用試誤法（或 Excel IRR／RATE）解。' : '價錢等於面值時，IRR 就等於票息率。' },
          { en: `IRR ≈ ${fmt(r * 100)}%`, zh: `IRR ≈ ${fmt(r * 100)}%` },
        ],
        wrong: [((cfs.reduce((a, b) => a + b, 0) - price) / price / n) * 100, ((cfs.reduce((a, b) => a + b, 0) - price) / price) * 100, r * 100 + 0.7, r * 100 - 0.6],
      };
    },
  };

  /* ================= L2 Money market ================= */
  G['comp.daycount'] = {
    course: C, t: { en: 'Deposit interest with the right day count', zh: '用啱日數慣例計存款利息' },
    make() {
      const ccy = pick([['HKD', 365], ['GBP', 365], ['SGD', 365], ['USD', 360], ['EUR', 360], ['CHF', 360]]);
      const P0 = pick([100000, 500000, 1000000, 5000000]);
      const r = rint(20, 600) / 10000;
      const d = pick([31, 61, 91, 92, 181, 182]);
      const int = (P0 * r * d) / ccy[1];
      return {
        q: { en: `A **${ccy[0]}** time deposit of **${fmt(P0, 0)}** is placed for **${d} days** at **${fmt(r * 100, 2)}%**. How much interest is paid at maturity?`, zh: `${ccy[0]} 定期存款 ${fmt(P0, 0)}，${d} 日，年利率 ${fmt(r * 100, 2)}%。到期利息係幾多？` },
        ans: int, unit: '', dp: 2,
        steps: [
          ccy[1] === 365 ? { en: `Most money markets use ACT/360, but ${ccy[0]} is one of the exceptions that use **ACT/365** (like HKD, GBP, SGD).`, zh: `大部分貨幣市場用 ACT/360，但 ${ccy[0]} 係用 **ACT/365** 嘅例外。` } : { en: `${ccy[0]} follows the normal money-market convention: **ACT/360**.`, zh: `${ccy[0]} 跟一般貨幣市場慣例：**ACT/360**。` },
          { en: 'Interest = principal × rate × days / days in year. Lecture: HK$1,000,000 at 0.25% for 31 days = 212.33.', zh: '利息 = 本金 × 利率 × 日數/年日數。講義：100 萬港元、0.25%、31 日 = 212.33。', f: `${fmt(P0, 0)} \\times ${fmt(r, 4)} \\times \\frac{${d}}{${ccy[1]}} = ${fmt(int)}` },
        ],
        wrong: [(P0 * r * d) / (ccy[1] === 365 ? 360 : 365), P0 * r, (P0 * r * d) / 12, (P0 * r * d) / ccy[1] / 100],
      };
    },
  };

  G['comp.cdprice'] = {
    course: C, t: { en: 'CD price in the secondary market', zh: '存款證二手市場價' },
    make() {
      const F = pick([1000000, 5000000, 10000000]);
      const c = rint(20, 70) / 1000;
      const tenor = pick([90, 182, 365]);
      const left = rint(20, tenor - 10);
      const y = rint(15, 70) / 1000;
      const base = pick([365, 360]);
      const mp = F * (1 + (c * tenor) / base);
      const price = mp / (1 + (y * left) / base);
      return {
        q: { en: `A CD with face value **$${fmt(F, 0)}** pays a **${fmt(c * 100, 1)}%** coupon at maturity. Original tenor **${tenor} days**; **${left} days** are left. Current deposit rates for that period are **${fmt(y * 100, 1)}%**. Day count ACT/${base}. What is the CD's price?`, zh: `存款證面值 $${fmt(F, 0)}，到期派 ${fmt(c * 100, 1)}% 票息，原本年期 ${tenor} 日，仲剩 ${left} 日。而家同期存款利率 ${fmt(y * 100, 1)}%，ACT/${base}。存款證價錢係幾多？` },
        ans: price, unit: '$', dp: 0, tol: 1.5,
        steps: [
          { en: 'Step 1 — maturity proceeds use the **coupon** over the **full** coupon period.', zh: '第一步：到期金額用**票息**同**成個**票息期計。', f: `MP = ${fmt(F, 0)} \\times (1 + ${c} \\times \\frac{${tenor}}{${base}}) = ${fmt(mp, 0)}` },
          { en: 'Step 2 — discount at the **current market rate** over the **remaining** days. Lecture: $1,050,000 / (1 + 0.04 × 61/365) = $1,043,027.', zh: '第二步：用**而家市場利率**同**剩餘日數**折現。', f: `Price = \\frac{${fmt(mp, 0)}}{1 + ${y} \\times \\frac{${left}}{${base}}} = ${fmt(price, 0)}` },
        ],
        wrong: [F / (1 + (y * left) / base), mp / (1 + (c * left) / base), mp / (1 + (y * tenor) / base), F * (1 + (c * left) / base)],
      };
    },
  };

  G['comp.cdyield'] = {
    course: C, t: { en: 'Yield implied by a CD price', zh: '由存款證價錢反推收益率' },
    make() {
      const mp = pick([1050000, 1025000, 1012500, 1040000]);
      const left = rint(20, 200);
      const y0 = rint(20, 70) / 1000;
      const price = Math.round(mp / (1 + (y0 * left) / 365) / 100) * 100;
      const y = (mp / price - 1) * (365 / left);
      return {
        q: { en: `A CD will pay **$${fmt(mp, 0)}** at maturity in **${left} days**. You are offered **$${fmt(price, 0)}** for it. What yield does this represent (ACT/365)?`, zh: `存款證 ${left} 日後到期收 $${fmt(mp, 0)}，有人出 $${fmt(price, 0)} 買。代表幾多收益率（ACT/365）？` },
        ans: y * 100, unit: '%', dp: 2,
        steps: [
          { en: 'Yield = (FV/PV − 1) × year/days. Lecture: 1,050,000/1,042,800, 61 days → 4.13%.', zh: '收益率 = (FV/PV − 1) × 年/日數。講義：61 日 → 4.13%。', f: `y = (\\frac{${fmt(mp, 0)}}{${fmt(price, 0)}} - 1) \\times \\frac{365}{${left}} = ${fmt(y * 100)}\\%` },
          { en: 'A quote "4.13 – 3.89" means the market maker buys at a price yielding 4.13% and sells at a price yielding 3.89% (higher yield = lower price).', zh: '「4.13 – 3.89」即莊家用 4.13% 收益嘅價買入、3.89% 嘅價賣出（收益高＝價錢低）。' },
        ],
        wrong: [(mp / price - 1) * 100, (mp / price - 1) * (360 / left) * 100, ((mp - price) / mp) * (365 / left) * 100, (Math.pow(mp / price, 365 / left) - 1) * 100],
      };
    },
  };

  G['comp.tbill'] = {
    course: C, t: { en: 'T-bill price from a discount rate', zh: '由貼現率計國庫券價' },
    make() {
      const F = pick([1000000, 5000000, 10000000]);
      const dr = rint(150, 600) / 10000;
      const d = rint(20, 180);
      const price = F * (1 - (dr * d) / 360);
      return {
        q: { en: `A US T-bill with **${d} days** to maturity is quoted at **${fmt(dr * 100, 2)}%** on a **discount basis**. How much do you pay for **$${fmt(F, 0)}** face value?`, zh: `美國國庫券仲有 ${d} 日到期，**貼現率**報 ${fmt(dr * 100, 2)}%。面值 $${fmt(F, 0)} 要畀幾多錢？` },
        ans: price, unit: '$', dp: 0, tol: 1.5,
        steps: [
          { en: 'Discount basis: price = face × (1 − discount rate × days/360). Lecture: 50 days at 4.12% → $994,278.', zh: '貼現基礎：價 = 面值 × (1 − 貼現率 × 日數/360)。講義：50 日 4.12% → $994,278。', f: `P = ${fmt(F, 0)} \\times (1 - ${fmt(dr, 4)} \\times \\frac{${d}}{360}) = ${fmt(price, 0)}` },
        ],
        wrong: [F / (1 + (dr * d) / 360), F * (1 - (dr * d) / 365), F * (1 - dr), F / (1 + (dr * d) / 365)],
      };
    },
  };

  G['comp.disc2yield'] = {
    course: C, t: { en: 'Convert a discount rate to a yield', zh: '貼現率換算收益率' },
    make() {
      const dr = rint(150, 700) / 10000;
      const d = rint(30, 180);
      const y = dr / (1 - (dr * d) / 360);
      return {
        q: { en: `A bill with **${d} days** to maturity is quoted at a discount rate of **${fmt(dr * 100, 2)}%** (360-day year). What is the equivalent **yield** (true yield, same day basis)?`, zh: `${d} 日到期嘅票據貼現率 ${fmt(dr * 100, 2)}%（360 日）。等值嘅**收益率**係幾多？` },
        ans: y * 100, unit: '%', dp: 3, tol: 0.0011,
        steps: [
          { en: 'Set the two price formulas equal: F(1 − D×t) = F / (1 + y×t), so y = D / (1 − D×t). The yield is always **higher** than the discount rate.', zh: '兩條價錢公式相等，得 y = D / (1 − D×t)。收益率一定**高過**貼現率。', f: 'y = \\frac{D}{1 - D \\times \\frac{days}{year}}' },
          { en: 'Substitute.', zh: '代入。', f: `y = \\frac{${fmt(dr, 4)}}{1 - ${fmt(dr, 4)} \\times \\frac{${d}}{360}} = ${fmt(y * 100, 3)}\\%` },
        ],
        wrong: [dr * 100, (dr / (1 + (dr * d) / 360)) * 100, dr * (1 + (dr * d) / 360) * 100 + 0.002, (dr * 365) / 360 * 100],
      };
    },
  };

  /* ================= L3 FRA & futures ================= */
  G['comp.fwdfwd'] = {
    course: C, t: { en: 'Forward-forward rate', zh: '遠期對遠期利率' },
    make() {
      const dS = pick([30, 61, 91, 92, 182]);
      const dL = dS + pick([30, 61, 91, 92, 182]);
      const iS = rint(20, 140) / 1000;
      const iL = iS + rint(-15, 25) / 1000;
      const base = pick([360, 365]);
      const f = ((1 + (iL * dL) / base) / (1 + (iS * dS) / base) - 1) * (base / (dL - dS));
      return {
        q: { en: `The **${dS}-day** rate is **${fmt(iS * 100, 2)}%** and the **${dL}-day** rate is **${fmt(iL * 100, 2)}%** (ACT/${base}). What is the **forward-forward rate** for the period from day ${dS} to day ${dL}?`, zh: `${dS} 日利率 ${fmt(iS * 100, 2)}%，${dL} 日利率 ${fmt(iL * 100, 2)}%（ACT/${base}）。第 ${dS} 日至第 ${dL} 日嘅遠期對遠期利率係幾多？` },
        ans: f * 100, unit: '%', dp: 3, tol: 0.0011,
        steps: [
          { en: 'No-arbitrage: investing for the long period = investing short, then rolling at the forward rate. Lecture: 13% (91 d) and 13.1% (183 d) → 12.79%.', zh: '無套利：直接投資長期 = 先投資短期再用遠期利率滾存。講義：13%（91 日）同 13.1%（183 日）→ 12.79%。', f: 'f = [\\frac{1 + i_{L} \\frac{d_{L}}{year}}{1 + i_{S} \\frac{d_{S}}{year}} - 1] \\times \\frac{year}{d_{L} - d_{S}}' },
          { en: 'Substitute.', zh: '代入。', f: `f = [\\frac{1 + ${fmt(iL, 4)} \\times \\frac{${dL}}{${base}}}{1 + ${fmt(iS, 4)} \\times \\frac{${dS}}{${base}}} - 1] \\times \\frac{${base}}{${dL - dS}} = ${fmt(f * 100, 3)}\\%` },
        ],
        wrong: [((iL * dL - iS * dS) / (dL - dS)) * 100 + 0.05, (iL - iS) * 100, ((iL + iS) / 2) * 100, ((1 + (iL * dL) / base) / (1 + (iS * dS) / base) - 1) * 100],
      };
    },
  };

  G['comp.frasettle'] = {
    course: C, t: { en: 'FRA settlement amount', zh: 'FRA 結算金額' },
    make() {
      const notional = pick([1, 5, 10, 20, 50]) * 1000000;
      const fra = rint(150, 700) / 10000;
      const ref = fra + (rint(5, 120) / 10000) * (Math.random() < 0.5 ? -1 : 1);
      const days = pick([90, 91, 92, 181, 182]);
      const raw = (notional * (fra - ref) * days) / 360;
      const s = raw / (1 + (ref * days) / 360);
      return {
        q: { en: `A company **bought** a FRA on **$${fmt(notional / 1e6, 0)}m** notional at an FRA rate of **${fmt(fra * 100, 2)}%** for a **${days}-day** period. On the fixing date the reference rate (SOFR/LIBOR) is **${fmt(ref * 100, 2)}%** (ACT/360). Using the lecture formula, what is the amount the **buyer pays**? (Negative = the buyer receives.)`, zh: `公司**買入** FRA，名義本金 $${fmt(notional / 1e6, 0)}m，FRA 利率 ${fmt(fra * 100, 2)}%，期間 ${days} 日。定價日參考利率 ${fmt(ref * 100, 2)}%（ACT/360）。用講義公式，**買方要付**幾多？（負數＝買方收錢）` },
        ans: s, unit: '$', dp: 0, tol: 2,
        steps: [
          { en: 'Settlement is paid at the **start** of the FRA period, so the interest difference is **discounted** at the reference rate.', zh: 'FRA 喺期間**開始**時結算，所以利息差要用參考利率**折現**。', f: '\\text{Buyer pays} = Notional \\times \\frac{(FRA - L) \\times \\frac{days}{year}}{1 + L \\times \\frac{days}{year}}' },
          { en: 'Substitute.', zh: '代入。', f: `${fmt(notional, 0)} \\times \\frac{(${fmt(fra, 4)} - ${fmt(ref, 4)}) \\times \\frac{${days}}{360}}{1 + ${fmt(ref, 4)} \\times \\frac{${days}}{360}} = ${fmt(s, 0)}` },
          { en: s < 0 ? 'Negative: the reference rate is above the FRA rate, so the buyer **receives** — compensation for higher borrowing costs.' : 'Positive: the reference rate is below the FRA rate, so the buyer **pays** — offset by cheaper borrowing.', zh: s < 0 ? '負數：參考利率高過 FRA 利率，買方**收錢**，補償較高借貸成本。' : '正數：參考利率低過 FRA 利率，買方**付錢**，但借錢平咗。' },
        ],
        wrong: [raw, -s, (notional * (fra - ref) * days) / 365, s * (1 + (ref * days) / 360) * (1 + (ref * days) / 360)],
      };
    },
  };

  G['comp.strip'] = {
    course: C, t: { en: 'Strip: synthetic fixed-rate borrowing', zh: '串連 FRA：合成定息借貸' },
    make() {
      const r1 = rint(200, 900) / 10000, r2 = r1 + rint(-20, 40) / 10000, r3 = r2 + rint(-20, 40) / 10000;
      const d1 = pick([90, 91, 92]), d2 = pick([90, 91, 92]), d3 = pick([90, 91, 92]);
      const f1 = 1 + (r1 * d1) / 360;
      const f2 = f1 * (1 + (r2 * d2) / 360);
      const f3 = f2 * (1 + (r3 * d3) / 360);
      const fixed = (f3 - 1) * (360 / (d1 + d2 + d3));
      const tbl = `<table class="tbl"><tr><th>Period</th><th>Rate</th><th>Days</th><th>FV of $1</th></tr><tr><td>0→3m (cash)</td><td>${P(r1)}</td><td>${d1}</td><td>${fmt(f1, 6)}</td></tr><tr><td>3→6m (3v6 FRA)</td><td>${P(r2)}</td><td>${d2}</td><td>${fmt(f2, 6)}</td></tr><tr><td>6→9m (6v9 FRA)</td><td>${P(r3)}</td><td>${d3}</td><td>${fmt(f3, 6)}</td></tr></table>`;
      return {
        q: { en: `3-month SOFR/LIBOR is **${P(r1)}** (${d1} days), the **3v6 FRA** is **${P(r2)}** (${d2} days) and the **6v9 FRA** is **${P(r3)}** (${d3} days). Year basis 360. What fixed rate can you lock in for a **9-month** borrowing?`, zh: `3 個月利率 ${P(r1)}（${d1} 日），3v6 FRA ${P(r2)}（${d2} 日），6v9 FRA ${P(r3)}（${d3} 日），360 日基礎。9 個月借貸可以鎖定幾多定息？` },
        ans: fixed * 100, unit: '%', dp: 3, tol: 0.0011,
        steps: [
          { en: 'Borrow $1 for 3 months, then roll the growing amount with each FRA (notional = amount owed).', zh: '借 $1 三個月，之後用每張 FRA 滾存（名義本金 = 欠款）。', html: tbl },
          { en: 'Convert the total growth into one simple rate over all days. Lecture: 8.5% / 8.6% / 8.7% → 8.79%.', zh: '將總增長換成整段期間嘅單一利率。講義：8.5%／8.6%／8.7% → 8.79%。', f: `r = (${fmt(f3, 6)} - 1) \\times \\frac{360}{${d1 + d2 + d3}} = ${fmt(fixed * 100, 3)}\\%` },
        ],
        wrong: [((r1 + r2 + r3) / 3) * 100, ((r1 * d1 + r2 * d2 + r3 * d3) / (d1 + d2 + d3)) * 100, (f3 - 1) * 100, (f3 - 1) * (365 / (d1 + d2 + d3)) * 100],
      };
    },
  };

  G['comp.futpl'] = {
    course: C, t: { en: 'Interest rate futures P&L', zh: '利率期貨盈虧' },
    make() {
      const hk = Math.random() < 0.5;
      const size = hk ? 5000000 : 1000000;
      const tick = hk ? 125 : 25;
      const cur = hk ? 'HK$' : 'US$';
      const n = rint(1, 20);
      const p0 = rint(9400, 9800) / 100;
      const move = rint(-40, 40) || 7;
      const p1 = round(p0 + move / 100, 2);
      const long = Math.random() < 0.5;
      const pl = (long ? 1 : -1) * n * size * ((p1 - p0) / 100) * 0.25;
      return {
        q: { en: `You are **${long ? 'long (bought)' : 'short (sold)'} ${n}** three-month ${hk ? 'HIBOR' : 'SOFR/Eurodollar'} futures (contract size **${cur}${fmt(size, 0)}**). The price moves from **${fmt(p0)}** to **${fmt(p1)}**. What is your profit or loss in ${cur}? (Loss = negative.)`, zh: `你${long ? '買入' : '沽出'} ${n} 張三個月 ${hk ? 'HIBOR' : 'SOFR'} 期貨（合約 ${cur}${fmt(size, 0)}）。價錢由 ${fmt(p0)} 變 ${fmt(p1)}。盈虧係幾多？（蝕錢＝負數）` },
        ans: pl, unit: '', dp: 0,
        steps: [
          { en: `One basis point (0.01) is worth contract size × 0.0001 × ¼ = **${cur}${tick}** per contract.`, zh: `一個基點值 = 合約 × 0.0001 × ¼ = **${cur}${tick}**。`, f: `${fmt(size, 0)} \\times 0.0001 \\times 0.25 = ${tick}` },
          { en: `Price change = ${Math.round((p1 - p0) * 100)} ticks. Futures price = 100 − rate, so a **${p1 > p0 ? 'rising price means falling rates' : 'falling price means rising rates'}**.`, zh: `變動 ${Math.round((p1 - p0) * 100)} 個點。期貨價 = 100 − 利率。` },
          { en: `P&L = ${long ? '+' : '−'}${n} × ${Math.round((p1 - p0) * 100)} × ${tick} = ${fmt(pl, 0)}. Lecture: 95.25 → 95.15 is −10 ticks = −HK$1,250 for one long contract.`, zh: `盈虧 = ${fmt(pl, 0)}。講義：95.25 → 95.15，長倉一張蝕 HK$1,250。` },
        ],
        wrong: [-pl, pl * 4, n * size * ((p1 - p0) / 100), pl / n],
      };
    },
  };

  G['comp.futhedge'] = {
    course: C, t: { en: 'Number of futures to hedge an FRA', zh: '對沖 FRA 要幾多張期貨' },
    make() {
      const notional = pick([5, 10, 20, 25, 50]) * 1000000;
      const days = pick([91, 92]);
      const rate = rint(300, 900) / 10000;
      const n = ((notional / 1000000) * days) / 90 / (1 + (rate * days) / 360);
      return {
        q: { en: `You **sell** a 3v6 FRA for **$${fmt(notional / 1e6, 0)}m** covering **${days} days**. You hedge with 3-month futures (US$1m each, P&L based on 90 days). The expected settlement rate is **${P(rate)}**. How many futures contracts are needed (before rounding)?`, zh: `你**沽出** $${fmt(notional / 1e6, 0)}m 嘅 3v6 FRA，期間 ${days} 日。用三個月期貨對沖（每張 1 百萬美元，盈虧按 90 日計），預期結算利率 ${P(rate)}。要幾多張（未四捨五入）？` },
        ans: n, unit: 'contracts', dp: 2, tol: 0.02,
        steps: [
          { en: 'Match the FRA settlement (discounted, actual days) with futures P&L (not discounted, 90 days).', zh: 'FRA 結算（有折現、實際日數）要對應期貨盈虧（冇折現、90 日）。', f: 'n = \\frac{Notional}{1m} \\times \\frac{days}{90} \\times \\frac{1}{1 + L \\times \\frac{days}{360}}' },
          { en: 'Substitute. Lecture: $10m, 92 days, 8.25% → 10.01 contracts.', zh: '代入。講義：$10m、92 日、8.25% → 10.01 張。', f: `${notional / 1e6} \\times \\frac{${days}}{90} \\times \\frac{1}{1 + ${fmt(rate, 4)} \\times \\frac{${days}}{360}} = ${fmt(n)}` },
          { en: 'Direction: a **sold** FRA gains when rates **fall**. Futures prices **rise** when rates fall, so you need a position that loses then: **sell** futures. The lecture sells 10 June futures.', zh: '方向：**沽出** FRA 喺利率**下跌**時賺錢。利率跌期貨價升，所以要用一個嗰時蝕錢嘅倉對沖：**沽出**期貨。講義沽 10 張六月期貨。' },
        ],
        wrong: [notional / 1e6, ((notional / 1e6) * days) / 90, (notional / 1e6) / (1 + (rate * days) / 360), ((notional / 1e6) * 90) / days],
      };
    },
  };

  G['comp.futrate'] = {
    course: C, t: { en: 'Implied rate and FRA from futures', zh: '由期貨價推利率同 FRA' },
    make() {
      const p1 = rint(9300, 9800) / 100, p2 = round(p1 - rint(0, 40) / 100, 2);
      const d1 = pick([91, 92]), d2 = pick([91, 92]);
      const r1 = (100 - p1) / 100, r2 = (100 - p2) / 100;
      const f = ((1 + (r1 * d1) / 360) * (1 + (r2 * d2) / 360) - 1) * (360 / (d1 + d2));
      return {
        q: { en: `The **June** 3-month futures price is **${fmt(p1)}** (${d1} days) and the **September** price is **${fmt(p2)}** (${d2} days). What should the **3v9 FRA** rate be (360 basis)?`, zh: `六月三個月期貨價 ${fmt(p1)}（${d1} 日），九月 ${fmt(p2)}（${d2} 日）。3v9 FRA 利率應該係幾多（360 基礎）？` },
        ans: f * 100, unit: '%', dp: 3, tol: 0.0011,
        steps: [
          { en: 'Implied forward rate = 100 − futures price.', zh: '隱含遠期利率 = 100 − 期貨價。', f: `June: ${fmt(100 - p1)}\\%, \\quad Sept: ${fmt(100 - p2)}\\%` },
          { en: 'A 3v9 FRA = a strip of 3v6 and 6v9. Lecture: 8.25% and 8.50% → 8.463%.', zh: '3v9 FRA = 3v6 加 6v9 串連。講義：8.25% 同 8.50% → 8.463%。', f: `[(1 + ${fmt(r1, 4)} \\times \\frac{${d1}}{360})(1 + ${fmt(r2, 4)} \\times \\frac{${d2}}{360}) - 1] \\times \\frac{360}{${d1 + d2}} = ${fmt(f * 100, 3)}\\%` },
        ],
        wrong: [((r1 + r2) / 2) * 100, (100 - (p1 + p2) / 2) * 1.0 - 0.01, (100 - p2), f * 100 + 0.06],
      };
    },
  };

  /* ================= L4 Interest rate swaps ================= */
  G['comp.swapadv'] = {
    course: C, t: { en: 'Comparative advantage in a swap', zh: '利率掉期嘅比較優勢' },
    make() {
      const aFix = rint(50, 90) / 10, aFl = rint(0, 4) / 10;
      const bFix = aFix + rint(8, 25) / 10, bFl = aFl + rint(3, 9) / 10;
      const gain = bFix - aFix - (bFl - aFl);
      if (gain <= 0) return G['comp.swapadv'].make();
      return {
        q: { en: `Company A can borrow fixed at **${fmt(aFix, 1)}%** or floating at **SOFR + ${fmt(aFl, 1)}%**. Company B can borrow fixed at **${fmt(bFix, 1)}%** or floating at **SOFR + ${fmt(bFl, 1)}%**. A prefers floating, B prefers fixed. What is the **total** saving (in %) the two can share through an interest rate swap?`, zh: `A 公司定息 ${fmt(aFix, 1)}%／浮息 SOFR + ${fmt(aFl, 1)}%；B 公司定息 ${fmt(bFix, 1)}%／浮息 SOFR + ${fmt(bFl, 1)}%。A 想要浮息，B 想要定息。透過掉期，兩間公司總共可以慳幾多 %？` },
        ans: gain, unit: '%', dp: 2,
        steps: [
          { en: `Fixed-rate difference: ${fmt(bFix, 1)} − ${fmt(aFix, 1)} = ${fmt(bFix - aFix, 1)}%. Floating difference: ${fmt(bFl, 1)} − ${fmt(aFl, 1)} = ${fmt(bFl - aFl, 1)}%.`, zh: `定息差 ${fmt(bFix - aFix, 1)}%；浮息差 ${fmt(bFl - aFl, 1)}%。` },
          { en: 'A has a **comparative** advantage in fixed (bigger gap), so A borrows fixed, B borrows floating, and they swap.', zh: 'A 喺定息有**比較優勢**（差距大啲），所以 A 借定息、B 借浮息，再掉期。' },
          { en: `Total saving = ${fmt(bFix - aFix, 1)} − ${fmt(bFl - aFl, 1)} = **${fmt(gain, 2)}%**. Lecture: (9.5 − 8.0) − (0.8 − 0.1) = 0.8%, split 0.4% each.`, zh: `總節省 = ${fmt(gain, 2)}%。講義：(9.5 − 8.0) − (0.8 − 0.1) = 0.8%，每間 0.4%。` },
        ],
        wrong: [bFix - aFix, bFl - aFl, gain / 2, bFix - aFix + (bFl - aFl)],
      };
    },
  };

  G['comp.swaprate'] = {
    course: C, t: { en: 'Par swap rate from discount factors', zh: '由折現因子計掉期利率' },
    make() {
      const n = pick([2, 3, 4]);
      const z = rint(200, 600) / 10000;
      const ts = [], Ds = [];
      for (let i = 1; i <= n; i++) {
        ts.push(1);
        Ds.push(round(1 / Math.pow(1 + z + (i - 1) * rint(0, 30) / 10000, i), 4));
      }
      const sumTD = ts.reduce((a, t, i) => a + t * Ds[i], 0);
      const r = (1 - Ds[n - 1]) / sumTD;
      return {
        q: { en: `An **${n}-year** swap pays fixed **annually** (t = 1 each year). The discount factors are: ${Ds.map((d, i) => `D${i + 1} = **${fmt(d, 4)}**`).join(', ')}. What is the **par swap rate**?`, zh: `${n} 年期掉期每年派定息（每期 t = 1）。折現因子：${Ds.map((d, i) => `D${i + 1} = ${fmt(d, 4)}`).join('、')}。掉期利率係幾多？` },
        ans: r * 100, unit: '%', dp: 3, tol: 0.0011,
        steps: [
          { en: 'At inception the swap NPV is zero, so the fixed leg (with notional at the end) is worth par.', zh: '開始時掉期 NPV = 0，所以定息腳（連最後本金）值平價。', f: 'r = \\frac{1 - D_{n}}{\\sum_{i=1}^{n} t_{i} D_{i}}' },
          { en: `Σ tᵢDᵢ = ${Ds.map((d) => fmt(d, 4)).join(' + ')} = ${fmt(sumTD, 4)}.`, zh: `Σ tᵢDᵢ = ${fmt(sumTD, 4)}。` },
          { en: 'Lecture (4-year HIBOR swap): (1 − 0.85370) / 3.694463 = 3.96%.', zh: '講義（4 年 HIBOR 掉期）：(1 − 0.85370) ÷ 3.694463 = 3.96%。', f: `r = \\frac{1 - ${fmt(Ds[n - 1], 4)}}{${fmt(sumTD, 4)}} = ${fmt(r * 100, 3)}\\%` },
        ],
        wrong: [((1 - Ds[n - 1]) / n) * 100, ((1 / Ds[n - 1] - 1) / n) * 100, (1 - Ds[n - 1]) * 100, ((1 - Ds[n - 1]) / (sumTD - Ds[n - 1])) * 100],
      };
    },
  };

  G['comp.swapunwind'] = {
    course: C, t: { en: 'Cost of reversing a swap', zh: '平倉掉期嘅成本' },
    make() {
      const N0 = pick([5, 10, 20, 50]) * 1000000;
      const orig = rint(400, 800) / 10000;
      const now = orig + (rint(10, 150) / 10000) * (Math.random() < 0.5 ? -1 : 1);
      const D1 = round(rint(9000, 9700) / 10000, 4), D2 = round(D1 - rint(500, 900) / 10000, 4);
      const net = N0 * (orig - now);
      const npv = net * (D1 + D2);
      return {
        q: { en: `You **receive fixed ${P(orig)}** (annual) on a **$${fmt(N0 / 1e6, 0)}m** swap with 2 years left. To close it, you enter a reverse swap where you **pay fixed ${P(now)}** for the remaining 2 years. The floating legs offset exactly. Discount factors: **${fmt(D1, 4)}** (year 1) and **${fmt(D2, 4)}** (year 2). What is the NPV of the net cash flows? (Negative = you must pay to close out.)`, zh: `你喺 $${fmt(N0 / 1e6, 0)}m 掉期**收定息 ${P(orig)}**，仲有 2 年。平倉要做反向掉期**付定息 ${P(now)}**。浮息腳互相抵銷。折現因子 ${fmt(D1, 4)}、${fmt(D2, 4)}。淨現金流嘅 NPV 係幾多？（負數＝要畀錢平倉）` },
        ans: npv, unit: '$', dp: 0, tol: 2,
        steps: [
          { en: `Net cash flow each year = ${fmt(N0, 0)} × (${P(orig)} − ${P(now)}) = ${fmt(net, 0)}.`, zh: `每年淨現金流 = ${fmt(net, 0)}。` },
          { en: 'Discount both years and add. Lecture: −85,000 × (0.9250 + 0.8530) = −151,130.', zh: '兩年折現再加。講義：−85,000 × (0.9250 + 0.8530) = −151,130。', f: `NPV = ${fmt(net, 0)} \\times (${fmt(D1, 4)} + ${fmt(D2, 4)}) = ${fmt(npv, 0)}` },
        ],
        wrong: [net * 2, -npv, net * D2 * 2, net * (D1 + D2) + N0 * D2 * (orig - now)],
      };
    },
  };

  /* ================= L5 Yield curve ================= */
  G['comp.mmdf'] = {
    course: C, t: { en: 'Money-market discount factor', zh: '貨幣市場折現因子' },
    make() {
      const r = rint(150, 600) / 10000, d = pick([7, 31, 61, 92, 182, 365]);
      const D = 1 / (1 + (r * d) / 365);
      return {
        q: { en: `A deposit rate of **${P(r)}** applies from spot for **${d} days** (ACT/365). What is the discount factor D for that date?`, zh: `由即期日起 ${d} 日存款利率 ${P(r)}（ACT/365）。嗰日嘅折現因子 D 係幾多？` },
        ans: D, unit: '', dp: 6, tol: 0.000002,
        steps: [{ en: 'Money market: D = 1 / (1 + r × t).', zh: '貨幣市場：D = 1 / (1 + r × t)。', f: `D = \\frac{1}{1 + ${fmt(r, 4)} \\times \\frac{${d}}{365}} = ${fmt(D, 6)}` }],
        wrong: [1 - (r * d) / 365, 1 / Math.pow(1 + r, d / 365), 1 / (1 + (r * d) / 360), Math.exp(-r)],
      };
    },
  };

  G['comp.dffwd'] = {
    course: C, t: { en: 'Forward rate from two discount factors', zh: '由兩個折現因子計遠期利率' },
    make() {
      const D1 = round(rint(9500, 9950) / 10000, 6);
      const days = pick([90, 91, 92]);
      const f0 = rint(150, 600) / 10000;
      const D2 = round(D1 / (1 + (f0 * days) / 365), 6);
      const f = ((D1 - D2) / (D2 * days)) * 365;
      return {
        q: { en: `The discount factor to the FRA start date is **D_S = ${fmt(D1, 6)}** and to the end date (${days} days later) is **D_E = ${fmt(D2, 6)}**. What is the implied FRA (forward) rate on ACT/365?`, zh: `FRA 開始日折現因子 D_S = ${fmt(D1, 6)}，${days} 日後結束日 D_E = ${fmt(D2, 6)}。隱含 FRA 利率（ACT/365）係幾多？` },
        ans: f * 100, unit: '%', dp: 3, tol: 0.0011,
        steps: [{ en: 'FRA rate r = (D_S − D_E) / (D_E × t).', zh: 'FRA 利率 r = (D_S − D_E) / (D_E × t)。', f: `r = \\frac{${fmt(D1, 6)} - ${fmt(D2, 6)}}{${fmt(D2, 6)} \\times \\frac{${days}}{365}} = ${fmt(f * 100, 3)}\\%` }],
        wrong: [((D1 - D2) / (D1 * days)) * 365 * 100, (D1 - D2) * 100, ((D1 - D2) / D2) * 100, ((D1 - D2) / (D2 * days)) * 360 * 100],
      };
    },
  };

  G['comp.zc'] = {
    course: C, t: { en: 'Zero-coupon rate from a discount factor', zh: '由折現因子計零息利率' },
    make() {
      const days = pick([1, 7, 31, 92, 182, 365, 730]);
      const z0 = rint(150, 600) / 10000;
      const D = round(1 / Math.pow(1 + z0, days / 365), 6);
      const zc = Math.pow(1 / D, 365 / days) - 1;
      return {
        q: { en: `A discount factor for **${days} day${days > 1 ? 's' : ''}** from today is **${fmt(D, 6)}**. Assuming annual compounding (year = 365 days), what is the **zero-coupon rate**?`, zh: `${days} 日折現因子係 ${fmt(D, 6)}。假設年複利（一年 365 日），零息利率係幾多？` },
        ans: zc * 100, unit: '%', dp: 3, tol: 0.003,
        steps: [{ en: 'ZC = (1/D)^(365/days) − 1. Lecture: D = 0.999915 for 1 day → 3.154% (the slide uses the unrounded D).', zh: 'ZC = (1/D)^(365/日數) − 1。講義：1 日 D = 0.999915 → 3.154%。', f: `ZC = (\\frac{1}{${fmt(D, 6)}})^{365/${days}} - 1 = ${fmt(zc * 100, 3)}\\%` }],
        wrong: [((1 / D - 1) * 365 / days) * 100 * 0.995, (1 - D) * 100, (1 / D - 1) * 100, (Math.pow(1 / D, days / 365) - 1) * 100],
      };
    },
  };

  G['comp.bootstrap'] = {
    course: C, t: { en: 'Bootstrap the next discount factor from a swap', zh: '用掉期自舉下一個折現因子' },
    make() {
      const r = rint(300, 500) / 10000;
      const ts = [0.25205, 0.25205, 0.24658, 0.24932];
      const D = [0.992036, 0.983017, 0.974035];
      const rr = r;
      const sum = ts.slice(0, 3).reduce((a, t, i) => a + t * D[i], 0);
      const D4 = (1 - rr * sum) / (1 + rr * ts[3]);
      return {
        q: { en: `A **1-year** swap pays fixed **${P(rr, 2)}** quarterly. Day-count fractions are t₁ = 0.25205, t₂ = 0.25205, t₃ = 0.24658, t₄ = 0.24932. Known discount factors: D₁ = 0.992036, D₂ = 0.983017, D₃ = 0.974035. **Bootstrap D₄.**`, zh: `1 年期掉期每季付定息 ${P(rr, 2)}。日數分數 t₁ = 0.25205、t₂ = 0.25205、t₃ = 0.24658、t₄ = 0.24932；已知 D₁ = 0.992036、D₂ = 0.983017、D₃ = 0.974035。用自舉法求 D₄。` },
        ans: D4, unit: '', dp: 6, tol: 0.000003,
        steps: [
          { en: 'A par swap has NPV 0: r Σ tᵢDᵢ + Dₙ = 1 (fixed leg incl. notional = 1). Solve for the last D.', zh: '平價掉期 NPV = 0：r Σ tᵢDᵢ + Dₙ = 1，解最後一個 D。', f: 'D_{n} = \\frac{1 - r \\sum_{i=1}^{n-1} t_{i} D_{i}}{1 + r t_{n}}' },
          { en: `Σ (first three) tᵢDᵢ = ${fmt(sum, 6)}.`, zh: `頭三項 Σ tᵢDᵢ = ${fmt(sum, 6)}。` },
          { en: 'Lecture (3.64%): D₄ = 0.964385.', zh: '講義（3.64%）：D₄ = 0.964385。', f: `D_{4} = \\frac{1 - ${fmt(rr, 4)} \\times ${fmt(sum, 6)}}{1 + ${fmt(rr, 4)} \\times 0.24932} = ${fmt(D4, 6)}` },
        ],
        wrong: [1 / (1 + rr), (1 - rr * sum), 1 / (1 + rr * 1.0), (1 - rr * (sum + 0.24932 * 0.97))],
      };
    },
  };

  /* ================= L6 Options basics ================= */
  G['comp.intrinsic'] = {
    course: C, t: { en: 'Intrinsic value and time value', zh: '內在值同時間值' },
    make() {
      const S = pick([18000, 19000, 20000, 21000, 22000, 25000]);
      const call = Math.random() < 0.5;
      const X = S + pick([-400, -200, 0, 200, 400]);
      const iv = call ? Math.max(0, S - X) : Math.max(0, X - S);
      const prem = iv + rint(60, 350);
      const ask = pick(['iv', 'tv']);
      const tv = prem - iv;
      const mny = iv > 0 ? 'in-the-money' : X === S ? 'at-the-money' : 'out-of-the-money';
      return {
        q: { en: `The Hang Seng Index is at **${fmt(S, 0)}**. A **${call ? 'call' : 'put'}** with strike **${fmt(X, 0)}** costs **${prem}** points. What is its **${ask === 'iv' ? 'intrinsic value' : 'time value'}**?`, zh: `恒指 ${fmt(S, 0)}。行使價 ${fmt(X, 0)} 嘅${call ? '認購' : '認沽'}期權金 ${prem} 點。佢嘅${ask === 'iv' ? '內在值' : '時間值'}係幾多？` },
        ans: ask === 'iv' ? iv : tv, unit: 'points', dp: 0,
        steps: [
          { en: `${call ? 'Call' : 'Put'} intrinsic value = max(0, ${call ? 'S − X' : 'X − S'}) = max(0, ${call ? S - X : X - S}) = ${iv}. The option is **${mny}**.`, zh: `內在值 = ${iv}，屬於${iv > 0 ? '價內' : X === S ? '平價' : '價外'}。` },
          { en: `Time value = premium − intrinsic value = ${prem} − ${iv} = ${tv}.`, zh: `時間值 = 期權金 − 內在值 = ${tv}。` },
        ],
        wrong: ask === 'iv' ? [prem, call ? X - S : S - X, tv, Math.abs(S - X) + 100].filter((v) => v !== iv) : [prem, iv, prem + iv, Math.abs(S - X)].filter((v) => v !== tv),
      };
    },
  };

  function payoff(strat, ST, K1, K2, prem) {
    const c = (K) => Math.max(0, ST - K), p = (K) => Math.max(0, K - ST);
    switch (strat) {
      case 'long call': return c(K1) - prem;
      case 'short call': return prem - c(K1);
      case 'long put': return p(K1) - prem;
      case 'short put': return prem - p(K1);
      case 'long straddle': return c(K1) + p(K1) - prem;
      case 'short straddle': return prem - c(K1) - p(K1);
      case 'long strangle': return c(K2) + p(K1) - prem;
      case 'short strangle': return prem - c(K2) - p(K1);
    }
    return 0;
  }
  SH.optPayoff = payoff;
  G['comp.payoff'] = {
    course: C, t: { en: 'Option strategy profit at expiry', zh: '期權策略到期盈虧' },
    make() {
      const strat = pick(['long call', 'short call', 'long put', 'short put', 'long straddle', 'short straddle', 'long strangle', 'short strangle']);
      const K1 = pick([90, 95, 100, 105]);
      const K2 = K1 + pick([5, 10]);
      const prem = rint(2, 9) + (strat.includes('str') ? rint(2, 6) : 0);
      const ST = K1 + rint(-20, 25);
      const pl = payoff(strat, ST, K1, K2, prem);
      const desc = strat.includes('strangle') ? `put strike **${K1}**, call strike **${K2}**, total premium **${prem}**` : `strike **${K1}**, ${strat.includes('straddle') ? 'total premium' : 'premium'} **${prem}**`;
      const zhs = { 'long call': '買入認購', 'short call': '沽出認購', 'long put': '買入認沽', 'short put': '沽出認沽', 'long straddle': '買入跨式', 'short straddle': '沽出跨式', 'long strangle': '買入勒束式', 'short strangle': '沽出勒束式' };
      return {
        q: { en: `A trader enters a **${strat}** (${desc}). At expiry the underlying is **${ST}**. What is the profit or loss per unit?`, zh: `交易員做**${zhs[strat]}**（${strat.includes('strangle') ? `認沽 ${K1}、認購 ${K2}` : `行使價 ${K1}`}，期權金 ${prem}）。到期正股 ${ST}。每單位盈虧係幾多？` },
        ans: pl, unit: '', dp: 0,
        steps: [
          { en: 'Long options: payoff − premium paid. Short options: premium received − payoff.', zh: '買期權：回報 − 期權金；沽期權：期權金 − 回報。' },
          { en: `Call payoff = max(0, S_T − K); put payoff = max(0, K − S_T). Here S_T = ${ST}.`, zh: `認購回報 = max(0, S_T − K)；認沽 = max(0, K − S_T)。` },
          { en: `P&L = ${fmt(pl, 0)}.`, zh: `盈虧 = ${fmt(pl, 0)}。` },
        ],
        wrong: [-pl, pl + prem, pl - prem, Math.abs(ST - K1)].filter((v) => v !== pl),
      };
    },
  };

  /* ================= L7 Option pricing ================= */
  G['comp.pcp'] = {
    course: C, t: { en: 'Put-call parity', zh: '認購認沽平價' },
    make() {
      const S = rint(40, 150), X = S + rint(-15, 15), r = rint(2, 12) / 100, T = pick([0.25, 0.5, 1]);
      const sig = rint(15, 40) / 100;
      const v = bs(S, X, r, sig, T);
      const findCall = Math.random() < 0.5;
      const Cm = round(v.C, 2), Pm = round(v.P, 2);
      const ans = findCall ? Pm + S - X * Math.exp(-r * T) : Cm - S + X * Math.exp(-r * T);
      return {
        q: { en: `A European ${findCall ? 'put' : 'call'} on a non-dividend stock costs **$${fmt(findCall ? Pm : Cm)}**. S₀ = **$${S}**, strike X = **$${X}**, r = **${r * 100}%** (continuous), T = **${T} year${T !== 1 ? 's' : ''}**. By put-call parity, what should the ${findCall ? 'call' : 'put'} cost?`, zh: `歐式${findCall ? '認沽' : '認購'}期權 $${fmt(findCall ? Pm : Cm)}。S₀ = $${S}、X = $${X}、r = ${r * 100}%（連續）、T = ${T} 年。用平價關係，${findCall ? '認購' : '認沽'}應該值幾多？` },
        ans, unit: '$', dp: 2, tol: 0.02,
        steps: [
          { en: 'Put-call parity (no arbitrage): C + X e^(−rT) = P + S₀.', zh: '平價關係（無套利）：C + X e^(−rT) = P + S₀。', f: 'C - P = S_{0} - X e^{-rT}' },
          { en: `PV(X) = ${X} × e^(−${r} × ${T}) = ${fmt(X * Math.exp(-r * T))}.`, zh: `PV(X) = ${fmt(X * Math.exp(-r * T))}。` },
          { en: `${findCall ? 'C = P + S₀ − PV(X)' : 'P = C − S₀ + PV(X)'} = ${fmt(ans)}.`, zh: `答案 = ${fmt(ans)}。` },
        ],
        wrong: [findCall ? Pm + S - X : Cm - S + X, findCall ? Pm - S + X * Math.exp(-r * T) : Cm + S - X * Math.exp(-r * T), findCall ? Pm + S - X / (1 + r * T) + 0.37 : Cm - S + X / (1 + r * T) + 0.37, ans + X * (1 - Math.exp(-r * T))],
      };
    },
  };

  G['comp.binom1'] = {
    course: C, t: { en: 'One-step binomial option price', zh: '一步二項式期權定價' },
    make() {
      const S = rint(20, 100);
      const up = rint(5, 20) / 100, dn = rint(5, 20) / 100;
      const Su = round(S * (1 + up), 2), Sd = round(S * (1 - dn), 2);
      const X = round(S + rint(-3, 3) * (S / 50), 0);
      const r = rint(2, 12) / 100, T = pick([0.25, 0.5]);
      const fu = Math.max(0, Su - X), fd = Math.max(0, Sd - X);
      if (fu === fd || Math.exp(r * T) >= Su / S || Math.exp(r * T) <= Sd / S) return G['comp.binom1'].make();
      const delta = (fu - fd) / (Su - Sd);
      const p = (Math.exp(r * T) - Sd / S) / (Su / S - Sd / S);
      const f = Math.exp(-r * T) * (p * fu + (1 - p) * fd);
      return {
        q: { en: `A stock is at **$${S}**. In ${T * 12} months it will be either **$${fmt(Su)}** or **$${fmt(Sd)}**. A European **call** has strike **$${X}**. The risk-free rate is **${r * 100}%** p.a. (continuous). What is the call price today?`, zh: `股價 $${S}，${T * 12} 個月後會係 $${fmt(Su)} 或 $${fmt(Sd)}。歐式認購行使價 $${X}，無風險利率 ${r * 100}%（連續）。今日認購值幾多？` },
        ans: f, unit: '$', dp: 3, tol: 0.006,
        steps: [
          { en: `Payoffs: up ${fmt(fu)}, down ${fmt(fd)}. Hedge ratio Δ = (fu − fd)/(Su − Sd) = ${fmt(delta, 4)}.`, zh: `回報：升 ${fmt(fu)}、跌 ${fmt(fd)}。對沖比率 Δ = ${fmt(delta, 4)}。`, f: '\\Delta = \\frac{f_{u} - f_{d}}{S_{u} - S_{d}}' },
          { en: `Risk-neutral probability p = (e^(rT) − d)/(u − d) = ${fmt(p, 4)}.`, zh: `風險中性概率 p = ${fmt(p, 4)}。`, f: 'p = \\frac{e^{rT} - d}{u - d}' },
          { en: 'Price = discounted expected payoff. Lecture: S = 20, 22/18, X = 21, r = 12%, 3 months → $0.633.', zh: '價錢 = 折現後嘅期望回報。講義：S = 20、22/18、X = 21 → $0.633。', f: `f = e^{-${r} \\times ${T}}[${fmt(p, 4)} \\times ${fmt(fu)} + ${fmt(1 - p, 4)} \\times ${fmt(fd)}] = ${fmt(f, 3)}` },
        ],
        wrong: [0.5 * fu + 0.5 * fd, p * fu + (1 - p) * fd, delta * S - f, Math.exp(-r * T) * 0.5 * (fu + fd)],
      };
    },
  };

  G['comp.bs'] = {
    course: C, t: { en: 'Black-Scholes price', zh: 'Black-Scholes 定價' },
    make() {
      const S = rint(40, 120), X = S + rint(-12, 12), r = rint(2, 12) / 100, sig = rint(15, 45) / 100, T = pick([0.25, 0.5, 1]);
      const call = Math.random() < 0.6;
      const v = bs(S, X, r, sig, T);
      return {
        q: { en: `Using **Black-Scholes**, price a European **${call ? 'call' : 'put'}**: S₀ = **${S}**, X = **${X}**, r = **${r * 100}%**, σ = **${sig * 100}%**, T = **${T}** year. (Use N(·) for the standard normal CDF.)`, zh: `用 Black-Scholes 計歐式${call ? '認購' : '認沽'}：S₀ = ${S}、X = ${X}、r = ${r * 100}%、σ = ${sig * 100}%、T = ${T} 年。` },
        ans: call ? v.C : v.P, unit: '$', dp: 2, tol: 0.03,
        steps: [
          { en: 'Compute d₁ and d₂.', zh: '計 d₁ 同 d₂。', f: `d_{1} = \\frac{\\ln(${S}/${X}) + (${r} + ${sig}^{2}/2) \\times ${T}}{${sig}\\sqrt{${T}}} = ${fmt(v.d1, 4)}, \\quad d_{2} = d_{1} - \\sigma\\sqrt{T} = ${fmt(v.d2, 4)}` },
          { en: `N(d₁) = ${fmt(v.Nd1, 4)}, N(d₂) = ${fmt(v.Nd2, 4)}.`, zh: `N(d₁) = ${fmt(v.Nd1, 4)}，N(d₂) = ${fmt(v.Nd2, 4)}。` },
          call
            ? { en: 'Call = S₀N(d₁) − X e^(−rT) N(d₂). Lecture: S = 70, X = 80, 12%, 20%, 3 months → 0.5735.', zh: '認購 = S₀N(d₁) − X e^(−rT) N(d₂)。講義：→ 0.5735。', f: `C = ${S} \\times ${fmt(v.Nd1, 4)} - ${X}e^{-${r} \\times ${T}} \\times ${fmt(v.Nd2, 4)} = ${fmt(v.C)}` }
            : { en: 'Put = X e^(−rT) N(−d₂) − S₀ N(−d₁). Lecture example → 8.2092.', zh: '認沽 = X e^(−rT) N(−d₂) − S₀ N(−d₁)。講義 → 8.2092。', f: `P = ${X}e^{-${r} \\times ${T}} \\times ${fmt(1 - v.Nd2, 4)} - ${S} \\times ${fmt(1 - v.Nd1, 4)} = ${fmt(v.P)}` },
        ],
        wrong: call ? [S * v.Nd1 - X * v.Nd2, Math.max(0, S - X), v.P, S * v.Nd1 - X * Math.exp(-r * T) * v.Nd1] : [X * (1 - v.Nd2) - S * (1 - v.Nd1), Math.max(0, X - S), v.C, v.P + 0.6],
      };
    },
  };

  G['comp.vol'] = {
    course: C, t: { en: 'Annualise historical volatility', zh: '年化歷史波幅' },
    make() {
      const freq = pick([['monthly', 12, '每月'], ['weekly', 52, '每週'], ['daily', 252, '每日']]);
      const n = freq[1] === 12 ? 12 : rint(20, 60);
      const ss = round((rint(30, 140) / 10000) * (n - 1) / (freq[1] === 252 ? 25 : freq[1] === 52 ? 5 : 1), 6);
      const varP = ss / (n - 1);
      const sdP = Math.sqrt(varP);
      const ann = sdP * Math.sqrt(freq[1]);
      return {
        q: { en: `You have **${n} ${freq[0]} returns**. The sum of squared deviations from the mean is **${fmt(ss, 6)}**. Estimate the **annual** historical volatility.`, zh: `你有 ${n} 個${freq[2]}回報，與平均值差嘅平方和係 ${fmt(ss, 6)}。估計年化歷史波幅。` },
        ans: ann * 100, unit: '%', dp: 2, tol: 0.03,
        steps: [
          { en: `Sample variance per period = Σ(x − x̄)² / (n − 1) = ${fmt(ss, 6)} / ${n - 1} = ${fmt(varP, 6)}.`, zh: `每期樣本方差 = ${fmt(varP, 6)}。`, f: '\\sigma^{2} = \\frac{1}{n-1}\\sum (x_{t} - \\bar{x})^{2}' },
          { en: `Per-period volatility = √${fmt(varP, 6)} = ${fmt(sdP * 100, 3)}%.`, zh: `每期波幅 = ${fmt(sdP * 100, 3)}%。` },
          { en: `Annualise: multiply the variance by ${freq[1]} (or the volatility by √${freq[1]}). Lecture: monthly 5.85% → yearly 20.26%.`, zh: `年化：方差乘 ${freq[1]}（波幅乘 √${freq[1]}）。講義：每月 5.85% → 每年 20.26%。`, f: `\\sigma_{year} = ${fmt(sdP, 5)} \\times \\sqrt{${freq[1]}} = ${fmt(ann * 100)}\\%` },
        ],
        wrong: [sdP * 100, sdP * freq[1] * 100, Math.sqrt(ss / n) * Math.sqrt(freq[1]) * 100, varP * freq[1] * 100],
      };
    },
  };

  G['comp.arb'] = {
    course: C, t: { en: 'Put-call parity arbitrage profit', zh: '平價套利利潤' },
    make() {
      const S = rint(80, 140), X = round(S / 10, 0) * 10 - pick([0, 10]), r = rint(2, 8) / 100, T = 1;
      const Pm = rint(2, 10);
      const fairC = Pm + S - X * Math.exp(-r * T);
      const Cm = round(fairC * (rint(35, 80) / 100), 2);
      const profit = -Cm + Pm + S - X * Math.exp(-r * T);
      return {
        q: { en: `S = **${S}**, X = **${X}**, r = **${r * 100}%** (continuous), T = 1 year. The market prices are: call **${fmt(Cm)}**, put **${Pm}**. Construct an arbitrage: buy the cheap call, sell the put, short 1 share, invest PV(X). What is the **arbitrage profit today**?`, zh: `S = ${S}、X = ${X}、r = ${r * 100}%、T = 1 年。市價：認購 ${fmt(Cm)}、認沽 ${Pm}。套利：買平嘅認購、沽認沽、沽空 1 股、投資 PV(X)。今日套利利潤係幾多？` },
        ans: profit, unit: '$', dp: 2, tol: 0.02,
        steps: [
          { en: `Fair call by parity = P + S − X e^(−rT) = ${fmt(fairC)} > market ${fmt(Cm)}, so the call is **undervalued** (or the put overvalued).`, zh: `平價嘅認購 = ${fmt(fairC)}，高過市價 ${fmt(Cm)}，所以認購**被低估**。` },
          { en: `Today: −C + P + S − PV(X) = −${fmt(Cm)} + ${Pm} + ${S} − ${fmt(X * Math.exp(-r * T))} = ${fmt(profit)}.`, zh: `今日現金流 = ${fmt(profit)}。` },
          { en: 'At maturity every position cancels out (call − put − share + bond X = 0 for every S_T), so the profit is risk-free. Course spreadsheet: S = 110, X = 100, r = 5%, C = 6.87, P = 5 → profit 13.00.', zh: '到期所有倉位互相抵銷，所以係無風險利潤。課程 Excel：S = 110、X = 100、r = 5%、C = 6.87、P = 5 → 13.00。' },
        ],
        wrong: [fairC, -profit, -Cm + Pm + S - X, profit * Math.exp(r * T)],
      };
    },
  };

  /* ================= L8 Greeks ================= */
  G['comp.posdelta'] = {
    course: C, t: { en: 'Position delta of an option book', zh: '期權組合嘅 Delta' },
    make() {
      const legs = shuffle([
        { n: rint(5, 30) * 100, side: 1, type: 'call', d: rint(15, 85) / 100 },
        { n: rint(5, 30) * 100, side: -1, type: 'put', d: -rint(15, 85) / 100 },
        { n: rint(5, 30) * 100, side: -1, type: 'call', d: rint(15, 85) / 100 },
        { n: rint(5, 30) * 100, side: 1, type: 'put', d: -rint(15, 85) / 100 },
      ]).slice(0, 3);
      const mult = pick([1, 100, 1000]);
      const pd = mult * legs.reduce((a, l) => a + l.side * l.n * l.d, 0);
      const list = legs.map((l) => `- ${l.side > 0 ? 'Long' : 'Short'} **${l.n}** ${l.type}s, delta **${fmt(l.d, 2)}**`).join('\n');
      return {
        q: { en: `A trader holds:\n\n${list}\n\nEach option covers **${mult}** share${mult > 1 ? 's' : ''}. What is the **position delta** (in shares)?`, zh: `交易員持有以上期權，每張對應 ${mult} 股。組合 Delta（以股數計）係幾多？` },
        ans: pd, unit: 'shares', dp: 0,
        steps: [
          { en: 'Position delta = Σ (± number × delta) × shares per option. Long = +, short = −; put deltas are negative already.', zh: '組合 Delta = Σ(± 數量 × delta) × 每張股數。買 +、沽 −；認沽 delta 本身係負數。', f: '\\Delta_{position} = \\sum n_{i} \\Delta_{i}' },
          { en: legs.map((l) => `${l.side > 0 ? '+' : '−'}${l.n} × ${fmt(l.d, 2)} = ${fmt(l.side * l.n * l.d, 0)}`).join('; ') + `. Sum × ${mult} = ${fmt(pd, 0)}.`, zh: `加埋再乘 ${mult} = ${fmt(pd, 0)}。` },
          { en: `To be delta-neutral, ${pd > 0 ? '**sell**' : '**buy**'} ${fmt(Math.abs(pd), 0)} shares. Lecture: 1000 × [(1000 × 0.29) − (3000 × −0.65) − (2500 × 0.72)] = 440,000 → sell 440,000 shares.`, zh: `要 Delta 中性，${pd > 0 ? '沽出' : '買入'} ${fmt(Math.abs(pd), 0)} 股。講義：440,000 → 沽 440,000 股。` },
        ],
        wrong: [-pd, mult * legs.reduce((a, l) => a + l.n * Math.abs(l.d), 0), mult * legs.reduce((a, l) => a + l.side * l.n * Math.abs(l.d), 0), pd / mult],
      };
    },
  };

  G['comp.deltahedge'] = {
    course: C, t: { en: 'Delta hedge and rebalancing', zh: 'Delta 對沖同再平衡' },
    make() {
      const n = rint(2, 20) * 100;
      const d1 = rint(30, 70) / 100;
      const d2 = round(d1 + (rint(3, 25) / 100) * (Math.random() < 0.6 ? 1 : -1), 2);
      const sh1 = n * d1, sh2 = n * d2;
      return {
        q: { en: `You are **short ${n} call options** (1 option = 1 share) with delta **${fmt(d1, 2)}** and you hold shares to be delta-neutral. The stock moves and the delta becomes **${fmt(d2, 2)}**. How many shares must you **buy** (negative = sell) to stay delta-neutral?`, zh: `你**沽出 ${n} 張認購**（每張 1 股），delta ${fmt(d1, 2)}，並持股做 Delta 中性。股價變動後 delta 變 ${fmt(d2, 2)}。要**買入**幾多股（負數＝沽出）先保持中性？` },
        ans: sh2 - sh1, unit: 'shares', dp: 1,
        steps: [
          { en: `Shares needed = number of options × delta. Before: ${n} × ${fmt(d1, 2)} = ${fmt(sh1, 1)}.`, zh: `所需股數 = 期權數 × delta。之前 = ${fmt(sh1, 1)}。` },
          { en: `After: ${n} × ${fmt(d2, 2)} = ${fmt(sh2, 1)}. Change = ${fmt(sh2 - sh1, 1)}. Lecture: 500 calls, delta 0.6564 → 0.8: hold 328.2 → 400 shares, buy 71.8.`, zh: `之後 = ${fmt(sh2, 1)}，變化 = ${fmt(sh2 - sh1, 1)}。講義：500 張，0.6564 → 0.8，由 328.2 股加到 400 股，買 71.8 股。` },
          { en: 'This is why delta hedging needs **periodic rebalancing** and causes transaction costs.', zh: '所以 Delta 對沖要**定期再平衡**，有交易成本。' },
        ],
        wrong: [sh2, sh1 - sh2, n * (d2 - d1) * 100, n / d2 - n / d1],
      };
    },
  };

  G['comp.theta'] = {
    course: C, t: { en: 'Theta from a price decline', zh: '由價格下跌計 Theta' },
    make() {
      const dropC = rint(10, 90) / 100 * pick([1, 1, 2]);
      const days = rint(5, 40);
      const daily = Math.random() < 0.5;
      const th = -dropC / (days / 365);
      return {
        q: { en: `With the share price and volatility unchanged, a long call loses **$${fmt(dropC, 3)}** over **${days} calendar days**. What is the ${daily ? '**daily** theta' : '**annual** theta'}?`, zh: `股價同波幅不變，長倉認購喺 ${days} 個曆日內跌咗 $${fmt(dropC, 3)}。${daily ? '每日' : '每年'} Theta 係幾多？` },
        ans: daily ? th / 365 : th, unit: '', dp: daily ? 4 : 3, tol: daily ? 0.0002 : 0.01,
        steps: [
          { en: 'Theta = change in option price / change in time (in years). Long options have negative theta.', zh: 'Theta = 期權價變化 ÷ 時間變化（年）。長倉期權 theta 係負數。', f: `\\Theta = \\frac{-${fmt(dropC, 3)}}{${days}/365} = ${fmt(th, 3)}` },
          daily ? { en: `Daily theta = ${fmt(th, 3)} / 365 = ${fmt(th / 365, 4)}. Lecture: −0.375 over 17 days → −8.051 per year, −0.022 per day.`, zh: `每日 theta = ${fmt(th / 365, 4)}。講義：17 日跌 0.375 → 每年 −8.051、每日 −0.022。` } : { en: 'Lecture: −0.375 over 17 days → −8.051.', zh: '講義：17 日跌 0.375 → −8.051。' },
        ],
        wrong: daily ? [-dropC / days / 365, dropC / days, th, -dropC / 365] : [-dropC / days, -dropC * 365, -th, -dropC / (days / 360)],
      };
    },
  };

  /* ================= L9 Risk management (extension) ================= */
  G['comp.var'] = {
    course: C, t: { en: 'Parametric VaR (extension practice)', zh: '參數法 VaR（延伸練習）' },
    make() {
      const V = pick([1, 2, 5, 10, 20]) * 1000000;
      const sig = rint(5, 30) / 1000;
      const conf = pick([[0.95, 1.645], [0.99, 2.326]]);
      const days = pick([1, 1, 10]);
      const varv = V * sig * conf[1] * Math.sqrt(days);
      return {
        q: { en: `(Extension — not on the slides.) A portfolio worth **$${fmt(V / 1e6, 0)}m** has daily return volatility **${fmt(sig * 100, 1)}%**. Assuming normal returns, what is the **${days}-day VaR at ${conf[0] * 100}% confidence**? (z = ${conf[1]})`, zh: `（延伸練習，講義冇）組合值 $${fmt(V / 1e6, 0)}m，每日回報波幅 ${fmt(sig * 100, 1)}%。假設常態分佈，${days} 日、${conf[0] * 100}% 信心水平嘅 VaR 係幾多？（z = ${conf[1]}）` },
        ans: varv, unit: '$', dp: 0, tol: 5,
        steps: [
          { en: 'VaR = z × σ × portfolio value × √(days). The higher the confidence level and the longer the horizon, the larger the VaR (lecture: determinants of VaR).', zh: 'VaR = z × σ × 組合價值 × √日數。信心水平越高、期間越長，VaR 越大（講義：VaR 決定因素）。', f: `VaR = ${conf[1]} \\times ${sig} \\times ${fmt(V, 0)} \\times \\sqrt{${days}} = ${fmt(varv, 0)}` },
        ],
        wrong: [V * sig * conf[1] * days, V * sig, V * sig * (conf[1] === 1.645 ? 2.326 : 1.645) * Math.sqrt(days), varv / conf[1]],
      };
    },
  };
})();

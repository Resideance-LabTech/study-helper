/* FITE7407 calculation generators — fresh numbers every time.
   make() returns { q:{en,zh}, ans, unit, dp, steps:[{en,zh,f,html}], wrong:[distractors], tol } */
(function () {
  'use strict';
  const SH = window.SH;
  const { rint, pick, round, fmt } = SH;
  const G = (SH.gens = SH.gens || {});
  const money = (x, d = 2) => '$' + fmt(x, d);

  G['fite.npv'] = {
    course: 'fite7407', t: { en: 'Net present value of equal cash flows', zh: '等額現金流嘅淨現值 (NPV)' },
    make() {
      const C = pick([100, 200, 250, 500, 1000]);
      const N = rint(2, 5);
      const r = rint(2, 9) / 100;
      let npv = 0;
      const parts = [];
      for (let n = 1; n <= N; n++) {
        npv += C / Math.pow(1 + r, n);
        parts.push(`\\frac{${C}}{(1+${r})^{${n}}}`);
      }
      const simple = Array.from({ length: N }, (_, k) => C / (1 + r * (k + 1))).reduce((a, b) => a + b, 0);
      const offByOne = npv / (1 + r);
      return {
        q: {
          en: `An investment pays **$${C}** at the end of each year for **${N} years**. The interest rate is **${round(r * 100, 0)}%** per year. What is the **net present value (NPV)** of these cash flows today?`,
          zh: `一項投資每年年尾畀你 $${C}，一共 ${N} 年，年利率 ${round(r * 100, 0)}%。今日嘅淨現值 (NPV) 係幾多？`,
        },
        ans: npv, unit: '$', dp: 2, tol: 0.02,
        steps: [
          { en: 'Discount each cash flow back to today and add them up.', zh: '將每一筆現金流折現返今日，再加埋一齊。', f: 'NPV = \\sum_{n=1}^{N} \\frac{C}{(1+r)^{n}}' },
          { en: 'Substitute the numbers.', zh: '代入數字。', f: 'NPV = ' + parts.join(' + ') },
          { en: `NPV = ${money(npv)}`, zh: `所以 NPV ≈ ${money(npv)}` },
        ],
        wrong: [C * N, simple, offByOne, npv * (1 + r), C * N / Math.pow(1 + r, N)],
      };
    },
  };

  G['fite.stock1'] = {
    course: 'fite7407', t: { en: 'Share price for a one-year investor', zh: '一年期投資者嘅股價' },
    make() {
      const div = rint(1, 8);
      const p1 = rint(30, 120);
      const r = rint(5, 14) / 100;
      const p0 = (div + p1) / (1 + r);
      return {
        q: {
          en: `A share is expected to pay a dividend of **$${div}** in one year, and to trade at **$${p1}** at that time. The cost of capital $r_{E}$ is **${round(r * 100, 0)}%**. What should the share price $P_{0}$ be today?`,
          zh: `隻股票預計一年後派息 $${div}，到時股價 $${p1}。資本成本 r_E 係 ${round(r * 100, 0)}%。今日股價 P0 應該係幾多？`,
        },
        ans: p0, unit: '$', dp: 2, tol: 0.02,
        steps: [
          { en: 'Today\'s price = (next year\'s dividend + next year\'s price), discounted by one year.', zh: '今日股價 = (明年股息 + 明年股價) 折現一年。', f: 'P_{0} = \\frac{Div_{1} + P_{1}}{1 + r_{E}}' },
          { en: 'Substitute.', zh: '代入。', f: `P_{0} = \\frac{${div} + ${p1}}{1 + ${r}} = ${fmt(p0)}` },
        ],
        wrong: [div + p1, p1 / (1 + r) , (div + p1) * (1 - r), div / r, p1 / (1 + r) + div],
      };
    },
  };

  G['fite.stockret'] = {
    course: 'fite7407', t: { en: 'Return on a one-year share investment', zh: '一年持股回報率' },
    make() {
      const p0 = rint(20, 90);
      const div = rint(1, 5);
      const p1 = p0 + rint(-6, 12);
      const r = (div + p1 - p0) / p0;
      return {
        q: {
          en: `You buy a share today for **$${p0}**. One year later you receive a dividend of **$${div}** and sell the share for **$${p1}**. What is your return $r_{E}$?`,
          zh: `你今日用 $${p0} 買入一股。一年後收到 $${div} 股息，再以 $${p1} 賣出。你嘅回報率 r_E 係幾多？`,
        },
        ans: r * 100, unit: '%', dp: 2, tol: 0.02,
        steps: [
          { en: 'Return = (dividend + capital gain) ÷ price paid.', zh: '回報 = (股息 + 價差) ÷ 買入價。', f: 'r_{E} = \\frac{Div_{1} + P_{1} - P_{0}}{P_{0}}' },
          { en: 'Substitute.', zh: '代入。', f: `r_{E} = \\frac{${div} + ${p1} - ${p0}}{${p0}} = ${fmt(r * 100)}\\%` },
        ],
        wrong: [((p1 - p0) / p0) * 100, ((div + p1) / p0) * 100, (div / p0) * 100, ((div + p1 - p0) / p1) * 100],
      };
    },
  };

  G['fite.zeroytm'] = {
    course: 'fite7407', t: { en: 'Yield to maturity of a zero bond', zh: '零息債券嘅到期收益率' },
    make() {
      const n = rint(1, 6);
      const y = rint(20, 80) / 1000;
      const P = round(100 / Math.pow(1 + y, n), 2);
      const ytm = Math.pow(100 / P, 1 / n) - 1;
      return {
        q: {
          en: `A zero bond with face value **$100** matures in **${n} year${n > 1 ? 's' : ''}** and trades at **$${fmt(P)}** today. What is its **yield to maturity (YTM)**?`,
          zh: `一張面值 $100 嘅零息債券，${n} 年後到期，今日價錢 $${fmt(P)}。佢嘅到期收益率 (YTM) 係幾多？`,
        },
        ans: ytm * 100, unit: '%', dp: 2, tol: 0.02,
        steps: [
          { en: 'For a zero bond, price = face value discounted n years. Solve for YTM.', zh: '零息債：價錢 = 面值折現 n 年。反推 YTM。', f: 'P = \\frac{FV}{(1+YTM)^{n}} \\to YTM = (\\frac{FV}{P})^{1/n} - 1' },
          { en: 'Substitute.', zh: '代入。', f: `YTM = (\\frac{100}{${fmt(P)}})^{1/${n}} - 1 = ${fmt(ytm * 100)}\\%` },
        ],
        wrong: [((100 - P) / P) * 100, ((100 - P) / P / n) * 100, ((100 - P) / 100) * 100, ((100 - P) / 100 / n) * 100],
      };
    },
  };

  G['fite.zeroprice'] = {
    course: 'fite7407', t: { en: 'Price of a zero bond', zh: '零息債券價格' },
    make() {
      const FV = pick([100, 1000, 5000]);
      const n = rint(2, 8);
      const y = rint(15, 70) / 1000;
      const P = FV / Math.pow(1 + y, n);
      return {
        q: {
          en: `What is the price today of a zero bond with face value **$${FV}**, **${n} years** to maturity and a yield to maturity of **${fmt(y * 100, 1)}%**?`,
          zh: `面值 $${FV}、${n} 年到期、YTM ${fmt(y * 100, 1)}% 嘅零息債券，今日價錢係幾多？`,
        },
        ans: P, unit: '$', dp: 2, tol: 0.02,
        steps: [{ en: 'Discount the face value back n years.', zh: '將面值折現 n 年。', f: `P = \\frac{FV}{(1+YTM)^{n}} = \\frac{${FV}}{(1+${round(y, 4)})^{${n}}} = ${fmt(P)}` }],
        wrong: [FV / (1 + y * n), FV * (1 - y * n), FV / Math.pow(1 + y, n - 1), FV * Math.pow(1 - y, n)],
      };
    },
  };

  function bondPrice(C, y, N, FV) {
    return (C * (1 - Math.pow(1 + y, -N))) / y + FV / Math.pow(1 + y, N);
  }
  SH.bondPrice = bondPrice;

  G['fite.couponprice'] = {
    course: 'fite7407', t: { en: 'Price of a coupon bond', zh: '有息債券價格' },
    make() {
      const FV = pick([100, 1000]);
      const cr = rint(2, 12) / 100;
      const N = pick([3, 5, 8, 10, 15, 20, 30]);
      let y = rint(2, 12) / 100;
      const C = FV * cr;
      const P = bondPrice(C, y, N, FV);
      const label = P > FV + 0.005 ? 'premium' : P < FV - 0.005 ? 'discount' : 'par';
      return {
        q: {
          en: `A **${N}-year** bond with face value **$${FV}** pays an annual coupon of **${round(cr * 100, 0)}%**. The yield to maturity is **${round(y * 100, 0)}%**. What is the bond price?`,
          zh: `一張 ${N} 年期、面值 $${FV} 嘅債券，每年票息 ${round(cr * 100, 0)}%，YTM ${round(y * 100, 0)}%。債券價錢係幾多？`,
        },
        ans: P, unit: '$', dp: 2, tol: 0.02,
        steps: [
          { en: `Annual coupon C = ${round(cr * 100, 0)}% × ${FV} = $${fmt(C)}.`, zh: `每年票息 C = ${round(cr * 100, 0)}% × ${FV} = $${fmt(C)}。` },
          { en: 'Price = present value of all coupons (an annuity) + present value of the face value.', zh: '價錢 = 所有票息嘅現值（年金）+ 面值嘅現值。', f: 'P = C \\times \\frac{1}{YTM}(1 - \\frac{1}{(1+YTM)^{N}}) + \\frac{FV}{(1+YTM)^{N}}' },
          { en: `P = ${money(P)} → the bond trades at **${label}** (coupon ${cr > y ? '>' : cr < y ? '<' : '='} YTM).`, zh: `P = ${money(P)}，所以債券係${label === 'premium' ? '溢價' : label === 'discount' ? '折讓' : '平價'}交易（票息率 ${cr > y ? '>' : cr < y ? '<' : '='} YTM）。` },
        ],
        wrong: [C * N + FV, bondPrice(C, y, N - 1, FV), FV / Math.pow(1 + y, N), (C * (1 - Math.pow(1 + y, -N))) / y, bondPrice(C, cr, N, FV) + (y === cr ? 7 : 0)],
      };
    },
  };

  G['fite.accrued'] = {
    course: 'fite7407', t: { en: 'Accrued interest when a bond changes owner', zh: '債券轉手時嘅應計利息' },
    make() {
      const FV = pick([1000, 5000, 10000]);
      const cr = rint(2, 8) / 100;
      const x = rint(20, 330);
      const C = FV * cr;
      const ia = (C * x) / 360;
      return {
        q: {
          en: `A bond with face value **$${FV}** pays an annual coupon of **${round(cr * 100, 0)}%**. It is sold **${x} days** after the last coupon date. Using the lecture's 360-day convention, how much **accrued interest** does the buyer pay the seller?`,
          zh: `面值 $${FV}、年票息 ${round(cr * 100, 0)}% 嘅債券，喺上次派息後第 ${x} 日賣出。用堂上 360 日慣例，買家要畀賣家幾多應計利息？`,
        },
        ans: ia, unit: '$', dp: 2, tol: 0.02,
        steps: [
          { en: `Annual coupon C = ${fmt(C)}.`, zh: `全年票息 C = ${fmt(C)}。` },
          { en: 'The buyer pays the seller the share of the coupon earned since the last payment.', zh: '買家要補返由上次派息到而家，賣家「賺咗」嗰部分票息。', f: `I_{A} = C \\times \\frac{x}{360} = ${fmt(C)} \\times \\frac{${x}}{360} = ${fmt(ia)}` },
        ],
        wrong: [(C * x) / 365, (C * (360 - x)) / 360, (FV * x) / 360 / 100, C - ia, (C * x) / 180],
      };
    },
  };

  G['fite.rights'] = {
    course: 'fite7407', t: { en: 'Value of a subscription right (capital increase)', zh: '供股權 (認購權) 價值' },
    make() {
      const R = pick([2, 3, 4, 5, 6, 8, 10]);
      const KN = rint(10, 40);
      const KO = KN + rint(3, 20);
      const V = (KO - KN) / (R + 1);
      const mixed = (R * KO + KN) / (R + 1);
      return {
        q: {
          en: `A company raises capital against cash with an issue ratio of **${R}:1** (${R} old shares entitle you to 1 young share). The young shares are issued at **$${KN}**. The old shares last traded at **$${KO}**. What is the theoretical **value of one right**?`,
          zh: `公司現金增資，比例 ${R}:1（每 ${R} 股舊股可以認購 1 股新股）。新股發行價 $${KN}，舊股最後成交 $${KO}。每一個認購權理論價值係幾多？`,
        },
        ans: V, unit: '$', dp: 2, tol: 0.02,
        steps: [
          { en: 'Lecture 2 formula for the value of a right:', zh: '第 2 講嘅認購權價值公式：', f: 'V = \\frac{K_{O} - K_{N}}{R + 1}' },
          { en: 'Substitute.', zh: '代入。', f: `V = \\frac{${KO} - ${KN}}{${R} + 1} = ${fmt(V)}` },
          { en: `Check: after the issue, the mixed price is (${R}×${KO} + ${KN}) ÷ ${R + 1} = ${fmt(mixed)}, and ${KO} − ${fmt(mixed)} = ${fmt(V)}.`, zh: `驗算：增資後混合價 = (${R}×${KO} + ${KN}) ÷ ${R + 1} = ${fmt(mixed)}；${KO} − ${fmt(mixed)} = ${fmt(V)}。` },
        ],
        wrong: [(KO - KN) / R, KO - KN, (KO - KN) / (R - 1), mixed, (KO + KN) / (R + 1)],
      };
    },
  };

  G['fite.split'] = {
    course: 'fite7407', t: { en: 'Share split and reverse split', zh: '拆股同合股' },
    make() {
      const reverse = Math.random() < 0.5;
      if (!reverse) {
        const k = pick([2, 3, 4, 5, 10]);
        const n = rint(1, 30) * 10;
        const p = rint(40, 600);
        return {
          q: {
            en: `You hold **${n} shares** priced at **$${p}**. The company announces a **1:${k} share split**. What is the theoretical share price **after** the split?`,
            zh: `你持有 ${n} 股，股價 $${p}。公司宣布 1:${k} 拆股。拆股後理論股價係幾多？`,
          },
          ans: p / k, unit: '$', dp: 2,
          steps: [
            { en: `Each old share becomes ${k} new shares, so you now hold ${n} × ${k} = ${n * k} shares.`, zh: `每 1 股舊股變 ${k} 股新股，所以你而家有 ${n * k} 股。` },
            { en: `Company value does not change, so the price falls by the same ratio: ${p} ÷ ${k} = ${fmt(p / k)}. Your total value stays ${money(n * p, 0)}.`, zh: `公司價值冇變，股價按同一比例下跌：${p} ÷ ${k} = ${fmt(p / k)}。你嘅總值仍然係 ${money(n * p, 0)}。` },
          ],
          wrong: [p * k, p, p / k + k, (p * n) / k],
        };
      }
      const k = pick([4, 5, 10, 20, 100]);
      const n = k * rint(2, 40);
      const p = round(rint(5, 300) / 100, 2);
      return {
        q: {
          en: `You hold **${n} units** of a security priced at **$${fmt(p)}**. The issuer executes a **${k}:1 reverse split**. How many units should be in your depot **after** the reverse split?`,
          zh: `你持有 ${n} 單位，價錢 $${fmt(p)}。發行人做 ${k}:1 合股（反向拆股）。合股後你個戶口應該有幾多單位？`,
        },
        ans: n / k, unit: '', dp: 0,
        steps: [
          { en: `${k} old units are combined into 1 new unit: ${n} ÷ ${k} = ${n / k}.`, zh: `${k} 個舊單位合併成 1 個新單位：${n} ÷ ${k} = ${n / k}。` },
          { en: `The price rises by the same factor to about ${money(p * k)}. This is exactly the booking DWP Bank failed to make in 2022.`, zh: `價錢按同一倍數升到大約 ${money(p * k)}。DWP Bank 2022 年就係漏咗做呢個調整！` },
        ],
        wrong: [n * k, n, n / k + k, n - k],
      };
    },
  };

  /* Auction: principle of highest executable volume (Lecture 1, slide 51) */
  G['fite.auction'] = {
    course: 'fite7407', t: { en: 'Auction price: highest executable volume', zh: '競價：最大成交量原則' },
    make() {
      for (let tries = 0; tries < 50; tries++) {
        const base = rint(20, 200);
        const prices = [base, base + 1, base + 2, base + 3];
        const buyMkt = rint(0, 4) * 20;
        const sellMkt = rint(0, 4) * 20;
        const buys = prices.map((p) => ({ p, u: rint(1, 7) * 20 }));
        const sells = prices.map((p) => ({ p, u: rint(1, 7) * 20 }));
        const rows = prices.map((p) => {
          const b = buyMkt + buys.filter((o) => o.p >= p).reduce((a, o) => a + o.u, 0);
          const s = sellMkt + sells.filter((o) => o.p <= p).reduce((a, o) => a + o.u, 0);
          return { p, b, s, t: Math.min(b, s) };
        });
        const maxT = Math.max(...rows.map((r) => r.t));
        const best = rows.filter((r) => r.t === maxT);
        if (best.length !== 1 || maxT === 0) continue;
        const tbl = (withTurnover) =>
          '<table class="tbl"><tr><th>Price</th><th>Buy units</th><th>Sell units</th>' + (withTurnover ? '<th>Executable</th>' : '') + '</tr>' +
          rows.map((r) => `<tr class="${withTurnover && r.t === maxT ? 'hi' : ''}"><td>${r.p}</td><td>${r.b}</td><td>${r.s}</td>${withTurnover ? '<td>' + r.t + '</td>' : ''}</tr>`).join('') + '</table>';
        const book =
          '<table class="tbl"><tr><th>Buy units</th><th>Limit</th><th></th><th>Sell units</th><th>Limit</th></tr>' +
          `<tr><td>${buyMkt || '—'}</td><td>${buyMkt ? 'market' : ''}</td><td></td><td>${sellMkt || '—'}</td><td>${sellMkt ? 'market' : ''}</td></tr>` +
          prices.map((p, i) => `<tr><td>${buys[i].u}</td><td>${p}</td><td></td><td>${sells[i].u}</td><td>${p}</td></tr>`).join('') + '</table>';
        return {
          q: {
            en: 'In a call auction the exchange collects these orders:\n\n' + '%%BOOK%%' + '\n\nUsing the **principle of highest executable volume**, at which price is the auction executed?',
            zh: '競價時交易所收集咗以上買賣盤。用「最大成交量原則」，成交價係幾多？',
          },
          book,
          ans: best[0].p, unit: '', dp: 0,
          steps: [
            { en: 'A buy order executes at price p if its limit is **at or above** p (market orders always). A sell order executes if its limit is **at or below** p.', zh: '買盤：限價 ≥ p 先成交（市價盤一定計）。賣盤：限價 ≤ p 先成交。' },
            { en: 'For each price, executable volume = min(buy units, sell units).', zh: '每個價位嘅可成交量 = min(買入量, 賣出量)。', html: tbl(true) },
            { en: `The highest executable volume is ${maxT} units at price **${best[0].p}**.`, zh: `最大可成交量係 ${maxT}，對應價位 ${best[0].p}。` },
          ],
          wrong: prices.filter((p) => p !== best[0].p),
        };
      }
      return G['fite.split'].make();
    },
  };

  G['fite.basel'] = {
    course: 'fite7407', t: { en: 'Basel II minimum capital (8% rule)', zh: '巴塞爾 II 最低資本 (8%)' },
    make() {
      const cr = rint(200, 900) * 10;
      const mr = rint(20, 300) * 10;
      const or = rint(30, 200) * 10;
      const cap = 0.08 * (cr + mr + or);
      return {
        q: {
          en: `A bank has risk-weighted assets of **$${fmt(cr, 0)}m** for credit risk, **$${fmt(mr, 0)}m** for market risk and **$${fmt(or, 0)}m** for operational risk. Under the simplified Basel II rule, what is the **minimum proprietary capital** it must hold?`,
          zh: `銀行嘅風險加權資產：信用風險 $${fmt(cr, 0)}m、市場風險 $${fmt(mr, 0)}m、操作風險 $${fmt(or, 0)}m。用簡化巴塞爾 II 規則，最少要有幾多自有資本？`,
        },
        ans: cap, unit: '$m', dp: 1,
        steps: [
          { en: 'Simplified Basel II: capital ÷ (credit + market + operational risk) must be at least 8%.', zh: '簡化巴塞爾 II：自有資本 ÷ (信用 + 市場 + 操作風險) ≥ 8%。', f: '\\frac{\\text{Proprietary capital}}{\\text{Credit risk} + \\text{Market risk} + \\text{Operational risk}} \\ge 8\\%' },
          { en: 'Rearrange and substitute.', zh: '移項再代入。', f: `Capital \\ge 0.08 \\times (${cr} + ${mr} + ${or}) = ${fmt(cap, 1)}` },
        ],
        wrong: [0.08 * cr, 0.08 * (cr + mr), 0.8 * (cr + mr + or) / 10 + 5, (cr + mr + or) / 8, 0.1 * (cr + mr + or)],
      };
    },
  };

  /* CCP netting (Lecture 1, slides 68-70) */
  G['fite.ccp'] = {
    course: 'fite7407', t: { en: 'CCP netting: what one bank finally pays', zh: '中央對手方 (CCP) 淨額結算' },
    make() {
      const banks = ['A', 'B', 'C', 'D'];
      const flows = [];
      const pairs = SH.shuffle([['A', 'C'], ['A', 'B'], ['B', 'D'], ['C', 'D'], ['B', 'C'], ['D', 'A']]).slice(0, 4);
      for (const [x, y] of pairs) {
        const amt = rint(2, 12) * 10;
        flows.push(Math.random() < 0.5 ? { from: x, to: y, amt } : { from: y, to: x, amt });
      }
      const target = pick(banks.filter((b) => flows.some((f) => f.from === b || f.to === b)));
      const net = flows.reduce((a, f) => a + (f.from === target ? f.amt : 0) - (f.to === target ? f.amt : 0), 0);
      const gross = flows.filter((f) => f.from === target).reduce((a, f) => a + f.amt, 0);
      const list = flows.map((f) => `- Bank ${f.from} pays Bank ${f.to} **$${f.amt}**`).join('\n');
      return {
        q: {
          en: `Today's trades create these payments:\n\n${list}\n\nAll trades go through a **central counterparty (CCP)** that settles **net positions**. How much does **Bank ${target}** finally pay to the CCP? (Enter a negative number if Bank ${target} receives money.)`,
          zh: `今日嘅交易產生以上付款。全部經中央對手方 (CCP) 做淨額結算。Bank ${target} 最後要畀 CCP 幾多錢？（如果係收錢就答負數。）`,
        },
        ans: net, unit: '$', dp: 0,
        steps: [
          { en: `Add everything Bank ${target} pays and subtract everything it receives.`, zh: `將 Bank ${target} 要畀嘅錢加埋，減去佢收嘅錢。` },
          { en: `Net = ${flows.filter((f) => f.from === target).map((f) => f.amt).join(' + ') || 0} − (${flows.filter((f) => f.to === target).map((f) => f.amt).join(' + ') || 0}) = ${net}`, zh: `淨額 = ${net}。${net > 0 ? '正數即係要畀錢。' : net < 0 ? '負數即係會收錢。' : '零即係唔使郁錢！'}` },
          { en: 'Only this difference moves between the bank and the CCP. Fewer and smaller payments reduce settlement risk.', zh: '最後淨係呢個差額會轉賬，次數同金額都細咗，結算風險就減少。' },
        ],
        wrong: [gross, -net, gross + Math.abs(net), net + 10, net - 10],
      };
    },
  };
})();

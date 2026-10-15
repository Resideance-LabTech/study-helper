/* COMP7802 animated lessons. Coordinates are in a 340 × 220 view box. Numbers follow the lecture examples. */
(function () {
  const A = SH.addScene;

  /* ---------- L1: simple vs compound ---------- */
  const yrs = [[0, 100, 100], [5, 120, 121.67], [10, 140, 148.02], [20, 180, 219.11]];
  A({
    id: 'c1.compound', course: 'comp7802', lecture: 'c1', t: { en: 'Simple line vs compound snowball', zh: '單利直線 vs 複利雪球' },
    base: (D) => D.text('h', 170, 20, '$100 at 4% a year', 'sc-note') +
      yrs.map(([y], k) => D.text('y' + k, 8, 52 + k * 44, 'Yr ' + y, 'sc-sub', 'start') +
        D.bar('s' + k, 44, 36 + k * 44, 0, 11, 'n') + D.bar('c' + k, 44, 50 + k * 44, 0, 11, 'a') +
        D.text('vs' + k, 336, 46 + k * 44, '', 'sc-sub', 'end') + D.text('vc' + k, 336, 60 + k * 44, '', 'sc-sub', 'end')).join('') +
      D.text('res', 170, 214, '', 'sc-lbl'),
    frames: [
      { en: 'Put **$100** away at **4%** a year. Grey bars = **simple** interest, blue bars = **compound** interest.', zh: '存 **$100**，年利率 **4%**。灰色 = **單利**，藍色 = **複利**。', set: { s0: { w: 100 }, c0: { w: 100 }, vs0: { txt: '100' }, vc0: { txt: '100' } } },
      { en: 'Simple interest pays only on the **principal**: +$4 every year, a **straight line** → $120, $140, $180.', zh: '單利只計**本金**：每年 +$4，一條**直線** → $120、$140、$180。', set: { s1: { w: 120 }, s2: { w: 140 }, s3: { w: 180 }, vs1: { txt: '120' }, vs2: { txt: '140' }, vs3: { txt: '180' } } },
      { en: 'Compound interest **reinvests** the interest, so interest earns interest: $121.67, $148.02, **$219.11**.', zh: '複利將利息**再投資**，利息再生利息：$121.67、$148.02、**$219.11**。', set: { c1: { w: 122 }, c2: { w: 148 }, c3: { w: 219, pulse: true }, vc1: { txt: '121.67' }, vc2: { txt: '148.02' }, vc3: { txt: '219.11' } } },
      { en: 'Rule: $FV = PV(1+i)^N$. Lecture check: two years → 100 × 1.04² = **$108.16**. The gap keeps growing — the **snowball**.', zh: '公式：$FV = PV(1+i)^N$。課堂例子：兩年 → 100 × 1.04² = **$108.16**。差距越嚟越大——**雪球**。', set: { res: { txt: 'FV = PV(1 + i)ᴺ' } } },
    ],
  });

  /* ---------- L1: discount factors on a timeline ---------- */
  A({
    id: 'c1.pv', course: 'comp7802', lecture: 'c1', t: { en: 'Moving money through time', zh: '將錢喺時間上搬來搬去' },
    base: (D) => D.raw('<line class="sc-arrow" x1="20" y1="120" x2="324" y2="120"/>') +
      D.text('t0', 40, 144, 'Today', 'sc-sub') + D.text('t1', 300, 144, 'In 2 years', 'sc-sub') +
      D.tok('m', 40, 100, '$100', 'a', 24) + D.text('lab', 170, 60, '', 'sc-big') + D.text('f', 170, 190, '', 'sc-lbl'),
    frames: [
      { en: 'Money today is worth more than money later, because it can earn interest. Start with **$100 today**, rate **4%**.', zh: '今日嘅錢比將來嘅錢值錢，因為可以賺利息。今日有 **$100**，利率 **4%**。' },
      { en: '**Future value:** compound forward. $100 × 1.04² = **$108.16** in two years.', zh: '**終值**：向前複利。$100 × 1.04² = 兩年後 **$108.16**。', set: { m: { x: 300, txt: '$108' }, lab: { txt: '× (1 + i)ᴺ →' }, f: { txt: 'FV = 100 × 1.04² = 108.16' } } },
      { en: '**Present value:** discount back. A promise of $108.16 in two years is worth $108.16 / 1.04² = **$100** now.', zh: '**現值**：向後折現。兩年後 $108.16 今日值 $108.16 / 1.04² = **$100**。', set: { m: { x: 40, txt: '$100' }, lab: { txt: '← ÷ (1 + i)ᴺ' }, f: { txt: 'PV = 108.16 / 1.04² = 100' } } },
      { en: 'The **discount factor** is what $1 at that date is worth today: 1 / 1.04² = **0.9246**. PV = cash flow × DF.', zh: '**折現因子**即係嗰日嘅 $1 今日值幾多：1 / 1.04² = **0.9246**。現值 = 現金流 × DF。', set: { lab: { txt: 'DF = 0.9246' }, f: { txt: 'PV = CF × DF' }, m: { pulse: true } } },
    ],
  });

  /* ---------- L2: CD pricing ---------- */
  A({
    id: 'c2.cd', course: 'comp7802', lecture: 'c2', t: { en: 'Pricing a CD in the secondary market', zh: '二手市場存款證定價' },
    base: (D) => D.raw('<line class="sc-arrow" x1="20" y1="110" x2="324" y2="110"/>') +
      D.text('d0', 30, 134, 'Issue 2 Jan 14', 'sc-sub', 'start') + D.text('d1', 228, 134, 'Buy (61 days left)', 'sc-sub') + D.text('d2', 318, 134, 'Mature', 'sc-sub', 'end') +
      D.chip('face', 40, 90, '$1,000,000', 'n', 80) + D.chip('mat', 300, 90, '$1,050,000', 'g', 80) + D.chip('px', 228, 168, 'price?', 'a', 90) +
      D.text('f', 170, 40, '', 'sc-big') + D.text('f2', 170, 206, '', 'sc-lbl'),
    init: { mat: { o: 0 }, px: { o: 0 } },
    frames: [
      { en: 'A one-year CD: face **$1,000,000**, coupon **5%**, issued 2 Jan 2014, matures 2 Jan 2015 (ACT/365).', zh: '一年期存款證：面值 **$1,000,000**、票息 **5%**，2014-01-02 發行、2015-01-02 到期（ACT/365）。' },
      { en: 'Step 1 — **maturity proceeds** = face × (1 + coupon × days/year) = **$1,050,000**.', zh: '第一步——**到期金額** = 面值 × (1 + 票息 × 日數/年) = **$1,050,000**。', set: { mat: { o: 1, pulse: true }, f: { txt: '1,000,000 × (1 + 0.05) ' } } },
      { en: 'You buy it with **61 days** left, when 2-month rates are **4%**. Only the remaining time matters now.', zh: '剩 **61 日**時買入，兩個月利率 **4%**。而家只睇剩餘時間。', set: { px: { o: 1 }, d1: { pulse: true } } },
      { en: 'Step 2 — **price = PV of the maturity proceeds**: 1,050,000 / (1 + 0.04 × 61/365) = **$1,043,027**.', zh: '第二步——**價錢 = 到期金額嘅現值**：1,050,000 / (1 + 0.04 × 61/365) = **$1,043,027**。', set: { px: { txt: '$1,043,027', tone: 'ok' }, f: { txt: 'Price = 1,050,000 / (1 + 0.04 × 61/365)' } } },
      { en: 'Higher yield = **lower price**. Quote "4.13 – 3.89": the dealer **buys** at 4.13% (cheap) and **sells** at 3.89% (dear).', zh: '收益率高 = **價錢低**。報價「4.13 – 3.89」：莊家用 4.13% **買**（平）、3.89% **賣**（貴）。', set: { f2: { txt: 'yield ↑  ⇒  price ↓' } } },
    ],
  });

  /* ---------- L2: T-bill discount basis ---------- */
  A({
    id: 'c2.tbill', course: 'comp7802', lecture: 'c2', t: { en: 'Discount rate vs true yield', zh: '貼現率 vs 真實收益率' },
    base: (D) => D.bar('face', 20, 60, 300, 26, 'n', 'Face value (paid at maturity)') + D.bar('px', 20, 120, 300, 26, 'a', 'Price paid today') +
      D.bar('disc', 320, 120, 0, 26, 's') + D.text('f', 170, 196, '', 'sc-lbl') + D.text('g', 170, 30, '', 'sc-big'),
    frames: [
      { en: 'A **T-bill** pays no coupon. You buy it **below face value** and receive face value at maturity.', zh: '**國庫券**冇票息，用**低於面值**買入，到期收面值。' },
      { en: 'Quoted on a **discount basis**: the discount is computed on the **face value**. $1,000,000, 50 days, **4.12%**, 360-day year → discount = **$5,722**.', zh: '以**貼現基礎**報價：貼現按**面值**計。$1,000,000、50 日、**4.12%**、360 日 → 貼現 = **$5,722**。', set: { px: { w: 292 }, disc: { x: 312, w: 8 }, f: { txt: 'Price = 1,000,000 − 5,722 = 994,278' } } },
      { en: 'But you only invested **$994,278**, not $1,000,000. The **true yield** is on the amount paid: 0.0412 / (1 − 0.0412 × 50/360) = **4.144%**.', zh: '但你只係投資咗 **$994,278**。**真實收益率**按付出金額計：0.0412 / (1 − 0.0412 × 50/360) = **4.144%**。', set: { px: { pulse: true }, g: { txt: 'yield 4.144% > discount 4.12%' } } },
      { en: 'So the **yield is always higher than the discount rate**. Exam tip: say which one a quote is before you calculate!', zh: '所以**收益率一定高過貼現率**。考試貼士：計之前講清楚個報價係邊種！', set: { f: { txt: 'y = D / (1 − D × t)' } } },
    ],
  });

  /* ---------- L3: FRA hedge ---------- */
  A({
    id: 'c3.fra', course: 'comp7802', lecture: 'c3', t: { en: 'An FRA locks the borrowing rate', zh: 'FRA 鎖定借貸利率' },
    base: (D) => D.raw('<line class="sc-arrow" x1="16" y1="70" x2="326" y2="70"/>') +
      D.text('l0', 30, 56, 'Today', 'sc-sub') + D.text('l1', 150, 56, '3 months', 'sc-sub') + D.text('l2', 310, 56, '6 months', 'sc-sub', 'end') +
      D.bar('per', 150, 76, 166, 10, 'a', 'loan period (92 days)') +
      D.chip('fra', 30, 120, 'FRA 8.25%', 'g', 74) + D.chip('mkt', 150, 160, 'L = ?', 'n', 70) + D.text('res', 170, 206, '', 'sc-lbl') + D.text('pay', 250, 130, '', 'sc-big'),
    frames: [
      { en: 'A company will **borrow $10m in 3 months** for 3 months and fears rates will rise. Today it **buys a 3 v 6 FRA at 8.25%**.', zh: '公司 **3 個月後要借 $10m**、借 3 個月，驚加息。今日**買入 3 v 6 FRA，8.25%**。', set: { fra: { pulse: true } } },
      { en: 'In 3 months the **reference rate fixes**. Suppose it is **9.00%** — rates did rise.', zh: '3 個月後**參考利率定盤**。假設係 **9.00%**——真係加咗息。', set: { fra: { x: 150 }, mkt: { txt: 'L = 9.00%', tone: 's', pulse: true } } },
      { en: 'L > FRA rate, so the **buyer receives** the difference: 10m × 0.75% × 92/360 = 19,166.67…', zh: 'L 高過 FRA 利率，所以**買方收**差額：10m × 0.75% × 92/360 = 19,166.67……', set: { pay: { txt: '+19,166.67' } } },
      { en: '…**discounted** to the start of the period, because it is paid now, not at the end: 19,166.67 / (1 + 0.09 × 92/360) = **$18,735.74**.', zh: '……要**折現**到期初，因為係而家付，唔係期尾：÷ (1 + 0.09 × 92/360) = **$18,735.74**。', set: { pay: { txt: '+18,735.74' }, res: { txt: 'N × (L − FRA) × t / (1 + L × t)' } } },
      { en: 'The company borrows at 9% in the market but the FRA pays it back the extra: its **net cost stays 8.25%**.', zh: '公司喺市場以 9% 借，但 FRA 補返差額：**淨成本仍然係 8.25%**。', set: { fra: { tone: 'ok' }, res: { txt: 'Net borrowing cost = 8.25% (locked)' } } },
    ],
  });

  /* ---------- L3: futures daily margin ---------- */
  A({
    id: 'c3.margin', course: 'comp7802', lecture: 'c3', t: { en: 'Futures: ticks and daily margin', zh: '期貨：跳動同每日保證金' },
    base: (D) => D.box('you', 10, 30, 90, 50, 'You', '', 'long 1 HIBOR fut.') + D.box('ch', 240, 30, 90, 50, 'Clearing house', '', 'counterparty') +
      D.text('px', 170, 50, '95.25', 'sc-big') + D.text('rate', 170, 70, 'rate 4.75%', 'sc-sub') +
      D.bar('acct', 20, 130, 150, 20, 'g', 'margin account') + D.text('bal', 190, 145, '', 'sc-lbl', 'start') + D.tok('cash', 120, 105, '$', 'g', 13) + D.text('n', 170, 200, '', 'sc-lbl'),
    init: { cash: { o: 0 } },
    frames: [
      { en: 'You buy one **3-month HIBOR future** at **95.25** — the price is **100 − rate**, so it implies 4.75%. You post **initial margin**.', zh: '你以 **95.25** 買一張 **3 個月 HIBOR 期貨**——價 = **100 − 利率**，即 4.75%。你交**初始保證金**。', set: { bal: { txt: 'initial margin posted' } } },
      { en: 'The **clearing house** is now your counterparty — buyer to every seller, seller to every buyer.', zh: '**結算所**而家係你嘅對手——每個賣方嘅買方、每個買方嘅賣方。', set: { ch: { pulse: true } } },
      { en: 'Rates rise; the price falls to **95.15**: down **10 ticks**. One tick = 5,000,000 × 0.0001 × ¼ = **HK$125**.', zh: '加息，價跌到 **95.15**：跌 **10 個點**。每點 = 5,000,000 × 0.0001 × ¼ = **HK$125**。', set: { px: { txt: '95.15', pulse: true }, rate: { txt: 'rate 4.85%' }, n: { txt: '10 ticks × HK$125 = HK$1,250' } } },
      { en: '**Marking to market:** the loss of **HK$1,250** is paid **today** as variation margin, flowing to the clearing house.', zh: '**按市值計價**：**HK$1,250** 虧損**今日**就要以變動保證金付畀結算所。', set: { cash: { o: 1, x: 270, y: 105 }, acct: { w: 120, tone: 's' }, bal: { txt: '− HK$1,250' } } },
      { en: 'Daily settlement keeps losses small, so the clearing house is protected. **Rates up → futures price down.**', zh: '每日結算令虧損唔會積聚，保障結算所。**加息 → 期貨價跌。**', set: { cash: { o: 0 }, n: { txt: 'Rates ↑  ⇒  futures price ↓' } } },
    ],
  });

  /* ---------- L4: swap from comparative advantage ---------- */
  A({
    id: 'c4.swap', course: 'comp7802', lecture: 'c4', t: { en: 'How a swap makes both sides better off', zh: '掉期點樣令雙方都著數' },
    base: (D) => D.box('A', 10, 70, 100, 60, 'Company A', '', 'fixed 8% · float S+0.1%') + D.box('B', 230, 70, 100, 60, 'Company B', '', 'fixed 9.5% · float S+0.8%') +
      D.chip('ma', 60, 170, 'borrows 8% fixed', 'n', 104) + D.chip('mb', 280, 170, 'borrows S+0.8%', 'n', 96) +
      D.arrow('fl', 112, 88, 228, 88) + D.arrow('fx', 228, 114, 112, 114) + D.text('tfl', 170, 82, 'SOFR', 'sc-sub') + D.text('tfx', 170, 128, '8.3%', 'sc-sub') +
      D.text('h', 170, 24, '', 'sc-big') + D.text('na', 60, 206, '', 'sc-lbl') + D.text('nb', 280, 206, '', 'sc-lbl'),
    init: { ma: { o: 0 }, mb: { o: 0 }, fl: { o: 0 }, fx: { o: 0 }, tfl: { o: 0 }, tfx: { o: 0 } },
    frames: [
      { en: 'A (strong credit) borrows fixed at **8%** or floating at **SOFR+0.1%**. B pays **9.5%** fixed or **SOFR+0.8%**. A wants floating, B wants fixed.', zh: 'A（信用好）定息 **8%**、浮息 **SOFR+0.1%**。B 定息 **9.5%**、浮息 **SOFR+0.8%**。A 想要浮息，B 想要定息。' },
      { en: 'A\'s advantage is **1.5%** in fixed but only **0.7%** in floating. Total gain available = 1.5 − 0.7 = **0.8%**.', zh: 'A 喺定息優勢 **1.5%**、浮息只有 **0.7%**。可分嘅總利益 = 1.5 − 0.7 = **0.8%**。', set: { h: { txt: 'gain = 1.5% − 0.7% = 0.8%' } } },
      { en: 'Each borrows where it is **relatively** cheap: A borrows **fixed 8%**, B borrows **floating SOFR+0.8%**.', zh: '各自喺**相對**平嘅市場借：A 借**定息 8%**，B 借**浮息 SOFR+0.8%**。', set: { ma: { o: 1 }, mb: { o: 1 } } },
      { en: 'They swap: A pays B **SOFR**; B pays A **8.3% fixed**.', zh: '交換：A 付 B **SOFR**；B 付 A **8.3% 定息**。', set: { fl: { o: 1 }, fx: { o: 1 }, tfl: { o: 1 }, tfx: { o: 1 } } },
      { en: 'A nets **SOFR − 0.3%** (saves 0.4% vs SOFR+0.1%). B nets **9.1% fixed** (saves 0.4% vs 9.5%). Shared gain: **0.4% + 0.4% = 0.8%**.', zh: 'A 淨付 **SOFR − 0.3%**（慳 0.4%）。B 淨付 **9.1% 定息**（慳 0.4%）。雙方共分 **0.8%**。', set: { na: { txt: 'net SOFR − 0.3%' }, nb: { txt: 'net 9.1% fixed' }, A: { tone: 'ok' }, B: { tone: 'ok' } } },
    ],
  });

  /* ---------- L5: bootstrapping ---------- */
  A({
    id: 'c5.boot', course: 'comp7802', lecture: 'c5', h: 240, t: { en: 'Bootstrapping the discount curve', zh: '自舉折現曲線' },
    base: (D) => D.raw('<line class="sc-arrow" x1="20" y1="180" x2="326" y2="180"/><line class="sc-arrow" x1="20" y1="180" x2="20" y2="30"/>') +
      ['3M', '6M', '9M', '1Y'].map((t, k) => D.text('x' + k, 80 + k * 70, 198, t, 'sc-sub')).join('') +
      ['0.992036', '0.983017', '0.974035', '0.964385'].map((v, k) => D.tok('p' + k, 80 + k * 70, 50 + k * 30, '', ['a', 'g', 'g', 's'][k], 9) + D.text('v' + k, 80 + k * 70, 34 + k * 30, v, 'sc-sub')).join('') +
      D.chip('src', 170, 222, '', 'n', 250) + D.text('h', 330, 22, '', 'sc-note', 'end'),
    init: { p0: { o: 0 }, p1: { o: 0 }, p2: { o: 0 }, p3: { o: 0 }, v0: { o: 0 }, v1: { o: 0 }, v2: { o: 0 }, v3: { o: 0 }, src: { o: 0 } },
    frames: [
      { en: 'We build the curve **one point at a time**, each step using the discount factors already found — that is **bootstrapping**.', zh: '條曲線係**逐點**砌出嚟，每步都用之前已經搵到嘅折現因子——即係**自舉**。', set: { h: { txt: 'discount factor' } } },
      { en: '**Short end from cash:** 3M deposit 3.185%, 92 days → $D = 1/(1 + 0.03185 × 92/365)$ = **0.992036**.', zh: '**短端用現金利率**：3 個月 3.185%、92 日 → **0.992036**。', set: { p0: { o: 1, pulse: true }, v0: { o: 1 }, src: { o: 1, txt: 'cash deposit' } } },
      { en: '**Middle from FRAs:** the 3x6 FRA links the 3M DF to the 6M DF: $D_E = D_S/(1 + r t)$ → **0.983017**. Then 6x9 → **0.974035**.', zh: '**中段用 FRA**：3x6 FRA 由 3 個月 DF 推 6 個月 DF：$D_E = D_S/(1 + r t)$ → **0.983017**；6x9 → **0.974035**。', set: { p1: { o: 1 }, v1: { o: 1 }, p2: { o: 1 }, v2: { o: 1 }, src: { txt: 'FRA: D_E = D_S / (1 + r·t)' } } },
      { en: '**Long end from swaps:** a 1Y swap at 3.64% values at par, so solve for the one unknown D₄ = **0.964385**.', zh: '**長端用掉期**：1 年掉期 3.64% 以面值計，解出唯一未知數 D₄ = **0.964385**。', set: { p3: { o: 1, pulse: true }, v3: { o: 1 }, src: { txt: 'swap: Dₙ = (1 − rΣtᵢDᵢ)/(1 + rtₙ)' } } },
      { en: 'Missing maturities (e.g. 15 months) are **linearly interpolated** between quoted swap rates, then bootstrapped the same way.', zh: '冇報價嘅年期（例如 15 個月）就喺報價掉期利率之間**線性插值**，再同樣自舉。', set: { src: { txt: 'interpolate gaps, then bootstrap' } } },
    ],
  });

  /* ---------- L7: one-step binomial ---------- */
  A({
    id: 'c7.binom', course: 'comp7802', lecture: 'c7', t: { en: 'One-step binomial: the riskless portfolio', zh: '一步二項式：無風險組合' },
    base: (D) => D.raw('<line class="sc-arrow" x1="70" y1="110" x2="200" y2="56"/><line class="sc-arrow" x1="70" y1="110" x2="200" y2="164"/>') +
      D.tok('s0', 60, 110, '$20', 'a', 22) + D.tok('su', 220, 50, '$22', 'g', 22) + D.tok('sd', 220, 170, '$18', 's', 22) +
      D.text('cu', 300, 54, '', 'sc-lbl') + D.text('cd', 300, 174, '', 'sc-lbl') + D.text('c0', 60, 152, '', 'sc-lbl') + D.text('h', 170, 20, '', 'sc-note') + D.text('b', 170, 212, '', 'sc-lbl'),
    frames: [
      { en: 'Stock **$20** today. In 3 months it is either **$22** or **$18**. Price a call with strike **$21**; r = 12%.', zh: '股價今日 **$20**，3 個月後係 **$22** 或 **$18**。求行使價 **$21** 嘅認購價；r = 12%。', set: { h: { txt: 'K = 21, T = 0.25, r = 12%' } } },
      { en: 'Call payoffs: **max(22 − 21, 0) = 1** in the up state, **0** in the down state.', zh: '認購回報：升 **max(22 − 21, 0) = 1**；跌 **0**。', set: { cu: { txt: 'call = 1' }, cd: { txt: 'call = 0' } } },
      { en: 'Hold **Δ shares** and **short 1 call**. Make both states equal: 22Δ − 1 = 18Δ → **Δ = 0.25**.', zh: '持 **Δ 股**、**沽 1 張認購**。兩邊相等：22Δ − 1 = 18Δ → **Δ = 0.25**。', set: { cu: { txt: '22Δ − 1 = 4.5' }, cd: { txt: '18Δ = 4.5' }, b: { txt: 'Δ = 0.25  → riskless value 4.5' } } },
      { en: 'A **riskless** portfolio must earn the **risk-free rate**: PV = 4.5 × e^(−0.12 × 0.25) = **4.367**.', zh: '**無風險**組合一定賺**無風險利率**：現值 = 4.5 × e^(−0.03) = **4.367**。', set: { b: { txt: 'PV = 4.5 e^(−0.03) = 4.367' }, s0: { pulse: true } } },
      { en: 'So 20 × 0.25 − C = 4.367 → **C = $0.633**. No probabilities of up or down were needed!', zh: '所以 20 × 0.25 − C = 4.367 → **C = $0.633**。完全唔使知升跌機率！', set: { c0: { txt: 'C = 0.633' }, s0: { tone: 'ok' } } },
    ],
  });

  /* ---------- L8: delta hedging ---------- */
  A({
    id: 'c8.delta', course: 'comp7802', lecture: 'c8', t: { en: 'Delta hedging and rebalancing', zh: 'Delta 對沖同再平衡' },
    base: (D) => D.box('opt', 10, 40, 140, 56, 'Short 500 calls', '', 'delta 0.6564') + D.box('stk', 190, 40, 140, 56, 'Long shares', '', 'none yet') +
      D.text('px', 170, 24, 'Stock $122.75', 'sc-note') + D.bar('bo', 10, 130, 0, 16, 's', 'option delta') + D.bar('bs', 190, 130, 0, 16, 'g', 'share delta') +
      D.text('net', 170, 190, '', 'sc-big') + D.text('n2', 170, 210, '', 'sc-sub'),
    frames: [
      { en: 'You **sold 500 calls**, each with **delta 0.6564**. Position delta = 500 × 0.6564 = **−328.2**: a $1 rise loses you about $328.', zh: '你**沽咗 500 張認購**，每張 **delta 0.6564**。組合 delta = **−328.2**：股價升 $1 你蝕約 $328。', set: { bo: { w: 98 } } },
      { en: 'Hedge by **buying 328.2 shares** (delta 1 each). Net delta = 0 → **delta-neutral**.', zh: '**買 328.2 股**（每股 delta 1）對沖。淨 delta = 0 → **delta 中性**。', set: { bs: { w: 98 }, stk: { sub: '328.2 shares' }, net: { txt: 'net delta = 0' } } },
      { en: 'The stock jumps to **$160** and call delta rises to **0.8**. Option delta is now 500 × 0.8 = **−400**. The hedge is broken!', zh: '股價升到 **$160**，delta 升到 **0.8**。期權 delta = **−400**。對沖失效！', set: { px: { txt: 'Stock $160', pulse: true }, opt: { sub: 'delta 0.80' }, bo: { w: 120 }, net: { txt: 'net delta = −71.8' }, bs: { tone: 's' } } },
      { en: '**Rebalance:** buy **400 − 328.2 = 71.8** more shares to get back to delta-neutral.', zh: '**再平衡**：再買 **400 − 328.2 = 71.8 股**，返回 delta 中性。', set: { bs: { w: 120, tone: 'ok' }, stk: { sub: '400 shares' }, net: { txt: 'net delta = 0' } } },
      { en: 'Delta only works for **small moves**, so hedges need **periodic rebalancing** — with high transaction costs. **Gamma** measures how fast delta changes.', zh: 'Delta 只係對**細幅變動**有效，所以要**定期再平衡**——交易成本高。**Gamma** 量度 delta 變得幾快。', set: { n2: { txt: 'big gamma ⇒ rebalance more often' } } },
    ],
  });

  /* ---------- L9: VaR ---------- */
  A({
    id: 'c9.var', course: 'comp7802', lecture: 'c9', t: { en: 'Reading a VaR number', zh: '點樣讀 VaR' },
    base: (D) => D.raw('<path d="M20 170 C 90 170, 120 40, 170 40 C 220 40, 250 170, 320 170" fill="none" stroke="var(--accent)" stroke-width="3"/><line class="sc-arrow" x1="20" y1="170" x2="326" y2="170"/>') +
      D.raw('<g class="mv" id="tail" style="opacity:0"><path d="M20 170 C 45 170, 58 160, 70 150 L 70 170 Z" fill="var(--seal)" opacity=".7"/></g>') +
      D.raw('<g class="mv" id="cut" style="opacity:0"><line x1="70" y1="40" x2="70" y2="176" stroke="var(--seal)" stroke-width="2" stroke-dasharray="5 4"/></g>') +
      D.text('l', 70, 192, '', 'sc-lbl') + D.text('r', 230, 100, '', 'sc-lbl') + D.text('h', 170, 22, 'Daily P&L distribution', 'sc-note') + D.text('b', 170, 212, '', 'sc-sub'),
    frames: [
      { en: 'Picture the portfolio\'s possible **one-day profit and loss**. Most days are near zero; big losses are rare.', zh: '想像組合**一日盈虧**嘅分佈。大部分日子接近零，大蝕好少見。' },
      { en: 'Choose a **confidence level** — say **99%** — and cut off the worst **1%** of outcomes.', zh: '揀一個**信心水平**——例如 **99%**——切走最差嗰 **1%**。', set: { cut: { o: 1 }, tail: { o: 1 } } },
      { en: 'The cut-off loss is the **VaR**: "With 99% confidence, we will not lose more than **$2m** in one day."', zh: '切點嘅虧損就係 **VaR**：「有 99% 信心，一日唔會蝕多過 **$2m**。」', set: { l: { txt: 'VaR = $2m' }, r: { txt: '99% of days' } } },
      { en: 'VaR needs three inputs: the **return distribution**, the **confidence level** and the **time horizon**.', zh: 'VaR 要三樣：**回報分佈**、**信心水平**、**時間範圍**。', set: { b: { txt: 'distribution · confidence · horizon' } } },
      { en: 'It does **not** say how bad the 1% tail can be. Only compare VaRs with the **same horizon and confidence**.', zh: 'VaR **冇**講嗰 1% 尾部可以差到幾多。只可以比較**相同時間範圍同信心水平**嘅 VaR。', set: { tail: { pulse: true }, b: { txt: 'the tail can be much worse!' } } },
    ],
  });
})();

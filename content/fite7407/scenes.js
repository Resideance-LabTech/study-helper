/* FITE7407 animated lessons. Coordinates are in a 340 × 220 view box. */
(function () {
  const A = SH.addScene;

  /* ---------- L1A: from paper to book entry ---------- */
  A({
    id: 'f1.custody', course: 'fite7407', lecture: 'f1', t: { en: 'From paper certificate to book entry', zh: '由紙本證書到記賬' },
    base: (D) => D.box('cust', 10, 120, 92, 56, 'Customer', '', 'depot account') + D.box('bank', 124, 120, 92, 56, 'Depot bank', '', 'custodian') +
      D.box('dep', 238, 120, 92, 56, 'Central depository', '', 'vault') +
      D.arrow('a1', 104, 148, 122, 148) + D.arrow('a2', 218, 148, 236, 148) +
      D.chip('cert', 56, 90, 'Share cert', 'g', 70) + D.chip('book', 56, 196, '100 units', 'a', 66) + D.text('note', 170, 40, '', 'sc-big'),
    init: { book: { o: 0 }, a1: { o: 0.25 }, a2: { o: 0.25 } },
    frames: [
      { en: 'In the paper world, the customer keeps an **individual certificate** at home and must hand it over to sell.', zh: '紙本年代，客戶自己保管**個別證書**，要賣就要交出證書。', set: { note: { txt: 'Individual certificate' } } },
      { en: '**Collective custody:** the depot bank keeps certificates of the same type together. The customer owns a **share of the pool**.', zh: '**集體託管**：託管銀行將同類證書放埋一齊，客戶擁有**池入面一份**。', set: { cert: { x: 170, y: 90 }, a1: { o: 1 }, note: { txt: 'Collective custody' } } },
      { en: 'The bank holds its positions at the **central depository**, which keeps the certificates in its vault.', zh: '銀行將持倉放喺**中央存管機構**，證書放喺佢嘅金庫。', set: { cert: { x: 284, y: 90 }, a2: { o: 1 }, note: { txt: 'Held at the depository' } } },
      { en: 'Today most issues are one **global certificate** for all rights. **No physical delivery** is possible any more.', zh: '而家大部分發行都係一張**全球證書**，**唔可以再實物交收**。', set: { cert: { s: 1.25, txt: 'GLOBAL cert' }, note: { txt: 'Global certificate' } } },
      { en: 'The customer\'s holding now exists only as a **book entry** in the depot account: 100 units.', zh: '客戶持倉而家只係戶口入面嘅**記賬**：100 單位。', set: { book: { o: 1, pulse: true }, note: { txt: 'Book entry' } } },
      { en: 'Selling means **moving book entries** between accounts — the global certificate never leaves the vault.', zh: '賣出即係**戶口之間轉移記賬**——全球證書永遠唔離開金庫。', set: { book: { x: 170, y: 196 }, note: { txt: 'Trade = re-booking' } } },
    ],
  });

  /* ---------- L1B: opening auction ---------- */
  const row = (y, p) => ({ y, p });
  A({
    id: 'f1b.auction', course: 'fite7407', lecture: 'f1b', t: { en: 'How the auction finds one price', zh: '競價點樣搵出一個價' },
    base: (D) => D.text('h1', 40, 34, 'Price', 'sc-note') + D.text('h2', 150, 34, 'Buy ▮  Sell ▮  Executable ▮', 'sc-note') +
      [row(62, 180), row(112, 181), row(162, 182)].map((r, k) =>
        D.text('p' + k, 40, r.y + 10, String(r.p), 'sc-big') +
        D.bar('b' + k, 70, r.y - 8, 0, 9, 'a') + D.bar('s' + k, 70, r.y + 4, 0, 9, 'g') + D.bar('e' + k, 70, r.y + 16, 0, 9, 'n') +
        D.text('v' + k, 320, r.y + 10, '', 'sc-lbl', 'end')).join('') +
      D.text('res', 170, 208, '', 'sc-big'),
    frames: [
      { en: 'In the opening auction the exchange first **collects all orders**. Buy: 100 at market, 60 @ 182, 80 @ 181. Sell: 80 at market, 120 @ 180, 40 @ 181.', zh: '開市競價先**收集所有盤**。買：市價 100、182 元 60、181 元 80。賣：市價 80、180 元 120、181 元 40。' },
      { en: 'For each candidate price, count the **buy** units: market orders plus every buy limit **at or above** the price → 240, 240, 160.', zh: '每個候選價計**買入量**：市價盤加限價 **≥** 該價嘅買盤 → 240、240、160。', set: { b0: { w: 96 }, b1: { w: 96 }, b2: { w: 64 } } },
      { en: 'Now the **sell** units: market orders plus every sell limit **at or below** the price → 200, 240, 240.', zh: '再計**賣出量**：市價盤加限價 **≤** 該價嘅賣盤 → 200、240、240。', set: { s0: { w: 80 }, s1: { w: 96 }, s2: { w: 96 } } },
      { en: 'Only the smaller side can trade: **executable = min(buy, sell)** → 200, 240, 160.', zh: '只有較細嗰邊可以成交：**可成交量 = min(買, 賣)** → 200、240、160。', set: { e0: { w: 80 }, e1: { w: 96 }, e2: { w: 64 }, v0: { txt: '200' }, v1: { txt: '240' }, v2: { txt: '160' } } },
      { en: 'The price with the **highest executable volume** wins: **181**. All 240 units on both sides trade — "market cleared".', zh: '**成交量最大**嘅價勝出：**181**。兩邊 240 單位全部成交——「market cleared」。', set: { e1: { tone: 'ok' }, p1: { pulse: true }, res: { txt: 'Price = 181 · market cleared' } } },
    ],
  });

  /* ---------- L1B: trade life cycle ---------- */
  A({
    id: 'f1b.lifecycle', course: 'fite7407', lecture: 'f1b', t: { en: 'A trade from order to settlement', zh: '一宗交易由落盤到交收' },
    base: (D) => D.box('c', 6, 30, 70, 44, 'Customer') + D.box('b', 92, 30, 70, 44, 'Bank') + D.box('x', 178, 30, 70, 44, 'Exchange') + D.box('k', 264, 30, 70, 44, 'Counterparty') +
      D.box('d', 120, 150, 100, 50, 'Depository', '', 'T+2 settlement') +
      D.chip('ord', 41, 96, 'Order', 'a', 52) + D.chip('conf', 213, 96, 'Trade conf.', 'g', 70) + D.chip('sec', 299, 120, 'Shares', 'a', 56) + D.tok('cash', 41, 130, '$', 'g', 14) +
      D.text('t', 170, 18, '', 'sc-note'),
    init: { conf: { o: 0 }, sec: { o: 0 }, cash: { o: 0 } },
    frames: [
      { en: 'The customer gives the bank an **order**. The bank checks identity, KYC profile and static data first.', zh: '客戶向銀行**落盤**。銀行先核對身份、KYC 同靜態資料。', set: { t: { txt: 'Day T: order' } } },
      { en: 'The bank\'s trader routes it to the **exchange**, where it is matched with a counterparty.', zh: '銀行交易員將盤送去**交易所**，同對手配對。', set: { ord: { x: 127 } } },
      { en: 'Executed! The order meets the counterparty at the exchange.', zh: '成交！盤喺交易所同對手配對成功。', set: { ord: { x: 213, txt: 'Executed' }, x: { pulse: true } } },
      { en: 'The broker immediately sends a **trade confirmation** (ISIN, price, time, fees, accrued interest) to both sides.', zh: '經紀即時將**交易確認書**（ISIN、價錢、時間、費用、應計利息）送畀雙方。', set: { conf: { o: 1, pulse: true }, ord: { o: 0 } } },
      { en: 'Two business days later (**T+2**) the trade settles at the depository by **delivery versus payment**.', zh: '兩個營業日後（**T+2**）喺存管機構用**貨銀對付**交收。', set: { sec: { o: 1, x: 200, y: 140 }, cash: { o: 1, x: 140, y: 140 }, t: { txt: 'Day T+2: settlement' }, conf: { o: 0.3 } } },
      { en: 'Shares go to the buyer\'s account and cash to the seller **at the same moment**, so neither side is exposed.', zh: '股票入買方戶口、現金入賣方戶口**同時發生**，冇人會蝕底。', set: { sec: { x: 41, y: 120 }, cash: { x: 299, y: 130 }, d: { pulse: true } } },
    ],
  });

  /* ---------- L1B: CCP netting ---------- */
  const pos = { A: [40, 40], B: [300, 40], C: [300, 180], D: [40, 180] };
  A({
    id: 'f1b.ccp', course: 'fite7407', lecture: 'f1b', t: { en: 'How a CCP nets payments', zh: '中央對手方點樣淨額結算' },
    base: (D) => Object.entries(pos).map(([k, [x, y]]) => D.tok('bk' + k, x, y, 'Bank ' + k, 'n', 24)).join('') +
      D.arrow('fAC', 62, 50, 282, 170) + D.arrow('fCB', 300, 156, 300, 66) + D.arrow('fBA', 276, 40, 66, 40) + D.arrow('fDC', 66, 180, 274, 180) +
      D.text('lAC', 150, 100, '100', 'sc-lbl') + D.text('lCB', 318, 112, '60', 'sc-lbl') + D.text('lBA', 170, 32, '70', 'sc-lbl') + D.text('lDC', 170, 196, '40', 'sc-lbl') +
      D.tok('ccp', 170, 110, 'CCP', 'g', 26) +
      D.text('nA', 40, 76, '', 'sc-lbl') + D.text('nB', 300, 76, '', 'sc-lbl') + D.text('nC', 300, 216, '', 'sc-lbl') + D.text('nD', 40, 216, '', 'sc-lbl') + D.text('sum', 170, 150, '', 'sc-note'),
    init: { ccp: { o: 0, s: 0.4 } },
    frames: [
      { en: 'Four banks trade with each other all day. Without help, every trade is a **separate payment**: 270 in total.', zh: '四間銀行成日互相交易。冇幫手嘅話，每宗都係**獨立付款**：總共 270。' },
      { en: 'If Bank A defaults, Bank C never gets its 100 — and C may then fail to pay B. That chain is **settlement risk**.', zh: '如果 A 行違約，C 行收唔到 100——C 又可能付唔到畀 B。呢條鏈就係**結算風險**。', set: { bkA: { tone: 'bad', pulse: true }, fAC: { o: 0.3 } } },
      { en: 'A **central counterparty** steps in the middle: every bank now trades only with the CCP, which **guarantees** fulfilment.', zh: '**中央對手方**企喺中間：每間銀行只同 CCP 交易，CCP **保證**履約。', set: { bkA: { tone: 'n' }, fAC: { o: 0.15 }, fCB: { o: 0.15 }, fBA: { o: 0.15 }, fDC: { o: 0.15 }, lAC: { o: 0.2 }, lCB: { o: 0.2 }, lBA: { o: 0.2 }, lDC: { o: 0.2 }, ccp: { o: 1, s: 1 } } },
      { en: 'At the end of the day the CCP **nets** each bank: A pays 30, B pays 10, D pays 40, C receives 80.', zh: '收工時 CCP 為每間銀行做**淨額**：A 付 30、B 付 10、D 付 40、C 收 80。', set: { nA: { txt: 'pays 30' }, nB: { txt: 'pays 10' }, nC: { txt: 'receives 80' }, nD: { txt: 'pays 40' }, bkC: { tone: 'ok' } } },
      { en: 'Only **80** moves instead of 270 — fewer, smaller payments and a guarantor in the middle. Settlement risk drops.', zh: '只係轉 **80** 而唔係 270——次數少、金額細，仲有中間人保證。結算風險大減。', set: { sum: { txt: 'Gross 270 → net 80' }, ccp: { pulse: true } } },
    ],
  });

  /* ---------- L2: DvP vs DFP ---------- */
  A({
    id: 'f2.dvp', course: 'fite7407', lecture: 'f2', t: { en: 'Delivery versus payment, step by step', zh: '貨銀對付 (DvP) 逐步睇' },
    base: (D) => D.box('ba', 8, 70, 92, 70, 'Bank A', '', 'seller\'s bank') + D.box('dp', 124, 70, 92, 70, 'Depository', '', 'matching') + D.box('bb', 240, 70, 92, 70, 'Bank B', '', 'buyer\'s bank') +
      D.chip('sec', 54, 160, '100 shares', 'a', 70) + D.tok('cash', 286, 168, '$1000', 'g', 20) +
      D.chip('i1', 54, 40, 'DVP', 's', 44) + D.chip('i2', 286, 40, 'RVP', 's', 44) + D.text('t', 170, 208, '', 'sc-note'),
    init: { i1: { o: 0 }, i2: { o: 0 } },
    frames: [
      { en: 'The seller\'s shares sit at Bank A; the buyer\'s cash sits at Bank B.', zh: '賣方股票喺 A 行；買方現金喺 B 行。' },
      { en: 'Bank A sends a **DVP** instruction after checking: is the position big enough, not blocked, not pledged?', zh: 'A 行檢查完持倉夠、冇凍結、冇抵押，就發出 **DVP** 指示。', set: { i1: { o: 1, x: 170, y: 40 } } },
      { en: 'Bank B sends the matching **RVP** instruction after checking the buyer has enough cash.', zh: 'B 行檢查買方現金足夠，發出配對嘅 **RVP** 指示。', set: { i2: { o: 1, x: 170, y: 60 } } },
      { en: 'The depository\'s **central matching engine** matches the two instructions.', zh: '存管機構嘅**中央配對引擎**將兩份指示配對。', set: { dp: { pulse: true }, i1: { o: 0.2 }, i2: { o: 0.2 }, t: { txt: 'Matched ✓' } } },
      { en: 'On settlement day shares and cash move **at the same time** in opposite directions. Nobody gives without receiving.', zh: '交收日股票同現金**同時**反方向轉移。冇人會畀咗而收唔到。', set: { sec: { x: 286, y: 160 }, cash: { x: 54, y: 168 } } },
      { en: 'With **DFP** (free of payment) only the shares would move, and no cash. That is used e.g. for transfers to another custodian.', zh: '如果係 **DFP**（免付款），就只有股票轉移、冇現金，例如轉去另一間託管銀行。', set: { t: { txt: 'DFP = securities only' } } },
    ],
  });

  /* ---------- L2: rights issue ---------- */
  A({
    id: 'f2.rights', course: 'fite7407', lecture: 'f2', t: { en: 'A capital increase against cash', zh: '現金增資（供股）' },
    base: (D) => ['Publish', 'Book rights', 'Trade rights', 'Exercise', 'Young shares'].map((s, k) => D.box('st' + k, 4 + k * 67, 40, 63, 40, s)).join('') +
      D.tok('me', 36, 110, 'Me', 'a', 16) + D.text('calc', 170, 160, '', 'sc-big') + D.text('calc2', 170, 186, '', 'sc-note'),
    init: { st1: { o: 0.35 }, st2: { o: 0.35 }, st3: { o: 0.35 }, st4: { o: 0.35 } },
    frames: [
      { en: 'The company publishes a capital increase: issue ratio **6:1**, young shares at **$18**, old shares trade at **$25**.', zh: '公司公布增資：比例 **6:1**、新股 **$18**、舊股 **$25**。' },
      { en: 'The custodian sends a rights issue advice and **books one right per old share** into each depot.', zh: '託管人寄供股通知，並為每股舊股**記入一個認購權**。', set: { st1: { o: 1 }, me: { x: 102 } } },
      { en: 'Rights trade for a few weeks. Their theoretical value: V = (25 − 18) ÷ (6 + 1) = **$1**.', zh: '認購權買賣幾個星期。理論值：V = (25 − 18) ÷ (6 + 1) = **$1**。', set: { st2: { o: 1 }, me: { x: 169 }, calc: { txt: 'V = (25 − 18) / (6 + 1) = $1' } } },
      { en: 'You either **exercise** (6 rights + $18 = 1 young share) or **sell** the rights. No instruction? The custodian sells them on the **last trading day**.', zh: '你可以**行使**（6 個權 + $18 = 1 股新股）或者**賣出**。冇指示？託管人喺**最後交易日**幫你賣。', set: { st3: { o: 1 }, me: { x: 236 }, calc2: { txt: 'No instruction → sold on the last day' } } },
      { en: 'The issuer converts exercised rights into **young shares**, which the custodian books into the depots. Average cost: (6 × 25 + 18) ÷ 7 = $24.', zh: '發行人將行使咗嘅權轉做**新股**，託管人記入戶口。平均成本：(6 × 25 + 18) ÷ 7 = $24。', set: { st4: { o: 1 }, me: { x: 303, tone: 'ok' }, calc: { txt: 'Average cost = $24 per share' } } },
    ],
  });

  /* ---------- L2: DWP Bank ---------- */
  A({
    id: 'f2.dwp', course: 'fite7407', lecture: 'f2', t: { en: 'The DWP Bank reverse-split mistake', zh: 'DWP Bank 合股出錯事件' },
    base: (D) => D.box('u', 14, 40, 150, 50, '85,000,000 units', '', 'units in the depot') + D.box('p', 176, 40, 150, 50, '€0.00005', '', 'price per unit') +
      D.box('v', 70, 110, 200, 54, '€4,250', '', 'value shown in the depot') + D.text('t', 170, 194, '', 'sc-big') + D.text('t2', 170, 212, '', 'sc-note'),
    frames: [
      { en: 'A customer holds a nearly worthless ETC: 85 million units at €0.00005 — about **€4,250** in total. (Illustrative numbers.)', zh: '客戶持有一隻差唔多冇價嘅 ETC：8,500 萬單位、每單位 €0.00005——總值約 **€4,250**。（示意數字）' },
      { en: 'The issuer does a **17,000:1 reverse split**. The price is multiplied by 17,000 → **€0.85**.', zh: '發行人做 **17,000:1 合股**。價錢乘 17,000 → **€0.85**。', set: { p: { txt: '€0.85', pulse: true }, t: { txt: 'Reverse split 17,000 : 1' } } },
      { en: 'Correct booking: units ÷ 17,000 = **5,000 units**, and the value stays €4,250.', zh: '正確記賬：單位 ÷ 17,000 = **5,000 單位**，價值仍然係 €4,250。', set: { u: { txt: '5,000 units' }, t2: { txt: 'Correct: units and price adjusted together' } } },
      { en: 'At DWP Bank the units were **not adjusted** and the security was **not blocked**. The depot showed 85 million × €0.85 = **€72 million**!', zh: 'DWP Bank **冇調整單位**，亦**冇凍結**證券。戶口顯示 8,500 萬 × €0.85 = **7,200 萬歐元**！', set: { u: { txt: '85,000,000 units' }, v: { txt: '€72,250,000', pulse: true }, t2: { txt: 'Error: price adjusted, units NOT' } } },
      { en: 'The customer sold. As **commission agent**, DWP had to deliver units that did not exist — it bought about 800,000 units at over €100.', zh: '客戶即刻賣。DWP 作為**代客交易代理**要交付根本唔存在嘅單位——喺市場以超過 €100 買咗約 80 萬單位。', set: { t: { txt: 'Buy, buy, buy…' } } },
      { en: 'Provisional loss: **about €60 million**, roughly a year\'s profit. Lesson: corporate actions must be **on time, blocked and reconciled**.', zh: '暫計損失：**約六千萬歐元**，差唔多成年利潤。教訓：公司行動要**準時、凍結、對賬**。', set: { t: { txt: 'Loss ≈ €60 million' }, t2: { txt: 'Block · adjust units AND price · reconcile' } } },
    ],
  });

  /* ---------- L3: dividend entitlement ---------- */
  A({
    id: 'f3.dividend', course: 'fite7407', lecture: 'f3', t: { en: 'Who gets the dividend?', zh: '邊個收股息？' },
    base: (D) => D.box('vault', 10, 30, 100, 44, 'Bank vault', '', 'held') + D.box('dep', 120, 30, 100, 44, 'Depository', '', 'held') + D.box('pend', 230, 30, 100, 44, 'Pending buy', '', 'not yet settled') +
      D.text('eve', 170, 100, 'Evening before the ex-day: register entitled holdings', 'sc-note') +
      D.tok('d1', 60, 140, 'Div', 'g', 16) + D.tok('d2', 170, 140, 'Div', 'g', 16) + D.tok('d3', 280, 140, 'Div', 'g', 16) +
      D.box('cash', 100, 170, 140, 40, 'Customer cash accounts'),
    init: { d1: { o: 0 }, d2: { o: 0 }, d3: { o: 0 } },
    frames: [
      { en: 'On the **evening before the ex-day** the depot bank registers all **entitled holdings**.', zh: '**除息日前一晚**，託管銀行登記所有**有權收息持倉**。', set: { eve: { pulse: true } } },
      { en: 'Entitled: holdings in the **vault**, holdings at **electronic depositories**, and **executed buys whose settlement is still pending**.', zh: '有權收息：**金庫**持倉、**電子存管**持倉，同**已成交但未交收嘅買入**。', set: { vault: { pulse: true }, dep: { pulse: true }, pend: { pulse: true } } },
      { en: 'On the ex-date the dividend is credited to the shareholders\' **cash accounts**; the shares now trade **ex-dividend**.', zh: '除息日股息入股東**現金戶口**；股票開始**除息**交易。', set: { d1: { o: 1, y: 190 }, d2: { o: 1, y: 190 } } },
      { en: 'For the pending buy, the shares were still with the seller — so the bank **collects the dividend from the counterparty**.', zh: '未交收嘅買入，股票仲喺賣方，所以銀行要**向交易對手追收股息**。', set: { d3: { o: 1, x: 240, y: 190 } } },
      { en: 'Before crediting, the bank deducts **withholding tax** and applies all reporting rules, then sends a transaction advice.', zh: '入賬前銀行扣**預扣稅**、遵守申報規則，再寄交易通知書。', set: { cash: { pulse: true } } },
    ],
  });

  /* ---------- L4: Basel II and III ---------- */
  A({
    id: 'f4.basel', course: 'fite7407', lecture: 'f4', t: { en: 'Basel II in one picture', zh: '一圖睇巴塞爾 II' },
    base: (D) => D.box('p1', 12, 40, 98, 100, 'Pillar 1', '', 'min. capital') + D.box('p2', 121, 40, 98, 100, 'Pillar 2', '', 'supervisory review') + D.box('p3', 230, 40, 98, 100, 'Pillar 3', '', 'market discipline') +
      D.bar('risk', 30, 172, 0, 12, 'n', 'Credit + market + operational risk') + D.bar('cap', 30, 196, 0, 12, 'a') + D.text('t', 170, 24, '', 'sc-note'),
    init: { p1: { o: 0.3 }, p2: { o: 0.3 }, p3: { o: 0.3 } },
    frames: [
      { en: 'Basel II aims to **measure** a bank\'s risk and make sure it is **covered by its own capital**. It stands on three pillars.', zh: '巴塞爾 II 目標係**量度**銀行風險，並確保有**自有資本**覆蓋。佢有三大支柱。' },
      { en: '**Pillar 1 — minimum capital** for credit, market and operational risk, with simple or advanced methods (e.g. VaR models, AMA).', zh: '**支柱一——最低資本**：信用、市場、操作風險，有簡單同進階方法（例如 VaR、AMA）。', set: { p1: { o: 1, pulse: true } } },
      { en: 'Add up the risks… and capital must be **at least 8%** of them.', zh: '將風險加埋……資本最少要係佢哋嘅 **8%**。', set: { risk: { w: 280 }, cap: { w: 22.4 }, t: { txt: 'Capital ≥ 8% × risk' } } },
      { en: '**Pillar 2 — supervisory review**: the regulator checks the bank\'s internal framework (ICAAP), risk management and systems.', zh: '**支柱二——監管審查**：監管機構檢查銀行內部框架 (ICAAP)、風險管理同系統。', set: { p2: { o: 1, pulse: true } } },
      { en: '**Pillar 3 — market discipline**: the bank discloses its risk position so the market can compare banks.', zh: '**支柱三——市場紀律**：銀行披露風險狀況，等市場比較。', set: { p3: { o: 1, pulse: true } } },
      { en: '**Basel III** adds more capital, a **leverage cap** and a **30-day liquidity** requirement.', zh: '**巴塞爾 III** 再加資本、**槓桿上限**同 **30 日流動性**要求。', set: { cap: { w: 40, tone: 'g' }, t: { txt: 'Basel III: more capital, leverage cap, liquidity' } } },
    ],
  });

  /* ---------- L4: VaR ---------- */
  A({
    id: 'f4.var', course: 'fite7407', lecture: 'f4', t: { en: 'What VaR really means', zh: 'VaR 真正嘅意思' },
    base: (D) => D.raw('<path d="M20 190 C 60 190, 70 60, 110 60 C 150 60, 180 150, 230 175 C 270 190, 300 188, 325 190" class="sc-arrow" fill="none" stroke-width="2.5"/>') +
      D.raw('<line x1="20" y1="190" x2="328" y2="190" class="sc-arrow"/>') + D.text('ax', 300, 208, 'damage per year →', 'sc-note') +
      D.text('mode', 110, 50, 'mode = planned damages', 'sc-note') +
      D.raw('<g class="mv" id="q" style="transform:translate(110px,0px)"><line x1="0" y1="40" x2="0" y2="190" stroke="var(--seal)" stroke-width="2" stroke-dasharray="4 3"/><text class="sc-lbl" y="34" text-anchor="middle" style="fill:var(--seal)">VaR</text></g>') +
      D.text('t', 230, 90, '', 'sc-big'),
    frames: [
      { en: 'The curve is a **probability density** of yearly losses. The peak (**mode**) is the most likely loss — the "planned damages".', zh: '條曲線係每年損失嘅**概率密度**。最高點（**眾數**）係最可能嘅損失——「計劃損失」。' },
      { en: 'The area to the left of a line is the probability that losses **stay below** it. At 95% we are 95% sure the loss is not larger.', zh: '一條線左邊嘅面積，就係損失**唔超過**佢嘅概率。95% 即係有 95% 把握損失唔會大過佢。', set: { q: { x: 220 }, t: { txt: '95% VaR' } } },
      { en: 'Basel II uses the **99.9% quantile** — only a 1-in-1,000-year loss is bigger. The line moves far into the tail.', zh: '巴塞爾 II 用 **99.9% 分位數**——一千年先有一次損失大過佢。條線移到尾部好遠。', set: { q: { x: 300 }, t: { txt: '99.9% VaR' } } },
      { en: 'Two units can have the same mode but very different tails. That is why **VaR, not the mode, is used to compare risk**.', zh: '兩個部門眾數可以一樣但尾部好唔同。所以**比較風險要用 VaR，唔係眾數**。' },
      { en: 'The bank is safe if its aggregated VaR stays **below its maximum loss cap** (budget + provisions + planned profit + own capital).', zh: '總風險 VaR **低過最大損失上限**（預算 + 撥備 + 計劃利潤 + 自有資本）就安全。', set: { t: { txt: 'VaR < maximum loss cap ✓' } } },
    ],
  });

  /* ---------- L5: the outsourcing project ---------- */
  const steps5 = ['1 Initiation', '2 Analysis', '3 Concept & RFP', '4 Preparation', '5 Decision'];
  A({
    id: 'f5.project', course: 'fite7407', lecture: 'f5', t: { en: 'An outsourcing project in five steps', zh: '外判項目五個步驟' },
    base: (D) => steps5.map((s, k) => D.box('s' + k, 4 + k * 67, 44, 63, 46, s.slice(2), '', 'step ' + (k + 1))).join('') +
      D.tok('bank', 36, 120, 'Bank', 'a', 18) + D.text('risk', 170, 170, '', 'sc-lbl') + D.text('fix', 170, 192, '', 'sc-note'),
    init: { s1: { o: 0.35 }, s2: { o: 0.35 }, s3: { o: 0.35 }, s4: { o: 0.35 } },
    frames: [
      { en: '**Initiation**: inform impacted staff openly, show job perspectives, set responsibilities, engage a neutral organiser, plan milestones.', zh: '**啟動**：坦誠通知受影響員工、講清工作前景、定職責、請中立統籌人、定里程碑。', set: { risk: { txt: 'Risk: staff not informed on time' }, fix: { txt: 'Fix: open engagement raises acceptance' } } },
      { en: '**Analysis**: study the as-is processes, decide what is outsourcable, calculate volumes and direct/indirect costs. Then a **break point**: continue?', zh: '**分析**：研究現有流程、決定可外判部分、計處理量同直接間接成本。之後有**決策點**：繼續？', set: { s1: { o: 1 }, bank: { x: 102 }, risk: { txt: 'Risk: cost base unknown' }, fix: { txt: 'Fix: measure volumes and costs first' } } },
      { en: '**Concept and RFP**: write the service requirements, screen the market, publish the **RFP**, evaluate offers with **weighted criteria**.', zh: '**概念同 RFP**：寫服務需求、篩選市場、發 **RFP**、用**加權準則**評估報價。', set: { s2: { o: 1 }, bank: { x: 169 }, risk: { txt: 'Risk: judging only by the initial price' }, fix: { txt: 'Fix: weighted criteria + all execution costs' } } },
      { en: '**Decision preparation**: RoI and payback, risks, and compare with **internal efficiency** or **shared services**.', zh: '**決策準備**：RoI 同回本期、風險，同**內部效率計劃**或**共享服務**比較。', set: { s3: { o: 1 }, bank: { x: 236 }, risk: { txt: 'Risk: too few alternatives considered' }, fix: { txt: 'Fix: compare all options on cost and risk' } } },
      { en: '**Decision** by the board; then contracts, **SLAs**, the migration project and the **change-of-control**.', zh: '**董事會決定**；再簽合約、**SLA**、遷移項目同**控制權轉移**。', set: { s4: { o: 1 }, bank: { x: 303, tone: 'ok' }, risk: { txt: 'Accountability stays with the bank' }, fix: { txt: 'Provider takes the responsibility, not the blame' } } },
    ],
  });

  /* ---------- L5: the reference process ---------- */
  const chain = ['Research', 'Advice', 'Order routing', 'Clearing', 'Custody', 'Print', 'Reg. reporting', 'Audit'];
  A({
    id: 'f5.chain', course: 'fite7407', lecture: 'f5', t: { en: 'The securities reference process', zh: '證券參考流程' },
    base: (D) => chain.map((s, k) => D.box('c' + k, 4 + (k % 4) * 84, k < 4 ? 30 : 110, 78, 40, s, '', 'system + service')).join('') +
      D.arrow('ar', 330, 52, 330, 108) + D.text('t', 170, 190, '', 'sc-lbl') + D.text('t2', 170, 208, '', 'sc-note'),
    init: Object.fromEntries(chain.map((_, k) => ['c' + k, { o: 0.3 }])),
    frames: [
      { en: 'Eight steps, from **research** to **audit**. Each has time limits, quality requirements, throughput, inputs and outputs.', zh: '八個步驟，由**研究**到**審計**。每步都有時間限制、質素要求、處理量、輸入同輸出。', set: Object.fromEntries(chain.map((_, k) => ['c' + k, { o: 1 }])) },
      { en: 'Customers see **advice** and **print services** — keep the customer relationship as a core process.', zh: '客戶睇到**諮詢**同**打印**——客戶關係要保留做核心流程。', set: { c0: { o: 0.3 }, c2: { o: 0.3 }, c3: { o: 0.3 }, c4: { o: 0.3 }, c6: { o: 0.3 }, c7: { o: 0.3 }, t: { txt: 'Visible to customers' } } },
      { en: 'The rest is **background processing** — highly technology-bound and volume-volatile: a good candidate for outsourcing.', zh: '其餘係**後台處理**——依賴科技、處理量波動大：好適合外判。', set: Object.fromEntries(chain.map((_, k) => ['c' + k, { o: [1, 5].includes(k) ? 0.3 : 1 }]).concat([['t', { txt: 'Background processing' }]])) },
      { en: 'Order routing carries almost the whole **operational risk**: orders must reach the exchange on time.', zh: '落盤傳送承擔幾乎全部**操作風險**：盤一定要準時去到交易所。', set: Object.assign(Object.fromEntries(chain.map((_, k) => ['c' + k, { o: k === 2 ? 1 : 0.3 }])), { t: { txt: 'Order routing = operational risk' } }) },
      { en: 'Custody suits an insourcer: corporate actions are set up **once for all banks**, and income is **stable**.', zh: '託管好適合承接方：公司行動**一次搞掂所有銀行**，收入**穩定**。', set: Object.assign(Object.fromEntries(chain.map((_, k) => ['c' + k, { o: k === 4 ? 1 : 0.3 }])), { t: { txt: 'Custody = economies of scale' } }) },
      { en: 'Each step = a **system** + a **service** (staff work). The bank decides how much of each to outsource — and stays **accountable**.', zh: '每步 = **系統** + **服務**（人手）。銀行決定每樣外判幾多——而且仍要**問責**。', set: Object.assign(Object.fromEntries(chain.map((_, k) => ['c' + k, { o: 1 }])), { t: { txt: 'System + service per step' }, t2: { txt: 'Outsource the work, keep the accountability' } }) },
    ],
  });
})();

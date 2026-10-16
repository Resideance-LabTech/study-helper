/* Study Helper — simulation games. One engine, two separate course sims:
   FITE7407 "Back-Office Tycoon" (run a custody & settlement bank) and
   COMP7802 "Trading Desk" (quote, hedge and manage risk while the market moves).
   Every decision is a lecture question; meters, upgrades and end-of-day events make it a game. */
(function () {
  'use strict';
  const SH = window.SH;
  const { h } = SH;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const R = { rint, pick, shuffle };
  const money = (v) => (v < 0 ? '−' : '') + '$' + Math.abs(Math.round(v)).toLocaleString('en-US') + 'k';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const delta = (m, v) => (v > 0 ? '+' : '') + (m.cash ? money(v) : (v < 0 ? '−' + Math.abs(v) : v));

  /* scenario helper: first option is the right one; options are shuffled when shown */
  const Q = (id, en, zh, o, x, xz, extra) => Object.assign({ id, en, zh, o, x, xz }, extra || {});

  /* =================================================================== engine */
  function engine(root, cid, S) {
    const best = SH.store.getBest(cid, 'sim.' + S.key);
    let mode = 'story';
    root.innerHTML = '';
    root.append(
      h('div', { class: 'sim-intro' },
        h('div', { class: 'sim-big', 'aria-hidden': 'true' }, S.emoji),
        SH.ui.biTitle(S.name, 'h2'),
        SH.ui.bi(S.story.en, S.story.zh, { say: false }),
        h('ul', { class: 'sim-rules' }, S.rules.map((r) => h('li', { html: SH.inline(r) }))),
        h('div', { class: 'sim-meters-legend' }, S.meters.map((m) => h('span', { class: 'chip' }, m.icon + ' ' + m.en))),
        h('div', { class: 'seg', role: 'group', 'aria-label': 'Mode' },
          h('button', { class: 'on', onclick: (e) => setMode(e, 'story') }, '📅 Story week · 5 themed days'),
          h('button', { onclick: (e) => setMode(e, 'quick') }, '⚡ Quick shift · mixed')),
        best != null ? h('p', { class: 'muted small' }, 'Best score: ' + best) : null,
        h('button', { class: 'btn primary block', onclick: () => start() }, 'Open the doors ▶')));
    function setMode(e, m) {
      mode = m;
      Array.from(e.currentTarget.parentNode.children).forEach((b) => b.classList.toggle('on', b === e.currentTarget));
    }

    let st;
    function start() {
      st = { day: 0, ev: 0, right: 0, n: 0, ups: new Set(), meters: {}, used: new Set(), log: [], extra: {}, review: [] };
      S.meters.forEach((m) => (st.meters[m.k] = m.start));
      if (S.init) S.init(st);
      st.plan = mode === 'story' ? S.themes.map((t) => t) : [mixTheme(), mixTheme()];
      st.perDay = mode === 'story' ? S.perDay : 6;
      dayIntro();
    }
    function mixTheme() {
      return { en: 'Mixed shift', zh: '混合更', icon: '⚡', mix: true, lids: [], scen: [], gens: [], brief: { en: 'Calls from every topic of the course, in random order.', zh: '全科題目，隨機出現。' } };
    }
    const theme = () => st.plan[st.day];
    const L = (lid) => SH.lecture(cid, lid);

    function hud() {
      const wrap = h('div', { class: 'sim-hud' });
      S.meters.forEach((m) => {
        const v = st.meters[m.k];
        const cell = h('div', { class: 'sim-m' + (m.life && v <= 25 ? ' low' : ''), id: 'simm-' + m.k },
          h('span', { class: 'sim-mi', 'aria-hidden': 'true' }, m.icon),
          h('span', { class: 'sim-ml' }, m.en),
          h('b', {}, m.cash ? money(v) : String(Math.round(v))),
          m.cash ? null : h('span', { class: 'sim-bar' }, h('i', { style: 'width:' + clamp(v, 0, 100) + '%' })));
        wrap.appendChild(cell);
      });
      if (S.ticker) wrap.appendChild(h('div', { class: 'sim-ticker' }, S.ticker(st)));
      return wrap;
    }
    function header(sub) {
      const T = theme();
      return h('div', { class: 'game-head' },
        h('h3', {}, (T.icon || '') + ' Day ' + (st.day + 1) + ' · ' + T.en),
        h('span', { class: 'muted small' }, sub || ''));
    }

    function dayIntro() {
      const T = theme();
      root.innerHTML = '';
      root.append(header(st.plan.length + '-day ' + (mode === 'story' ? 'week' : 'shift')), hud(),
        h('div', { class: 'sim-day card' },
          h('div', { class: 'sim-dayn' }, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][st.day] || 'Day ' + (st.day + 1)),
          SH.ui.biTitle({ en: T.en, zh: T.zh }, 'h2'),
          T.brief ? SH.ui.bi(T.brief.en, T.brief.zh, { say: false }) : null,
          T.lids && T.lids.length ? h('p', { class: 'muted small' }, 'Lectures: ' + T.lids.map((l) => (L(l) ? L(l).code : l)).join(', ')) : null,
          h('button', { class: 'btn primary block', onclick: () => { st.ev = 0; nextEvent(); } }, 'Start the day ▶')));
      SH.scrollTop && SH.scrollTop();
    }

    /* choose the next event: scenarios and calculations from today's theme */
    function buildEvent() {
      const T = theme();
      let scen = T.scen, gens = T.gens, lids = T.lids;
      if (T.mix) {
        scen = [].concat(...S.themes.map((t) => t.scen.map((s) => Object.assign({ _lid: t.lids[0], _cat: t.cat, _meter: t.meter }, s))));
        gens = [].concat(...S.themes.map((t) => t.gens.map((g) => [g, t.lids[0], t.cat])));
      } else {
        scen = scen.map((s) => Object.assign({ _lid: s.lid || lids[0] }, s));
        gens = gens.map((g) => [g, lids[0], T.cat]);
      }
      const wantCalc = gens.length && (T.mix ? Math.random() < 0.35 : (st.ev === st.perDay - 1 || (T.gens.length > 1 && st.ev === 1)));
      if (wantCalc) {
        const [g, lid, gcat] = pick(gens);
        const q = SH.quiz.genQuestion(cid, g, lid);
        if (q) {
          q.q = '📞 ' + pick(S.callers) + ' — ' + q.q;
          return { q, calc: true, meter: S.calcMeter, cat: gcat || 'mix' };
        }
      }
      let pool = scen.filter((s) => !st.used.has(s.id));
      if (!pool.length) { scen.forEach((s) => st.used.delete(s.id)); pool = scen; }
      const sc = pick(pool);
      st.used.add(sc.id);
      const v = typeof sc.make === 'function' ? Object.assign({}, sc, sc.make(R)) : sc;
      const q = {
        uid: cid + ':sim.' + v.id, kind: 'mcq', noRecord: true, cid, lecture: v._lid,
        q: v.en, qz: v.zh, x: v.x, xz: v.xz,
        options: shuffle(v.o.map((op, i) => ({ text: op[0], zh: op[1], ok: i === 0 }))),
      };
      return { q, sc: v, meter: v.m || v._meter || T.meter, cat: v._cat || T.cat || 'mix' };
    }

    function nextEvent() {
      if (st.ev >= st.perDay) return endOfDay();
      const E = buildEvent();
      root.innerHTML = '';
      const hudEl = hud();
      root.append(header('Task ' + (st.ev + 1) + ' / ' + st.perDay), hudEl);
      if (E.calc && st.ups.has('hint') && E.q.steps && E.q.steps[0]) {
        root.appendChild(h('details', { class: 'sim-hint' }, h('summary', {}, '🧮 Pricing library: show the first step'), SH.quiz.stepsEl([E.q.steps[0]])));
      }
      const card = SH.quiz.card(E.q, (ok) => resolve(E, ok, card, hudEl), { extraMeta: h('span', { class: 'qkind' }, E.calc ? '· client call' : '· decision') });
      root.appendChild(card);
      SH.scrollTop && SH.scrollTop();
    }

    function resolve(E, ok, card, hudEl) {
      st.n++;
      if (ok) st.right++;
      else st.review.push(SH.qShort(E.q.q.replace(/^📞 [^—]+— /, '').replace(/\*\*/g, ''), 150) + ' → **' + (E.q.options.find((o) => o.ok) || {}).text + '**');
      const fx = {};
      const half = (cat) => S.upgrades.some((u) => st.ups.has(u.id) && u.halves === cat);
      if (ok) {
        fx[S.cashKey] = rint(S.fee[0], S.fee[1]);
        fx[E.meter] = (fx[E.meter] || 0) + rint(5, 8);
        if (S.onRight) S.onRight(st, E, fx);
      } else {
        const k = half(E.cat) ? 0.5 : 1;
        fx[S.cashKey] = -Math.round(rint(S.loss[0], S.loss[1]) * k);
        fx[E.meter] = (fx[E.meter] || 0) - Math.round(rint(8, 12) * k);
        if (S.onWrong) S.onWrong(st, E, fx, k);
      }
      applyFx(fx);
      const row = h('div', { class: 'sim-fx' }, Object.keys(fx).filter((k) => fx[k]).map((k) => {
        const m = S.meters.find((x) => x.k === k);
        return h('span', { class: 'sim-d ' + (fx[k] > 0 ? 'up' : 'down') }, m.icon + ' ' + delta(m, fx[k]));
      }), E.note ? h('span', { class: 'muted small' }, E.note) : null);
      hudEl.replaceWith(hud());
      const dead = S.meters.find((m) => m.life && st.meters[m.k] <= 0);
      const btn = h('button', { class: 'btn primary block', onclick: () => { st.ev++; dead ? finish(dead) : nextEvent(); } }, dead ? 'See what happened…' : (st.ev + 1 >= st.perDay ? 'Close the day ▶' : 'Next task ▶'));
      const fb = card.querySelector('.qfb');
      (fb || card).append(row, btn);
    }
    function applyFx(fx) {
      for (const k in fx) {
        const m = S.meters.find((x) => x.k === k);
        st.meters[k] = m.cash ? st.meters[k] + fx[k] : clamp(st.meters[k] + fx[k], 0, m.max || 100);
      }
    }

    function endOfDay() {
      const rep = S.endOfDay(st);
      if (rep.fx) applyFx(rep.fx);
      root.innerHTML = '';
      root.append(header('End of day'), hud());
      const box = h('div', { class: 'sim-day card' },
        h('div', { class: 'sim-dayn' }, rep.icon + ' ' + rep.title),
        SH.ui.bi(rep.en, rep.zh, { say: false }),
        rep.fx ? h('div', { class: 'sim-fx' }, Object.keys(rep.fx).filter((k) => rep.fx[k]).map((k) => {
          const m = S.meters.find((x) => x.k === k);
          return h('span', { class: 'sim-d ' + (rep.fx[k] > 0 ? 'up' : 'down') }, m.icon + ' ' + delta(m, rep.fx[k]));
        })) : null);
      root.appendChild(box);
      const dead = S.meters.find((m) => m.life && st.meters[m.k] <= 0);
      if (dead) return box.appendChild(h('button', { class: 'btn primary block', onclick: () => finish(dead) }, 'See what happened…'));
      st.day++;
      if (st.day >= st.plan.length) return box.appendChild(h('button', { class: 'btn primary block', onclick: () => finish() }, 'Week review ▶'));
      box.appendChild(h('button', { class: 'btn primary block', onclick: shop }, 'Invest overnight ▶'));
    }

    function shop() {
      const offer = shuffle(S.upgrades.filter((u) => !st.ups.has(u.id))).slice(0, 3);
      root.innerHTML = '';
      root.append(header('Overnight'), hud());
      const cash = st.meters[S.cashKey];
      root.appendChild(h('div', { class: 'sim-day card' },
        h('div', { class: 'sim-dayn' }, '🛒 Invest in your ' + S.unit),
        h('p', { class: 'muted small' }, 'Pick at most one upgrade. Each one is a lesson from the course.'),
        offer.map((u) => h('button', { class: 'sim-up' + (cash < u.cost ? ' dim' : ''), disabled: cash < u.cost, onclick: () => buy(u) },
          h('span', { class: 'sim-ue', 'aria-hidden': 'true' }, u.icon),
          h('span', {}, h('b', {}, u.en), h('small', { lang: 'zh-HK' }, ' ' + u.zh), h('span', { class: 'sim-ud', html: SH.inline(u.d) })),
          h('span', { class: 'sim-uc' }, money(u.cost)))),
        h('button', { class: 'btn block', onclick: dayIntro }, 'Save the cash · next day')));
    }
    function buy(u) {
      st.meters[S.cashKey] -= u.cost;
      st.ups.add(u.id);
      SH.beep('good');
      SH.toast(u.icon + ' ' + u.en + ' installed');
      dayIntro();
    }

    function finish(dead) {
      const score = Math.round(S.score(st));
      const frac = st.n ? st.right / st.n : 0;
      // title follows accuracy: <40% · 40% · 60% · 75% · 90%; a strong score lifts a 75%+ week one step
      const lvl = frac >= 0.9 ? 4 : frac >= 0.75 ? 3 : frac >= 0.6 ? 2 : frac >= 0.4 ? 1 : 0;
      const rank = dead ? S.ranks[0] : S.ranks[Math.min(4, lvl + (frac >= 0.75 && score > S.goodScore ? 1 : 0))];
      const xp = st.right * 3 + st.day * 6 + (dead ? 0 : 20);
      SH.award(cid, xp, dead ? null : 'Survived the week');
      root.innerHTML = '';
      const res = SH.games.resultCard(cid, {
        win: !dead && frac >= 0.6,
        title: dead ? dead.dead : rank.en,
        sub: (dead ? '' : rank.zh + ' · ') + st.right + ' / ' + st.n + ' good decisions · ' + Object.keys(st.meters).map((k) => {
          const m = S.meters.find((x) => x.k === k);
          return m.icon + ' ' + (m.cash ? money(st.meters[k]) : Math.round(st.meters[k]));
        }).join('  '),
        score, scoreLabel: 'Score', xp, bestKey: 'sim.' + S.key, review: st.review,
        again: () => engine(root, cid, S),
      });
      root.appendChild(res);
      if (dead) res.insertBefore(h('p', { class: 'muted' }, dead.deadWhy), res.querySelector('.result-stats'));
    }
  }

  /* =================================================================== FITE7407 */
  const fite = {
    key: 'tycoon', emoji: '🏦', name: { en: 'Back-Office Tycoon', zh: '後勤大亨' },
    blurb: 'Run a custody & settlement bank for a week: orders, corporate actions, reporting, regulation and outsourcing.',
    story: {
      en: 'You have just been made **Head of Operations** at a small transaction bank. Clients call, counterparties push, the regulator watches. Make the right call, keep the books clean and grow the bank.',
      zh: '你啱啱做咗一間交易銀行嘅**營運主管**。客戶打嚟、對手催、監管機構盯住。做啱決定、保持賬目乾淨、令銀行發展。',
    },
    rules: [
      'Each day has **5 tasks** from one lecture. Right answers earn fees and trust; wrong ones cost money and **Compliance** or **Client trust**.',
      'Some mistakes leave **breaks** in the books — they hurt you at the **overnight reconciliation**.',
      'Spend profit overnight on **upgrades** (AML officer, blocking rule, reconciliation team…).',
      'If **Client trust** or **Compliance** hits 0, the week is over.',
    ],
    perDay: 5, unit: 'bank', cashKey: 'cash', calcMeter: 'rep', fee: [15, 30], loss: [25, 45], goodScore: 330,
    callers: ['Mrs Chan from the private bank', 'A fund manager', 'The trading desk', 'A corporate client', 'Your custody team'],
    meters: [
      { k: 'cash', icon: '💰', en: 'Profit', start: 100, cash: true },
      { k: 'rep', icon: '⭐', en: 'Client trust', start: 60, life: true, dead: 'The clients walked away', deadWhy: 'Client trust fell to zero — customers moved their depots to a competitor.' },
      { k: 'comp', icon: '🛡️', en: 'Compliance', start: 60, life: true, dead: 'Licence suspended!', deadWhy: 'Compliance fell to zero — the regulator stepped in and stopped your business.' },
    ],
    init: (st) => { st.extra.breaks = 0; },
    onWrong: (st, E, fx) => { if (E.sc && E.sc.brk) { st.extra.breaks++; E.note = '⚠️ A break was left in the books'; } },
    endOfDay(st) {
      const b = st.extra.breaks;
      const income = 20 + (st.ups.has('sla') ? 15 : 0);
      st.extra.breaks = 0;
      if (!b) return { icon: '🌙', title: 'Overnight reconciliation', en: `All books reconcile with the depositories. Custody fees earned today: **${money(income)}**.`, zh: `所有賬目同存管機構對得上。今日託管費收入 **${money(income)}**。`, fx: { cash: income } };
      if (st.ups.has('recon')) return { icon: '🌙', title: 'Overnight reconciliation', en: `Your **neutral reconciliation team** found **${b}** break(s) against the depository listing and fixed them before clients noticed. Fees: **${money(income)}**.`, zh: `你嘅**中立對賬團隊**搵到 **${b}** 個差異並喺客戶發現前修正。收費 **${money(income)}**。`, fx: { cash: income } };
      return { icon: '🌙', title: 'Overnight reconciliation', en: `The depository's full listing (via **SWIFT**) shows **${b}** break(s) caused by today's mistakes. Each must be investigated and corrected — clients complain. Fees: **${money(income)}**.`, zh: `存管機構（經 **SWIFT**）嘅持倉清單顯示今日錯誤造成 **${b}** 個差異，要逐個跟進——客戶投訴。收費 **${money(income)}**。`, fx: { cash: income - 15 * b, rep: -6 * b, comp: -4 * b } };
    },
    score: (st) => st.meters.cash + st.meters.rep + st.meters.comp,
    ranks: [
      { en: 'Back-office intern', zh: '後勤實習生' }, { en: 'Settlement clerk', zh: '交收文員' }, { en: 'Custody manager', zh: '託管經理' },
      { en: 'Head of Operations', zh: '營運主管' }, { en: 'Back-Office Tycoon!', zh: '後勤大亨！' }, { en: 'Back-Office Tycoon!', zh: '後勤大亨！' },
    ],
    upgrades: [
      { id: 'dvp', icon: '🔗', en: 'Real-time DvP link', zh: '實時貨銀對付', cost: 55, halves: 'orders', d: 'Halves losses on **order & settlement** mistakes (L1B: DvP links both legs).' },
      { id: 'block', icon: '🧊', en: 'Corporate-action blocking rule', zh: '公司行動凍結規則', cost: 55, halves: 'custody', d: 'Halves losses on **custody & corporate action** mistakes (L2: the DWP reverse-split case).' },
      { id: 'aml', icon: '🕵️', en: 'Trained AML officer', zh: '反洗錢主任', cost: 55, halves: 'reporting', d: 'Halves losses on **reporting & tax** mistakes (L3: AML officers examine larger transactions).' },
      { id: 'audit', icon: '📜', en: 'SAS 70 Type II audit', zh: 'SAS 70 第二類審計', cost: 55, halves: 'reg', d: 'Halves losses on **regulation & risk** mistakes (L4: proof that controls really work).' },
      { id: 'recon', icon: '🧾', en: 'Neutral reconciliation team', zh: '中立對賬團隊', cost: 50, d: 'Overnight **breaks** are found and fixed for free (L2: segregation of duties).' },
      { id: 'sla', icon: '🤝', en: 'Insourcing deal with SLAs', zh: '附 SLA 嘅承接外判合約', cost: 70, d: '**+$15k** fee income every night (L5: scaled prices, bonus/malus).' },
    ],
    themes: [
      { cat: 'orders', icon: '📈', en: 'Orders & settlement', zh: '落盤同交收', lids: ['f1b'], meter: 'rep', gens: ['fite.auction', 'fite.ccp'],
        brief: { en: 'The trading floor is busy. Pick the right order types, check clients before trading and settle safely.', zh: '交易大堂好忙。揀啱盤種、交易前核實客戶、安全交收。' },
        scen: [
          Q('o1', 'A hedge-fund client wants to buy **10,000 shares right now** — but **only if the whole amount** can be filled at once. Otherwise nothing. Which order condition?', '對沖基金客戶想**即刻**買 **10,000 股**——但**一定要全數**一次過成交，否則唔要。用咩條件？',
            [['Fill or Kill (FOK)', '全數成交否則取消 (FOK)'], ['Immediate or Cancel (IOC)', '即時成交否則取消 (IOC)'], ['Good-till-cancelled (GTC)', '取消前有效 (GTC)'], ['Iceberg order', '冰山盤']],
            '**FOK** = execute immediately and **completely**, no partial execution; otherwise the whole order is deleted. **IOC** would allow a partial fill.', 'FOK 要即時**全數**成交，唔准部分成交；IOC 就容許部分成交。'),
          Q('o2', 'A pension fund must buy **2 million shares** without letting the market see how big its demand is.', '退休基金要買 **200 萬股**，但唔想市場知道需求有幾大。',
            [['Iceberg order — only one lot shows in the book', '冰山盤——買賣盤冊只顯示一手'], ['One market order for the full 2 million', '一張 200 萬股市價盤'], ['Stop-market order', '止蝕市價盤'], ['Fill or Kill', 'FOK']],
            'An **iceberg order** splits a large order into lots; only the lot size is shown in the order book, **hiding the total size**.', '**冰山盤**將大盤拆細，盤冊只見每手數量，**隱藏總數**。'),
          Q('o3', 'Mr Wong\'s shares trade at **$50**. If the price falls to **$45**, he wants out **at whatever price** the market then gives.', '王生隻股而家 **$50**。如果跌到 **$45**，佢想**用任何價**即刻沽走。',
            [['Stop-market sell with stop $45', '止蝕市價沽盤，觸發價 $45'], ['Limit sell at $45', '$45 限價沽盤'], ['Stop-limit sell at $45', '$45 止蝕限價沽盤'], ['Limit buy at $45', '$45 限價買盤']],
            'When the stop price is reached, a **stop-market** order enters the book as a **market order** (unlimited), so it will execute. A stop-limit becomes a limit order and may not fill; a limit sell at $45 would execute right now at about $50.', '觸發後 **止蝕市價盤**變成**市價盤**，一定成交。止蝕限價盤變限價盤，未必成交；$45 限價沽盤而家就會以約 $50 成交。'),
          Q('o4', 'A walk-in customer wants to trade **today**. There is no customer profile yet.', '有個新客想**今日**就交易，但未有客戶資料。',
            [['Complete KYC first: identity, risk profile, beneficiary and static data', '先做 KYC：身份、風險評估、受益人同靜態資料'], ['Take the order now and do KYC next week', '先落盤，下星期先做 KYC'], ['Let a colleague sign the order instead', '叫同事代簽'], ['Refuse — new clients can never trade', '拒絕——新客永遠唔可以交易']],
            'Before taking orders the bank needs **KYC** (risk classification; protection against money laundering), proof of **identity**, the **beneficiary** and **static data**.', '落盤前銀行要做 **KYC**、核實**身份**、**受益人**同**靜態資料**。', { m: 'comp' }),
          Q('o5', 'A client asks for a **good-till-date** order valid for **120 days**.', '客戶要一張有效期 **120 日**嘅**指定日期前有效 (GTD)** 盤。',
            [['Explain GTD runs at most to T+89 and offer that date', '解釋 GTD 最長到 T+89，提供呢個日期'], ['Accept 120 days — any date is fine', '接受 120 日——乜日期都得'], ['Turn it into a same-day market order', '改做即日市價盤'], ['Make it Fill or Kill', '改做 FOK']],
            '**Good-till-date** is valid until a given date, **at most T+89**.', '**GTD** 有效至指定日期，**最長 T+89**。'),
          Q('o6', 'A share trade is executed on **Monday** on an exchange with a **T+2** settlement cycle (no holidays). When does it settle?', '一宗股票交易**星期一**成交，交易所係 **T+2** 交收（冇假期）。幾時交收？',
            [['Wednesday', '星期三'], ['Monday', '星期一'], ['Tuesday', '星期二'], ['Friday', '星期五']],
            '**T+2** = two business days after the trade date: Monday + 2 = **Wednesday**.', '**T+2** = 交易日後兩個營業日：星期三。'),
          Q('o7', 'A counterparty asks you to **deliver the shares today**; they promise to **pay tomorrow**.', '對手叫你**今日交股票**，佢**聽日先俾錢**。',
            [['Insist on delivery versus payment (DvP)', '堅持貨銀對付 (DvP)'], ['Deliver free of payment — they are a good name', '免付款交收——佢哋信譽好'], ['Pay them first as goodwill', '你先俾錢表示誠意'], ['Deliver half today, half tomorrow', '今日交一半，聽日交一半']],
            '**DvP** links the two legs so neither side gives without receiving — otherwise you carry **settlement / counterparty risk**.', '**DvP** 將兩邊連埋，冇人會俾咗嘢但收唔到——否則你要承擔**交收／對手風險**。', { brk: 1 }),
          Q('o8', 'Why does the exchange put a **central counterparty (CCP)** between the banks?', '點解交易所要喺銀行之間加個**中央對手方 (CCP)**？',
            [['It guarantees fulfilment, takes the default risk and settles netted positions', '保證履約、承擔違約風險、按淨額交收'], ['It sets the opening auction price', '佢定開市競價'], ['It keeps the KYC profiles', '佢保管 KYC 資料'], ['It pays out dividends', '佢派股息']],
            'The **CCP** guarantees fulfilment, takes the **default risk** of either party and settles only **netted** positions.', '**CCP** 保證履約、承擔任何一方嘅**違約風險**、只交收**淨額**。'),
          Q('o9', 'A client places a **limit order** and says nothing about validity. By default it is valid until…', '客戶落咗張**限價盤**，冇講有效期。預設有效到…',
            [['month end', '月尾'], ['the end of today', '今日收市'], ['T+89', 'T+89'], ['forever', '永遠']],
            'Standard **market order**: same day only. **Limit order**: valid until **month end**.', '市價盤：即日有效。**限價盤**：有效至**月尾**。'),
        ] },
      { cat: 'custody', icon: '🗄️', en: 'Custody & corporate actions', zh: '託管同公司行動', lids: ['f2'], meter: 'comp', gens: ['fite.rights', 'fite.split'],
        brief: { en: 'Deliveries, rights issues, splits and an AGM. One careless booking can cost millions — remember DWP Bank.', zh: '交收、供股、拆股同股東大會。一個大意嘅記賬可以蝕幾千萬——記住 DWP Bank。' },
        scen: [
          Q('k1', 'Customer instruction: deliver **1,000 shares** DVP to another bank. Your check shows **400** of them are **pledged as collateral**.', '客戶指示：以 DVP 交 **1,000 股**去另一間銀行。你發現其中 **400 股**已**抵押**。',
            [['Stop: only free positions can be delivered — clarify with the customer', '暫停：只可以交冇負擔嘅持倉——同客戶確認'], ['Deliver all 1,000 — the customer asked', '照交 1,000 股——客戶要求嘅'], ['Deliver 1,000 and sort out the pledge later', '先交 1,000 股，抵押之後再算'], ['Switch to delivery free of payment', '改做免付款交收']],
            'Before delivery the bank validates: is the position **big enough**? Is the depot **blocked**? Are positions **pledged as collateral**?', '交收前銀行要核實：持倉**夠唔夠**？戶口有冇**凍結**？有冇**抵押**？', { brk: 1 }),
          Q('k2', 'Rights issue: Ms Lee has sent **no instruction**, and today is the **last trading day** of the rights.', '供股：李小姐**冇俾指示**，今日係供股權**最後交易日**。',
            [['Sell the rights on the last trading day', '喺最後交易日沽出供股權'], ['Let the rights expire worthless', '由佢過期作廢'], ['Exercise them with her cash', '用佢啲現金行使'], ['Buy more rights for her', '幫佢買多啲供股權']],
            'If **no instruction** arrives, the custodian **sells the right on the last trading day**.', '**冇指示**嘅話，託管人會喺**最後交易日沽出**供股權。', { m: 'rep' }),
          Q('k3', '⚠️ A product announces a **17,000:1 reverse split** tonight. The data feed will adjust the price, but depot units update in a separate batch.', '⚠️ 有隻產品今晚做 **17,000 合 1** 合股。報價會即時調整，但戶口單位要另一批次先更新。',
            [['Block the security until the depot units are adjusted', '凍結該證券，直至戶口單位調整好'], ['Let trading continue as normal', '照常交易'], ['Adjust only the price and wait for complaints', '只改價，等客投訴'], ['Credit customers 17,000 times more units', '俾客戶多 17,000 倍單位']],
            '**DWP Bank (2022):** the price was adjusted ×17,000 but the units were not, and the security was not **blocked**. A customer sold units that did not exist — loss about **€60 million**.', '**DWP Bank（2022）**：價錢調咗 ×17,000 但單位冇改，又冇**凍結**。客戶沽出唔存在嘅單位——蝕約 **6,000 萬歐元**。', { brk: 1 }),
          Q('k4', 'A client panics: "My shares **fell 80%** overnight!" The company did a **1:5 share split**.', '客戶好驚：「我隻股一晚**跌咗 80%**！」其實公司做咗 **1 拆 5**。',
            [['Explain: 5 new shares for each old one at 1/5 of the price — value unchanged', '解釋：每股變 5 股、價錢變五分一——價值不變'], ['Agree it crashed and sell everything', '同意係股災，全部沽清'], ['Tell him to sue the company', '叫佢告間公司'], ['Say it was a reverse split', '話係合股']],
            'A **share split** does not change company value: the price falls by the same ratio because the value is spread over more shares.', '**拆股**唔改變公司價值：價錢按同一比例下跌，因為價值分散到更多股。', { m: 'rep' }),
          Q('k5', 'Your bank holds Mr Ho\'s AGM authorisation. On the day, **Mr Ho turns up at the AGM in person** to vote.', '銀行持有何生嘅股東大會授權。當日**何生親身出席**投票。',
            [['Invalidate the bank\'s authorisation — he votes himself', '取消銀行嘅授權——佢自己投'], ['Both vote — more votes are better', '兩邊都投——票越多越好'], ['The bank votes; Mr Ho just watches', '銀行投，何生睇'], ['Cancel the voting rights of his shares', '取消佢股份嘅投票權']],
            'If a customer attends in person, the authorisation must be **invalidated**.', '客戶親身出席，授權就要**作廢**。'),
          Q('k6', 'The depository\'s **full listing** (requested via **SWIFT**) shows 500 fewer units of one ISIN than your in-house view.', '存管機構（經 **SWIFT**）嘅**完整清單**顯示某 ISIN 比你內部記錄少 500 單位。',
            [['A neutral team investigates: in-flight transactions or a booking error?', '中立團隊調查：在途交易定記賬錯誤？'], ['Custody quietly edits its own books to match', '託管部靜靜雞改自己賬'], ['Ignore it — it will sort itself out', '唔理——自然會好返'], ['Charge the difference to a random customer', '隨便搵個客扣數']],
            'Depository reconciliation should be done by a **neutral party** (segregation of duties). **Breaks** must be followed up — typical causes are **open or in-flight transactions** or a **real booking error**.', '存管對賬要由**中立方**做。**差異**一定要跟進——通常係**未完成／在途交易**或者**真正記賬錯誤**。', { brk: 1 }),
          Q('k7', 'Year end. What must every depot customer receive **at least once a year**?', '年尾。每個託管客戶**最少每年一次**要收到乜？',
            [['A full account listing: units, security ID, depository, type of deposit', '完整持倉清單：數量、證券編號、存管機構、存管類型'], ['A free AGM ticket', '免費股東大會門票'], ['A tax refund', '退稅'], ['The bank\'s balance sheet', '銀行資產負債表']],
            'Depot reconciliation: at least **once a year** the bank sends a **full account listing**, and keeps proof and an audit trail.', '託管對賬：最少**每年一次**寄出**完整持倉清單**，並保留證明同審計記錄。'),
          Q('k8', 'A customer moves shares to his daughter\'s account **at another bank**, with **no cash** in return.', '客戶將股票轉去女兒喺**另一間銀行**嘅戶口，**唔收錢**。',
            [['Delivery free of payment (DFP); the receiver instructs RFP', '免付款交收 (DFP)；收方指示 RFP'], ['Delivery versus payment (DVP)', '貨銀對付 (DVP)'], ['A share split', '拆股'], ['An iceberg order', '冰山盤']],
            '**DFP**: the depository matches DFP and **RFP** and moves the units — **no cash moves**.', '**DFP**：存管機構配對 DFP 同 **RFP** 再轉單位——**冇現金流動**。'),
        ] },
      { cat: 'reporting', icon: '🧾', en: 'Returns, reporting & tax', zh: '收益、申報同稅務', lids: ['f3'], meter: 'comp', gens: ['fite.accrued', 'fite.stock1'],
        brief: { en: 'Pay out dividends and coupons correctly, then feed the regulators: insider reports, AML and tax.', zh: '準確派息同付票息，再應付監管：內幕交易申報、反洗錢同稅務。' },
        scen: [
          Q('r1', 'Dividend record date. A client **bought** shares yesterday — **executed, settlement still pending**.', '股息登記日。客戶琴日**買咗**股票——**已成交但未交收**。',
            [['Entitled — the dividend is collected from the trade\'s counterparty', '有權收——股息向交易對手收取'], ['Not entitled until settlement', '交收前冇權收'], ['Pay the dividend twice to be safe', '保險起見派兩次'], ['Ask the client to wait a year', '叫客等一年']],
            'Entitled holdings include **executed buy trades whose settlement is still pending**; for pending deliveries the dividend is **collected from the counterparty**.', '有權益嘅持倉包括**已成交未交收嘅買入**；股息會**向對手收取**。', { m: 'rep' }),
          Q('r2', 'A bond coupon falls due on a **Sunday**.', '債券票息喺**星期日**到期。',
            [['Credit it on the next banking day', '下一個銀行營業日入賬'], ['Credit it on the Friday before', '之前嗰個星期五入賬'], ['Skip this coupon', '跳過今期'], ['Pay it next month', '下個月先俾']],
            'Interest is credited on the payment date, or the **next banking day** if it is not one.', '利息喺付款日入賬；如果唔係營業日就**下一個營業日**。', { m: 'rep' }),
          Q('r3', 'Your system lists today\'s securities trades. When is the **insider-trading report** due?', '系統列出今日證券交易。**內幕交易申報**幾時要交？',
            [['T+1 — the next business day', 'T+1——下一個營業日'], ['End of the month', '月尾'], ['T+5', 'T+5'], ['Only if the regulator asks', '監管機構問先交']],
            'Insider-trading reports are due **T+1**, anonymised at first.', '內幕交易申報限期 **T+1**，起初係匿名。'),
          Q('r4', '🔎 The regulator asks for the **clear names** behind suspicious trades placed just **before company news**.', '🔎 監管機構要求提供喺**公司消息公佈前**可疑交易背後嘅**真實姓名**。',
            [['Provide the beneficiaries\' names — without telling the customer yet', '提供受益人姓名——暫時唔通知客戶'], ['Call the customer first to warn him', '先打俾客戶通風報信'], ['Refuse: bank secrecy', '拒絕：銀行保密'], ['Delete the data — it is over a year old', '刪除資料——超過一年'],],
            'Institutions must provide **clear names** — usually **without notifying the customer** — and be able to reproduce data for the **past 6 years**.', '機構要提供**真實姓名**——通常**唔通知客戶**——並保存**過去 6 年**資料。'),
          { id: 'r5', make: (r) => {
            const hk = r.rint(13, 40) * 10 + ',000', eu = r.rint(16, 60) + ',000';
            const c = r.pick([
              { en: 'in **Hong Kong** wants to put **physical shares worth HK$' + hk + '** into his depot', zh: '喺**香港**想將價值 **HK$' + hk + '** 嘅**實物股票**存入戶口', th: 'HK$120,000' },
              { en: 'in the **EU** wants to **buy physical shares** for **€' + eu + '**', zh: '喺**歐盟**想用 **€' + eu + '** **買實物股票**', th: 'EUR 15,000 (10,000 in Germany)' },
              { en: 'in **Hong Kong** wants to **pledge securities** worth **HK$' + hk + '**', zh: '喺**香港**想**抵押**價值 **HK$' + hk + '** 嘅證券', th: 'HK$120,000' },
            ]);
            return {
              en: 'A customer ' + c.en + '.', zh: '有個客戶' + c.zh + '。',
              o: [['Identify actors and beneficiaries and pass the data to the AML officer', '識別參與者同受益人，交俾反洗錢主任'], ['Process it like any other booking', '當普通交易處理'], ['Split it into smaller bookings below the threshold', '拆細成低於門檻嘅幾單'], ['Refuse and close the account at once', '即刻拒絕並關戶口']],
              x: 'Above the AML threshold (here ' + c.th + '), actors and beneficiaries must be identified for **buying/selling physical shares**, **transferring physical shares into a depot** and **pledging securities**; the data goes to the **AML officer**.',
              xz: '超過反洗錢門檻（' + c.th + '），**買賣實物股票**、**實物股票存入戶口**同**抵押證券**都要識別參與者同受益人，資料交**反洗錢主任**。',
            };
          } },
          Q('r6', 'A **non-resident** client earns dividends from local shares and interest from foreign bonds held with you.', '一個**非居民**客戶有本地股息，亦有喺你度持有嘅外國債券利息。',
            [['Only income from local trades and holdings is taxed here', '只有本地交易同持倉收入喺度課稅'], ['All income worldwide is taxed here', '全球收入都喺度課稅'], ['Nothing is ever taxed for non-residents', '非居民永遠唔使交稅'], ['Only the foreign income is taxed here', '只有外國收入喺度課稅']],
            '**Residents** are taxed on all income, local and foreign; **non-residents** only on income from **local** trades and holdings.', '**居民**全部收入都課稅；**非居民**只係**本地**交易同持倉收入。'),
          Q('r7', 'A dividend was **earned (entitlement) in 2025** but **paid out in January 2026**. Which fiscal year is it taxed in?', '一筆股息**2025 年有權收**，但**2026 年 1 月**先派。計邊個財政年度？',
            [['2025 — the year of entitlement', '2025——權益產生嘅年份'], ['2026 — the year of payment', '2026——付款年份'], ['Split 50/50', '一半一半'], ['Neither — it is tax-free', '兩年都唔計——免稅']],
            'Taxes are due for the fiscal year in which the income was **generated** — based on the **entitlement**, not the pay-out.', '稅項按收入**產生**嘅財政年度計——睇**權益**，唔係派發日。'),
          Q('r8', 'Which of these does **NOT** need an insider-trading report?', '以下邊樣**唔使**做內幕交易申報？',
            [['Receiving young shares from a capital increase', '增資收到新股'], ['A customer buying shares on the exchange', '客戶喺交易所買股票'], ['A customer selling bonds', '客戶沽債券'], ['The bank trading shares for its own book', '銀行自營買賣股票']],
            'No insider report for **non-initiated trades or corporate events**: cash reimbursement, employee shares, share borrowing, exercise of rights, **receiving young shares**.', '**非主動交易或公司行動**唔使申報：現金償還、員工股、借股、行使權利、**收新股**。'),
        ] },
      { cat: 'reg', icon: '⚖️', en: 'Regulation & risk', zh: '監管同風險', lids: ['f4'], meter: 'comp', gens: ['fite.basel'],
        brief: { en: 'Auditors and supervisors visit. Know Basel, SOx, SAS 70, MiFID II, GDPR and FATCA — and classify your risks.', zh: '核數師同監管人員到訪。要識 Basel、SOx、SAS 70、MiFID II、GDPR 同 FATCA——仲要分類風險。' },
        scen: [
          Q('g1', 'A **server failure** stops your settlement system for half a day. Under Basel II, what risk is this?', '**伺服器故障**令交收系統停咗半日。按 Basel II 係咩風險？',
            [['Operational risk (technology)', '營運風險（科技）'], ['Market price risk', '市場價格風險'], ['Strategic risk', '策略風險'], ['Liquidity risk', '流動性風險']],
            'Operational risk = loss from inadequate or failed **processes, people and systems** or **external events**.', '營運風險 = 因**流程、人員、系統**失誤或**外部事件**而引致嘅損失。'),
          Q('g2', 'The bank publishes its **risk position and own funds** so investors can compare banks. Which Basel II pillar is this?', '銀行公開**風險狀況同自有資金**，等投資者比較。屬於 Basel II 邊個支柱？',
            [['Pillar 3 — market discipline (disclosure)', '第三支柱——市場紀律（披露）'], ['Pillar 1 — minimum capital', '第一支柱——最低資本'], ['Pillar 2 — supervisory review', '第二支柱——監管審查'], ['It is MiFID II, not Basel', '係 MiFID II，唔係 Basel']],
            '**Pillar 3** = market discipline: disclosure requirements that make banks comparable.', '**第三支柱** = 市場紀律：披露要求令銀行可比較。'),
          Q('g3', 'A US-listed client asks you (its provider) to prove your controls **actually worked over the last 6+ months**.', '一間美國上市客戶要求你（佢嘅外判商）證明你嘅監控**過去 6 個月以上真係有效運作**。',
            [['Provide a SAS 70 Type II report', '提供 SAS 70 第二類報告'], ['Provide a SAS 70 Type I report', '提供 SAS 70 第一類報告'], ['Send the process manual', '寄流程手冊'], ['Say SOx never applies to providers', '話 SOx 唔適用於外判商']],
            '**Type I** audits the description and existence of controls; **Type II** adds the **execution** of a functioning control over at least **6 months**. SOx reaches providers **indirectly**.', '**第一類**審查監控嘅描述同存在；**第二類**再加最少 **6 個月**嘅**實際執行**。SOx **間接**適用於外判商。'),
          Q('g4', 'You hire a provider to **process client data on your behalf**. Under GDPR, who is the **controller**?', '你請外判商**代你處理客戶資料**。按 GDPR，邊個係**控制者**？',
            [['Your bank — it decides how and why data is processed', '你間銀行——佢決定點樣同點解處理'], ['The provider', '外判商'], ['The client', '客戶'], ['Nobody, once it is outsourced', '外判咗就冇人']],
            'The **controller** decides how and why; the **processor** acts on its behalf. The controller is **not relieved** of its obligations.', '**控制者**決定點樣同點解；**處理者**代佢做。控制者**唔會因此免責**。'),
          Q('g5', 'A **US taxpayer** opens a depot with your Hong Kong bank.', '一個**美國納稅人**喺你香港銀行開託管戶口。',
            [['Identify and report the account to the US tax authorities (FATCA)', '識別並向美國稅務當局申報 (FATCA)'], ['Nothing — US rules do not apply abroad', '唔使理——美國規則唔適用海外'], ['Report it under MiFID II best execution', '按 MiFID II 最佳執行申報'], ['Refuse the client', '拒絕客戶']],
            '**FATCA** requires foreign financial institutions to **identify and report accounts held by US taxpayers**.', '**FATCA** 要求外國金融機構**識別並申報美國納稅人戶口**。'),
          Q('g6', 'MiFID II **best execution**: what standard must your EU branch meet?', 'MiFID II **最佳執行**：你歐盟分行要達到咩標準？',
            [['"All sufficient steps" — and publish its top five venues yearly', '「所有足夠措施」——每年公佈五大執行場所'], ['"Reasonable steps" only', '只要「合理措施」'], ['Always the cheapest venue, no reporting', '永遠揀最平，唔使報告'], ['Whatever the trader prefers', '交易員鍾意點就點']],
            'MiFID I: "reasonable steps"; **MiFID II: "all sufficient steps"**, with yearly free publication of execution quality and the **top five venues**.', 'MiFID I 係「合理措施」；**MiFID II 係「所有足夠措施」**，每年免費公佈執行質素同**五大場所**。'),
          Q('g7', 'The Basel II definition of operational risk **includes** which of these?', 'Basel II 營運風險定義**包括**以下邊樣？',
            [['Legal risk', '法律風險'], ['Strategic risk', '策略風險'], ['Reputational risk', '聲譽風險'], ['None of them', '全部都唔包']],
            'It **includes legal risk** but **excludes strategic and reputational risk**.', '**包括法律風險**，但**唔包策略同聲譽風險**。'),
          Q('g8', 'Marketing wants to keep **all** client data **forever, just in case**. GDPR Article 5 says…', '市場部想**永久**保留**所有**客戶資料「以防萬一」。GDPR 第 5 條話…',
            [['No — data minimisation and storage limitation', '唔得——資料最少化同儲存限制'], ['Fine, if it is encrypted', '加密就得'], ['Fine, for non-EU clients only', '非歐盟客就得'], ['Fine, if the board approves', '董事會批就得']],
            'Article 5: data must be **adequate, relevant and limited** (minimisation) and kept **no longer than necessary** (storage limitation).', '第 5 條：資料要**足夠、相關、有限**（最少化），**唔可以保留超過需要**（儲存限制）。'),
        ] },
      { cat: 'outsourcing', icon: '🤝', en: 'Outsourcing deal', zh: '外判交易', lids: ['f5'], meter: 'rep', gens: ['fite.ccp', 'fite.split', 'fite.basel'],
        brief: { en: 'The board wants to outsource securities processing. Run the project, write the contract and steer the provider.', zh: '董事會想外判證券處理。你要帶項目、寫合約、管理外判商。' },
        scen: [
          Q('u1', 'Your settlement provider made an error and the **regulator calls you**. Who is accountable?', '你嘅交收外判商出錯，**監管機構搵你**。邊個要問責？',
            [['Your bank — accountability stays; the provider has responsibility for execution', '你間銀行——問責留喺銀行；外判商負責執行'], ['Only the provider', '只係外判商'], ['Nobody — it was outsourced', '冇人——外判咗'], ['The customer', '客戶']],
            'The outsourcing institution **keeps the accountability**; the provider takes over the **responsibility** for executing the processes.', '外判機構**保留問責**；外判商接手**執行責任**。', { m: 'comp' }),
          Q('u2', 'The provider wants to use a **subcontractor**. What must the contract ensure?', '外判商想用**分判商**。合約要確保乜？',
            [['All employees and subcontractors are bound by an NDA (bank secrecy)', '所有員工同分判商都簽保密協議（銀行保密）'], ['Nothing — subcontractors are free', '唔使——分判商自由'], ['Only managers sign an NDA', '只係經理簽保密協議'], ['The bank pays the subcontractor directly', '銀行直接俾錢分判商']],
            'Bank secrecy and business secrets: the insourcer binds **all employees and subcontractors** with an **NDA**.', '銀行保密：承接方要令**所有員工同分判商**簽**保密協議**。', { m: 'comp' }),
          Q('u3', 'Volumes may jump next year. You are the **outsourcer** (the bank) negotiating the price scheme.', '明年交易量可能大升。你係**外判方**（銀行），傾緊價錢機制。',
            [['Ask for an upper cap on charges for higher volumes', '要求高交易量收費上限'], ['Ask for a lower cap on charges', '要求收費下限'], ['Agree to unlimited charges', '同意無上限收費'], ['Refuse any volume-based pricing', '拒絕任何按量收費']],
            'Define charges for higher/lower volumes than expected: the **insourcer wants a lower cap**, the **outsourcer wants an upper cap**.', '要訂明量多量少點收：**承接方想要下限**，**外判方想要上限**。'),
          Q('u4', 'The provider **missed its SLA processing times** three months in a row.', '外判商連續三個月**做唔到 SLA 處理時間**。',
            [['Apply the malus (penalty) agreed for failing SLAs', '執行未達 SLA 嘅罰則 (malus)'], ['Pay a bonus to motivate them', '俾獎金鼓勵佢'], ['Ignore it — SLAs are only guidance', '唔理——SLA 只係參考'], ['Take all the work back tomorrow', '聽日即刻收返晒啲工作']],
            'Ongoing **bonus/malus**: a **penalty for failing SLAs** or other obligations.', '持續營運嘅 **bonus/malus**：**未達 SLA 要罰**。'),
          Q('u5', 'The board wants to **sign with a provider tomorrow** — no RFP, no cost analysis, one vendor.', '董事會想**聽日就簽**——冇 RFP、冇成本分析、得一個供應商。',
            [['Follow the five steps: initiation, analysis, RFP, decision preparation, decision', '跟五個步驟：啟動、分析、RFP、決策準備、決策'], ['Sign now — speed matters', '即刻簽——快最緊要'], ['Pick the lowest initial price', '揀首期價最平'], ['Ask the one vendor for a discount', '叫嗰個供應商減價']],
            'Typical project risks: **too few vendors**, offers judged **only by initial price**, no internal cost base. The **five steps** reduce them.', '常見風險：**供應商太少**、**只睇首期價**、唔知自己成本。**五個步驟**可以減低風險。'),
          Q('u6', 'You plan to outsource to a provider **in another country**.', '你打算外判去**另一個國家**嘅供應商。',
            [['Ensure all locally required audits can be run at the remote site', '確保本地要求嘅審計可以喺海外執行'], ['Skip audits abroad', '海外就唔使審計'], ['Audit only once before signing', '簽約前審一次就夠'], ['Let the provider audit itself', '叫外判商自己審自己']],
            'For **foreign** outsourcing, the contract must ensure all locally required **audits and verifications can be executed at the remote site**.', '**海外**外判：合約要確保所有本地要求嘅**審計可以喺海外地點執行**。', { m: 'comp' }),
          Q('u7', 'Which part of the **value chain** is most likely to be outsourced?', '**價值鏈**入面邊部分最有可能外判？',
            [['Hidden production steps such as securities settlement', '客戶睇唔到嘅生產步驟，例如證券交收'], ['Customer advice', '客戶諮詢'], ['Marketing and the brand', '市場推廣同品牌'], ['Sales', '銷售']],
            'Customers see advice, marketing and sales; **hidden** steps like sourcing and **production** (e.g. securities processing) are the typical outsourcing candidates.', '客戶睇到諮詢、推廣、銷售；**睇唔到**嘅採購同**生產**（例如證券處理）先係常見外判對象。'),
          Q('u8', 'Migration week. Who must run **dress rehearsals** for data conversion?', '遷移週。邊個要做數據轉換**綵排**？',
            [['Both: the provider rehearses and proves capacity; the bank executes data transfers and rehearsals', '雙方：外判商綵排並證明系統能力；銀行執行數據轉移同綵排'], ['Only the regulator', '只係監管機構'], ['Only the provider — the bank just waits', '只係外判商——銀行等就得'], ['Nobody — go live directly', '冇人——直接上線']],
            'Collaboration duties: the **insourcer** runs dress rehearsals and proves suitability and capacity; the **outsourcer** provides competent staff and executes **data transfers and dress rehearsals**.', '合作責任：**承接方**做綵排、證明系統能力；**外判方**派稱職人手、執行**數據轉移同綵排**。'),
        ] },
    ],
  };

  /* =================================================================== COMP7802 */
  const comp = {
    key: 'desk', emoji: '📊', name: { en: 'Trading Desk Simulator', zh: '交易枱模擬' },
    blurb: 'A week as a money-market and derivatives dealer: quote, price, hedge — and survive the market close.',
    story: {
      en: 'You join the **treasury desk** of a Hong Kong bank. Clients call for quotes, prices must be right, and every evening the market moves. **Unhedged** positions can blow up your risk limit.',
      zh: '你加入一間香港銀行嘅**資金交易枱**。客戶打嚟要報價，價錢一定要準，每晚市場都會郁。**冇對沖**嘅倉位可以爆你嘅風險限額。',
    },
    rules: [
      'Each day has **5 tasks** from one topic: money market, FRAs & futures, swaps & curve, options, Greeks & risk.',
      'Correct quotes earn **P&L** and **Client trust**. Wrong hedges leave **open exposure**.',
      'At the **market close** rates move — open exposure can win or lose money, and it **uses up risk headroom**.',
      'Buy desk tools overnight. If **Client trust** or **Risk headroom** hits 0, you are off the desk.',
    ],
    perDay: 5, unit: 'desk', cashKey: 'cash', calcMeter: 'trust', fee: [15, 35], loss: [20, 40], goodScore: 330,
    callers: ['A corporate treasurer', 'The sales desk', 'A hedge fund', 'Your head of desk', 'A pension fund'],
    meters: [
      { k: 'cash', icon: '💵', en: 'Desk P&L', start: 100, cash: true },
      { k: 'trust', icon: '🤝', en: 'Client trust', start: 60, life: true, dead: 'Clients stopped calling', deadWhy: 'Client trust fell to zero — the sales team routed every client to another bank.' },
      { k: 'risk', icon: '🛡️', en: 'Risk headroom', start: 60, life: true, dead: 'VaR limit breached!', deadWhy: 'Your open positions used up the whole VaR limit — risk management closed your book.' },
    ],
    init: (st) => { st.extra.exp = 0; st.extra.rate = 4 + Math.random(); st.extra.last = 0; },
    ticker: (st) => {
      const d = st.extra.last;
      return h('span', {}, '3M HIBOR ', h('b', {}, st.extra.rate.toFixed(2) + '%'), ' ', h('span', { class: d > 0 ? 'no-t' : d < 0 ? 'ok-t' : 'muted' }, d ? (d > 0 ? '▲ ' : '▼ ') + Math.abs(d) + 'bp' : '—'),
        '  · open exposure ', h('b', {}, String(st.extra.exp)));
    },
    onRight: (st, E, fx) => {
      if (st.ups.has('sales')) fx.trust = (fx.trust || 0) + 2;
      if (E.sc && E.sc.hedge) { fx.risk = (fx.risk || 0) + 3; }
      tick(st);
    },
    onWrong: (st, E, fx, k) => {
      if (E.sc && E.sc.hedge) { st.extra.exp += 2; E.note = '⚠️ Position left unhedged (+2 exposure)'; }
      else if (E.calc) { st.extra.exp += 1; E.note = '⚠️ Mispriced deal sits on your book (+1 exposure)'; }
      tick(st);
    },
    endOfDay(st) {
      const move = (Math.random() < 0.5 ? -1 : 1) * rint(5, 30);
      st.extra.rate = Math.max(0.1, st.extra.rate + move / 100);
      st.extra.last = move;
      const e = st.extra.exp;
      const carry = st.ups.has('carry') ? 15 : 0;
      st.extra.exp = 0;
      if (!e) return { icon: '🔔', title: 'Market close', en: `Rates moved **${move > 0 ? '+' : '−'}${Math.abs(move)}bp**. Your book was fully hedged, so the move did not hurt you.${carry ? ' Swap book carry: **' + money(carry) + '**.' : ''}`, zh: `利率郁咗 **${move > 0 ? '+' : '−'}${Math.abs(move)}bp**。你嘅倉位完全對沖，冇受影響。`, fx: { cash: carry, risk: 4 } };
      const k = st.ups.has('var') ? 0.5 : 1;
      const pnl = Math.round((Math.random() < 0.45 ? 1 : -1) * e * Math.abs(move) * 0.8 * k);
      const used = Math.round(e * 3 * k);
      return { icon: '🔔', title: 'Market close', en: `Rates moved **${move > 0 ? '+' : '−'}${Math.abs(move)}bp**. You carried **${e}** unit(s) of open exposure overnight: P&L **${money(pnl)}**, and the position used **${used}** points of your VaR limit.${k < 1 ? ' (Your risk engine flagged it early: impact halved.)' : ''}`, zh: `利率郁咗 **${move > 0 ? '+' : '−'}${Math.abs(move)}bp**。你帶住 **${e}** 單位未對沖風險過夜：盈虧 **${money(pnl)}**，用咗 **${used}** 點 VaR 限額。`, fx: { cash: pnl + carry, risk: -used } };
    },
    score: (st) => st.meters.cash + st.meters.trust + st.meters.risk,
    ranks: [
      { en: 'Trainee dealer', zh: '見習交易員' }, { en: 'Junior dealer', zh: '初級交易員' }, { en: 'Market maker', zh: '莊家' },
      { en: 'Head of desk', zh: '交易枱主管' }, { en: 'Trading legend!', zh: '交易傳奇！' }, { en: 'Trading legend!', zh: '交易傳奇！' },
    ],
    upgrades: [
      { id: 'hint', icon: '🧮', en: 'Pricing library', zh: '定價程式庫', cost: 55, d: 'Shows the **first step** of every client calculation.' },
      { id: 'var', icon: '📉', en: 'VaR risk engine', zh: 'VaR 風險引擎', cost: 60, d: 'Halves the overnight damage from **open exposure** (L9).' },
      { id: 'futs', icon: '🏛️', en: 'Futures clearing account', zh: '期貨結算戶口', cost: 50, halves: 'fra', d: 'Halves losses on **FRA & futures** mistakes (L3: the clearing house is the counterparty).' },
      { id: 'sales', icon: '☎️', en: 'Star salesperson', zh: '王牌銷售', cost: 50, d: '**+2 Client trust** on every good decision.' },
      { id: 'carry', icon: '🔁', en: 'Swap book', zh: '掉期組合', cost: 70, d: '**+$15k** carry income every market close (L4).' },
      { id: 'greeks', icon: 'Δ', en: 'Greeks dashboard', zh: '希臘字母儀表板', cost: 55, halves: 'opt', d: 'Halves losses on **options & Greeks** mistakes (L6–L8).' },
    ],
    themes: [
      { cat: 'mm', icon: '💱', en: 'Money market', zh: '貨幣市場', lids: ['c2', 'c1'], meter: 'trust', gens: ['comp.cdprice', 'comp.tbill', 'comp.daycount', 'comp.effective', 'comp.simple', 'comp.disc2yield'],
        brief: { en: 'Quote deposits, CDs and T-bills. Get the day counts and the bid/offer side right.', zh: '報存款、存款證同國庫券價。日數慣例同買賣邊一定要啱。' },
        scen: [
          { id: 'm1', make: (r) => {
            const c = r.pick([['GBP', 0], ['HKD', 0], ['SGD', 0], ['USD', 1], ['EUR', 1], ['CHF', 1]]);
            const o = [['ACT/365', 'ACT/365'], ['ACT/360', 'ACT/360'], ['30/360', '30/360']];
            return { en: 'A client wants an interbank **' + c[0] + '** deposit quote. Which day count do you use?', zh: '客戶要 **' + c[0] + '** 同業存款報價。用咩日數慣例？',
              o: c[1] ? [o[1], o[0], o[2]] : [o[0], o[1], o[2]],
              x: 'Most money markets use **ACT/360**. ACT/365 exceptions: **GBP, HKD, SGD**, MYR, TWD, THB, ZAR (and JPY, CAD, AUD, NZD domestically).', xz: '大部分貨幣市場用 **ACT/360**；ACT/365 例外：**英鎊、港元、星元**等。' };
          } },
          Q('m2', 'Interbank quote in **London**: "**4.25 – 4.12**". Your client wants to **borrow**. Which rate?', '**倫敦**同業報價「**4.25 – 4.12**」。客戶想**借錢**，用邊個利率？',
            [['4.25% — you pay the higher rate for a loan', '4.25%——借錢付較高利率'], ['4.12%', '4.12%'], ['The average, 4.185%', '平均 4.185%'], ['Whichever the client prefers', '客戶鍾意邊個就邊個']],
            'London quotes **offer – bid**; others quote bid – offer. Rule: you **pay the higher** rate for a loan and **receive the lower** for a deposit.', '倫敦報**賣價 – 買價**。規則：**借錢付較高**、**存款收較低**。'),
          Q('m3', 'A CD market maker quotes "**4.13 – 3.89**". At which yield does he **buy** a CD from you?', '存款證莊家報「**4.13 – 3.89**」。佢用咩收益率**向你買**？',
            [['4.13% — higher yield means a lower price', '4.13%——收益率高即價錢低'], ['3.89%', '3.89%'], ['4.01%', '4.01%'], ['He never buys CDs', '佢唔會買']],
            'The market maker **buys** at the price yielding **4.13%** and **sells** at **3.89%**: higher yield = lower price, so he buys cheap and sells dear.', '莊家用 **4.13%** 嘅價**買**、**3.89%** 嘅價**賣**：收益率高 = 價錢低，平買貴賣。'),
          Q('m4', 'A treasurer asks which rate replaced **USD LIBOR** after the scandal.', '司庫問 **美元 LIBOR** 醜聞後由邊個利率取代。',
            [['SOFR', 'SOFR'], ['HIBOR', 'HIBOR'], ['LIBID', 'LIBID'], ['The T-bill discount rate', '國庫券貼現率']],
            'USD LIBOR was replaced by **SOFR** (with CME Term SOFR for term rates); Eurodollar futures became **3-month SOFR futures**.', '美元 LIBOR 由 **SOFR** 取代；歐洲美元期貨變咗 **三個月 SOFR 期貨**。'),
          Q('m5', 'A T-bill is quoted at a **4% discount rate**. Its true yield is…', '國庫券以 **4% 貼現率**報價。真實收益率…',
            [['higher than 4%', '高過 4%'], ['exactly 4%', '剛好 4%'], ['lower than 4%', '低過 4%'], ['undefined — T-bills have no yield', '冇得計——國庫券冇收益率']],
            'The discount is computed on the **face value**, but you invest less than face, so the **yield is always higher** than the discount rate: $y = D/(1 - Dt)$.', '貼現按**面值**計，但你投資少過面值，所以**收益率一定高過**貼現率。'),
          Q('m6', 'Spot is **28 Feb (month-end)**. A 2-month deposit would mature on **30 April**, which is a **Sunday**.', '即期係 **2 月 28 日（月尾）**。兩個月存款到期日 **4 月 30 日**係**星期日**。',
            [['Roll back to Friday 28 April — stay in the same month', '退返去 4 月 28 日星期五——留喺同一個月'], ['Roll forward to Monday 1 May', '推後到 5 月 1 日星期一'], ['Keep Sunday 30 April', '照用 4 月 30 日星期日'], ['Cancel the deposit', '取消存款']],
            '**End/end rule**: spot at month-end → maturity at month-end. **Month-end roll back**: if that falls on a holiday, roll **back** to the last working day of the same month.', '**月尾對月尾**；如果月尾係假期，就**退返**同月最後一個工作日。'),
          Q('m7', 'Bank A offers **6.0% compounded monthly**; Bank B **6.1% paid annually**. Which pays more?', 'A 銀行 **6.0% 按月複利**；B 銀行 **6.1% 每年派息**。邊個多啲？',
            [['Bank A — effective about 6.17%', 'A 銀行——實際約 6.17%'], ['Bank B', 'B 銀行'], ['They are the same', '一樣'], ['Cannot compare different compounding', '唔同複利冇得比']],
            'Effective rate of A = $(1 + 0.06/12)^{12} - 1 = 6.17\\%$ > 6.1%. Compare rates on the **same compounding basis**.', 'A 嘅實際利率 = 6.17% > 6.1%。要用**相同複利基礎**比較。'),
        ] },
      { cat: 'fra', icon: '📆', en: 'FRAs & futures', zh: 'FRA 同期貨', lids: ['c3'], meter: 'risk', gens: ['comp.frasettle', 'comp.futpl', 'comp.fwdfwd', 'comp.futhedge'],
        brief: { en: 'Corporate clients want to lock in future rates. Price FRAs, hedge them with futures and mind the margin calls.', zh: '企業客想鎖定將來利率。為 FRA 定價、用期貨對沖、留意保證金。' },
        scen: [
          Q('f1', 'A factory will **borrow in 3 months for 3 months** and fears **rising rates**. Which FRA trade do you sell it?', '工廠 **3 個月後要借 3 個月**，驚**加息**。你應該同佢做咩 FRA？',
            [['It buys a 3 v 6 FRA (pays fixed)', '佢買 3 v 6 FRA（付定息）'], ['It sells a 3 v 6 FRA', '佢沽 3 v 6 FRA'], ['It buys a 6 v 9 FRA', '佢買 6 v 9 FRA'], ['Nothing — FRAs exchange the principal', '唔使——FRA 會交換本金']],
            'A borrower afraid of rising rates **buys an FRA**: it pays the fixed FRA rate and receives the reference rate. Only interest differences move — never the principal.', '驚加息嘅借款人**買 FRA**：付定息、收參考利率。只交收利息差，**唔涉及本金**。', { hedge: 1 }),
          Q('f2', 'You just **sold an FRA** to a client. How do you hedge it with futures?', '你啱啱**沽咗一張 FRA** 俾客。點樣用期貨對沖？',
            [['Sell futures', '沽期貨'], ['Buy futures', '買期貨'], ['Buy another FRA from the same client', '再向同一個客買 FRA'], ['No hedge is possible', '冇得對沖']],
            'If rates rise, the FRA seller loses — and a **futures seller gains** (price falls). So a trader who **sells an FRA** should **sell futures**.', '加息時 FRA 賣方蝕，而**期貨賣方賺**（價跌）。所以**沽 FRA** 就要**沽期貨**。', { hedge: 1 }),
          Q('f3', 'FRA dealer quote: **12.82% / 12.88%**. The client wants to **buy** the FRA. At which rate?', 'FRA 報價 **12.82% / 12.88%**。客戶想**買**，用咩利率？',
            [['12.88% — the buyer deals at the higher rate', '12.88%——買方用較高利率'], ['12.82%', '12.82%'], ['12.85%', '12.85%'], ['The client chooses', '客戶揀']],
            'A customer **buying** an FRA (paying fixed) deals at the **higher** rate; a seller at the lower.', '客戶**買** FRA（付定息）用**較高**利率；賣就用較低。', { m: 'trust' }),
          Q('f4', 'You expect rates to **fall**. As a futures speculator you…', '你預期**減息**。作為期貨投機者你會…',
            [['buy futures — the price will rise', '買期貨——價會升'], ['sell futures', '沽期貨'], ['buy an FRA', '買 FRA'], ['sell call options on futures', '沽期貨認購期權']],
            'Futures price = **100 − rate**. Rates **fall → price rises**, so buy futures. (Expect a rise → sell.)', '期貨價 = **100 − 利率**。**減息 → 價升**，所以買期貨。'),
          Q('f5', 'Price, volume and **open interest** are all rising in HIBOR futures. This signals…', 'HIBOR 期貨嘅價、成交量同**未平倉合約**一齊升，代表…',
            [['new money entering — a strong trend', '新資金入市——趨勢強'], ['traders closing positions', '交易員平倉'], ['a weakening trend', '趨勢轉弱'], ['nothing at all', '乜都唔代表']],
            'All three rising → **new money is entering**: a strong trend. Falling open interest → positions being closed.', '三樣都升 → **新資金入市**，趨勢強。未平倉減少 → 有人平倉。', { m: 'trust' }),
          Q('f6', 'A client asks why futures have **virtually no credit risk**.', '客戶問點解期貨**差唔多冇信用風險**。',
            [['The clearing house is the counterparty and positions are marked to market daily', '結算所做對手，倉位每日按市值計價'], ['Futures never lose money', '期貨永遠唔會蝕'], ['The government guarantees every contract', '政府擔保每張合約'], ['They are discounted like FRAs', '佢哋好似 FRA 咁折現']],
            'The **clearing house** substitutes itself as counterparty, and **initial + variation margin** (daily marking to market) protect it.', '**結算所**做對手，加上**初始同變動保證金**（每日按市值計價）。', { m: 'trust' }),
          { id: 'f7', make: (r) => {
            const p = (r.rint(9400, 9750) / 100);
            const rate = (100 - p).toFixed(2);
            return { en: 'A 3-month futures contract trades at **' + p.toFixed(2) + '**. What rate does it imply?', zh: '三個月期貨價 **' + p.toFixed(2) + '**。隱含利率幾多？',
              o: [[rate + '%', rate + '%'], [p.toFixed(2) + '%', p.toFixed(2) + '%'], [(100 - p + 1).toFixed(2) + '%', (100 - p + 1).toFixed(2) + '%'], [(p / 100).toFixed(4) + '%', (p / 100).toFixed(4) + '%']],
              x: 'Interest rate futures are quoted as **100 − rate**: 100 − ' + p.toFixed(2) + ' = **' + rate + '%**.', xz: '利率期貨報價 = **100 − 利率**。', m: 'trust' };
          } },
        ] },
      { cat: 'swap', icon: '🔁', en: 'Swaps & the yield curve', zh: '掉期同收益率曲線', lids: ['c4', 'c5'], meter: 'trust', gens: ['comp.swapadv', 'comp.swaprate', 'comp.mmdf', 'comp.dffwd', 'comp.bootstrap', 'comp.swapunwind'],
        brief: { en: 'Arrange swaps between borrowers, value old swaps and bootstrap the curve every price depends on.', zh: '撮合借款人做掉期、為舊掉期估值、自舉所有價錢都靠佢嘅曲線。' },
        scen: [
          Q('s1', 'Company A borrows more cheaply than B in **both** fixed and floating markets. Can a swap still help both?', 'A 公司喺定息同浮息市場**都**借得平過 B。掉期仲可以幫到雙方嗎？',
            [['Yes — comparative advantage: each borrows where it is relatively cheaper, then they swap', '可以——比較優勢：各自喺相對平嘅市場借，再交換'], ['No — A has no reason to swap', '唔得——A 冇理由做'], ['Only if B pays A a large fee', '除非 B 俾大筆費用 A'], ['Only if both want fixed', '除非雙方都想要定息']],
            'What matters is the **difference** in A\'s advantage between markets (e.g. 1.5% fixed vs 0.7% floating → 0.8% to share).', '關鍵係 A 喺兩個市場優勢嘅**差**（例如 1.5% vs 0.7% → 0.8% 可分）。'),
          Q('s2', 'A client wants to **close out** an existing swap before maturity.', '客戶想喺到期前**平倉**一張掉期。',
            [['Do an opposite swap for the remaining term and settle the net difference', '做一張反方向、剩餘年期嘅掉期，結算淨差額'], ['Simply stop paying', '停止俾錢就得'], ['Exchange the notional principal', '交換名義本金'], ['Sell it on the stock exchange', '喺股票交易所賣']],
            'Reverse a swap with **another swap in the opposite direction**; the floating legs offset and the fixed difference is settled (as an NPV).', '用**反方向掉期**平倉；浮息抵銷，定息差額按現值結算。', { hedge: 1 }),
          Q('s3', 'Rates have **risen** since a client entered a swap in which it **receives fixed 7.4%**. Its value to the client is now…', '客戶做咗一張**收定息 7.4%** 嘅掉期，之後利率**上升**。而家對客戶嘅價值…',
            [['negative — market rates are above the fixed rate it receives', '負數——市場利率高過佢收嘅定息'], ['positive', '正數'], ['exactly zero', '剛好零'], ['always equal to the notional', '永遠等於名義本金']],
            'Receive-fixed value = PV(fixed leg) − PV(floating leg). When market rates exceed 7.4%, the fixed leg is worth less: the lecture example values at **−182,884**.', '收定息價值 = 定息腿現值 − 浮息腿現值。市場利率高過 7.4%，價值變負（例子 **−182,884**）。'),
          Q('s4', 'Building the curve: which instruments give the **short end**?', '砌曲線：**短端**用咩工具？',
            [['Cash deposit rates', '現金存款利率'], ['Swaps', '掉期'], ['Options', '期權'], ['30-year bonds', '30 年債券']],
            'Short end from **cash deposits**, middle from **FRAs** (or futures), long end from **swaps** — each step bootstrapped from the one before.', '短端用**現金**、中段用 **FRA**、長端用**掉期**，逐步自舉。'),
          Q('s5', 'There is no **15-month** swap quote, but you need D at 15 months.', '冇 **15 個月**掉期報價，但你要 15 個月嘅折現因子。',
            [['Linearly interpolate between the 1Y and 2Y swap rates, then bootstrap', '喺 1 年同 2 年掉期利率之間線性插值，再自舉'], ['Assume D = 1', '假設 D = 1'], ['Use the 3M cash rate', '用 3 個月現金利率'], ['Leave that date out', '跳過嗰日']],
            'Missing maturities are **linearly interpolated** by days from spot (e.g. 3.64% and 3.77% → 3.67%), then bootstrapped.', '冇報價嘅年期按日數**線性插值**（例如 3.64% 同 3.77% → 3.67%），再自舉。'),
          Q('s6', 'The yield curve slopes **upward**. The market expects short-term rates to…', '收益率曲線**向上**。市場預期短期利率會…',
            [['rise', '上升'], ['fall', '下跌'], ['stay exactly the same', '完全唔變'], ['become negative', '變負']],
            'The curve reflects expectations: **upward slope → rates expected to rise**.', '曲線反映預期：**向上 → 預期加息**。'),
          Q('s7', 'In a plain interest rate swap, what is **exchanged**?', '普通利率掉期**交換**咩？',
            [['Interest payments (fixed vs floating) on a notional — no principal', '名義本金上嘅利息（定息 vs 浮息）——唔換本金'], ['The notional principal at start and end', '開始同結束交換本金'], ['Shares for bonds', '股票換債券'], ['Two currencies only', '只係兩種貨幣']],
            'An interest rate swap exchanges **interest streams** on a notional amount; the notional itself is not exchanged (it is only a "hypothetical" leg when valuing).', '利率掉期交換名義本金上嘅**利息**；本金本身唔交換（估值時先假設）。'),
        ] },
      { cat: 'opt', icon: '🎯', en: 'Options desk', zh: '期權枱', lids: ['c6', 'c7'], meter: 'trust', gens: ['comp.intrinsic', 'comp.payoff', 'comp.pcp', 'comp.binom1', 'comp.arb'],
        brief: { en: 'Clients want views turned into options. Pick strategies, price with the binomial model and spot parity arbitrage.', zh: '客戶想將睇法變成期權。揀策略、用二項式定價、搵平價套利。' },
        scen: [
          Q('p1', 'A client expects the HSI to **move a lot** but has no idea in which direction.', '客戶預期恒指會**大上大落**，但唔知邊個方向。',
            [['Long straddle — buy a call and a put at the same strike', '買入跨式——同一行使價買認購同認沽'], ['Short straddle', '沽出跨式'], ['Long call only', '只買認購'], ['Sell a put', '沽認沽']],
            '**Long straddle**: profit if |S_T − X| > total premium — for a **volatile** market with no directional view.', '**買入跨式**：|S_T − X| 大過總期權金就賺——適合**波動**但冇方向嘅市況。'),
          { id: 'p2', make: (r) => {
            const S = r.rint(80, 120), K = S + r.pick([-10, -5, 0, 5, 10]);
            const st = S > K ? 0 : S === K ? 1 : 2;
            const lab = [[st === 0 ? 'In the money (intrinsic ' + (S - K) + ')' : 'In the money', st === 0 ? '價內（內在值 ' + (S - K) + '）' : '價內'], ['At the money (intrinsic 0)', '平價（內在值 0）'], ['Out of the money (intrinsic 0)', '價外（內在值 0）']];
            return { en: 'Stock trades at **$' + S + '**. A client holds a **call** with strike **$' + K + '**. It is…', zh: '股價 **$' + S + '**。客戶持有行使價 **$' + K + '** 嘅**認購期權**。佢係…',
              o: [lab[st], ...lab.filter((_, i) => i !== st), ['Worth less than zero', '價值低過零']],
              x: 'Call intrinsic value = max(0, S − X). In the money: X < S; at the money: X = S; out of the money: X > S. Intrinsic value is never negative.', xz: '認購內在值 = max(0, S − X)；永遠唔會係負數。' };
          } },
          Q('p3', 'Market **volatility jumps**. What happens to call **and** put prices?', '市場**波幅急升**。認購同認沽價會點？',
            [['Both rise', '兩個都升'], ['Both fall', '兩個都跌'], ['Calls rise, puts fall', '認購升、認沽跌'], ['No change', '唔變']],
            'Higher volatility increases **both** call and put prices (more chance of ending deep in the money). Long options have positive vega.', '波幅升，認購同認沽**都升**。長倉期權 vega 為正。'),
          Q('p4', 'A client wants to **sell calls** to earn premium. What is the main risk?', '客戶想**沽認購**賺期權金。主要風險係？',
            [['Potential loss is large — unlimited for a short call', '潛在損失好大——沽認購可以無限'], ['Loss is limited to the premium', '損失最多係期權金'], ['There is no risk', '冇風險'], ['Only time decay', '只有時間值損耗']],
            'The **buyer\'s** loss is limited to the premium; the **seller\'s** potential loss can be large — **unlimited for a short call**.', '**買方**最多蝕期權金；**賣方**可以蝕好多——**沽認購無上限**。', { hedge: 1 }),
          Q('p5', 'Put-call parity says the call is **too cheap** versus the put. The arbitrage today is…', '平價關係顯示認購**太平**。今日套利係…',
            [['Buy the call, sell the put, short the share, invest PV(X)', '買認購、沽認沽、沽空股票、投資 PV(X)'], ['Sell the call, buy the put, buy the share, borrow PV(X)', '沽認購、買認沽、買股票、借 PV(X)'], ['Buy both options', '兩個期權都買'], ['Nothing — parity never breaks', '唔使做——平價永遠成立']],
            '$C + Xe^{-rT} = P + S_0$. Buy the cheap side (call + bond) and sell the dear side (put + share): lecture example profit **+13.00** today, zero at maturity.', '買平嗰邊（認購 + 債券），沽貴嗰邊（認沽 + 股票）：例子今日賺 **+13.00**。'),
          Q('p6', 'In the binomial model, why do you **not** need the probability of an up move?', '二項式模型點解**唔使**知升嘅機率？',
            [['A riskless portfolio must earn the risk-free rate, which pins down the price', '無風險組合一定賺無風險利率，鎖定咗價錢'], ['Up and down are always 50/50', '升跌永遠五五波'], ['The option has no value', '期權冇價值'], ['Volatility is zero', '波幅係零']],
            'Hold Δ shares and short 1 call so both states are equal (Δ = 0.25 in the lecture); the riskless value is discounted at **r** → C = 0.633.', '持 Δ 股、沽 1 張認購令兩個情況相等；無風險價值按 **r** 折現 → C = 0.633。'),
          Q('p7', 'A Hong Kong **CBBC**: the underlying hits the **call price**. Then…', '香港**牛熊證**：相關資產觸及**收回價**。然後…',
            [['It is called back early (mandatory call) and stops trading', '提早收回（強制收回），停止買賣'], ['It doubles in value', '價值翻倍'], ['It turns into a put', '變成認沽'], ['Nothing happens until expiry', '到期前乜都唔會發生']],
            'CBBCs have a **call price**: if the underlying hits it, the contract is **called back early** and stops trading.', '牛熊證有**收回價**：觸及就**提早收回**，停止買賣。'),
        ] },
      { cat: 'opt', icon: 'Δ', en: 'Greeks & risk control', zh: '希臘字母同風險控制', lids: ['c8', 'c9'], meter: 'risk', gens: ['comp.posdelta', 'comp.deltahedge', 'comp.theta'],
        brief: { en: 'Friday: keep the option book delta-neutral, understand gamma, vega and theta, and read VaR like a risk manager.', zh: '星期五：保持期權組合 delta 中性，明白 gamma、vega、theta，用風險經理嘅角度讀 VaR。' },
        scen: [
          { id: 'q1', make: (r) => {
            const n = r.pick([200, 400, 500, 800, 1000]), d = r.pick([0.4, 0.5, 0.6, 0.65, 0.75]);
            const sh = Math.round(n * d * 10) / 10;
            return { en: 'You are **short ' + n + ' calls** with delta **' + d + '** (1 option = 1 share). How do you get **delta-neutral**?', zh: '你**沽咗 ' + n + ' 張認購**，delta **' + d + '**（1 張 = 1 股）。點樣做到 **delta 中性**？',
              o: [['Buy ' + sh + ' shares', '買 ' + sh + ' 股'], ['Sell ' + sh + ' shares', '沽 ' + sh + ' 股'], ['Buy ' + n + ' shares', '買 ' + n + ' 股'], ['Sell ' + n + ' more calls', '再沽 ' + n + ' 張認購']],
              x: 'Position delta = −' + n + ' × ' + d + ' = **−' + sh + '**. Buying **' + sh + ' shares** (delta 1 each) brings it to zero. Rebalance as delta changes.', xz: '組合 delta = −' + sh + '；買 ' + sh + ' 股就中性。delta 變就要再平衡。', hedge: 1 };
          } },
          Q('q2', 'Your option book has **negative gamma**. What hurts you most?', '你嘅期權組合 **gamma 為負**。咩最傷？',
            [['Big moves in either direction', '任何方向嘅大幅波動'], ['A calm market', '平靜市況'], ['Only falling prices', '只係跌市'], ['Nothing — gamma does not matter', '冇嘢——gamma 唔重要']],
            'Negative gamma = **short options** overall: the position loses from **big moves** either way and benefits if the market stays calm.', '負 gamma = 整體**沽期權**：**大波動**任何方向都蝕，平靜就有利。', { hedge: 1 }),
          Q('q3', 'The head of desk wants you **long vega** before an election. You…', '主管想你喺選舉前**持有正 vega**。你會…',
            [['buy calls or puts', '買認購或認沽'], ['sell calls', '沽認購'], ['sell puts', '沽認沽'], ['buy shares only', '只買股票']],
            'Long options have **positive vega**. To be long vega, **buy** puts or calls.', '長倉期權 **vega 為正**。要正 vega 就**買**期權。'),
          Q('q4', 'Over a long weekend nothing moves. Your **long options**…', '長週末乜都冇郁。你嘅**長倉期權**…',
            [['lose value — negative theta (time decay)', '貶值——theta 為負（時間值損耗）'], ['gain value', '升值'], ['stay exactly the same', '完全唔變'], ['expire immediately', '即刻到期']],
            'Theta of a long call or put is usually **negative**; time decay speeds up **near maturity**.', '長倉 theta 通常**為負**；**臨近到期**損耗加快。'),
          Q('q5', 'Desk A: **95% one-day** VaR $1m. Desk B: **99% ten-day** VaR $3m. Which is riskier?', 'A 枱：**95% 一日** VaR $1m。B 枱：**99% 十日** VaR $3m。邊個風險大啲？',
            [['Cannot say — VaRs need the same horizon and confidence', '講唔到——VaR 要相同期限同信心水平先比較到'], ['Desk B — the number is bigger', 'B——數字大啲'], ['Desk A', 'A'], ['They are equal', '一樣']],
            'VaR depends on distribution, **confidence level** and **time horizon**; VaRs **cannot be compared** unless they share the same horizon (and confidence).', 'VaR 取決於分佈、**信心水平**同**期限**；唔同期限**冇得比**。'),
          Q('q6', 'A counterparty goes **bankrupt while a payment to it is in process**. Which risk is this?', '對手喺**付款進行中破產**。係咩風險？',
            [['Settlement risk', '交收風險'], ['Model risk', '模型風險'], ['Tax risk', '稅務風險'], ['Liquidity risk', '流動性風險']],
            '**Settlement risk**: the counterparty declares bankruptcy while one party is in the process of payment.', '**交收風險**：一方付款期間對手破產。'),
          Q('q7', 'Gamma is **highest** for an option that is…', 'Gamma **最高**嘅期權係…',
            [['at the money and close to expiry', '平價兼接近到期'], ['deep in the money', '深價內'], ['deep out of the money', '深價外'], ['long-dated and deep out of the money', '長期兼深價外']],
            'Gamma is maximum **at the money with a short time to expiry**; near zero for deep ITM/OTM options.', 'Gamma 喺**平價兼短期**最大；深價內外接近零。'),
        ] },
    ],
  };
  function tick(st) {
    const d = rint(-4, 4);
    st.extra.rate = Math.max(0.1, st.extra.rate + d / 100);
    st.extra.last = d;
  }

  SH.sims = {
    fite7407: { emoji: fite.emoji, name: fite.name, blurb: fite.blurb, run: (root, cid) => engine(root, cid, fite), def: fite },
    comp7802: { emoji: comp.emoji, name: comp.name, blurb: comp.blurb, run: (root, cid) => engine(root, cid, comp), def: comp },
  };
})();

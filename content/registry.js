/* Content registry. Each course and lecture file calls SH.addCourse / SH.addLecture.
   Courses are kept fully separate: every id is namespaced by course + lecture. */
(function () {
  'use strict';
  const SH = window.SH;
  SH.courses = {};
  SH.courseOrder = [];

  SH.addCourse = function (meta) {
    meta.lectures = [];
    SH.courses[meta.id] = meta;
    SH.courseOrder.push(meta.id);
  };

  SH.addLecture = function (cid, L) {
    const C = SH.courses[cid];
    if (!C) throw new Error('Unknown course ' + cid);
    L.course = cid;
    const lists = ['cards', 'terms', 'stories', 'examples', 'mcq', 'written', 'orders', 'cloze'];
    for (const k of lists) {
      L[k] = L[k] || [];
      L[k].forEach((it, i) => {
        it.id = it.id || k[0] + (i + 1);
        it.uid = cid + ':' + L.id + '.' + it.id;
        it.lecture = L.id;
      });
    }
    L.gens = L.gens || [];
    C.lectures.push(L);
    C.lectures.sort((a, b) => a.order - b.order);
  };

  SH.lecture = (cid, lid) => (SH.courses[cid] ? SH.courses[cid].lectures.find((l) => l.id === lid) : null);

  SH.all = function (cid, key, lids) {
    const C = SH.courses[cid];
    if (!C) return [];
    return C.lectures.filter((l) => !lids || lids.includes(l.id)).flatMap((l) => l[key]);
  };

  /* Exam command words — the English skill layer used by both courses */
  SH.commandWords = [
    { w: 'Define', zh: '下定義', d: 'Give the precise meaning of a term. One or two exact sentences, often plus a short example.', dz: '講清楚個名詞係乜嘢意思，一兩句準確定義，最好加個小例子。', starter: '[Term] is defined as ... For example, ...' },
    { w: 'Describe', zh: '描述', d: 'Say what something is or how it works, step by step. No need to judge it.', dz: '講佢係點、點運作，一步步寫出嚟，唔使評論好定唔好。', starter: 'The process consists of the following steps. First, ... Then, ... Finally, ...' },
    { w: 'Explain', zh: '解釋（講原因）', d: 'Say WHY or HOW. Each point needs a reason ("because ...", "this means ...").', dz: '要講「點解」同「點樣」。每一點都要有原因，例如 because…、this means…。', starter: '... This is because ... As a result, ...' },
    { w: 'Compare', zh: '比較（異同）', d: 'Show similarities AND differences, point by point, on the same criteria.', dz: '同一個準則下，逐點講相同同唔同，唔好淨係分開描述兩樣嘢。', starter: 'Both A and B ... However, A ..., whereas B ...' },
    { w: 'Distinguish', zh: '區分', d: 'Focus on the differences that tell two things apart.', dz: '重點講分別，令人分得清兩樣嘢。', starter: 'The key difference between A and B is that ...' },
    { w: 'Discuss', zh: '討論', d: 'Give several sides (advantages / disadvantages, risks / benefits) and end with a short conclusion.', dz: '要講多個角度（好處壞處、風險同利益），最後要有結論。', starter: 'On the one hand, ... On the other hand, ... Overall, ...' },
    { w: 'Evaluate', zh: '評估', d: 'Judge how good or important something is, with evidence, and give your verdict.', dz: '用證據判斷好唔好、重唔重要，最後一定要畀判斷。', starter: 'The main strength is ... However, a weakness is ... On balance, ...' },
    { w: 'Outline', zh: '概述', d: 'List the main points briefly. Short bullet-like sentences are fine.', dz: '簡單列出重點，唔使好長，一點一句都得。', starter: 'The main points are: (1) ..., (2) ..., (3) ...' },
    { w: 'List / State / Name', zh: '列出／寫出', d: 'Just give the items. No explanation needed (but do not give fewer than asked).', dz: '直接寫答案，唔使解釋，但數量要夠。', starter: '(1) ... (2) ... (3) ...' },
    { w: 'Calculate / Compute', zh: '計算', d: 'Show the formula, substitute the numbers, give the final answer with units and sensible rounding.', dz: '寫公式 → 代入數字 → 最後答案（有單位、合理小數位）。步驟都有分。', starter: 'Using the formula ..., we have ... = ... Therefore, the answer is ...' },
    { w: 'Illustrate', zh: '舉例說明', d: 'Use an example (numbers, a case or a diagram) to make the point clear.', dz: '用例子（數字、案例或者圖）去講清楚。', starter: 'To illustrate, suppose ...' },
    { w: 'Justify', zh: '證明／說明理據', d: 'Give reasons or evidence that support an answer or decision.', dz: '畀理由或者證據去支持你嘅答案。', starter: 'This is justified because ... Evidence for this is ...' },
    { w: 'Identify', zh: '指出', d: 'Point out and name the relevant item(s), usually from a scenario.', dz: '喺題目情境入面搵出相關嘢，講出佢個名。', starter: 'The relevant risk here is ..., because ...' },
    { w: 'Why / How', zh: '點解／點樣', d: '"Why" wants reasons; "How" wants the mechanism or steps.', dz: 'Why 要原因；How 要機制或者步驟。', starter: 'Why: The main reason is ... / How: This works by ...' },
    { w: 'What if / Suppose', zh: '假設情境', d: 'Apply the concept to a new situation and state the consequence.', dz: '將概念套落新情境，講會有咩後果。', starter: 'If ..., then ... This would lead to ...' },
  ];

  /* Words that signal what to look for when reading an English question */
  SH.signalWords = {
    command: ['define', 'describe', 'explain', 'compare', 'distinguish', 'discuss', 'evaluate', 'outline', 'list', 'state', 'name', 'calculate', 'compute', 'determine', 'illustrate', 'justify', 'identify', 'why', 'how', 'what', 'suppose', 'assume', 'show', 'derive', 'find', 'give'],
    limit: ['briefly', 'two', 'three', 'four', 'five', 'main', 'key', 'each', 'both', 'all', 'at least', 'only', 'example', 'examples', 'marks', 'mark', 'in your own words', 'with reference to', 'step', 'steps'],
    contrast: ['difference', 'differences', 'between', 'versus', 'vs', 'whereas', 'advantages', 'disadvantages', 'risks', 'benefits', 'similarities'],
  };
})();

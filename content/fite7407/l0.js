/* FITE7407 Part 0 — Course introduction */
SH.addLecture('fite7407', {
  id: 'f0', order: 0, code: 'L0',
  title: { en: 'Course map: what is securities transaction banking?', zh: '課程地圖：乜嘢係證券交易銀行？' },
  src: ['FITE7407 - 2026 - Part0.pdf'],
  intro: {
    en: 'Start here. This short unit explains what the course covers and why an IT person needs to understand banking operations.',
    zh: '由呢度開始。呢個短單元講課程範圍，同埋點解讀 IT 嘅人要識銀行營運。',
  },
  cards: [
    {
      id: 'c1', s: 'Part 0, slides 3–5', t: { en: 'The four parts of the course', zh: '課程四大部分' },
      en: 'The course follows the life of a security inside a bank:\n1. **Securities and markets**: types of securities, markets, custody, corporate actions, tax and regulatory reporting.\n2. **Transaction banking**: banking structure, outsourcing, regulatory control, the securities value chain.\n3. **Internal organisation** of a securities transaction bank.\n4. **Information technology** in transaction banks: systems, cloud, mobile, software development, IT operations, information security, plus blockchain, digital assets and generative AI.\n\nIt is a cross-over course: banking products + bank organisation + real-life bank IT. It is **not** a programming course and **not** about financial modelling.',
      zh: '成個課程跟住「一張證券喺銀行入面嘅一生」去講：\n1. **證券與市場**：證券種類、市場、託管、公司行動、稅務同監管報告。\n2. **交易銀行**：銀行結構、外判、監管、證券價值鏈。\n3. 證券交易銀行嘅**內部組織**。\n4. 交易銀行嘅 **IT**：系統、雲端、手機銀行、軟件開發、IT 營運、資訊保安，再加區塊鏈、數碼資產同生成式 AI。\n\n呢科係跨界：銀行產品 + 銀行組織 + 真實銀行 IT。**唔係**寫程式課，亦**唔係**財務建模課。',
      mem: { en: 'Product → Process → Organisation → IT.', zh: '記住次序：產品 → 流程 → 組織 → IT。' },
    },
    {
      id: 'c2', s: 'Part 0, slides 14–16', t: { en: 'Learning outcomes = what the exam tests', zh: '學習成果 = 考試考乜' },
      en: '- **CLO 1**: understand the key properties of basic financial products and their **processing** in a transaction banking scenario.\n- **CLO 2**: describe the **organisational structure** of a transaction bank and the **outsourcing and offshoring** opportunities.\n- **CLO 3**: explain how the requirements of products, customers, markets and regulators are implemented by the **IT department**.\n\nAssessment: 40% course work, 60% written examination covering all taught content.',
      zh: '- **CLO 1**：明白基本金融產品嘅特性，同埋佢哋喺交易銀行點樣**處理**。\n- **CLO 2**：描述交易銀行嘅**組織架構**，同**外判／離岸**機會。\n- **CLO 3**：解釋 IT 部門點樣實現產品、客戶、市場同監管機構嘅要求。\n\n評核：40% 功課，60% 筆試（考晒所有內容）。',
      tip: { en: 'Notice the verbs: *understand*, *describe*, *explain*. Exam questions use the same verbs, so practise writing descriptions and explanations, not just definitions.', zh: '留意動詞：understand、describe、explain。考題都係用呢啲字，所以要練寫「描述」同「解釋」，唔好淨係背定義。' },
    },
    {
      id: 'c3', s: 'Part 0, slides 17–20', t: { en: 'Why IT people need banking knowledge', zh: '點解 IT 人要識銀行業務' },
      en: 'Every IT system starts from a **business problem**. The path is: business problem → **business analysis** → **IT solution design**. If you do not understand the business (for example, what custody or settlement means), you cannot analyse the requirements or design the right system.\n\nIncreasingly important: how the **data** in the system develops, and what information is "hidden" in that data. In a bank, many roles work together: management, business, requirements, software development, architecture, IT operations, project management and the "data people".',
      zh: '每個 IT 系統都由**業務問題**開始：業務問題 → **業務分析** → **IT 方案設計**。如果你唔明業務（例如託管、結算係乜），就做唔到需求分析，設計唔到啱嘅系統。\n\n越嚟越重要嘅係：系統入面嘅**數據**點樣發展、數據入面「藏住」咩資訊。銀行入面好多角色要合作：管理層、業務、需求、軟件開發、架構、IT 營運、項目管理同「數據人」。',
    },
    {
      id: 'c4', s: 'Part 0, slide 17', t: { en: 'Key questions to warm up', zh: '熱身問題' },
      en: '- What is a **security**, and why do securities exist? (They let companies and governments raise money, and let investors own a tradeable claim.)\n- What is a **transaction**? In real life it is an exchange of value; technically it is a set of bookings that must all succeed or all fail.\n- What is a **transaction bank**? A bank focused on *processing*: executing, settling and administering transactions in a standardised way, often for other banks.\n- Other types of banks: distribution banks (customer advice, branches) and production banks (product creation, e.g. fund houses, investment banks). See Lecture 4.',
      zh: '- 乜嘢係**證券**？點解會有證券？（等公司同政府集資，亦等投資者擁有一個可以買賣嘅權利。）\n- 乜嘢係**交易**？現實係價值交換；技術上係一組記賬，要齊齊成功或者齊齊失敗。\n- 乜嘢係**交易銀行**？專注*處理*嘅銀行：用標準化方式執行、結算同管理交易，好多時幫其他銀行做。\n- 其他銀行類型：分銷銀行（客戶諮詢、分行）同生產銀行（設計產品，例如基金公司、投資銀行）。詳見第 4 講。',
    },
  ],
  terms: [
    { en: 'Transaction bank', zh: '交易銀行', d: 'A bank that focuses on processing: standardised execution, settlement and administration of transactions, often as a white-label service for other banks.', dz: '專注處理交易嘅銀行：標準化執行、結算同管理，經常用白牌形式幫其他銀行做。' },
    { en: 'Business analysis', zh: '業務分析', d: 'The step between a business problem and an IT solution: understanding and documenting what the business really needs.', dz: '由業務問題去到 IT 方案之間嘅一步：了解同記錄業務真正需要乜。' },
    { en: 'Offshoring', zh: '離岸外移', d: 'Moving business activities to another country, for example to lower-cost locations.', dz: '將業務活動搬去其他國家做，例如成本較低嘅地方。' },
    { en: 'Outsourcing', zh: '外判', d: 'Giving a business activity to an external service provider instead of doing it in-house.', dz: '將某項業務交畀外面嘅服務供應商做，而唔係自己做。' },
  ],
  mcq: [
    { q: 'Which statement best describes FITE7407?', qz: '邊句最能形容 FITE7407？', o: ['A cross-over course on banking products, bank organisation and real-life bank IT', 'A programming course on building trading systems', 'A course on detailed financial modelling and investment finance', 'A course on accounting standards'], a: 0, x: 'Part 0 says the course is a cross-over lecture on products and processing, organisation/regulation, and IT in large banks. It is explicitly not a programming course and not about financial modelling.', xz: 'Part 0 講明係跨界課程：產品與處理、組織與監管、大銀行 IT。明確話唔係寫程式、唔係財務建模。', s: 'Part 0, slide 5' },
    { q: 'What is the weighting of the written examination in FITE7407?', qz: '筆試佔幾多分？', o: ['60%', '40%', '50%', '100%'], a: 0, x: 'Continuous assessment (course work) is 40% and the written examination is 60%.', xz: '平時分 40%，筆試 60%。', s: 'Part 0, slide 16' },
    { q: 'CLO 2 asks you to describe the organisational structure of a transaction bank and the existing ______ opportunities.', qz: 'CLO 2 要你描述交易銀行嘅組織架構同現有嘅 ______ 機會。', o: ['outsourcing and offshoring', 'trading and arbitrage', 'lending and mortgage', 'marketing and branding'], a: 0, x: 'CLO 2: organisational structure of a transaction bank plus outsourcing and offshoring opportunities.', xz: 'CLO 2：交易銀行組織架構 + 外判同離岸機會。', s: 'Part 0, slide 14' },
    { q: 'In the lecturer\'s model, what comes between a business problem and an IT solution design?', qz: '講師個模型入面，業務問題同 IT 方案設計之間係乜？', o: ['Business analysis', 'Software testing', 'Marketing', 'Regulatory approval'], a: 0, x: 'Business problem → business analysis → IT solution design.', xz: '業務問題 → 業務分析 → IT 方案設計。', s: 'Part 0, slide 19' },
    { q: 'True or false: the FITE7407 written exam only covers Part 1 of the course.', qz: '對定錯：筆試只考第一部分。', o: ['True', 'False'], a: 1, x: 'False. The written exam covers all taught content.', xz: '錯。筆試考晒所有教過嘅內容。', s: 'Part 0, slide 16' },
    { q: 'Which CLO is about how IT implements the requirements of products, customers, markets and regulators?', qz: '邊個 CLO 係講 IT 點樣實現產品、客戶、市場同監管要求？', o: ['CLO 3', 'CLO 1', 'CLO 2', 'None of them'], a: 0, x: 'CLO 3 is the IT outcome.', xz: 'CLO 3 係 IT 嗰個。', s: 'Part 0, slide 14' },
  ],
  written: [
    {
      id: 'w1', cmd: 'Explain', marks: 4,
      q: 'Explain why an IT professional working in a bank needs to understand the business processes of securities transactions.',
      qz: '解釋點解喺銀行做 IT 嘅人需要明白證券交易嘅業務流程。',
      plan: [{ en: 'State the path: business problem → analysis → IT solution.', zh: '講出路徑：業務問題 → 分析 → IT 方案。' }, { en: 'Reason 1: requirements come from the business.', zh: '原因一：需求來自業務。' }, { en: 'Reason 2: data and regulation.', zh: '原因二：數據同監管。' }, { en: 'Conclude.', zh: '總結。' }],
      points: [
        { en: 'IT solutions start from a business problem', zh: 'IT 方案由業務問題開始', kw: ['business problem|business need|problem of the business'] },
        { en: 'Business analysis translates needs into requirements', zh: '業務分析將需要轉成需求', kw: ['analysis|analyse|analyze', 'requirement'] },
        { en: 'Without domain knowledge the design may be wrong', zh: '唔識業務，設計會錯', kw: ['understand', 'wrong|incorrect|fail'] },
        { en: 'Data in the system and hidden information matter', zh: '系統數據同隱藏資訊好重要', kw: ['data'] },
      ],
      model: 'Every IT system in a bank exists to solve a business problem, such as settling trades or processing dividends. Before a system can be designed, a business analysis must turn the business needs into clear requirements. If the IT professional does not understand terms like custody, settlement or corporate actions, the requirements can be misunderstood and the system may process transactions incorrectly. In addition, the data produced by these processes is valuable, so IT staff must understand what the data means. Therefore, business knowledge is a precondition for building correct and useful banking systems.',
      modelZh: '每個銀行 IT 系統都係為咗解決業務問題（例如結算交易、處理股息）。設計之前要做業務分析，將需要變成清楚嘅需求。如果 IT 人唔明託管、結算、公司行動等概念，就會誤解需求，系統就會處理錯。另外，流程產生嘅數據好有價值，IT 人要明白數據代表乜。所以業務知識係做出正確系統嘅前提。',
      phrases: ['Every IT system exists to solve a **business problem**.', 'Before a system can be designed, ...', 'If ... is misunderstood, the system may ...', 'Therefore, business knowledge is a precondition for ...'],
    },
  ],
});

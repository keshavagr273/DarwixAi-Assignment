import type { LocalizationTriplet, MarketCode } from '../types';

export interface MarketProfile {
  code: MarketCode;
  name: string;
  nativeName: string;
  flag: string;
  domain: string;
  primaryLanguages: string[];
  formalityRange: string;
  culturalNotes: string[];
  regulatoryBody: string;
}

export const marketProfiles: Record<MarketCode, MarketProfile> = {
  in_en: {
    code: 'in_en',
    name: 'India (Renewal Operations)',
    nativeName: 'India · English & Regional Hindi',
    flag: '🇮🇳',
    domain: 'Term Life & Motor Policy Renewal',
    primaryLanguages: ['Indian English (92%)', 'Hinglish Bridge (8%)'],
    formalityRange: 'Semi-Formal / Professional Direct',
    culturalNotes: [
      'Politeness through honorifics (Sir/Ma’am) and prompt reassurance on claim settlements.',
      'UPI and Netbanking preference over physical cheques; immediate SMS receipt SLA expectation.',
      'Explicit confirmation of statutory 30-day grace period is a regulatory trust builder.'
    ],
    regulatoryBody: 'Insurance Regulatory and Development Authority of India (IRDAI)'
  },
  ph_tl: {
    code: 'ph_tl',
    name: 'Philippines (Life Insurance)',
    nativeName: 'Pilipinas · Taglish & Filipino',
    flag: '🇵🇭',
    domain: 'Bancassurance & Individual Life Renewal',
    primaryLanguages: ['Taglish (65%)', 'Tagalog/Filipino (25%)', 'Philippine English (10%)'],
    formalityRange: 'Warm Respectful (po/opo + Ma’am/Sir)',
    culturalNotes: [
      'Constant use of "po" and "opo" particles to express deference and respect to the policyholder.',
      'Natural Taglish code-switching: English finance verbs embedded in Tagalog syntax ("i-update ang auto-debit").',
      'Flexible payment channels: GCash, Maya, and BDO/BPI over-the-counter payments are dominant.',
      'Avoiding harsh words like "lapse" directly; softened to "mapanatiling protektado ang pamilya".'
    ],
    regulatoryBody: 'Insurance Commission (IC) of the Philippines'
  },
  id_id: {
    code: 'id_id',
    name: 'Indonesia (Multifinance)',
    nativeName: 'Indonesia · Bahasa Formal & Santai',
    flag: '🇮🇩',
    domain: 'Motorcycle & Vehicle Multifinance Instalments',
    primaryLanguages: ['Bahasa Indonesia Formal (55%)', 'Bahasa Colloquial/Santai (40%)', 'Regional Dialects (5%)'],
    formalityRange: 'Sopan & Ramah (Bapak/Ibu, Kak)',
    culturalNotes: [
      'Honorifics "Bapak" (Mr.) and "Ibu" (Ms./Mrs.) are non-negotiable for respect; "Kak" used for younger borrowers.',
      'Exact finance vocabulary: "angsuran" (instalment), "jatuh tempo" (due date), "denda" (penalty), "tenor" (loan duration).',
      'Payday timing ("tanggal gajian", 25th to 1st) heavily influences reminder scheduling and promise-to-pay dates.',
      'Payment options must highlight Virtual Account (VA BCA/Mandiri) and convenience stores (Indomaret/Alfamart).'
    ],
    regulatoryBody: 'Otoritas Jasa Keuangan (OJK)'
  }
};

export const mockLocalizationTriplets: LocalizationTriplet[] = [
  // Philippines (PH) Examples
  {
    id: 'ph_trip_01',
    intent_label: 'Renewal Due Date Reminder',
    category: 'reminder',
    market: 'ph_tl',
    neutral_intent: 'Remind customer that premium is due on October 15th and request confirmation.',
    literal_english_translation: 'Your payment must be given on October 15 or your insurance will end.',
    localized_natural_expression: 'Magandang araw po Ma’am Maria! Paalala lang po mula sa Meridian Life na sa October 15 po ang due date ng inyong renewal para manatiling tuloy-tuloy ang proteksyon ng inyong pamilya.',
    cultural_annotations: [
      { feature: 'Politeness Particles', explanation: 'Integrated "po" in every clause to maintain warmth without sounding overly robotic.' },
      { feature: 'Benefit Framing', explanation: 'Replaced negative threat of termination with positive assurance: "manatiling tuloy-tuloy ang proteksyon ng inyong pamilya".' },
      { feature: 'Honorific Ma’am', explanation: 'Filipino customer service standard pairs "Ma’am" with first name ("Ma’am Maria").' }
    ],
    honorific_register: 'Respectful Taglish (Po/Opo standard)'
  },
  {
    id: 'ph_trip_02',
    intent_label: 'Payment Method Inquiry',
    category: 'payment',
    market: 'ph_tl',
    neutral_intent: 'Ask customer what payment method they prefer to settle the overdue premium.',
    literal_english_translation: 'What channel of money transfer are you utilizing to pay this debt?',
    localized_natural_expression: 'Saan po mas convenient para sa inyo mag-settle? Pwede po via GCash bills payment, Maya, o diretso sa inyong BDO/BPI online banking app.',
    cultural_annotations: [
      { feature: 'Taglish Verb Formation', explanation: 'Used "mag-settle" as a natural hybrid loanword familiar to all Metro Manila and regional urban callers.' },
      { feature: 'Local E-Wallets First', explanation: 'Mentioned GCash and Maya before traditional bank branches reflecting 84% adoption in local fintech.' }
    ],
    honorific_register: 'Conversational Taglish'
  },
  {
    id: 'ph_trip_03',
    intent_label: 'Grace Period Explanation',
    category: 'objection',
    market: 'ph_tl',
    neutral_intent: 'Inform customer that they have a 31-day grace period to pay without losing their coverage.',
    literal_english_translation: 'You have a duration of 31 days to give money before death benefit is lost.',
    localized_natural_expression: 'Huwag po kayong mag-alala, may 31-day grace period po tayo sa ilalim ng Insurance Commission regulations. Ibig sabihin po, full cover pa rin kayo habang inaayos ang inyong budget.',
    cultural_annotations: [
      { feature: 'Inclusive Pronoun "Tayo"', explanation: 'Used "tayo" (inclusive we) to build partnership with the customer rather than adversarial collection tone.' },
      { feature: 'Regulatory Reassurance', explanation: 'Referenced Insurance Commission rules to eliminate doubt and anxiety about sudden claim rejections.' }
    ],
    honorific_register: 'Empathetic Taglish'
  },

  // Indonesia (ID) Examples
  {
    id: 'id_trip_01',
    intent_label: 'Instalment Due Date Reminder',
    category: 'reminder',
    market: 'id_id',
    neutral_intent: 'Remind borrower that vehicle multifinance instalment is due tomorrow and avoid late fees.',
    literal_english_translation: 'Pay your vehicle money tomorrow or penalty fees will happen to you.',
    localized_natural_expression: 'Selamat pagi Bapak Hendra, kami dari Meridian Finance ingin mengingatkan bahwa angsuran pembiayaan motor Bapak akan jatuh tempo besok tanggal 5. Pembayaran tepat waktu menjaga status cicilan tetap lancar dan bebas denda ya, Pak.',
    cultural_annotations: [
      { feature: 'Honorific Bapak / Pak', explanation: '"Bapak" in greeting and closing softening particle "ya, Pak" is mandatory in Indonesian polite financial protocol.' },
      { feature: 'Terminological Precision', explanation: 'Substituted generic words with statutory multifinance terms: "angsuran" (instalment), "jatuh tempo" (due date), "denda" (penalty).' }
    ],
    honorific_register: 'Formal Sopan (Bapak/Ibu standard)'
  },
  {
    id: 'id_trip_02',
    intent_label: 'Payday Timing Coordination',
    category: 'objection',
    market: 'id_id',
    neutral_intent: 'Customer says they do not have money until payday; adjust promise-to-pay date.',
    literal_english_translation: 'You cannot delay. Pay now.',
    localized_natural_expression: 'Baik Bapak, kami sangat memahami jika sedang menunggu tanggal gajian. Boleh kami bantu catat komitmen pembayarannya di tanggal berapa ya, Pak, agar kami sesuaikan jadwal sistem pengingatnya?',
    cultural_annotations: [
      { feature: 'Tanggal Gajian Recognition', explanation: 'Recognizes "tanggal gajian" (payday window usually 25th-1st) as a valid socio-economic reality rather than immediate refusal.' },
      { feature: 'Collaborative Phrasing', explanation: '"Boleh kami bantu catat" frames the call as financial assistance rather than aggressive debt collection.' }
    ],
    honorific_register: 'Empathetic Professional'
  },
  {
    id: 'id_trip_03',
    intent_label: 'Retail Cash Outlet & Virtual Account Guidance',
    category: 'payment',
    market: 'id_id',
    neutral_intent: 'Direct borrower to pay at Indomaret convenience store or bank virtual account.',
    literal_english_translation: 'Deposit money into shop cashier or internet code.',
    localized_natural_expression: 'Untuk kemudahan Bapak, pembayarannya bisa langsung lewat nomor Virtual Account BCA di m-banking, atau cukup sebutkan nomor kontrak di kasir Indomaret terdekat. Sangat cepat dan bukti bayarnya langsung tercatat real-time.',
    cultural_annotations: [
      { feature: 'Familiar Retail Channels', explanation: 'Mentioned Indomaret and BCA Virtual Account which are the top 2 preferred cash & digital channels in Java/Sumatra.' },
      { feature: 'Real-time Reassurance', explanation: 'Emphasized "langsung tercatat real-time" to alleviate borrower fears of unrecorded late fees.' }
    ],
    honorific_register: 'Helpful Informative'
  }
];

export const mockGlossary = [
  { term: 'Grace Period', market: 'in_en', translation: 'Grace Period (Statutory 30 Days)', dnt: false, note: 'Do not shorten; cite IRDAI 30 days.' },
  { term: 'Auto-Debit', market: 'in_en', translation: 'NACH / e-Mandate', dnt: false, note: 'Use NACH or e-mandate for bank auto-pull.' },
  { term: 'Po / Opo', market: 'ph_tl', translation: 'Po / Opo', dnt: true, note: 'Mandatory respect particle. NEVER translate or omit.' },
  { term: 'Lapse', market: 'ph_tl', translation: 'Pagka-antala / Pag-lapse ng proteksyon', dnt: false, note: 'Always pair with protection softening phrase.' },
  { term: 'Bancassurance', market: 'ph_tl', translation: 'Bancassurance', dnt: true, note: 'Regulatory product category term.' },
  { term: 'Bapak / Ibu', market: 'id_id', translation: 'Bapak / Ibu', dnt: true, note: 'Universal honorific for adult customers.' },
  { term: 'Cicilan / Angsuran', market: 'id_id', translation: 'Angsuran Bulanan / Cicilan', dnt: false, note: 'Use angsuran for formal; cicilan for conversational.' },
  { term: 'Jatuh Tempo', market: 'id_id', translation: 'Jatuh Tempo', dnt: true, note: 'Legal due date term mandated by OJK.' },
  { term: 'Tanggal Gajian', market: 'id_id', translation: 'Tanggal Gajian', dnt: false, note: 'Cultural payday landmark (25th to 1st).' },
];

export const mockFallbacks = [
  {
    market: 'in_en',
    type: 'out_of_scope',
    phrase: 'I want to be completely accurate with you. I do not have verified policy records for that specific question right now, but I can immediately have our senior branch specialist call you back today.',
    drift_score: '0.00 (Pure EN)'
  },
  {
    market: 'ph_tl',
    type: 'out_of_scope',
    phrase: 'Gusto ko po sanang maging sigurado at tapat sa inyo, Ma’am/Sir. Wala po sa aking certified records ang impormasyong iyan sa ngayon. Pwede ko po kayong i-connect sa aming senior underwriter para matulungan kayo nang buo.',
    drift_score: '0.04 (Within Taglish Register)'
  },
  {
    market: 'id_id',
    type: 'out_of_scope',
    phrase: 'Mohon maaf Bapak/Ibu, agar informasi yang kami sampaikan akurat dan sesuai ketentuan OJK, detail tersebut saat ini belum tersedia di sistem kami. Apakah berkenan jika petugas pembiayaan kami menghubungi Bapak/Ibu kembali siang ini?',
    drift_score: '0.02 (Pure Sopan Bahasa)'
  }
];

export interface AccentBenchmark {
  accent: string;
  region: string;
  sampleSize: number;
  werClean: number; // >25 dB
  werModerate: number; // 15-25 dB
  werNoisy: number; // <15 dB
  typicalErrorPatterns: string[];
}

export const mockAccentBenchmarks: AccentBenchmark[] = [
  {
    accent: 'Standard Jakarta Colloquial',
    region: 'Jabodetabek (Urban Capital)',
    sampleSize: 240,
    werClean: 4.6,
    werModerate: 7.2,
    werNoisy: 11.4,
    typicalErrorPatterns: ['Slang contraction ambiguity ("udah" vs "telah", "bisaan" vs "bisa")', 'Enclitic particle drop ("-nya", "-sih")']
  },
  {
    accent: 'Javanese-Accented Indonesian',
    region: 'Central & East Java (Semarang, Solo, Surabaya)',
    sampleSize: 185,
    werClean: 6.8,
    werModerate: 10.4,
    werNoisy: 16.9,
    typicalErrorPatterns: ['Heavy voiced plosive aspiration (b, d, g pronounced with glottal breath)', 'Loanwords like "angsuran" heard as "angsurane"', 'Vowel height shifts (e ↔ i)']
  },
  {
    accent: 'Sundanese-Accented Indonesian',
    region: 'West Java (Bandung, Bogor)',
    sampleSize: 150,
    werClean: 7.1,
    werModerate: 11.2,
    werNoisy: 17.8,
    typicalErrorPatterns: ['Phoneme substitution /f/ and /v/ frequently realized as /p/ ("Virtual Account" → "Pirtual Account")', 'Terminal vowel lengthening ("teh", "mah")']
  },
  {
    accent: 'Batak-Accented Indonesian',
    region: 'North Sumatra (Medan, Toba)',
    sampleSize: 120,
    werClean: 5.9,
    werModerate: 9.8,
    werNoisy: 15.2,
    typicalErrorPatterns: ['Strong alveolar trill /r/ causing phoneme segmentation boundary artifacts in streaming chunker', 'Staccato cadence triggering premature VAD endpoints']
  }
];

export interface WordDiffToken {
  word: string;
  type: 'correct' | 'insertion' | 'deletion' | 'substitution';
  hypothesisAlternative?: string;
}

export const mockWordDiffExample: WordDiffToken[] = [
  { word: 'Selamat', type: 'correct' },
  { word: 'siang', type: 'correct' },
  { word: 'Bapak', type: 'correct' },
  { word: 'Hendra', type: 'correct' },
  { word: 'angsuran', type: 'correct' },
  { word: 'motor', type: 'correct' },
  { word: 'Honda', type: 'correct' },
  { word: 'Beat', type: 'substitution', hypothesisAlternative: 'Biot' },
  { word: 'Bapak', type: 'correct' },
  { word: 'jatuh', type: 'correct' },
  { word: 'tempo', type: 'correct' },
  { word: 'tanggal', type: 'correct' },
  { word: 'lima', type: 'correct' },
  { word: 'di', type: 'deletion' },
  { word: 'BCA', type: 'correct' },
  { word: 'Virtual', type: 'substitution', hypothesisAlternative: 'Pirtual' },
  { word: 'Account', type: 'correct' },
  { word: 'ya', type: 'insertion', hypothesisAlternative: '[inserted "lah"]' },
  { word: 'Pak', type: 'correct' }
];

export interface ProviderComparison {
  name: string;
  model: string;
  streamingLatencyMs: number;
  costPerHour: string;
  codeSwitchScore: string;
  idAccentRobustness: string;
  verdict: 'SELECTED' | 'BACKUP' | 'EVALUATED_NOT_CHOSEN';
  notes: string;
}

export const mockProviders: ProviderComparison[] = [
  {
    name: 'Deepgram',
    model: 'Nova-2 Telephony (Multilingual)',
    streamingLatencyMs: 185,
    costPerHour: '$0.258',
    codeSwitchScore: '92% (High Taglish & Hinglish fluency)',
    idAccentRobustness: 'High (Tolerates Javanese plosives well)',
    verdict: 'SELECTED',
    notes: 'Fastest time-to-first-token in telephony streams; custom financial term boosting supported.'
  },
  {
    name: 'OpenAI',
    model: 'Whisper Large-v3 Turbo (Self-hosted)',
    streamingLatencyMs: 440,
    costPerHour: '$0.360 (GPU equiv)',
    codeSwitchScore: '89% (Good semantic reconstruction)',
    idAccentRobustness: 'Moderate (Hallucinates under street noise <12dB)',
    verdict: 'BACKUP',
    notes: 'High raw accuracy on clean audio, but latency exceeds live-nudge 250ms streaming chunk budget.'
  },
  {
    name: 'Google Cloud',
    model: 'Chirp-2 (Speech-to-Text v2)',
    streamingLatencyMs: 310,
    costPerHour: '$0.960',
    codeSwitchScore: '86% (Struggles with rapid colloquial Taglish bridging)',
    idAccentRobustness: 'Very High (Extensive Indonesian regional corpus)',
    verdict: 'EVALUATED_NOT_CHOSEN',
    notes: 'Excellent accent handling for Sundanese/Javanese, but 3.7x more expensive and higher latency.'
  },
  {
    name: 'AssemblyAI',
    model: 'Conformer-2 Streaming',
    streamingLatencyMs: 260,
    costPerHour: '$0.390',
    codeSwitchScore: '81% (Forces English orthography on Tagalog loanwords)',
    idAccentRobustness: 'Low (Severe Sundanese /p/ vs /f/ confusion)',
    verdict: 'EVALUATED_NOT_CHOSEN',
    notes: 'Good English telephony, but unacceptable word error rates on Southeast Asian vernacular.'
  }
];

export const mockTtsCompromises = [
  {
    issue: 'Filipino English Prosody Flatness',
    market: 'ph_tl',
    description: 'Off-the-shelf neural TTS voices pronounce Tagalog loanwords and English finance terms with flat American prosody or unnatural Indonesian cadence.',
    mitigationEngineered: 'Implemented SSML phoneme mapping (`<phoneme alphabet="ipa">`) for key terminology (GCash, S-P-A-J, Bancassurance, po, opo) plus 1.08x pitch lift on respectful questioning turns.',
    status: 'Mitigated in Production'
  },
  {
    issue: 'Indonesian Acronym Letter-by-Letter Spellout',
    market: 'id_id',
    description: 'TTS engines frequently mispronounced Indonesian regulatory acronyms ("OJK" spoken as english "Oh-Jay-Kay" rather than Indonesian "Oh-Je-Ka", and "BPKB" garbled).',
    mitigationEngineered: 'Integrated pre-TTS phonetic dictionary expansion: "OJK" → "O-J-K", "BPKB" → "B-P-K-B", "Indomaret" accented on penultimate syllable.',
    status: 'Mitigated in Production'
  }
];

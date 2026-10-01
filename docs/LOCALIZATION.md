# Native-Language Bot Localization (Phase 4)

## Overview

Deploying conversational AI in the Philippines (`ph_tl`) and Indonesia (`id_id`) requires more than literal translation. Cultural norms dictate specific registers (formality levels), honorifics, and specialized code-switching (Taglish in the Philippines, localized finance terms in Indonesia) that an LLM will frequently get wrong without strict prompt constraints.

This document details the localization rules, terminology choices, and examples applied in the PARLEY voice agent.

---

## 1. Register & Honorifics

### Philippines (`ph_tl`)
- **Honorifics:** Use `po` and `opo` consistently to show respect.
- **Pronouns:** Use `kayo`, `niyo`, or `ninyo` (plural/polite) rather than `ka` or `mo` (singular/informal).
- **Tone:** Warm, respectful, and accommodating.

### Indonesia (`id_id`)
- **Honorifics:** Use `Bapak` (Sir) or `Ibu` (Madam) before names. Avoid `Anda` as it can sound robotic or overly direct in customer service.
- **Pronouns:** Use `saya` for the agent.
- **Tone:** Professional, polite, and helpful (formal Jakarta standard).

---

## 2. Localization Examples (Literal vs Localized)

When building the system prompt and fallbacks, we must avoid literal English translations.

| English Intent | Literal Translation | Localized Version | Reason / Constraint |
|---|---|---|---|
| "How can I help you?" (PH) | Paano ko ikaw matutulungan? | Paano ko po kayo matutulungan? | Needs `po` and polite plural pronoun `kayo`. |
| "I understand your concern." (PH) | Naiintindihan ko ang iyong alalahanin. | Naiintindihan ko po ang inyong concern. | 'Alalahanin' sounds archaic. Use English loanword 'concern' + `po`. |
| "Your premium is due." (PH) | Ang iyong premium ay dapat bayaran. | Kailangan na po nating bayaran ang inyong premium. | Literal sounds accusatory. Localized softens the tone. |
| "Please wait a moment." (ID) | Tolong tunggu sebentar. | Mohon tunggu sebentar, Bapak/Ibu. | 'Tolong' is informal. 'Mohon' is polite customer service register. |
| "Your grace period has ended." (ID) | Masa tenggang Anda telah berakhir. | Masa tenggang polis Bapak/Ibu telah berakhir. | 'Anda' is robotic. Use 'Bapak/Ibu' and explicitly specify 'polis'. |

---

## 3. Terminology & Glossary

Financial terms are often kept in English in the Philippines (code-switching), while Indonesia has specific localized terms.

| English Term | Philippines (`ph_tl`) | Indonesia (`id_id`) | Notes |
|---|---|---|---|
| Premium | Premium | Premi | PH keeps English; ID adapts spelling. |
| Policy | Policy / Polisa | Polis | Both markets understand the English root. |
| Grace Period | Grace Period / Palugit | Masa Tenggang | PH uses English primarily; ID strictly uses localized term. |
| Beneficiary | Beneficiary | Ahli Waris / Penerima Manfaat | PH keeps English; ID uses specific legal terms. |
| Due Date | Due Date | Jatuh Tempo | PH keeps English; ID strictly localizes. |
| Installment | Hulugan / Installment | Cicilan / Angsuran | ID colloquially uses 'cicilan'. |

---

## 4. Code-Switching & Language Drift

In the Philippines, customers speak in Taglish (mixing Tagalog and English). An untrained LLM tends to drift into pure English if the customer uses too many English terms, or drift into pure deep Tagalog which sounds unnatural.

**Language Lock Strategy:**
- The agent is instructed to *always* reply in Tagalog with English loanwords, regardless of the customer's mix.
- **Drift Detection:** We measure the percentage of non-loanword English in the bot's responses. If it exceeds a threshold (e.g., > 10% unexpected English), we flag a "Language Drift" violation.

## 5. Compliance & Collections Conduct

In both markets, regulatory bodies strictly prohibit aggressive collections behavior.
- **Rule:** Never threaten policy cancellation immediately. Always offer the statutory grace period first.
- **Rule:** Do not disclose policy values (sum assured, premium amount) until caller identity (Name + DOB + Phone) is verified.

---

## Known Gaps & Caveats

- **Regional Accents (ID):** The current TTS voice is Jakarta-standard. Javanese or Sundanese speakers might find the agent sounds slightly too formal or "capital city" centric.
- **Deep Tagalog Fallback:** If the LLM generates deep Tagalog (e.g., "salapi" instead of "pera"), it sounds like a news broadcaster rather than a call center agent. System prompt constraints mitigate this, but few-shot examples are required to enforce it completely.

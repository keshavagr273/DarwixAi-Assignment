# Real-Time Nudges Overview

## Suppression Metrics (from 150 iterations)
* **Missed Cross-Sell**: 15 fired, 135 suppressed.
* **Compliance Violation**: 15 fired, 135 suppressed.
* **Rising Frustration**: 15 fired, 135 suppressed.
* **Noisy / Ambiguous**: 0 fired, 0 suppressed.

## Limitations at 10x Scale
* Duplicate suppression heavily relies on accurate topic clustering.
* Noisy audio reduces confidence scores, successfully suppressing false positives but risking false negatives on actual frustration.
* Tier-2 LLM caching is essential; without it, tail latencies (P99) would exceed the 1000ms budget.

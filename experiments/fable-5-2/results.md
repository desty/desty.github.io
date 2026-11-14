# Fable 5.2 cost-per-task calculations (AA Intelligence Index v5.0.1, fetched 2026-11-14)

## Fable 5.1 -> Fable 5.2 at the same effort (token price ratio 0.8)

| effort | index | cost/task | cost change | output tokens | input tokens | implied token-volume change |
|---|---|---|---|---|---|---|
| low | 39 -> 54 | $4.47 -> $3.10 | -31% | -4% | -33% | -13% |
| medium | 43 -> 56 | $5.56 -> $3.80 | -32% | -17% | -29% | -15% |
| high | 47 -> 62 | $7.54 -> $9.08 | +20% | +22% | +54% | +51% |
| xhigh | 50 -> 62 | $10.85 -> $14.83 | +37% | +25% | +82% | +71% |
| max | 49 -> 65 | $12.99 -> $26.54 | +104% | +68% | +199% | +155% |

## Opus 5.5 -> Fable 5.2 at the same effort (token price ratio None)

| effort | index | cost/task | cost change | output tokens | input tokens | implied token-volume change |
|---|---|---|---|---|---|---|
| low | 35 -> 54 | $0.98 -> $3.10 | +217% | +65% | +69% | n/a |
| medium | 48 -> 56 | $2.45 -> $3.80 | +55% | -4% | -20% | n/a |
| high | 52 -> 62 | $3.46 -> $9.08 | +162% | +52% | +66% | n/a |
| xhigh | 57 -> 62 | $6.05 -> $14.83 | +145% | +43% | +56% | n/a |
| max | 59 -> 65 | $10.04 -> $26.54 | +164% | +26% | +82% | n/a |

## Fable 5.2: where cost per task goes

| effort | cost/task | output | cache read | cache write | uncached input | output share |
|---|---|---|---|---|---|---|
| low | $3.10 | $1.42 | $0.63 | $0.97 | $0.07 | 46% |
| medium | $3.80 | $1.71 | $0.86 | $1.16 | $0.07 | 45% |
| high | $9.08 | $3.89 | $2.60 | $2.52 | $0.07 | 43% |
| xhigh | $14.83 | $6.43 | $4.38 | $3.94 | $0.07 | 43% |
| max | $26.54 | $10.89 | $8.53 | $7.05 | $0.07 | 41% |

## Fable 5.1: where cost per task goes

| effort | cost/task | output | cache read | cache write | uncached input | output share |
|---|---|---|---|---|---|---|
| low | $4.47 | $1.86 | $1.21 | $1.32 | $0.09 | 42% |
| medium | $5.56 | $2.39 | $1.47 | $1.61 | $0.09 | 43% |
| high | $7.54 | $3.26 | $2.08 | $2.11 | $0.09 | 43% |
| xhigh | $10.85 | $4.78 | $3.06 | $2.92 | $0.09 | 44% |
| max | $12.99 | $5.78 | $3.70 | $3.42 | $0.09 | 44% |

## Opus 5.5: where cost per task goes

| effort | cost/task | output | cache read | cache write | uncached input | output share |
|---|---|---|---|---|---|---|
| low | $0.98 | $0.38 | $0.33 | $0.23 | $0.04 | 39% |
| medium | $2.45 | $0.88 | $1.00 | $0.54 | $0.04 | 36% |
| high | $3.46 | $1.20 | $1.51 | $0.72 | $0.04 | 35% |
| xhigh | $6.05 | $2.07 | $2.79 | $1.15 | $0.04 | 34% |
| max | $10.04 | $3.47 | $4.74 | $1.80 | $0.04 | 35% |

## Fable 5.2: marginal cost per index point

| step | +points | +cost/task | $ per point |
|---|---|---|---|
| low -> medium | +2.5 | $+0.71 | $0.28 |
| medium -> high | +5.4 | $+5.28 | $0.97 |
| high -> xhigh | +0.4 | $+5.75 | $14.56 |
| xhigh -> max | +2.3 | $+11.71 | $4.99 |

## Opus 5.5: marginal cost per index point

| step | +points | +cost/task | $ per point |
|---|---|---|---|
| low -> medium | +13.5 | $+1.48 | $0.11 |
| medium -> high | +3.6 | $+1.01 | $0.28 |
| high -> xhigh | +5.6 | $+2.58 | $0.46 |
| xhigh -> max | +1.7 | $+3.99 | $2.40 |

## Cheapest configuration per target index (all 25 configs)

| config | index | cost/task | on frontier | dominated by |
|---|---|---|---|---|
| Haiku 5.5 low | 18.6 | $0.04 | yes |  |
| Haiku 5.5 medium | 24.6 | $0.09 | yes |  |
| Sonnet 5.5 low | 25.6 | $0.51 |  | Haiku 5.5 high (29.9, $0.16) |
| Haiku 5.5 high | 29.9 | $0.16 | yes |  |
| Sonnet 5.5 medium | 30.8 | $0.78 |  | Haiku 5.5 xhigh (34.6, $0.25) |
| Haiku 5.5 xhigh | 34.6 | $0.25 | yes |  |
| Opus 5.5 low | 34.8 | $0.98 |  | Haiku 5.5 max (36.5, $0.41) |
| Haiku 5.5 max | 36.5 | $0.41 | yes |  |
| Fable 5.1 low | 38.7 | $4.47 |  | Sonnet 5.5 high (41.5, $1.64) |
| Sonnet 5.5 high | 41.5 | $1.64 | yes |  |
| Fable 5.1 medium | 43.2 | $5.56 |  | Opus 5.5 medium (48.2, $2.45) |
| Fable 5.1 high | 47.2 | $7.54 |  | Opus 5.5 medium (48.2, $2.45) |
| Opus 5.5 medium | 48.2 | $2.45 | yes |  |
| Fable 5.1 max | 49.2 | $12.99 |  | Fable 5.2 low (53.9, $3.10) |
| Sonnet 5.5 xhigh | 49.9 | $4.09 |  | Fable 5.2 low (53.9, $3.10) |
| Fable 5.1 xhigh | 50.0 | $10.85 |  | Fable 5.2 low (53.9, $3.10) |
| Opus 5.5 high | 51.8 | $3.46 |  | Fable 5.2 low (53.9, $3.10) |
| Fable 5.2 low | 53.9 | $3.10 | yes |  |
| Sonnet 5.5 max | 54.5 | $10.02 |  | Fable 5.2 medium (56.4, $3.80) |
| Fable 5.2 medium | 56.4 | $3.80 | yes |  |
| Opus 5.5 xhigh | 57.4 | $6.05 | yes |  |
| Opus 5.5 max | 59.1 | $10.04 |  | Fable 5.2 high (61.8, $9.08) |
| Fable 5.2 high | 61.8 | $9.08 | yes |  |
| Fable 5.2 xhigh | 62.2 | $14.83 | yes |  |
| Fable 5.2 max | 64.6 | $26.54 | yes |  |

## FrontierCode-AA 2.0 (AA per-evaluation score and cost per task)

| config | score | cost/task | output tokens/task | time/task (min) |
|---|---|---|---|---|
| Fable 5.2 low | 38.4% | $2.12 | 25,509 | 4.2 |
| Fable 5.2 medium | 41.3% | $2.69 | 31,711 | 5.7 |
| Fable 5.2 high | 49.1% | $9.64 | 104,935 | 17.4 |
| Fable 5.2 xhigh | 47.6% | $21.41 | 219,357 | 37.9 |
| Fable 5.2 max | 48.8% | $43.37 | 419,818 | 69.5 |
| Fable 5.1 low | 22.8% | $3.51 | 30,009 | 6.0 |
| Fable 5.1 medium | 28.8% | $4.78 | 39,981 | 7.9 |
| Fable 5.1 high | 30.3% | $7.43 | 59,804 | 11.9 |
| Fable 5.1 xhigh | 35.7% | $12.65 | 95,563 | 18.1 |
| Fable 5.1 max | 31.6% | $16.29 | 119,810 | 22.6 |
| Opus 5.5 low | 15.8% | $0.63 | 14,073 | 2.2 |
| Opus 5.5 medium | 33.1% | $1.71 | 31,042 | 4.9 |
| Opus 5.5 high | 35.9% | $2.49 | 42,739 | 6.7 |
| Opus 5.5 xhigh | 43.8% | $6.49 | 101,768 | 15.4 |
| Opus 5.5 max | 46.4% | $13.46 | 199,997 | 29.3 |
| Sonnet 5.5 low | 7.1% | $0.25 | 10,474 | 1.3 |
| Sonnet 5.5 medium | 11.0% | $0.32 | 13,314 | 1.7 |
| Sonnet 5.5 high | 25.7% | $0.76 | 27,588 | 3.2 |
| Sonnet 5.5 xhigh | 35.6% | $2.71 | 85,399 | 10.0 |
| Sonnet 5.5 max | 41.7% | $11.56 | 315,985 | 38.3 |

## Terminal-Bench 4.0 (AA per-evaluation score and cost per task)

| config | score | cost/task | output tokens/task | time/task (min) |
|---|---|---|---|---|
| Fable 5.2 low | 54.5% | $4.34 | 52,872 | 8.6 |
| Fable 5.2 medium | 55.1% | $5.25 | 63,173 | 11.3 |
| Fable 5.2 high | 59.6% | $13.47 | 157,872 | 26.2 |
| Fable 5.2 xhigh | 61.6% | $20.81 | 259,771 | 44.9 |
| Fable 5.2 max | 59.6% | $31.59 | 376,804 | 62.4 |
| Fable 5.1 low | 40.4% | $7.20 | 66,194 | 13.2 |
| Fable 5.1 medium | 44.9% | $8.98 | 84,092 | 16.6 |
| Fable 5.1 high | 52.0% | $11.49 | 113,032 | 22.5 |
| Fable 5.1 xhigh | 55.1% | $15.53 | 158,352 | 30.0 |
| Fable 5.1 max | 52.0% | $18.77 | 191,566 | 36.2 |
| Opus 5.5 low | 31.3% | $2.08 | 37,782 | 6.0 |
| Opus 5.5 medium | 52.5% | $4.04 | 75,654 | 12.0 |
| Opus 5.5 high | 56.6% | $5.12 | 100,178 | 15.8 |
| Opus 5.5 xhigh | 59.6% | $8.78 | 169,497 | 25.6 |
| Opus 5.5 max | 59.6% | $13.11 | 252,948 | 37.1 |
| Sonnet 5.5 low | 20.7% | $1.28 | 40,277 | 5.0 |
| Sonnet 5.5 medium | 29.8% | $1.58 | 51,618 | 6.6 |
| Sonnet 5.5 high | 43.9% | $2.19 | 76,655 | 8.8 |
| Sonnet 5.5 xhigh | 57.1% | $6.08 | 192,064 | 22.6 |
| Sonnet 5.5 max | 63.6% | $12.65 | 382,429 | 46.3 |

## AA-Briefcase (AA per-evaluation score and cost per task)

| config | score | cost/task | output tokens/task | time/task (min) |
|---|---|---|---|---|
| Fable 5.2 low | 1563 | $5.62 | 66,731 | 10.9 |
| Fable 5.2 medium | 1622 | $6.84 | 80,308 | 14.4 |
| Fable 5.2 high | 1677 | $15.49 | 168,484 | 28.0 |
| Fable 5.2 xhigh | 1737 | $28.56 | 286,607 | 49.6 |
| Fable 5.2 max | 1785 | $59.35 | 550,380 | 91.1 |
| Fable 5.1 low | 1477 | $6.72 | 62,221 | 12.4 |
| Fable 5.1 medium | 1524 | $8.58 | 77,049 | 15.2 |
| Fable 5.1 high | 1577 | $11.40 | 99,904 | 19.9 |
| Fable 5.1 xhigh | 1649 | $17.79 | 151,381 | 28.7 |
| Fable 5.1 max | 1671 | $22.71 | 187,455 | 35.4 |
| Opus 5.5 low | 1278 | $1.15 | 26,734 | 4.2 |
| Opus 5.5 medium | 1617 | $4.40 | 83,406 | 13.3 |
| Opus 5.5 high | 1682 | $6.27 | 113,122 | 17.8 |
| Opus 5.5 xhigh | 1761 | $12.27 | 198,195 | 29.9 |
| Opus 5.5 max | 1801 | $21.05 | 338,099 | 49.6 |
| Sonnet 5.5 low | 1268 | $0.80 | 45,609 | 5.6 |
| Sonnet 5.5 medium | 1437 | $1.39 | 71,619 | 9.1 |
| Sonnet 5.5 high | 1634 | $3.27 | 139,976 | 16.1 |
| Sonnet 5.5 xhigh | 1740 | $6.98 | 241,615 | 28.4 |
| Sonnet 5.5 max | 1816 | $20.47 | 625,176 | 75.7 |

## Terminal-Bench-Science 0.1 (AA per-evaluation score and cost per task)

| config | score | cost/task | output tokens/task | time/task (min) |
|---|---|---|---|---|
| Fable 5.2 low | 53.8% | $8.78 | 98,894 | 16.2 |
| Fable 5.2 medium | 60.5% | $10.98 | 118,623 | 21.3 |
| Fable 5.2 high | 70.0% | $24.28 | 242,409 | 40.3 |
| Fable 5.2 xhigh | 67.6% | $31.37 | 338,767 | 58.6 |
| Fable 5.2 max | 73.3% | $45.21 | 455,033 | 75.4 |
| Fable 5.1 low | 21.4% | $12.91 | 97,668 | 19.4 |
| Fable 5.1 medium | 29.0% | $15.32 | 122,398 | 24.1 |
| Fable 5.1 high | 39.5% | $20.30 | 159,506 | 31.7 |
| Fable 5.1 xhigh | 40.5% | $25.80 | 210,506 | 39.9 |
| Fable 5.1 max | 43.3% | $28.12 | 242,900 | 45.9 |
| Opus 5.5 low | 24.3% | $2.81 | 51,878 | 8.2 |
| Opus 5.5 medium | 43.3% | $6.80 | 109,873 | 17.5 |
| Opus 5.5 high | 49.0% | $10.02 | 153,973 | 24.2 |
| Opus 5.5 xhigh | 61.9% | $14.12 | 224,112 | 33.8 |
| Opus 5.5 max | 59.0% | $19.97 | 306,993 | 45.0 |
| Sonnet 5.5 low | 10.5% | $1.23 | 47,237 | 5.8 |
| Sonnet 5.5 medium | 16.2% | $2.14 | 73,731 | 9.4 |
| Sonnet 5.5 high | 34.3% | $4.98 | 147,369 | 17.0 |
| Sonnet 5.5 xhigh | 52.4% | $12.77 | 308,860 | 36.3 |
| Sonnet 5.5 max | 53.3% | $23.76 | 508,836 | 61.6 |

## AutomationBench-AA (AA per-evaluation score and cost per task)

| config | score | cost/task | output tokens/task | time/task (min) |
|---|---|---|---|---|
| Fable 5.2 low | 68.0% | $1.28 | 15,911 | 2.6 |
| Fable 5.2 medium | 68.8% | $1.33 | 16,599 | 3.0 |
| Fable 5.2 high | 71.4% | $1.69 | 21,978 | 3.7 |
| Fable 5.2 xhigh | 74.2% | $2.27 | 31,675 | 5.5 |
| Fable 5.2 max | 76.4% | $4.45 | 68,932 | 11.4 |
| Fable 5.1 low | 52.2% | $1.50 | 15,688 | 3.1 |
| Fable 5.1 medium | 54.7% | $1.62 | 17,378 | 3.4 |
| Fable 5.1 high | 55.3% | $1.75 | 19,017 | 3.8 |
| Fable 5.1 xhigh | 57.8% | $2.18 | 25,032 | 4.7 |
| Fable 5.1 max | 59.4% | $2.59 | 31,099 | 5.9 |
| Opus 5.5 low | 52.9% | $0.49 | 11,890 | 1.9 |
| Opus 5.5 medium | 61.2% | $0.64 | 15,060 | 2.4 |
| Opus 5.5 high | 63.2% | $0.70 | 16,536 | 2.6 |
| Opus 5.5 xhigh | 65.0% | $0.88 | 21,784 | 3.3 |
| Opus 5.5 max | 69.5% | $1.43 | 41,105 | 6.0 |
| Sonnet 5.5 low | 49.4% | $0.24 | 11,158 | 1.4 |
| Sonnet 5.5 medium | 54.9% | $0.26 | 12,228 | 1.6 |
| Sonnet 5.5 high | 59.4% | $0.31 | 14,696 | 1.7 |
| Sonnet 5.5 xhigh | 65.5% | $0.42 | 20,790 | 2.4 |
| Sonnet 5.5 max | 71.8% | $1.03 | 60,911 | 7.4 |

## CritPt v2 (Hard Subset) (AA per-evaluation score and cost per task)

| config | score | cost/task | output tokens/task | time/task (min) |
|---|---|---|---|---|
| Fable 5.2 low | 60.0% | $0.31 | 5,963 | 1.0 |
| Fable 5.2 medium | 61.5% | $0.37 | 7,013 | 1.3 |
| Fable 5.2 high | 73.0% | $1.05 | 20,666 | 3.4 |
| Fable 5.2 xhigh | 73.5% | $2.47 | 48,267 | 8.3 |
| Fable 5.2 max | 76.5% | $6.35 | 123,348 | 20.4 |
| Fable 5.1 low | 49.5% | $0.89 | 13,590 | 2.7 |
| Fable 5.1 medium | 58.5% | $1.38 | 21,787 | 4.3 |
| Fable 5.1 high | 62.0% | $2.39 | 37,339 | 7.4 |
| Fable 5.1 xhigh | 60.0% | $4.33 | 67,381 | 12.8 |
| Fable 5.1 max | 52.5% | $4.55 | 71,384 | 13.5 |
| Opus 5.5 low | 36.0% | $0.12 | 4,387 | 0.7 |
| Opus 5.5 medium | 54.0% | $0.25 | 9,391 | 1.5 |
| Opus 5.5 high | 59.5% | $0.38 | 14,390 | 2.3 |
| Opus 5.5 xhigh | 67.5% | $0.97 | 36,639 | 5.5 |
| Opus 5.5 max | 68.0% | $2.58 | 97,157 | 14.2 |
| Sonnet 5.5 low | 26.0% | $0.07 | 5,020 | 0.6 |
| Sonnet 5.5 medium | 33.5% | $0.09 | 6,762 | 0.9 |
| Sonnet 5.5 high | 51.5% | $0.18 | 13,687 | 1.6 |
| Sonnet 5.5 xhigh | 57.5% | $0.45 | 34,661 | 4.1 |
| Sonnet 5.5 max | 59.0% | $1.93 | 140,930 | 17.1 |

## HLE-Diamond (AA per-evaluation score and cost per task)

| config | score | cost/task | output tokens/task | time/task (min) |
|---|---|---|---|---|
| Fable 5.2 low | 60.8% | $0.13 | 3,070 | 0.5 |
| Fable 5.2 medium | 66.3% | $0.18 | 4,441 | 0.8 |
| Fable 5.2 high | 73.8% | $0.46 | 11,476 | 1.9 |
| Fable 5.2 xhigh | 75.8% | $0.88 | 21,754 | 3.8 |
| Fable 5.2 max | 80.2% | $1.73 | 43,214 | 7.2 |
| Fable 5.1 low | 37.4% | $0.20 | 3,932 | 0.8 |
| Fable 5.1 medium | 45.0% | $0.46 | 9,177 | 1.8 |
| Fable 5.1 high | 50.4% | $0.91 | 18,192 | 3.6 |
| Fable 5.1 xhigh | 58.8% | $1.87 | 37,696 | 7.2 |
| Fable 5.1 max | 60.1% | $2.77 | 55,712 | 10.5 |
| Opus 5.5 low | 41.7% | $0.04 | 1,586 | 0.3 |
| Opus 5.5 medium | 51.4% | $0.13 | 6,312 | 1.0 |
| Opus 5.5 high | 55.6% | $0.19 | 9,493 | 1.5 |
| Opus 5.5 xhigh | 64.0% | $0.47 | 23,302 | 3.5 |
| Opus 5.5 max | 67.9% | $1.20 | 59,682 | 8.8 |
| Sonnet 5.5 low | 20.6% | $0.01 | 1,358 | 0.2 |
| Sonnet 5.5 medium | 23.8% | $0.03 | 3,134 | 0.4 |
| Sonnet 5.5 high | 33.8% | $0.11 | 10,546 | 1.2 |
| Sonnet 5.5 xhigh | 44.1% | $0.25 | 24,492 | 2.9 |
| Sonnet 5.5 max | 53.3% | $0.80 | 80,244 | 9.7 |

## AA-Omniscience (AA per-evaluation score and cost per task)

| config | score | cost/task | output tokens/task | time/task (min) |
|---|---|---|---|---|
| Fable 5.2 low | 63 | $0.01 | 309 | 0.1 |
| Fable 5.2 medium | 64 | $0.02 | 349 | 0.1 |
| Fable 5.2 high | 64 | $0.02 | 455 | 0.1 |
| Fable 5.2 xhigh | 65 | $0.03 | 781 | 0.1 |
| Fable 5.2 max | 67 | $0.22 | 5,440 | 0.9 |
| Fable 5.1 low | 34 | $0.01 | 126 | 0.0 |
| Fable 5.1 medium | 36 | $0.02 | 286 | 0.1 |
| Fable 5.1 high | 40 | $0.02 | 433 | 0.1 |
| Fable 5.1 xhigh | 44 | $0.09 | 1,786 | 0.3 |
| Fable 5.1 max | 46 | $0.33 | 6,505 | 1.2 |
| Opus 5.5 low | 39 | $0.01 | 279 | 0.0 |
| Opus 5.5 medium | 40 | $0.01 | 377 | 0.1 |
| Opus 5.5 high | 42 | $0.01 | 430 | 0.1 |
| Opus 5.5 xhigh | 43 | $0.01 | 703 | 0.1 |
| Opus 5.5 max | 48 | $0.19 | 9,329 | 1.4 |
| Sonnet 5.5 low | 20 | $0.00 | 256 | 0.0 |
| Sonnet 5.5 medium | 19 | $0.00 | 277 | 0.0 |
| Sonnet 5.5 high | 19 | $0.01 | 533 | 0.1 |
| Sonnet 5.5 xhigh | 21 | $0.01 | 848 | 0.1 |
| Sonnet 5.5 max | 30 | $0.15 | 15,148 | 1.8 |

## GDP.pdf (AA per-evaluation score and cost per task)

| config | score | cost/task | output tokens/task | time/task (min) |
|---|---|---|---|---|
| Fable 5.2 low | 26.8% | $1.53 | 3,153 | 0.5 |
| Fable 5.2 medium | 23.8% | $1.56 | 3,782 | 0.7 |
| Fable 5.2 high | 21.8% | $1.64 | 5,964 | 1.0 |
| Fable 5.2 xhigh | 21.4% | $1.85 | 11,092 | 1.9 |
| Fable 5.2 max | 24.2% | $2.52 | 27,840 | 4.6 |
| Fable 5.1 low | 28.0% | $1.91 | 3,537 | 0.7 |
| Fable 5.1 medium | 26.8% | $1.95 | 4,280 | 0.8 |
| Fable 5.1 high | 26.8% | $2.00 | 5,530 | 1.1 |
| Fable 5.1 xhigh | 26.2% | $2.31 | 11,580 | 2.2 |
| Fable 5.1 max | 26.2% | $2.76 | 20,389 | 3.9 |
| Opus 5.5 low | 25.6% | $0.76 | 2,902 | 0.5 |
| Opus 5.5 medium | 25.6% | $0.80 | 4,462 | 0.7 |
| Opus 5.5 high | 28.8% | $0.83 | 5,967 | 0.9 |
| Opus 5.5 xhigh | 26.6% | $0.96 | 12,910 | 1.9 |
| Opus 5.5 max | 26.2% | $1.55 | 42,319 | 6.2 |
| Sonnet 5.5 low | 16.0% | $0.37 | 1,928 | 0.2 |
| Sonnet 5.5 medium | 20.2% | $0.38 | 2,839 | 0.4 |
| Sonnet 5.5 high | 25.2% | $0.41 | 5,556 | 0.6 |
| Sonnet 5.5 xhigh | 24.6% | $0.46 | 10,709 | 1.3 |
| Sonnet 5.5 max | 25.8% | $0.79 | 44,189 | 5.4 |

## Output speed and time per task

| effort | Fable 5.1 tok/s | Fable 5.2 tok/s | Fable 5.1 min/task | Fable 5.2 min/task |
|---|---|---|---|---|
| low | 84 | 102 | 7.5 | 5.9 |
| medium | 85 | 93 | 9.6 | 7.7 |
| high | 84 | 100 | 13.1 | 16.3 |
| xhigh | 88 | 96 | 18.4 | 28.0 |
| max | 88 | 101 | 22.3 | 45.3 |

## Model-ID swaps with effort left unset

API default effort: Fable 5.1 high, Fable 5.2 high, Opus 5.5 medium (platform docs).
Claude Code / apps default: Fable 5.2 medium, Opus 5.5 medium (Claude Code model-config docs).

| swap | index | cost/task | cost change | time/task (min) |
|---|---|---|---|---|
| API: Fable 5.1 (high) -> Fable 5.2 (high) | 47.2 -> 61.8 | $7.54 -> $9.08 | +20% | 13.1 -> 16.3 |
| API: Opus 5.5 (medium) -> Fable 5.2 (high) | 48.2 -> 61.8 | $2.45 -> $9.08 | +270% | 7.0 -> 16.3 |
| Claude Code: Opus 5.5 (medium) -> Fable 5.2 (medium) | 48.2 -> 56.4 | $2.45 -> $3.80 | +55% | 7.0 -> 7.7 |
| Explicit: Opus 5.5 high -> Fable 5.2 low | 51.8 -> 53.9 | $3.46 -> $3.10 | -11% | 9.5 -> 5.9 |
| Explicit: Opus 5.5 xhigh -> Fable 5.2 medium | 57.4 -> 56.4 | $6.05 -> $3.80 | -37% | 15.6 -> 7.7 |
| Explicit: Opus 5.5 max -> Fable 5.2 high | 59.1 -> 61.8 | $10.04 -> $9.08 | -10% | 25.4 -> 16.3 |
| Explicit: Fable 5.1 xhigh -> Fable 5.2 low | 50.0 -> 53.9 | $10.85 -> $3.10 | -71% | 18.4 -> 5.9 |

# modern-web-guidance experiment summary

Setup (2026-11-14): Claude Code 2.1.325, `claude -p --model claude-opus-5-5 --setting-sources project,local`,
fresh copy of fixture/ per run. base = no skill. skill = SKILL.md from GoogleChrome/modern-web-guidance v1.0.0 (4dd9683)
placed in the workspace's .claude/skills/, CLI fetched via `npx -y modern-web-guidance@latest` (1.0.0), DISABLE_TELEMETRY=1.
4 English tasks x 2 conditions x 3 runs = 24 runs, plus t1 in Korean x skill x 2 runs. Pattern hits = regex matches over
the resulting index.html/style.css/app.js (see analyze.py); they show which APIs appear, not whether the UI works.
No browser testing was done. Cost = total_cost_usd reported by Claude Code (list price).

| run | skill tool | CLI calls | retrieved guides | sec | cost USD | input tok (incl. cache) | output tok | +JS lines | +CSS lines | +HTML lines |
|---|---|---|---|---|---|---|---|---|---|---|
| t1-delete-confirm-base-1 | False | 0 |  | 44 | 0.183 | 111,386 | 3,343 | 25 | 9 | 11 |
| t1-delete-confirm-base-2 | False | 0 |  | 45 | 0.189 | 111,622 | 3,503 | 26 | 11 | 11 |
| t1-delete-confirm-base-3 | False | 0 |  | 45 | 0.182 | 111,399 | 3,284 | 31 | 11 | 11 |
| t1-delete-confirm-skill-1 | True | 2 | dialog, platform-controls-dismiss-dialog | 39 | 0.263 | 138,545 | 2,993 | 14 | 10 | 9 |
| t1-delete-confirm-skill-2 | True | 2 |  | 46 | 0.214 | 125,000 | 3,193 | 15 | 10 | 11 |
| t1-delete-confirm-skill-3 | True | 2 | dialog, platform-controls-dismiss-dialog | 58 | 0.248 | 137,986 | 2,597 | 14 | 8 | 9 |
| t1ko-delete-confirm-skill-1 | True | 2 | dialog | 33 | 0.270 | 135,603 | 3,619 | 15 | 11 | 9 |
| t1ko-delete-confirm-skill-2 | True | 2 | dialog, platform-controls-dismiss-dialog | 32 | 0.273 | 173,108 | 3,280 | 15 | 11 | 9 |
| t2-help-tooltip-base-1 | False | 0 |  | 50 | 0.210 | 156,938 | 4,012 | 51 | 3 | 1 |
| t2-help-tooltip-base-2 | False | 0 |  | 63 | 0.257 | 187,486 | 5,457 | 64 | 6 | 2 |
| t2-help-tooltip-base-3 | False | 0 |  | 63 | 0.266 | 163,897 | 5,795 | 29 | 20 | 6 |
| t2-help-tooltip-skill-1 | True | 3 | interest-triggered-tooltips | 96 | 0.399 | 249,158 | 6,799 | 58 | 23 | 16 |
| t2-help-tooltip-skill-2 | True | 2 |  | 68 | 0.268 | 156,724 | 4,915 | 23 | 27 | 3 |
| t2-help-tooltip-skill-3 | True | 2 | interest-triggered-tooltips, position-aware-tooltips | 98 | 0.417 | 277,072 | 6,303 | 52 | 27 | 27 |
| t3-form-errors-base-1 | False | 0 |  | 56 | 0.230 | 160,880 | 4,390 | 63 | 1 | 3 |
| t3-form-errors-base-2 | False | 0 |  | 49 | 0.240 | 188,120 | 4,507 | 64 | 1 | 3 |
| t3-form-errors-base-3 | False | 0 |  | 52 | 0.249 | 189,368 | 4,934 | 57 | 1 | 3 |
| t3-form-errors-skill-1 | True | 2 | validate-input-after-interaction, accessible-error-announcement, required-field-feedback | 87 | 0.470 | 248,609 | 5,892 | 79 | 9 | 9 |
| t3-form-errors-skill-2 | True | 2 | validate-input-after-interaction, required-field-feedback, accessible-error-announcement | 104 | 0.551 | 403,156 | 7,309 | 83 | 10 | 9 |
| t3-form-errors-skill-3 | True | 2 | validate-input-after-interaction, accessible-error-announcement, required-field-feedback | 88 | 0.493 | 343,846 | 6,091 | 64 | 10 | 3 |
| t4-dark-mode-base-1 | False | 0 |  | 57 | 0.230 | 134,119 | 4,799 | 39 | 69 | 14 |
| t4-dark-mode-base-2 | False | 0 |  | 59 | 0.243 | 187,227 | 4,972 | 39 | 24 | 8 |
| t4-dark-mode-base-3 | False | 0 |  | 70 | 0.280 | 165,077 | 6,454 | 47 | 56 | 14 |
| t4-dark-mode-skill-1 | True | 2 | dark-mode-toggle, dark-mode | 103 | 0.436 | 190,561 | 8,026 | 32 | 69 | 12 |
| t4-dark-mode-skill-2 | True | 2 | dark-mode-toggle, dark-mode, color | 103 | 0.487 | 320,205 | 7,859 | 32 | 75 | 13 |
| t4-dark-mode-skill-3 | True | 2 | dark-mode-toggle, dark-mode | 103 | 0.442 | 230,894 | 7,926 | 35 | 93 | 12 |

## t1: pattern hits (number of runs with >=1 match, out of n)

| pattern | base (n=3) | skill (n=3) |
|---|---|---|
| <dialog> | 3 | 3 |
| showModal() | 3 | 3 |
| command/commandfor | 0 | 0 |
| window.confirm() | 0 | 0 |
| role=dialog/alertdialog | 0 | 0 |
| aria-modal | 0 | 0 |
| manual Tab focus trap | 0 | 0 |
| manual Escape handler | 0 | 0 |
| autofocus on Cancel | 3 | 3 |
| returnValue | 3 | 3 |
| ::backdrop | 3 | 3 |
| overscroll-behavior | 0 | 2 |
| body overflow lock | 0 | 0 |
| custom overlay div | 0 | 0 |

## t1ko: pattern hits (number of runs with >=1 match, out of n)

| pattern | base (n=0) | skill (n=2) |
|---|---|---|
| <dialog> | 0 | 2 |
| showModal() | 0 | 2 |
| command/commandfor | 0 | 0 |
| window.confirm() | 0 | 0 |
| role=dialog/alertdialog | 0 | 0 |
| aria-modal | 0 | 0 |
| manual Tab focus trap | 0 | 0 |
| manual Escape handler | 0 | 0 |
| autofocus on Cancel | 0 | 2 |
| returnValue | 0 | 2 |
| ::backdrop | 0 | 2 |
| overscroll-behavior | 0 | 2 |
| body overflow lock | 0 | 0 |
| custom overlay div | 0 | 0 |

## t2: pattern hits (number of runs with >=1 match, out of n)

| pattern | base (n=3) | skill (n=3) |
|---|---|---|
| popover attr | 0 | 2 |
| interestfor | 0 | 2 |
| anchor-name | 0 | 2 |
| position-anchor | 0 | 2 |
| position-area / anchor() | 0 | 2 |
| position-try(-fallbacks) | 0 | 2 |
| role=tooltip | 3 | 1 |
| aria-describedby | 3 | 3 |
| getBoundingClientRect (JS positioning) | 3 | 1 |
| JS hover/focus listeners | 3 | 1 |
| CSS :hover/:focus show | 3 | 3 |
| Escape dismiss | 3 | 1 |

## t3: pattern hits (number of runs with >=1 match, out of n)

| pattern | base (n=3) | skill (n=3) |
|---|---|---|
| :user-invalid | 0 | 3 |
| :invalid (still used) | 1 | 3 |
| touched/dirty class or flag | 3 | 3 |
| blur listener | 3 | 3 |
| setCustomValidity | 3 | 0 |
| validationMessage / validity | 3 | 3 |
| aria-invalid | 3 | 3 |
| aria-describedby | 3 | 3 |
| aria-live / role=alert | 2 | 3 |
| novalidate kept | 3 | 3 |

## t4: pattern hits (number of runs with >=1 match, out of n)

| pattern | base (n=3) | skill (n=3) |
|---|---|---|
| color-scheme property/meta | 3 | 3 |
| light-dark() | 1 | 3 |
| prefers-color-scheme | 2 | 3 |
| matchMedia in JS | 0 | 0 |
| data-theme / class toggle | 3 | 0 |
| localStorage | 3 | 3 |
| inline head script (no flash) | 0 | 0 |
| radio/select control | 0 | 3 |
| aria-pressed | 1 | 0 |

## averages by condition

| task | cond | n | avg sec | avg cost USD | avg input tok | avg +JS lines | avg +CSS lines |
|---|---|---|---|---|---|---|---|
| t1 | base | 3 | 45 | 0.184 | 111,469 | 27.3 | 10.3 |
| t1 | skill | 3 | 48 | 0.242 | 133,844 | 14.3 | 9.3 |
| t1ko | skill | 2 | 32 | 0.271 | 154,356 | 15.0 | 11.0 |
| t2 | base | 3 | 59 | 0.244 | 169,440 | 48.0 | 9.7 |
| t2 | skill | 3 | 87 | 0.361 | 227,651 | 44.3 | 25.7 |
| t3 | base | 3 | 52 | 0.240 | 179,456 | 61.3 | 1.0 |
| t3 | skill | 3 | 93 | 0.504 | 331,870 | 75.3 | 9.7 |
| t4 | base | 3 | 62 | 0.251 | 162,141 | 41.7 | 49.7 |
| t4 | skill | 3 | 103 | 0.455 | 247,220 | 33.0 | 79.0 |

## search queries issued (skill runs)

- t1-delete-confirm-skill-1: confirmation modal dialog
- t1-delete-confirm-skill-2: confirmation modal dialog; confirmation modal dialog
- t1-delete-confirm-skill-3: confirmation modal dialog
- t1ko-delete-confirm-skill-1: confirmation modal dialog
- t1ko-delete-confirm-skill-2: confirmation modal dialog
- t2-help-tooltip-skill-1: hover tooltip; hover tooltip
- t2-help-tooltip-skill-2: hover tooltip popover; hover tooltip popover
- t2-help-tooltip-skill-3: tooltip on hover and focus
- t3-form-errors-skill-1: form validation error messages
- t3-form-errors-skill-2: form validation error messages
- t3-form-errors-skill-3: show validation errors after interaction
- t4-dark-mode-skill-1: dark mode theme toggle
- t4-dark-mode-skill-2: dark mode theme toggle
- t4-dark-mode-skill-3: dark mode theme toggle

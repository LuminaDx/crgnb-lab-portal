# CR-GNB laboratory testing program — development concept

Static site for a controlled Australian public-hospital program supporting susceptibility testing of carbapenem-resistant Gram-negatives.

## What it does
- Healthcare-professional gate (tick + registration number format check)
- Education page on disk diffusion and confirmatory MIC
- Hospital code that unlocks tiered ordering (discs only, or discs + MIC)
- Order form with quantity limits; confirmation shown on screen
- Email hand-off ready (Formspree placeholder in `js/app.js`)

## Demo codes (this build)
- `DISC-DEMO` — discs only
- `FULL-DEMO` — discs + confirmatory MIC option

No passwords. Gate is browser-local only.

## Pages
- `index.html` — HCP gate
- `education.html` — testing methods
- `order.html` — code + order form

## Deploy
Cloudflare Pages from the GitHub repo (framework: None, output: root).

Replace `YOUR_FORMSPREE_ID` in `js/app.js` when an inbox is ready.

# ClearBid — Procurement Integrity Prototype

**Hackathon submission — Smart Governance & Compliance track**
Problem 2: auditing procurement activity to surface cases that deserve human
investigation, without assuming every change or every unusual price is
misconduct.

**Live demo:** _add your Vercel URL here after deploying_
**One-line pitch:** ClearBid doesn't hunt for outliers against a global
average — it builds a peer group for every tender first, then ranks cases by
how many independent signals corroborate, how much money is at stake, and
whether a benign explanation already accounts for the anomaly.

---

## The problem this addresses

Government procurement generates huge volumes of tenders, bids, and awards.
Most are legitimate. Unusual bidding behavior, repeated awards, or vendor
relationships can be real signals of collusion — or they can be exactly what
a specialized, thin market looks like. The hard part isn't finding things
that look unusual; it's telling the two apart, and pointing a small
investigative team at the handful of cases where review is actually worth
their time.

## How it works

1. **Peer group first.** Every tender is compared against other tenders in
   its own category — not a global average. A single realistic supplier in a
   specialist category isn't treated like an outlier in a competitive one.
2. **Four independent detectors**, each producing its own evidence:
   - **Bid rotation** — a small pool of bidders keeps winning within the same
     buyer/category, alternating in a closed loop.
   - **Cover bidding** — losing bids cluster tightly just above the winner
     instead of spreading naturally.
   - **Shell / shared-director linkage** — bidders that appear to compete
     resolve to the same director or entity.
   - **Peer-grouped price deviation** — award price vs. the category median,
     using a robust (median/MAD) z-score so a few extreme prices can't skew
     the baseline.
3. **A priority score**, not a raw anomaly score:

   ```
   priority = signal strength × corroboration × materiality × (1 − benign explanation)
   ```

   A case only reaches the top of the queue when multiple signals agree
   *and* real money is at stake. A benign explanation on file (a thin
   market, a low-value contract) discounts the score — and the discount is
   shown, not hidden.
4. **The investigation queue.** Cases are ranked, not just flagged. Above a
   rank-based cutoff (top 20 in this build) a case is marked "flagged for
   review"; everything is still visible and explorable below that line.

## What's actually built vs. what's pitched

This is a hackathon prototype, and it's worth being direct about the line
between the two, because a judge will ask:

**Built and working:**
- Synthetic procurement market: 60 vendors, 300 tenders, 3 planted collusion
  rings, generated client-side with a fixed seed (so results are
  reproducible and precision/recall can be measured against a known ground
  truth).
- All four detectors above, plus the combined priority score, computed live
  in the browser — nothing in the UI is hardcoded.
- A case detail view: evidence breakdown, a bidder-relationship graph (SVG,
  built from the actual bid data), and a peer-price comparison chart.
- Precision @ top-10 / top-20 / top-40, computed live each run.

**Pitched but not yet built:**
- Additional detectors described in the design doc: threshold bunching
  (contract splitting near approval limits), tender-window compression,
  vendor lifecycle analysis, amendment drift.
- **Spec fingerprinting** — matching tender specifications against vendor
  product sheets to catch specs written for a specific vendor. This is an
  LLM-driven feature and the biggest differentiator in the original pitch;
  it isn't implemented in this build.
- Any LLM usage at all — case-narrative generation and natural-language
  graph queries are concepts in the pitch deck, not code here.
- Real data ingestion (OCDS format, e.g. India's GeM/CPPP, Ukraine's
  ProZorro). The generator is a clearly-labeled stand-in.
- Persistence — every page load regenerates the same market from the fixed
  seed; there's no backend, no database, no "mark as reviewed" state that
  survives a refresh.
- Search, filtering, or manual sort in the queue beyond the fixed priority
  ranking.

## Tech stack

- **React + Vite** — client-only, no backend
- **Tailwind CSS** — styling
- **Recharts** — precision chart, peer-price scatter
- Hand-rolled SVG — the bidder-relationship graph (no graph library needed
  at this scale)
- Seeded PRNG (`mulberry32`) — deterministic synthetic data, so the same
  market and the same "ground truth" appear on every load

No API keys, no environment variables, no external services.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Deploy to Vercel

```bash
git init
git add .
git commit -m "ClearBid prototype"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Then import the repo at [vercel.com/new](https://vercel.com/new). Vercel
auto-detects Vite — default build command (`npm run build`) and output
directory (`dist`) both work as-is. Click Deploy.

## Project structure

```
src/
  lib/
    rng.js            seeded PRNG
    generateData.js   synthetic vendors, tenders, bids + planted cartels
    detectors.js      the four detectors + priority scoring + precision@k
    format.js         currency/percentage formatting
  components/
    Header.jsx
    StatsBar.jsx        top-line stats + precision chart
    CaseQueue.jsx       ranked investigation queue (left pane)
    CaseDetail.jsx      evidence, graph, peer chart (right pane)
    EvidenceBar.jsx
    NetworkGraph.jsx    SVG bidder-relationship graph
    PeerChart.jsx
    Methodology.jsx     the "how this works" explainer section
  App.jsx
```

To point this at real data, replace `generateMarket()` in
`src/lib/generateData.js` with a loader that returns the same shape
(`vendors`, `tenders`, `bids`) from an OCDS feed or similar — the detectors
and UI don't need to change.

## Demo script

1. Open on the investigation queue — point out the precision-at-K numbers in
   the stats bar are computed live, not hardcoded.
2. Click a top-ranked case that's a confirmed planted cartel — walk through
   the evidence bars and the bidder graph, showing the dashed red line
   between two "competing" bidders that share a director.
3. Click a case further down the queue with a benign-explanation callout —
   show that the system explains why it discounted the score instead of
   silently dropping it.
4. Open a false positive near the top of the queue (there's usually one) —
   this is the strongest moment in the demo: showing what a wrong flag
   looks like, and that an investigator could dismiss it in seconds from
   the evidence shown.

## Disclaimer

All data in this prototype is synthetically generated with a fixed random
seed. No real vendor, buyer, contract, or government official is
represented. "Ground truth" labels exist only because the collusion rings
were deliberately planted for evaluation purposes.

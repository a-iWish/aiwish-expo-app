# a.iwish — Product Roadmap Proposal

> **Date:** 2026-06-27
> **Scope:** App UX/UI, ML model, data pipeline
> **Repos:** aiwish-expo-app, aiwish-api, aiwish-ml

---

## Where We Are Today

| Area | Status |
|---|---|
| **Products** | 80 tracked across 4 categories (Audio, Baby, Home Tech, +1) |
| **Data sources** | Keepa (Amazon, 18+ months, 12 series) + SerpAPI/Google Shopping (~4.5 months, Walmart/Target/Best Buy) |
| **Model (prod)** | v2 — XGBoost, 45 features, 30-day fixed horizon, 5-tier cascade. BUY 87% / WAIT 88% precision. 56% abstain rate delegated to heuristics |
| **Model (branch)** | v3 — deadline-aware window model on `model-v3`. Horizon `k` as a feature. Massive short-horizon gains (MAE -58% at k=3) |
| **App** | Discover, Watchlist (server-side), Product Detail (verdict-first), Settings. Full auth system. No notifications, no social, no onboarding |
| **API** | Read-only on product data. Auth + wishlist writes. No background jobs, no push, no caching layer |

---

## Part 1 — App UX/UI

### 1.1 Social & Gifting (New Surface)

| Feature | Description | Effort | Impact |
|---|---|---|---|
| **Shared Wishlists** | Add `is_public` flag + shareable deep link to wishlist. Recipients see items without prices by default ("Gift Mode" toggle hides amounts). "Mark as bought" button prevents duplicates | Medium | High — viral loop + solves real gifting pain |
| **Friend Connections** | Follow users by email invite or link. New "Friends' Wishes" section in Watchlist tab shows what people in your circle are watching | Medium | Medium — retention + social proof |
| **Gift Occasions** | Tag wishlist items with occasion (Birthday, Christmas, etc.). Surface: "Sarah's birthday is in 2 weeks — 3 items on her list are BUY right now" | Low | Medium — timely engagement trigger |
| **Collaborative Lists** | Multiple users contribute to one list ("New Apartment", "Baby Registry"). Shared ownership with invite codes | Medium | Medium — group purchasing use case |

**Schema changes:** `wishlist_items` gets `is_public`, `occasion`, `marked_bought_by`. New `user_follows` table. New `shared_lists` + `shared_list_members` tables.

### 1.2 Price Intelligence UX

| Feature | Description | Effort | Impact |
|---|---|---|---|
| **Price Drop Notifications** | Push notifications when a watched product drops below saved price or hits a BUY verdict. The `saved_price` column already exists on `wishlist_items` — nothing fires on it today | High (needs Expo Push + background job) | **Critical** — #1 missing feature |
| **Forecast Overlay on Chart** | The API already returns `forecast: [{date, price, lower, upper}]`. Render it as a dashed line + confidence band on the History tab chart. With v3: let user set a deadline and see the expected best price by that date | Low (data exists) | High — "see the future" moment, core value prop |
| **Deadline Picker** | "I need this by [date]". Powered by v3's window model — the deadline becomes a model input, not a heuristic. Shows personalized verdict: "No meaningful drop is reachable within 5 days — buy now" | Medium | High — differentiator, ties into v3 |
| **Deal Score Gauge** | "Better than 73% of prices in the last year" — simple percentile visualization. Data exists (`deal_pct`, price percentile from Keepa stats) | Low | Medium — more intuitive than raw numbers |
| **True Cost Comparison** | Retailers tab shows sticker price only. SerpAPI Google Product endpoint returns `extracted_total` (price + tax + shipping). Show out-of-pocket cost per retailer | Medium | Medium — real purchase decision data |
| **"Best Time to Buy" Calendar** | Heat-map calendar using historical seasonality. "This category drops 18% in November on average." Model already has holiday features (Black Friday, Prime Day, Cyber Monday) | Medium | Medium — educational, builds trust |

### 1.3 Discovery & Engagement

| Feature | Description | Effort | Impact |
|---|---|---|---|
| **"Deals Right Now" Feed** | Dedicated feed: products where verdict = BUY, confidence > 80%, price near 90-day low. More aggressive filter than current "Best picks" sort | Low | High — immediate actionability |
| **Advanced Filters** | Price range slider, confidence threshold, verdict filter (show only BUY), brand filter. All data already in the product list response | Low | Medium |
| **Product Comparison** | Select 2-3 products, see them side by side: price, verdict, trend, chart overlay | Medium | Medium — "AirPods vs Sony XM5" |
| **Search by URL / Barcode** | Paste Amazon/Walmart URL or scan UPC/EAN. Keepa API supports lookup by UPC/EAN. Bridges in-store to "should I buy now?" | Medium | High — acquisition channel |
| **Recently Viewed** | Lightweight `AsyncStorage` list of last 20 viewed product IDs. "Continue browsing" row on Discover | Low | Low-Medium — standard retention pattern |
| **Search History** | Persist recent search queries, show as suggestions | Low | Low |

### 1.4 Onboarding & Retention

| Feature | Description | Effort | Impact |
|---|---|---|---|
| **First-Run Walkthrough** | 3 screens: "We track prices across 5 retailers" → "Our AI tells you when to buy" → "Save items and get alerts". Currently boots straight to Discover with zero context | Low | Medium — sets expectations, improves activation |
| **Savings Dashboard** | "You've saved $X by following our recommendations." Track when user acts on BUY, record price, show delta vs peak. Gamifies value | Medium | High — retention + word-of-mouth |
| **Weekly Digest** | Email or in-app: "3 watched items dropped this week. 1 is at its lowest in 90 days." | Medium (needs email infra) | Medium — re-engagement without spam |
| **Personalized Categories** | Track which categories user browses/saves most, surface those first on Discover | Low | Low-Medium |

---

## Part 2 — ML Model

### 2.1 Ship v3 (Deadline-Aware Window Model)

**Status:** Trained and prototyped on `model-v3` branch. Not deployed.

**What it does:** Replaces v2's separate drop + days-to-min regressions with ONE model where the user's deadline `k` is a feature. Predicts "best achievable drop within `k` days."

**Results vs v2 baseline:**

| Deadline | v3 MAE | v2 MAE | Improvement | BUY precision @ coverage |
|---|---|---|---|---|
| 3 days | 0.032 | 0.074 | **-58%** | 95.6% @ 79% |
| 7 days | 0.042 | 0.068 | **-38%** | 93.5% @ 64% |
| 14 days | 0.051 | 0.063 | -20% | 91.6% @ 50% |
| 30 days | 0.061 | 0.061 | -2% | 87.5% @ 31% |

**Action items:**
1. Merge `model-v3` → `main`
2. Run `run_keepa_predictions_v3.py` in production (writes 4 rows/product, one per horizon)
3. Wire API: `GET /products/{id}/prediction?deadline=` picks nearest horizon row
4. Wire app: deadline picker UI → passes `deadline` param to API

**Known trade-off:** WAIT at k=30 is weaker than v2 (66% vs 88% precision). Options: keep v2's dedicated 30-day WAIT calibration as a fallback, or train a horizon-weighted loss.

### 2.2 New Features from Keepa API (Not Yet Extracted)

We collect 12 Keepa series but the API exposes much more. These are available at no additional API cost (included in the product response):

**High-signal additions:**

| Feature | Keepa Field | Expected Impact |
|---|---|---|
| Buy Box ownership % | `buyBoxStatsAmazon30/90/365` | When Amazon holds the buy box, prices are more stable. Seller rotation predicts volatility |
| Out-of-stock frequency | `outOfStockPercentage30/90`, `outOfStockCountAmazon30/90` | Stock-outs precede price spikes — strong WAIT→BUY transition signal |
| Offer count history | CSV types 11-14 (COUNT_NEW, COUNT_USED, COUNT_NEW_FBA/FBM as time series) | Competition trajectory, not just current snapshot. More sellers = prices fall |
| Monthly sold history | `monthlySoldHistory[]` time series | Trend (accelerating/decelerating) is stronger than the current snapshot |
| Lightning deal history | `lightningDealInfo[]`, CSV type 8 | Products with deal history have cyclical patterns. Predicts future deal eligibility |
| Warehouse deals | CSV type 9 | Amazon Warehouse prices signal inventory pressure, create a price ceiling |
| MAP restrictions | `newPriceIsMAP` | Hard price floor — model should know it can't drop further |
| Coupon/promo history | `couponHistory[]`, `promotions[]` | Coupon removal often precedes permanent price drops |
| Stock levels | `stockAmazon`, `stockPerCondition3rdFBA[]` | Low stock → price increases |
| Longer averages | `avg180`, `avg365` | Better mean-reversion calibration beyond current 30d/90d windows |

**Implementation:** Extend `keepa_features_v2.py` to extract these from `price_history_json` and the stats object. Retrain v3 with the enriched feature set.

### 2.3 Model Infrastructure

| Improvement | Description | Effort |
|---|---|---|
| **Auto-retrain pipeline** | Currently manual notebooks. Schedule weekly/monthly retrain job that writes new artifacts + thresholds | Medium |
| **Per-category analysis** | Do headphones predict better than baby products? Category-specific thresholds or separate models | Low |
| **Confidence calibration** | Replace hard-coded gates with Platt scaling or isotonic regression for calibrated probabilities | Low |
| **Error dashboard** | Monitor prediction quality in production: track how often BUY/WAIT calls were correct after the fact | Medium |
| **SerpAPI ensemble (Phase 2)** | Tier 3 is currently heuristic-based. At ~6 months of SerpAPI data (we're at ~4.5), train a proper cross-retailer model | Medium (blocked until ~Aug 2026) |

---

## Part 3 — Data Collection & Pipeline

### 3.1 SerpAPI Optimization

**Current approach:** Querying per retailer separately.
**Recommended:** Switch to these more efficient endpoints:

| Endpoint | Benefit |
|---|---|
| **Google Immersive Product** (`google_immersive_product`) | Groups same product across 3-13 retailers in ONE call. More data, fewer API calls |
| **`multiple_sources`** field in Google Shopping | Already in responses, likely not parsed. Free competitive data within existing calls |
| **Google Product `online_sellers`** | Full seller list with `extracted_total` (price + tax + shipping) — true out-of-pocket cost |

**Cost savings:**
- Current: 80 products × 5 retailers × 4/day ≈ **48,000 calls/month**
- With Immersive Product: 80 × 1 call × 2/day ≈ **4,800/month** (5-13 retailers per call)
- Savings: ~$200/month on SerpAPI plan, better data

### 3.2 New Data Points to Collect

| Data | Source | Use |
|---|---|---|
| `typical_prices.low/high` | Google Product API | Google's computed price range — external benchmark for "is this a good deal?" |
| `in_stock` / availability | Walmart Product API, Google Shopping | Stock status changes as a feature + show in app |
| Badges ("Best Seller", "Amazon's Choice") | Google Shopping | Demand signals — badge presence correlates with price stability |
| Seller count over time | `multiple_sources` count | Competition trajectory across retailers |
| Product specs + GTIN | Google Product `specs_results` | GTIN-based cross-retailer matching could close the gap on 10 unmapped products |
| `price_map.was_price` | Walmart Product API | Walmart's own "was" price — historical price signal |

### 3.3 Keepa API Capabilities Not Yet Used

| Endpoint | What It Gives Us |
|---|---|
| **Deals** (`/deal`) | Products with recent price/rank changes. Could power the "Deals Right Now" feed without waiting for our model |
| **Lightning Deals** (`/lightningdeal`) | All current/upcoming lightning deals, updated every 10 min. Real-time deal alerts |
| **Tracking + Webhooks** | Keepa can push price alerts to a webhook URL. Could supplement our own notification system at no additional polling cost |
| **Best Sellers** (`/bestsellers`) | ASIN list of top products by category. Could inform product discovery and catalog expansion |
| **Product Finder** (`/query`) | 200+ filter fields for finding products. Could power "search by URL/barcode" and catalog expansion |

---

## Prioritized Roadmap

### Phase 1 — Quick Wins (1-2 weeks)

1. **Ship v3 model** — merge `model-v3`, deploy runner, wire API `?deadline=` param
2. **Forecast overlay on chart** — data exists, just wire `forecast[]` to the chart component
3. **"Deals Right Now" feed** — filter existing product list by BUY + high confidence
4. **Advanced filters** — price range, verdict filter, brand. Data already in API response
5. **First-run walkthrough** — 3 static screens, low effort
6. **Recently viewed** — AsyncStorage, no backend needed

### Phase 2 — Core Value (2-4 weeks)

7. **Deadline picker** — the v3 UI. "I need this by [date]" → personalized verdict
8. **Price drop push notifications** — Expo Push + background job + threshold on `saved_price`
9. **Shared wishlists / Gift Mode** — `is_public` flag, shareable link, "Mark as bought"
10. **SerpAPI → Google Immersive Product migration** — fewer calls, better data, lower cost
11. **Keepa feature enrichment** — Buy Box, out-of-stock, offer count history → retrain v3
12. **True cost comparison** — tax + shipping per retailer on the Retailers tab

### Phase 3 — Growth (4-8 weeks)

13. **Friend connections** — follow by email, "Friends' Wishes" section
14. **Savings dashboard** — "You've saved $X following our advice"
15. **Weekly digest emails** — "3 items dropped, 1 at lowest in 90 days"
16. **Gift occasions** — tag items, timely prompts
17. **Search by URL / Barcode** — Keepa UPC/EAN lookup, bridges in-store to app
18. **Auto-retrain pipeline** — scheduled weekly retrain job
19. **Best Time to Buy calendar** — seasonal heat-map per category

### Phase 4 — Polish & Scale (8+ weeks)

20. **Collaborative lists** — multi-user lists with invite codes
21. **Product comparison view** — side-by-side 2-3 products
22. **SerpAPI ensemble model** — proper ML on cross-retailer data (needs ~6 months history)
23. **Per-category models** — category-specific thresholds or separate models
24. **Error dashboard** — track prediction accuracy in production
25. **Catalog expansion** — more products via Keepa Product Finder + Best Sellers
26. **Keepa webhook alerts** — push-based price monitoring, no polling needed

---

## Key Metrics to Track

| Metric | What It Measures | Target |
|---|---|---|
| Prediction precision (BUY/WAIT) | Model quality | >85% on confident calls |
| Abstain rate | Coverage gap | <40% (down from 56%) |
| Watchlist → notification → purchase | Conversion funnel | Baseline then optimize |
| Shared wishlist creates | Social virality | Growth indicator |
| Savings claimed | User value delivered | Retention driver |
| DAU / WAU ratio | Engagement stickiness | >30% |
| API cost per product/day | Pipeline efficiency | <$0.05 after SerpAPI migration |

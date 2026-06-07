# aiwish Expo App

AI-powered product price tracking and buy/wait/hold prediction mobile app built with Expo/React Native.

## App Identity

- **Name**: "a.iwish" — rendered via `BrandWordmark` (dotless ı U+0131 with red heart overlay)
- **Bundle ID**: `com.anonymous.aiwish`
- **Logo assets**: `assets/aiwish-logo-transparent-dark.png` (dark), `assets/aiwish-logo-transparent-light.png` (light)
- **Splash**: `assets/splash-icon.png`, dark background `#0F172A`
- **Default theme**: system appearance; override Light/Dark/System in Settings (`AIWISH_APPEARANCE`)

## Environment

```
EXPO_PUBLIC_API_URL=http://192.168.0.4:8000   # .env (not committed)
# Falls back to http://localhost:8000 if unset
```

## Stack

- **Expo** ~54 / **React Native** 0.81.5
- **Navigation**: React Navigation v7 — `createNativeStackNavigator` + `createBottomTabNavigator`
- **Data fetching**: TanStack React Query v5 with AsyncStorage persister (`AIWISH_QUERY_CACHE` key)
- **Lists**: `@shopify/flash-list` v2 — no `estimatedItemSize` prop in v2
- **Animations**: React Native Reanimated ~4.1.1 — transform + opacity only
- **Language**: TypeScript ~5.9.2
- **Images**: `Image` from `react-native` (NOT expo-image)

## Navigation Structure

```
RootStack (native stack, no header)
└── Main → MainTabs (bottom tab navigator)
    ├── Discover → ProductListScreen
    ├── Watchlist → WatchlistScreen
    └── Settings → SettingsScreen
ProductDetail (pushed full-screen over MainTabs)
```

Navigation types: `RootStackParamList`, `MainTabParamList` in `src/navigation/types.ts`.
Tab bar: custom `TabBar` component with brand gradient active indicator.

## Project Structure

```
src/
  screens/
    ProductListScreen.tsx      Main product list (FlashList, skeleton loading, category pills)
    ProductDetailScreen.tsx    Product detail (verdict first, collapsible sections, sticky footer)
    WatchlistScreen.tsx        Saved products (FlashList, empty state)
    SettingsScreen.tsx         Theme toggle + app info
  components/
    BrandWordmark.tsx          App wordmark with dotless ı + heart
    Button.tsx                 Primary + outline variants
    CollapsibleSection.tsx     Animated expand/collapse section wrapper
    InfoRow.tsx                Label + value row
    PriceChart.tsx             Retailer price chart with range fill
    PriceDisplay.tsx           Current/old price + change %
    EditorialProductRow.tsx    Typographic list row (verdict-first, 40px thumb)
    VerdictDisplay.tsx         BUY/WAIT/HOLD display typography
    SegmentedControl.tsx       Summary | History | Retailers on detail
    RecommendationBadge.tsx    BUY/WAIT/HOLD badge
    RecommendationCard.tsx     Full recommendation panel
    SkeletonCard.tsx           Loading placeholder matching ProductCard shape
    StickyFooter.tsx           Absolute-positioned CTA bar above safe area
    TabBar.tsx                 Custom bottom tab bar
  navigation/
    types.ts                   RootStackParamList, MainTabParamList
    MainTabs.tsx               Bottom tab navigator
  context/
    ThemeContext.tsx            useTheme() — isDark persisted to AsyncStorage
  hooks/
    useProducts.ts             Products list with React Query
    useProductDetail.ts        Product + prediction + retailers (parallel fetch)
    useWatchlist.ts            AsyncStorage CRUD for watchlist IDs
  services/api.ts              API client (all 7 endpoints)
  lib/queryClient.ts           TanStack Query setup + AsyncStorage persister
  styles/theme.ts              Design tokens
  types/product.ts             All TypeScript interfaces
  utils/
    priceSeriesAggregate.ts
    keepaSeriesAggregate.ts
    predictionMerge.ts         mergePredictionSummary(embedded, fromApi) — embedded wins
    lowestCurrentOffer.ts
    priceChangePercent.ts
    trustedRetailers.ts        Walmart, Best Buy, Target, Amazon, Amazon.com
    retailerChartColors.ts     Walmart #0071CE, Best Buy #0046BE, Target #CC0000, Amazon #FF9900
```

## TypeScript Interfaces (`src/types/product.ts`)

```typescript
Product {
  id, name, category, image_url, retailer,
  current_price, original_price, currency,
  discount_pct, rating, reviews_count,
  recommendation, confidence, trend,
  trusted_price, trusted_source, msrp
}

ProductDetail extends Product {
  delivery, search_position, data_points_count,
  stats: KeepaStats | null,
  prediction: PredictionSummary | null
}

KeepaStats {
  brand, rating, review_count, tracking_since,
  new_price, amazon_price, new_fba_price, used_price, list_price,
  avg_price_90d, min_price_90d, max_price_90d, deal_pct, list_discount_pct,
  is_lowest_ever, is_lowest_90d, total_offers, new_offers, used_offers,
  sales_rank, monthly_sold, rank_drops_30d, rank_drops_90d
}

PredictionSummary {
  model_name, recommendation ('buy'|'wait'|'hold'), confidence (0-100),
  trend ('falling'|'stable'|'rising'), title, body,
  savings_amount?, expected_drop_pct?, estimated_best_price?,
  estimated_wait_days?, reasons: string[]
}

PredictionResponse extends PredictionSummary {
  product_id, generated_at, horizon_days, current_price,
  forecast: ForecastPoint[]   // { date, price, lower, upper }
}

MonthlyPricePoint    { month: 'YYYY-MM', min_price, avg_price, max_price }
RetailerPriceSeries  { retailer, data: MonthlyPricePoint[] }
PriceObservationPoint { observed_at, price, retailer, currency }
```

## API Endpoints (`src/services/api.ts`)

| Function | Path | Returns |
|---|---|---|
| `fetchProducts()` | GET /api/products | `ProductListResponse` |
| `fetchProduct(id)` | GET /api/products/:id | `ProductDetail` |
| `fetchPriceHistory(id, months?, retailer?)` | GET /api/products/:id/prices | `{ chart_data: MonthlyPricePoint[] }` |
| `fetchPriceSeries(id, months?, retailer?, limit?)` | GET /api/products/:id/prices/series | `{ points: PriceObservationPoint[] }` |
| `fetchKeepaSeries(id, opts?)` | GET /api/products/:id/keepa/series | `{ tracks: Record<string, KeepaHistoryPoint[]> }` |
| `fetchRetailers(id)` | GET /api/products/:id/retailers | `{ retailers: string[] }` |
| `fetchPrediction(id)` | GET /api/products/:id/prediction | `PredictionResponse \| null` |

`normalizePredictionResponse(raw)` handles snake_case/camelCase conversion.

## Hook Interfaces

```typescript
useProducts() → { products: Product[], loading, error, refetch }
// queryKey: ['products'], staleTime 5m, gcTime 24h, retry 2

useProductDetail(productId) → {
  product, priceHistory, allRetailerSeries, prediction,
  retailers, selectedRetailer, selectRetailer,
  comparisonRows, loading, error
}
// Parallel fetch: product + prediction + retailers
// Series fallback: raw prices/series → legacy prices → empty

useWatchlist() → { ids, add(id), remove(id), toggle(id), isWatched(id) }
// Persisted to AsyncStorage key: AIWISH_WATCHLIST
```

## Component Props

```typescript
Button          { title, onPress, variant?: 'primary'|'outline', disabled?, style? }
ProductCard     { product: Product, onPress, selected? }
PriceChart      { priceHistory, allRetailerSeries?, retailers?, selectedRetailer?, onRetailerChange? }
PriceDisplay    { currentPrice, oldPrice, changePercentage, size?: 'small'|'large' }
RecommendationCard   { product: ProductDetail, predictionFromApi?: PredictionResponse | null }
RecommendationBadge  { recommendation, confidence, size?: 'small'|'large' }
CollapsibleSection   { title, defaultOpen?, children }
StickyFooter         { children }
SkeletonCard         { }
BrandWordmark   { textStyle, iwishColor?, accessibilityLabel? }
InfoRow         { label, value, icon? }
```

## Design System

Always consume via `useTheme()` — never hardcode colors.

**Dark theme** (Editorial): background `#09090B`, surface `#141416`
**Light theme** (Editorial): background `#FDFBF7`, surface `#FFFFFF`
**Brand gradient**: `brandStart: #F0048C` → `brandEnd: #9D4EDD` (magenta → violet)

Key tokens: `success`, `warning`, `neutralState` + `*Bg`/`*Border` variants
Text tokens: `text`, `textSecondary`, `textMuted`, `textSoft`
Structural: `border`, `borderMed`, `surface2`, `surfaceLight`, `cardBg`, `headerBg`

Spacing scale: `xs=4, sm=8, md=16, lg=24, xl=32, xxl=48`
Border radius: `sm=8, md=12, lg=16, xl=24, card=20, cardLg=26, button=14, full=100`
Font sizes: `xs=12, sm=14, md=16, lg=20, xl=24, xxl=32`
Shadows: `card`, `header`, `glow` — all lavender/pink tinted, platform-aware
Fonts: `MONO_FONT` (Courier New/monospace), `DISPLAY_FONT`, `BODY_FONT`, `SEMIBOLD_FONT` (Outfit)

## Conventions

- Components use `StyleSheet.create` with `createStyles(colors)` pattern
- List items memoized with `React.memo`; callbacks stabilized with `useCallback`
- FlashList v2 has no `estimatedItemSize` prop — do not add it
- Animations: transform + opacity only via Reanimated 2
- Never hardcode colors; always use theme tokens from `useTheme()`
- No emoji in UI
- Minimum 44pt touch targets
- Safe area via `react-native-safe-area-context` on all screens

## Data Flow

- Prediction merge: `mergePredictionSummary(embedded, fromApi)` — embedded wins
- Retailer sort: Walmart → Best Buy → Target → Amazon → alpha
- Retailer chart colors: defined in `src/utils/retailerChartColors.ts`
- Chart modes: single-retailer (range fill + avg) vs. multi-retailer (one line each)
- `keepa_products` and `predictions` tables are optional — API degrades gracefully

## ML Pipeline (`aiwish-ml`)

- 80 products, 4 categories, 18+ months history
- 7d horizon: mean-reversion baseline
- 30d horizon: RF + XGBoost ensemble, 60+ features
- Holiday windows: Black Friday, Prime Day, Cyber Monday
- Trend thresholds: `< -3%` falling, `> 3%` rising, else stable

## Commands

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run typecheck  # npx tsc --noEmit
```

## Installed Skills (69)

### Design
| Skill | Focus |
|---|---|
| `gpt-taste` | Anti-AI-slop design patterns |
| `high-end-visual-design` | Premium visual hierarchy, double-bezel architecture |
| `design-taste-frontend` | Frontend design taste, typography, motion |
| `stitch-design-taste` | Color, spacing, component polish |
| `minimalist-ui` | Restraint, whitespace, typography-first |
| `industrial-brutalist-ui` | Bold, structural, high-contrast |
| `impeccable` | Perceptually uniform color (OKLCH), pixel-perfect craft |
| `huashu-design` | Anti-generic UI patterns, Chinese design aesthetics |
| `top-design` | Elite design standards synthesis |
| `refactoring-ui` | Practical UI improvement techniques |
| `image-to-code` | Visual-to-code translation |
| `imagegen-frontend-mobile` | Mobile UI generation |
| `imagegen-frontend-web` | Web UI generation |
| `ckm-banner-design` | Banner design patterns |
| `ckm-brand` | Brand identity |
| `ckm-design` | General design |
| `ckm-design-system` | Design system construction |
| `ckm-slides` | Presentation design |
| `ckm-ui-styling` | UI styling patterns |

### UX / Product
| Skill | Focus |
|---|---|
| `ux-designer` | UX methodology, user research |
| `ux-heuristics` | Nielsen's 10 heuristics + modern expansions |
| `ios-hig-design` | Apple Human Interface Guidelines |
| `web-design-guidelines` | Web design best practices |
| `microinteractions` | Detail-level feedback and animation |
| `redesign-existing-projects` | Systematic redesign methodology |
| `hooked-ux` | Hook/habit loop: Trigger → Action → Reward → Investment |
| `improve-retention` | B=MAP: Behavior = Motivation × Ability × Prompt |
| `design-everyday-things` | Affordances, signifiers, feedback |
| `design-sprint` | 5-day sprint methodology |
| `jobs-to-be-done` | JTBD framework (functional/emotional/social) |
| `continuous-discovery` | Continuous product discovery |
| `lean-ux` | Lean UX methodology |
| `cro-methodology` | Conversion rate optimization |
| `ui-ux-pro-max` | Combined UI/UX excellence |
| `frontend-design` | Frontend design standards |

### Engineering
| Skill | Focus |
|---|---|
| `vercel-react-native-skills` | React Native best practices (Vercel) |
| `vercel-react-best-practices` | React best practices (Vercel) |
| `web-typography` | Typography systems, font loading |
| `high-perf-browser` | Browser/app performance |
| `clean-architecture` | Clean architecture patterns |
| `clean-code` | Code quality, naming, readability |
| `domain-driven-design` | DDD tactical patterns |
| `ddia-systems` | Distributed systems design |
| `system-design` | System design patterns |
| `software-design-philosophy` | Design philosophy principles |
| `refactoring-patterns` | Code refactoring techniques |
| `pragmatic-programmer` | Pragmatic development practices |
| `full-output-enforcement` | Complete code output |
| `release-it` | Production resilience patterns |

### Testing
| Skill | Focus |
|---|---|
| `playwright-skill` | E2E browser testing with Playwright |

### Product Strategy / Business
| Skill | Focus |
|---|---|
| `inspired-product` | Product management (Marty Cagan) |
| `lean-startup` | Build-measure-learn |
| `mom-test` | Customer interview techniques |
| `brandkit` | Brand identity construction |
| `storybrand-messaging` | StoryBrand narrative framework |
| `obviously-awesome` | Product positioning (April Dunford) |
| `made-to-stick` | SUCCESs: Simple/Unexpected/Concrete/Credible/Emotional/Stories |
| `contagious` | Viral/contagious content principles |
| `one-page-marketing` | 1-page marketing canvas |
| `scorecard-marketing` | Marketing measurement |
| `traction-eos` | EOS/Traction business operating system |
| `hundred-million-offers` | Irresistible offer construction |
| `predictable-revenue` | Outbound sales methodology |
| `crossing-the-chasm` | Technology adoption lifecycle |
| `blue-ocean-strategy` | Blue Ocean / value innovation |
| `drive-motivation` | Intrinsic motivation (autonomy/mastery/purpose) |
| `influence-psychology` | Cialdini's persuasion principles |
| `negotiation` | Negotiation tactics |

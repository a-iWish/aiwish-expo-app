# a.iwish Design System — Editorial Verdict (Direction D)

## North star

Users feel **BUY / WAIT / HOLD** before reading body copy. Typography is the UI.

## Appearance

- **Default:** System (follows OS light/dark)
- **Override:** Settings → Light | Dark | System
- Storage: `AIWISH_APPEARANCE` (`system` | `light` | `dark`)

## Color

| Role | Light | Dark |
|------|-------|------|
| Background | `#FDFBF7` | `#09090B` |
| Surface | `#FFFFFF` | `#141416` |
| Text | `#18181B` | `#FAFAFA` |
| Text secondary | 64% opacity | 64% opacity |
| Border | 8% ink / white | |

Brand gradient (`#F0048C` → `#9D4EDD`): primary CTA, wordmark `wish`, tab active indicator only.

Verdict colors (solid, never gradient text):

- BUY: green
- WAIT: amber
- HOLD: slate

## Typography (Outfit)

| Variant | Size | Weight |
|---------|------|--------|
| displayVerdict (list) | 40px | 700 |
| displayVerdict (detail) | 56px | 700 |
| confidence | 32px | 700 |
| title | 20px | 600 |
| body | 16px | 400 |
| meta | 12px | 500, uppercase tracking |
| monoPrice | 16px | mono |

## Layout

- List row: 40px thumb, verdict left, confidence right, hairline dividers (no card-in-card)
- Detail: verdict → title → asymmetric image/price → CTA → segments
- Sticky mini-bar on scroll: `WAIT · 78%`, 44pt min height
- Touch targets: 44pt minimum

## Motion

- Detail enter: verdict → title → image (80–160ms stagger), fade + translateY only
- No BUY shimmer
- `prefers-reduced-motion`: skip stagger

## Bans

- Gradient text (`background-clip: text`)
- Colored left stripe on cards
- Emoji placeholders
- Duplicate watchlist controls on detail
- Collapsible sections on detail (use segments)
- `backdrop-blur` on scrolling content

## Segments (detail)

Summary | History | Retailers

## CTA

Open retailer purchase URL when buildable; else Google search for product + retailer.

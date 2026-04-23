# Backend API parity checklist

Use this list to verify that a running API matches what the mobile client calls in [`src/services/api.ts`](../src/services/api.ts). Replace `BASE` and `PRODUCT_ID` with real values.

**Base URL:** `BASE` = your `EXPO_PUBLIC_API_URL` (default `http://localhost:8000`).

## Endpoints (must return JSON, 2xx)

| # | Client function | HTTP | Path / query |
|---|-----------------|------|----------------|
| 1 | `fetchProducts` | GET | `/api/products` |
| 2 | `fetchProduct` | GET | `/api/products/{id}` |
| 3 | `fetchPriceHistory` | GET | `/api/products/{id}/prices?months=6` (list screen uses 12 in fallbacks; detail uses 6 default in signature — backend should accept any supported `months`) |
| 4 | `fetchPriceHistory` + retailer | GET | `/api/products/{id}/prices?months=12&retailer=Walmart` (URL-encoded retailer name) |
| 5 | `fetchPriceSeries` | GET | `/api/products/{id}/prices/series?months=12&limit=10000` |
| 6 | `fetchPriceSeries` + retailer | GET | `/api/products/{id}/prices/series?months=12&limit=10000&retailer=Walmart` |
| 7 | `fetchKeepaSeries` | GET | `/api/products/{id}/keepa/series?months=24&limit_per_track=10000&tracks=NEW%2CAMAZON` (`tracks` comma-separated, encoded) |
| 8 | `fetchRetailers` | GET | `/api/products/{id}/retailers` |
| 9 | `fetchPrediction` | GET | `/api/products/{id}/prediction` |

## Example curl commands

```bash
export BASE=http://localhost:8000
export PRODUCT_ID=your-product-uuid

curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/products"
curl -sS "$BASE/api/products/$PRODUCT_ID" | head -c 200; echo
curl -sS "$BASE/api/products/$PRODUCT_ID/prices?months=6"
curl -sS "$BASE/api/products/$PRODUCT_ID/prices/series?months=12&limit=10000"
curl -sS "$BASE/api/products/$PRODUCT_ID/keepa/series?months=24&limit_per_track=10000&tracks=NEW%2CAMAZON"
curl -sS "$BASE/api/products/$PRODUCT_ID/retailers"
curl -sS "$BASE/api/products/$PRODUCT_ID/prediction"
```

## Response shape

Cross-check field names against TypeScript types in [`src/types/product.ts`](../src/types/product.ts). The app uses optional fields defensively; missing optional data may degrade UI but should not crash if the client’s `.catch` paths are hit.

## Parity sign-off

When the backend team confirms each row in the table against a staging URL, note the environment and date in your release notes or ticket.

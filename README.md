# a.iwish (Expo)

Smart wishlist mobile app with ML price prediction and multi-retailer price history. This repo is the **React Native (Expo)** client; it talks to a separate REST API.

## Team documentation

- **Full developer handbook (Confluence-ready):** [docs/DEVELOPER_HANDBOOK.md](docs/DEVELOPER_HANDBOOK.md) — paste into Confluence or read in-repo.
- **Backend parity / manual API checks:** [docs/BACKEND_API_CHECKLIST.md](docs/BACKEND_API_CHECKLIST.md)

If your team keeps the canonical doc in **Confluence**, add that page URL here under “Team documentation” so onboarding stays one click away.

## Quick start

```bash
npm install
npx expo start
```

Use the Expo CLI UI to open iOS simulator, Android emulator, or web. Native dev builds:

```bash
npx expo run:ios
npx expo run:android
```

Typecheck:

```bash
npm run typecheck
```

## Environment

The API base URL defaults to `http://localhost:8000`. Override with a public Expo env var (embedded in the bundle — **not for secrets**):

```bash
cp .env.example .env
# Edit .env: EXPO_PUBLIC_API_URL=http://YOUR_HOST:8000
```

- **Simulator/emulator:** `localhost` is usually fine.
- **Physical device:** use your computer’s LAN IP or a tunnel; the device cannot reach `localhost` on your machine.

See [docs/DEVELOPER_HANDBOOK.md](docs/DEVELOPER_HANDBOOK.md) §6 for staging/production notes.

## Tech summary

Expo SDK 54, React 19, React Native 0.81, TypeScript (strict), React Navigation native stack. New Architecture is enabled in `app.json`.

## License

Private project (`package.json`).

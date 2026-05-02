# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This is the **Hello-Agent** learning platform — a gamified, interactive Agent knowledge learning app based on the "Hello-Agents" open-source tutorial by Datawhale. It combines game-like progression (XP, badges, leaderboards), built-in code practice, and AI tutoring into a single mobile/web experience.

## Commands

```bash
npm start          # Start Expo dev server (interactive)
npm run web        # Start for web
npm run android    # Start for Android
npm run ios        # Start for iOS
npm run lint       # Run ESLint
npm run reset-project  # Move starter code to app-example/ and create fresh app/ directory
```

## Architecture

### File-based Routing (Expo Router)

Routes are defined by the file tree under `app/`. Expo Router 6 uses a strict file convention:

- `app/_layout.tsx` — Root layout (Stack navigator). Wraps everything in ThemeProvider and sets up the `(tabs)` + `modal` screens.
- `app/(tabs)/_layout.tsx` — Tab navigator layout. Currently has two tabs: Home (`index`) and Explore (`explore`).
- `app/(tabs)/index.tsx` — Home screen
- `app/(tabs)/explore.tsx` — Explore screen
- `app/modal.tsx` — Modal screen presented over the tabs

Path alias: `@/*` maps to the project root (`./*`), configured in `tsconfig.json`.

### Theme System

- `constants/theme.ts` — `Colors` (light/dark palettes) and `Fonts` (platform-specific font stacks).
- `hooks/use-color-scheme.ts` — Detects the system color scheme (light/dark), with a `.web.ts` variant for web.
- `hooks/use-theme-color.ts` — Returns themed colors from the Colors palette.
- `components/themed-text.tsx` and `components/themed-view.tsx` — Drop-in replacements for `<Text>` and `<View>` that respect the current theme.

### Shared Components

- `components/ui/collapsible.tsx` — Animated collapsible section using `react-native-reanimated`.
- `components/ui/icon-symbol.tsx` / `icon-symbol.ios.tsx` — SF Symbols on iOS, fallback text icons on other platforms.
- `components/parallax-scroll-view.tsx` — Parallax-scrolling header wrapper.
- `components/external-link.tsx` — Opens URLs in the system browser.
- `components/haptic-tab.tsx` — Tab bar button with haptic feedback.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 |
| UI | React Native 0.81, React 19 |
| Navigation | Expo Router 6 (file-based routing) |
| Language | TypeScript 5.9 (strict mode) |
| Animations | `react-native-reanimated` 4 |
| Linting | ESLint 9 with `eslint-config-expo` |

## Important Constraints

- **Node version**: React Native 0.81 requires Node >= 20.19.4. The current environment has v20.11.0 — upgrade before running into runtime issues.
- **React Compiler**: Enabled in `app.json` (`experiments.reactCompiler: true`). Components must follow the Rules of React strictly.
- **Typed routes**: Enabled in `app.json` (`experiments.typedRoutes: true`). Route params are statically typed — run `npx expo start` to regenerate `.expo/types/` after route changes.
- **Web output**: Configured as `static` in `app.json` — the web build produces a static SPA.

# Occam Mobile — Claude Development Guide

React Native mobile app for Occam Golf. Uses React Native Paper (MD3) as the component library, Expo for development.

## Dev Environment
- **Start:** Expo on port 8081 (not typically running during regular development)
- **Backend API:** http://occam.localhost

## React Native Paper (MD3)
**Always use React Native Paper components first** before building custom ones.

### Key Components to Prefer
- `Appbar.Header` / `Appbar.BackAction` / `Appbar.Content` — screen headers (see `ScreenHeader.jsx`)
- `Button` (mode: contained, outlined, text) — instead of custom `TouchableOpacity` buttons
- `TextInput` — instead of RN `TextInput` with manual styling
- `Card` / `Card.Content` / `Card.Title` — instead of custom card Views
- `ActivityIndicator` — from Paper, not RN core
- `Text` with `variant` prop — for themed typography (e.g. `variant="titleMedium"`)
- `Icon` — uses **MaterialCommunityIcons** (not Ionicons)
- `Chip`, `Badge`, `Divider`, `FAB`, `Snackbar`, `Dialog`, `Portal`, `Modal`, `Surface` — use as needed

### Icons
Paper uses **MaterialCommunityIcons** by default. When migrating from Ionicons, find the equivalent Material icon name. For icons not available in Material, `@expo/vector-icons` Ionicons can still be used directly.

### Theme Access
Use `useTheme()` hook from `react-native-paper` to access theme colors/fonts, or import tokens directly from `src/theme/`.

## Theme System
```
src/theme/
├── index.js          # Barrel export (re-exports all modules)
├── colors.js         # All color tokens
├── typography.js     # Font styles
├── spacing.js        # Spacing, borderRadius, shadows
└── paperTheme.js     # MD3 theme mapping our tokens to Paper
```

The app is wrapped with `PaperProvider` in `App.js` using the custom theme from `paperTheme.js`.

## Styling
- Styles live in `src/styles/` as separate files (e.g. `rootNavigator.styles.js`)
- **Never hardcode hex colors** — always use tokens from `src/theme/colors.js`
- Use `globalStyles` from `src/styles/global.styles.js` for common patterns (loading containers, error states, spacers, flex utilities)
- **Touch targets:** All interactive elements must be at least 44x44px

## File Organization
```
src/
├── components/       # Shared components
├── styles/           # Style files (featureName.styles.js)
├── theme/            # Color, typography, spacing tokens + Paper theme
├── hooks/            # Custom hooks
├── services/         # API functions
├── context/          # Context providers
└── ...
```

## Mobile-Web Parity
When making changes to features that exist on both web (Caddie/Marshal) and mobile, always ensure both platforms are updated to maintain feature parity.

## General Rules
- DRY coding principles
- Always use latest stable package versions
- No pre-release or beta versions
- Functional components with hooks only
- API calls always `async/await`

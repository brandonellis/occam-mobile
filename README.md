# Occam Golf — Mobile App

React Native (Expo) mobile application for Occam Golf. Supports both iOS and Android from a single codebase.

## Tech Stack

- **Framework**: React Native via Expo SDK 54
- **Navigation**: React Navigation (native stack + bottom tabs)
- **State**: useReducer + Context API
- **Auth**: JWT stored in Expo SecureStore
- **API**: Axios with auth interceptors
- **Push Notifications**: expo-notifications (FCM + APNs)

## Project Structure

```
src/
├── config/           # Environment configuration
├── constants/        # App-wide constants (auth, navigation, etc.)
├── context/          # React Context definitions
├── helpers/          # Utility/helper functions
├── hooks/            # Custom hooks (useAuth, usePushNotifications)
├── navigation/       # React Navigation setup (Root, Coach tabs, Client tabs)
├── providers/        # Context providers (AuthProvider)
├── reducers/         # useReducer state logic
├── screens/          # Screen components organized by role
│   ├── Auth/         # Login, ForgotPassword
│   ├── Coach/        # Coach-specific screens
│   └── Client/       # Client-specific screens
├── services/         # API service functions (apiClient, auth, bookings, etc.)
├── styles/           # StyleSheet files (per-screen and global)
└── theme/            # Colors, typography, spacing tokens
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Xcode) or Android Emulator (Android Studio)
- Expo Go app on a physical device (optional)

### Install Dependencies

```bash
cd occam-mobile
npm install
```

### Run Development Server

```bash
# Start Expo dev server
npm start

# iOS simulator
npm run ios

# Android emulator
npm run android
```

### Environment Configuration

Edit `src/config/index.js` to set API URLs per environment. The app defaults to `development` which points to `http://localhost:8000/api/v1`.

For physical device testing, update the development API URL to your machine's local IP address.

## Architecture

### Role-Based Routing

The app uses a **single binary with role-conditional navigation**:

1. User logs in with organization ID + credentials
2. JWT + user profile stored securely via `expo-secure-store`
3. Role extracted from user data determines which tab navigator loads:
   - **Coach/Admin** → Dashboard, Schedule, Clients, Profile
   - **Client** → Home, Bookings, Progress, Profile

### API Layer

All API functions live in `src/services/` and use a shared Axios instance (`apiClient.js`) that automatically:
- Attaches the JWT Bearer token
- Sends the tenant ID header (`X-Tenant-ID`)
- Clears local auth on 401 responses

### Styling Convention

Per the mobile architecture rules, styles are kept in `src/styles/` as separate `.styles.js` files and imported into components. This keeps component files focused on logic and markup.

## Roadmap

- [x] **Phase 1**: Auth, booking flow, membership purchase, push notifications
- [x] **Phase 2**: Video recording/upload, shared resources, progress reports
- [x] **Phase 3**: Client management, curriculum tools, schedule management
- [x] **Phase 4**: Video annotation, offline support, CoPilot AI, analytics

## License

This project is licensed under the MIT License.

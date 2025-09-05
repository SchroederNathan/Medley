![Medley](assets/images/medley-readme-review.png)

A simple media discovery app built with Expo + React Native, Expo Router, Supabase, and TanStack Query. It includes **coming soon**

### Features

- **Expo Router**: File‑system routing with protected `(tabs)` and auth screens
- **Supabase**: Email/password auth, session handling, and basic profile storage
- **TanStack Query**: Data fetching with AsyncStorage persistence
- **UI components**: Carousel, Media cards, Search, Buttons, Inputs
- **Custom fonts**: Plus Jakarta Sans and Tanker

### Requirements

- Node 18+ (recommended: Node 20)
- npm 9+ (comes with Node) or your preferred package manager
- Xcode (for iOS) and/or Android Studio (for Android)

### Quick Start

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env  # If you don't have one yet, see below

# Start the Expo dev server
npm start

# Or run directly on a platform
npm run ios     # iOS simulator
npm run android # Android emulator/device
npm run web     # Web
```

### Environment Variables

The app expects the following public environment variables for Supabase in `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.ref.supabase.co"
EXPO_PUBLIC_SUPABASE_KEY="YOUR_SUPABASE_ANON_KEY"
```

Notes:

- Variables prefixed with `EXPO_PUBLIC_` are embedded at build time and available in the client bundle.
- After adding or changing `.env` values, fully restart the dev server.

### Scripts

The most useful npm scripts:

```bash
npm start     # Start the Expo dev server
npm run ios   # Run iOS (Expo Run / prebuild flow)
npm run android
npm run web
npm run lint  # Lint the project
```

### Project Structure (high level)

```
app/                        # App routes (Expo Router)
  (protected)/              # Auth‑gated routes
    (tabs)/                 # Tab navigator: Home, Profile
components/ui/              # Reusable UI components
contexts/                   # React contexts (auth, theme)
hooks/                      # Custom hooks (profile, media)
lib/                        # Query client, utils (Supabase client)
assets/                     # Images, icons, fonts
```

### Tech Stack

- React Native 0.79, Expo 53
- Expo Router 5
- Supabase JS 2
- TanStack Query 5

### Troubleshooting

- If `.env` changes are not reflected, stop and restart the dev server.
- iOS/Android builds may require opening the native projects once after `npm run ios`/`android` to finish installing pods/gradle deps.


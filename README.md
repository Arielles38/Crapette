# 🎮 Crapette Mobile Game - Testing on Android Emulator

## 🚀 Quick Start (3 Steps)

### Step 1: Verify Setup
```bash
npm run verify
```

### Step 2: Start Development Server
```bash
npm start
```

### Step 3: Launch on Android Emulator
Press **`a`** or run `npm run android`

---

## 📱 First-Time Setup

### 1. Install Android Studio
- Download: https://developer.android.com/studio
- Run installer, choose "Standard Installation"

### 2. Create Virtual Device
1. Open Android Studio → Tools → Device Manager
2. Create Virtual Device (Pixel 5 + API 33)
3. Click Finish

### 3. Set Environment Variable (Windows PowerShell)
```powershell
$Path = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $Path, "User")
```

### 4. Run Verify
```bash
npm run verify
```

---

## 🎮 Playing the Game

**Menu:** Easy/Medium/Hard AI + Settings  
**Board:** Foundations (top) | Tableau (main) | Reserve (bottom)  
**Play:** Tap card → Tap destination → End Turn  
**Win:** All 52 cards in Foundations

---

## 🔧 Commands

```bash
npm start              # Start server
npm run android        # Launch on emulator
npm run verify         # Check setup
npm test               # Run 63 tests
adb logcat -s Crapette # View logs
```

---

## 🐛 Troubleshooting

**Emulator not found?**
```bash
emulator -list-avds
emulator -avd Pixel_5_API_33
```

**Cannot find Java?**
- Install JDK: https://adoptium.net/
- Verify: `java -version`

**Cannot find Android SDK?**
```powershell
[Environment]::SetEnvironmentVariable(
  "ANDROID_SDK_ROOT",
  "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk",
  "User"
)
```

**App crashes?**
```bash
adb logcat -s "Crapette" | grep -i error
npm run android -- --clean
```

---

## ✅ Testing Checklist

- [ ] App launches
- [ ] Menu displays
- [ ] Can select AI difficulty
- [ ] Game board shows
- [ ] Cards display
- [ ] Can move cards
- [ ] AI plays
- [ ] Turn switches
- [ ] Score updates
- [ ] Can resign

---

## 📊 Status

✅ **Backend:** 63/63 tests passing  
✅ **UI:** 5 screens, fully integrated  
✅ **Android:** Configured and ready  

**Next:** Test on emulator!

---

**See also:** QUICKSTART_ANDROID.md | ANDROID_SETUP.md | TECH_SPEC.md

```bash
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/platform-tools
```

#### For Windows (PowerShell):

```powershell
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH += ";$env:ANDROID_SDK_ROOT\tools;$env:ANDROID_SDK_ROOT\platform-tools"
```

## Development

### Build & Run

```bash
# Development mode (watch)
npm run dev

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

### Android Emulator

```bash
# List available emulators
emulator -list-avds

# Start an emulator
emulator -avd <emulator_name>

# Run on connected device/emulator
npm run android:run

# Build Android APK
npm run android:build

# Build Android App Bundle (for Play Store)
npm run android:bundle
```

## Project Structure

```
/src
  /core                  # Game engine (rules, validation, state)
    state.ts            # TypeScript types for GameState
    engine.ts           # applyAction, validateAction
    rules.ts            # Crapette rule implementations
  /ai                    # AI opponent logic
    ai.ts               # suggestAction implementation
  /firebase              # Firebase integration
    firebaseConfig.ts   # Firebase initialization
    matchService.ts     # Matchmaking & sync
  /locales               # i18n translations
    en.json
    fr.json
  /i18n
    i18n.ts             # i18next configuration
  /tests
    core.test.ts        # Unit tests for game engine
    crapette.test.ts    # Crapette interrupt mechanism tests
  index.ts              # Entry point
/android                # Android-specific configuration
/ios                    # iOS-specific configuration (if applicable)
.env.example           # Firebase config template
package.json           # Dependencies & scripts
tsconfig.json          # TypeScript configuration
jest.config.js         # Jest test configuration
```

## Key Dependencies

- **firebase** / **@react-native-firebase/\*** — Realtime Database, Auth, Analytics, Crash Reporting, Push Notifications
- **react-native** — Mobile app framework
- **react-navigation** — Navigation between screens
- **i18next** — Multi-language support (English/French)
- **jest** / **ts-jest** — Testing
- **TypeScript** — Type safety

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Run app in development mode |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run test` | Run test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | Lint TypeScript files |
| `npm run lint:fix` | Fix linting errors automatically |
| `npm run format` | Format code with Prettier |
| `npm run android:run` | Build and run on Android device/emulator |
| `npm run android:bundle` | Create Android App Bundle for Play Store |

## Testing

All tests are in `/src/tests` and follow the naming convention `*.test.ts` or `*.spec.ts`.

Run tests:

```bash
npm run test
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

Tests cover:
- Game rule validation
- State transitions
- Crapette interrupt mechanic
- Firebase connectivity (mocked)
- Deterministic shuffle & replay

## Deployment

### Android (Google Play)

1. Build Android App Bundle:
   ```bash
   npm run android:bundle
   ```

2. Use **fastlane** (optional, for automation):
   ```bash
   gem install fastlane
   fastlane init android
   fastlane supply --aab dist/app-release.aab --track alpha
   ```

3. Upload to Google Play Console manually or via CLI

### CI/CD

GitHub Actions workflows are configured in `.github/workflows/` to:
- Run tests on PRs
- Build Android APK/AAB on push to `main`
- Upload to Firebase App Distribution

## Troubleshooting

### Android Build Fails
- Ensure `ANDROID_SDK_ROOT` and `ANDROID_HOME` environment variables are set
- Check that Java version is 11 or 17: `java -version`
- Clear build cache: `cd android && ./gradlew clean`

### Metro Bundler Issues
- Clear cache: `npx react-native start --reset-cache`
- Kill any existing Metro servers: `lsof -i :8081` then `kill -9 <PID>`

### Firebase Connection Issues
- Verify `.env` file has correct Firebase credentials
- Check that Realtime Database is enabled in Firebase Console
- Ensure device/emulator has internet connection

## Support & Documentation

- [React Native Docs](https://reactnative.dev)
- [Firebase React Native Guide](https://rnfirebase.io)
- [React Navigation Docs](https://reactnavigation.org)
- [i18next Documentation](https://www.i18next.com)
- [Jest Testing Docs](https://jestjs.io)

---

For questions or issues, open an issue on GitHub or contact the development team.

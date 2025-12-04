# 🎮 Crapette Mobile - Quick Start Guide

## ⚡ Super Quick Start (Already have Android Studio?)

```bash
# 1. Open terminal in project folder
cd "c:\Users\lecon\Documents\python projects\crapette"

# 2. Start development server
npm start

# 3. Start Android Emulator (in Android Studio)
#    Tools → Device Manager → Select device → Play button

# 4. Once emulator is running, press 'a' in terminal
# The game should launch on emulator!
```

**That's it!** 🚀

---

## 📋 What You Need

- **Node.js**: v18+ (you have v22 ✓)
- **Android Studio**: For emulator and SDK
- **Java JDK**: 11+ (usually included with Android Studio)
- **Git**: For version control

---

## 🔧 Setup Steps (First Time Only)

### 1️⃣ Install Android Studio

1. Download from: https://developer.android.com/studio
2. Run installer
3. Choose "Standard Installation" (includes everything)
4. Accept all licenses
5. Wait for SDK download (grab coffee ☕)

### 2️⃣ Create Android Virtual Device

1. Open **Android Studio**
2. Click **Tools → Device Manager**
3. Click **Create Virtual Device**
4. Select **Pixel 5** (recommended)
5. Select **API 33** (Android 13)
6. Click **Finish**

### 3️⃣ Set Environment Variable (Windows)

1. Right-click **This PC** → **Properties**
2. **Advanced system settings**
3. **Environment Variables**
4. **New** (System variable)
5. Name: `ANDROID_SDK_ROOT`
6. Value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
7. Click **OK**
8. Restart PowerShell

---

## 🎮 Playing the Game

### Starting a Game

1. **Launch app** (see Quick Start above)
2. **Menu Screen** appears with options:
   - Play vs Easy AI
   - Play vs Medium AI
   - Play vs Hard AI
   - Settings

3. **Select difficulty** → **Game starts!**

### Game Controls

| Action | How |
|--------|-----|
| Select card | Tap card in reserve |
| Move card | Tap card, then tap destination |
| End turn | Tap "End Turn" button |
| See score | Top of screen shows both scores |
| Change settings | Menu → Settings |

### Game Rules

- **Goal**: Move all 52 cards to the foundations
- **Foundations**: Build from Ace to King, same suit
- **Tableau**: Arrange in descending order, alternating colors
- **Reserve**: Use these cards strategically
- **Win**: First to complete all 4 foundations wins!
- **Crapette**: Challenge opponent's invalid move (coming in Phase 2)

---

## 🛠️ Common Commands

```bash
# Start dev server
npm start

# Start with Android specifically
npm run android
npm start -- --android

# Start with iOS (Mac only)
npm run ios

# View logs from app
adb logcat -s "Crapette"

# List connected devices
adb devices

# Stop emulator
adb emu kill
```

---

## 📱 Testing Checklist

Use this to verify everything works:

### UI
- [ ] App launches without crashing
- [ ] Can see menu with 4 buttons
- [ ] Can navigate to game
- [ ] Can navigate to settings
- [ ] Can see game board with cards

### Game Logic
- [ ] Can tap and select cards
- [ ] Can move cards to tableaus
- [ ] Can move cards to foundations
- [ ] Illegal moves are rejected
- [ ] Turn changes to AI
- [ ] AI makes a move
- [ ] Score updates
- [ ] Can end turn
- [ ] Can resign

### AI Testing
- [ ] Easy mode: plays quickly, varied moves
- [ ] Medium mode: plays carefully, good moves
- [ ] Hard mode: always makes best move

### Settings
- [ ] Can switch language (EN/FR)
- [ ] Can toggle sound (settings only, sound not yet implemented)
- [ ] Can return to menu

---

## 🐛 Troubleshooting

### "App won't launch"
```bash
# Check emulator is running
adb devices

# View error logs
adb logcat -s "Crapette"

# Try clean build
npm run android -- --clean
```

### "Emulator not found"
```bash
# List emulators
emulator -list-avds

# Start specific one
emulator -avd Pixel_5_API_33
```

### "Cannot find Android SDK"
```bash
# Create environment variable (Admin PowerShell)
[Environment]::SetEnvironmentVariable(
  "ANDROID_SDK_ROOT",
  "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk",
  "User"
)

# Restart PowerShell
```

### "Port 8081 already in use"
```bash
# Kill existing process
lsof -ti:8081 | xargs kill -9

# Or try different port
npm start -- --port 8082
```

### "Gradle build failed"
```bash
# Clean everything and rebuild
npm run android -- --clean

# Or manually
npm install
npm run android
```

---

## 📊 Project Structure

```
crapette-mobile/
├── App.tsx              ← Main app component
├── src/
│   ├── screens/        ← UI screens
│   │   ├── MenuScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── AILobbyScreen.tsx
│   ├── core/           ← Game engine
│   │   ├── engine.ts
│   │   ├── rules.ts
│   │   └── state.ts
│   ├── ai/            ← AI opponent
│   │   └── ai.ts
│   └── i18n/          ← Localization
│       └── i18n.ts
├── app.json           ← Expo config
├── babel.config.js    ← Babel config
└── metro.config.js    ← Metro bundler config
```

---

## 🚀 Next Steps

### Phase 2 Features (Planned)
- [ ] Online multiplayer (Firebase)
- [ ] Crapette interrupt mechanic
- [ ] Sound effects & animations
- [ ] Leaderboard
- [ ] Replays

### For Developers
1. ✅ Backend engine complete (63 tests passing)
2. ✅ UI screens wired up
3. ✅ Android build configured
4. **→ Next**: Test on emulator, then add multiplayer

---

## 📚 Documentation

- `README.md` - General overview
- `TECH_SPEC.md` - Architecture & design
- `ANDROID_SETUP.md` - Detailed Android setup
- `FILE_INDEX.md` - Complete file reference
- `COMPLETION_SUMMARY.md` - Phase 1 details

---

## 🎯 Performance Tips

- Game runs smoothly on API 30+ devices
- Emulator recommended specs: 4GB+ RAM, 10GB disk
- Use GPU acceleration in emulator for better performance
- Test on real device for accurate performance data

---

## 💡 Pro Tips

1. **Use hot reload**: Changes auto-apply while app running
2. **Keep emulator running**: Much faster than restarting
3. **Use LAN mode**: `npm start -- --lan` for better connection
4. **Monitor logs**: `adb logcat -s "Crapette"` shows errors
5. **Real device**: Test on actual phone for best accuracy

---

## ❓ FAQ

**Q: Can I use my phone instead of emulator?**
A: Yes! Enable USB debugging, connect via USB, and run `npm start -- --usb`

**Q: How do I debug TypeScript code?**
A: Use Chrome DevTools - press 'j' in Expo terminal

**Q: Can I build an APK?**
A: Yes! `npm run android` creates a debug APK. Release APK requires keystore setup.

**Q: Is the game multiplayer?**
A: Not yet - Phase 2 will add Firebase multiplayer support

**Q: Can I play offline?**
A: Yes! Multiplayer requires online, but AI mode works offline

---

## 🎓 Learning Resources

- React Native docs: https://reactnative.dev/
- Expo docs: https://docs.expo.dev/
- Android docs: https://developer.android.com/
- Our TECH_SPEC: See TECH_SPEC.md in project

---

## 📞 Support

If stuck:
1. Check this guide's troubleshooting section
2. View `ANDROID_SETUP.md` for detailed setup
3. Check Logcat: `adb logcat -s "Crapette"`
4. Review React Native docs

---

**Ready to test?** Run `npm start` and enjoy! 🎮

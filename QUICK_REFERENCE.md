# ⚡ Quick Reference Card

## 🚀 To Launch Game

```bash
npm start
# Press 'a' or in another terminal:
npm run android
```

---

## 📊 Project Status

| Component | Status | Tests |
|-----------|--------|-------|
| Backend Engine | ✅ Complete | 63/63 ✓ |
| React Native UI | ✅ Complete | Integrated |
| Android Config | ✅ Ready | Verified |
| Dependencies | ✅ Installed | 929 packages |
| TypeScript | ✅ Compiling | 0 errors |

---

## 📁 File Structure

```
App.tsx                 - React Native root
src/
  ├── core/            - Game engine (tested)
  ├── ai/              - AI opponent
  ├── screens/         - UI components
  ├── firebase/        - Firebase (ready)
  └── i18n/            - Localization
  
app.json               - Expo config
babel.config.js        - Transpiler
metro.config.js        - Bundler
tsconfig.json          - TypeScript
package.json           - Dependencies
```

---

## 🎮 Game Rules

**Goal:** Move all 52 cards to Foundations

**Foundations:** Build Ace→King per suit  
**Tableau:** Descending + alternating colors  
**Reserve:** Your control cards  
**Win:** All cards in Foundations

---

## 🔧 Commands

```bash
npm start              # Dev server
npm run android        # Launch emulator
npm test               # Run 63 tests
npm run build          # TypeScript compile
npm run verify         # Check setup

adb logcat -s Crapette # View logs
adb devices            # List emulators
```

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| Emulator not found | `emulator -list-avds` |
| Port 8081 in use | Restart computer |
| Cannot find Java | Install JDK from adoptium.net |
| Cannot find Android SDK | Set ANDROID_SDK_ROOT env var |
| App crashes | Check logs: `adb logcat -s Crapette` |

---

## 📚 Documentation

- **SETUP_COMPLETE.md** - What was built
- **TESTING_README.md** - Full testing guide
- **QUICKSTART_ANDROID.md** - Fast setup
- **ANDROID_SETUP.md** - Detailed setup
- **TECH_SPEC.md** - Architecture

---

## ✅ Verification

Last check (npm run verify):
```
✅ 35/35 checks passed
❌ 0 failures
⚠️  2 warnings (Android SDK/Java - optional)
```

---

## 🎯 Next Steps

1. **Terminal 1:** `npm start`
2. **Wait for Metro**
3. **Press 'a'** or **Terminal 2:** `npm run android`
4. **Test on emulator!**

---

**You're ready to test! 🎉**

See **TESTING_README.md** for complete guide.

# Android Development Setup & Testing Guide

## Quick Start (5 minutes)

If you already have Android Studio and emulator set up:

```bash
# Start Expo dev server
npm start

# In a new terminal, start Android emulator
emulator -avd Pixel_5_API_33  # or your AVD name

# Once emulator is running, press 'a' in Expo terminal or:
npx expo start --android
```

The game should launch on your emulator!

---

## Full Setup Guide (30 minutes)

### Step 1: Install Java Development Kit (JDK)

**Windows:**
```bash
# Using Chocolatey
choco install openjdk17

# Or download from: https://adoptium.net/
```

Verify installation:
```bash
java -version
```

### Step 2: Install Android Studio

1. Download from: https://developer.android.com/studio
2. Run installer and follow prompts
3. Choose "Standard Installation" (includes SDK and emulator)
4. Accept license agreements
5. Wait for SDK download (~3-5 GB)

### Step 3: Configure Android SDK

In Android Studio:
1. Click **Tools → SDK Manager**
2. Go to **SDK Platforms** tab
3. Check these boxes:
   - Android 13 (API level 33) ✓ Recommended
   - Android 12 (API level 32) ✓ Recommended
   - Android 11 (API level 30) ✓ Minimum

4. Go to **SDK Tools** tab
5. Check these boxes:
   - Android SDK Build-Tools 33.0.0+ ✓
   - Android Emulator ✓
   - Android SDK Platform-Tools ✓
   - Android SDK Tools ✓

6. Click **Apply** → **OK** and wait for downloads

### Step 4: Create Android Virtual Device (Emulator)

In Android Studio:
1. Click **Tools → Device Manager** (or AVD Manager)
2. Click **Create Virtual Device**
3. Select device type:
   - **Pixel 5** (recommended for testing)
   - Or any phone device
4. Click **Next**
5. Select **API 33** (Android 13)
6. Click **Next**
7. Keep defaults and click **Finish**

### Step 5: Set Environment Variables (Windows)

1. Right-click **This PC** → **Properties**
2. Click **Advanced system settings**
3. Click **Environment Variables**
4. Under "System variables", click **New**
5. Create new variable:
   ```
   Variable name: ANDROID_SDK_ROOT
   Variable value: C:\Users\<YourUsername>\AppData\Local\Android\Sdk
   ```
6. Click **OK** and restart PowerShell

Verify setup:
```bash
echo $env:ANDROID_SDK_ROOT
adb --version
```

### Step 6: Install Expo CLI

```bash
npm install -g expo-cli
```

---

## Running the Game

### Method 1: Using Expo (Recommended for Development)

```bash
# Start development server
npm start

# Press 'a' for Android, or manually run:
npm run android

# The game should launch on emulator
```

### Method 2: Using React Native CLI

```bash
# Build APK
npm run android

# Or use native React Native command
npx react-native run-android
```

### Method 3: Direct Emulator Command

```bash
# Start emulator (find your AVD name in Android Studio)
emulator -avd Pixel_5_API_33

# Once running, start Expo server
npm start

# Press 'a' to launch on Android
```

---

## Troubleshooting

### Issue: "adb: command not found"

**Solution:** Add Android SDK to PATH
```bash
# In PowerShell as admin
[Environment]::SetEnvironmentVariable(
  "PATH",
  "$env:PATH;C:\Users\$env:USERNAME\AppData\Local\Android\Sdk\platform-tools",
  "User"
)

# Restart PowerShell
```

### Issue: "Cannot find emulator"

**Solution:** 
```bash
# List available virtual devices
emulator -list-avds

# Start specific emulator
emulator -avd <device_name>
```

### Issue: "Android SDK not found"

**Solution:** Create environment variable pointing to SDK
```bash
# Windows PowerShell (as admin)
$AndroidPath = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $AndroidPath, "User")
```

### Issue: "Gradle build failed"

**Solution:**
```bash
# Clean and rebuild
npm run android -- --clean
```

### Issue: "App crashes on startup"

**Check logs:**
```bash
# View Android logs
adb logcat -s "Crapette"

# Or in Android Studio:
# View → Tool Windows → Logcat
```

### Issue: "Emulator is very slow"

**Solutions:**
1. Enable GPU acceleration in emulator settings
2. Allocate more RAM (4GB minimum)
3. Use a real device instead
4. Run on a system with SSD

---

## Game Controls (on Emulator)

| Action | How to Do It |
|--------|------------|
| Tap card | Click with mouse |
| Swipe | Click and drag with mouse |
| Back button | Right-click or use Android back button |
| Home button | Emulator menu → Home |

---

## Testing Checklist

### UI Tests
- [ ] App launches without crashing
- [ ] Menu screen displays all buttons
- [ ] Settings screen is accessible
- [ ] Language switching works (EN/FR)
- [ ] Card display is readable

### Game Logic Tests
- [ ] Can select cards in reserve
- [ ] Can move cards to tableau/foundation
- [ ] Move validation works (no invalid moves)
- [ ] Turn switching works
- [ ] AI makes moves in reasonable time
- [ ] Difficulty levels have different behavior

### AI Tests
- [ ] Easy AI: Makes varied moves
- [ ] Medium AI: Mostly good moves
- [ ] Hard AI: Always good moves
- [ ] AI responds promptly

### Edge Cases
- [ ] Can resign from game
- [ ] Game detects win condition
- [ ] Can start new game
- [ ] App doesn't freeze during AI turn
- [ ] Settings persist between sessions

---

## Performance Monitoring

### View App Memory Usage
```bash
adb shell "dumpsys meminfo com.arielles38.crapette"
```

### View Frame Rate (GPU rendering)
```bash
adb shell dumpsys gfxinfo
```

### Capture Logcat to File
```bash
adb logcat > logcat-$(date +%Y%m%d-%H%M%S).txt
```

---

## Building APK for Distribution

### Debug APK (for testing)
```bash
npm run android -- --build-type debug
```

### Release APK (for Play Store)
```bash
# This requires keystore setup
npm run android -- --build-type release
```

---

## Useful Commands

```bash
# Start Expo dev server
npm start

# Tunnel mode (if direct connection doesn't work)
npm start -- --tunnel

# LAN mode (recommended)
npm start -- --lan

# USB mode (connect real device)
npm start -- --usb

# View all Expo options
npx expo start --help

# Clean everything and rebuild
npm run android -- --clean

# View device list
adb devices

# Restart ADB server
adb kill-server
adb start-server

# View all installed packages
adb shell pm list packages | grep crapette
```

---

## Real Device Testing

### Connect Physical Android Device

1. Enable Developer Mode:
   - Go to **Settings → About phone**
   - Tap **Build number** 7 times
   - Go back to **Settings → Developer options**
   - Enable **USB Debugging**

2. Connect via USB to computer

3. Trust computer when prompted on device

4. Verify connection:
   ```bash
   adb devices
   ```

5. Run app:
   ```bash
   npm start -- --usb
   # or press 'a' in Expo terminal
   ```

---

## IDE Integration (Android Studio)

### View Logs in Android Studio
1. Click **View → Tool Windows → Logcat**
2. Filter by package name: `com.arielles38.crapette`
3. Or tag: `Crapette`

### Debug with Breakpoints
1. Open your TypeScript source files
2. No IDE debugger for React Native by default
3. Use Chrome DevTools instead:
   ```bash
   # Press 'd' in Expo terminal or
   npx expo start --android
   # Then press 'j' for Chrome DevTools
   ```

### Profiling Performance
1. **Android Studio → Profiler**
2. Select your app package
3. Monitor:
   - CPU usage
   - Memory usage
   - Network activity
   - Battery drain

---

## Next Steps

1. ✅ **Setup complete** - Run your first test build
2. **Test gameplay** - Go through testing checklist
3. **Debug issues** - Use Logcat and Chrome DevTools
4. **Optimize** - Profile performance and fix slow areas
5. **Release** - Build APK for distribution

---

## Resources

- **Android Studio Docs:** https://developer.android.com/studio
- **Expo Docs:** https://docs.expo.dev/
- **React Native Docs:** https://reactnative.dev/
- **Android Development:** https://developer.android.com/
- **Firebase Android Setup:** https://firebase.google.com/docs/android/setup

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. View Logcat for error messages: `adb logcat -s "Crapette"`
3. Check Expo documentation: https://docs.expo.dev/
4. Review React Native docs: https://reactnative.dev/docs/troubleshooting

Good luck testing! 🎮

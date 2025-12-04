#!/usr/bin/env node

/**
 * Crapette Mobile - Project Verification Script
 * Checks all required dependencies and configurations
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function pass(message) {
  console.log(`✅ ${message}`);
  checks.passed++;
}

function fail(message) {
  console.log(`❌ ${message}`);
  checks.failed++;
}

function warn(message) {
  console.log(`⚠️  ${message}`);
  checks.warnings++;
}

function section(title) {
  console.log(`\n📋 ${title}`);
  console.log('─'.repeat(50));
}

// Check 1: Node and npm
section('Runtime Environment');
const nodeVersion = process.version;
console.log(`Node version: ${nodeVersion}`);
if (parseInt(nodeVersion.split('.')[0].slice(1)) >= 18) {
  pass('Node.js 18+');
} else {
  fail('Node.js 18+ required');
}

const npmVersion = require('child_process')
  .execSync('npm -v')
  .toString()
  .trim();
console.log(`NPM version: ${npmVersion}`);

// Check 2: File structure
section('Project Files');
const requiredFiles = [
  'App.tsx',
  'app.json',
  'babel.config.js',
  'metro.config.js',
  'package.json',
  'tsconfig.json',
  'src/core/engine.ts',
  'src/core/rules.ts',
  'src/core/state.ts',
  'src/ai/ai.ts',
  'src/screens/MenuScreen.tsx',
  'src/screens/GameScreen.tsx',
  'src/screens/SettingsScreen.tsx',
  'src/i18n/i18n.ts',
];

requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    pass(`${file}`);
  } else {
    fail(`${file} - MISSING`);
  }
});

// Check 3: Dependencies
section('Dependencies');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const requiredDeps = [
    'react-native',
    'expo',
    '@react-navigation/native',
    'typescript',
    'jest',
  ];

  requiredDeps.forEach((dep) => {
    if (deps[dep]) {
      pass(`${dep} (${deps[dep]})`);
    } else {
      fail(`${dep} - NOT INSTALLED`);
    }
  });
} catch (e) {
  fail('Could not read package.json');
}

// Check 4: TypeScript compilation
section('TypeScript Compilation');
try {
  const { execSync } = require('child_process');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  pass('TypeScript compiles without errors');
} catch (e) {
  fail('TypeScript compilation errors - run: npm run build');
}

// Check 5: Tests
section('Test Suite');
try {
  const testFiles = [
    'src/tests/core.test.ts',
    'src/tests/engine.test.ts',
    'src/tests/crapette.test.ts',
    'src/ai/ai.test.ts',
    'src/firebase/gameService.test.ts',
  ];

  testFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      pass(`${file}`);
    } else {
      fail(`${file} - MISSING`);
    }
  });
} catch (e) {
  fail('Could not check test files');
}

// Check 6: Configuration files
section('Configuration Files');
const configFiles = ['app.json', 'babel.config.js', 'metro.config.js', 'tsconfig.json'];

configFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    try {
      if (file === 'app.json' || file === 'tsconfig.json') {
        JSON.parse(fs.readFileSync(file, 'utf8'));
      }
      pass(`${file} - valid`);
    } catch (e) {
      fail(`${file} - invalid JSON`);
    }
  }
});

// Check 7: Documentation
section('Documentation');
const docFiles = [
  'README.md',
  'TECH_SPEC.md',
  'ANDROID_SETUP.md',
  'QUICKSTART_ANDROID.md',
  'COMPLETION_SUMMARY.md',
];

docFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    pass(`${file}`);
  } else {
    warn(`${file} - missing`);
  }
});

// Check 8: Android setup
section('Android Development Setup');
try {
  const { execSync } = require('child_process');
  
  try {
    execSync('adb version', { stdio: 'pipe' });
    pass('Android SDK (adb) detected');
  } catch {
    warn('Android SDK not found - install Android Studio to develop for Android');
  }

  try {
    execSync('java -version', { stdio: 'pipe' });
    pass('Java/JDK detected');
  } catch {
    warn('Java/JDK not found - install from https://adoptium.net/');
  }
} catch (e) {
  warn('Could not verify Android setup');
}

// Summary
section('Summary');
console.log(`\n✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);

if (checks.failed === 0) {
  console.log('\n🎉 All checks passed! Ready to develop.');
  console.log('\nNext steps:');
  console.log('1. npm start                 - Start dev server');
  console.log('2. npm run android           - Launch on Android emulator');
  console.log('3. Check QUICKSTART_ANDROID.md for detailed guide');
  process.exit(0);
} else {
  console.log('\n⚠️  Please fix the failures above before continuing.');
  console.log('See ANDROID_SETUP.md for help.');
  process.exit(1);
}

/**
 * Settings Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { t, setLanguage, getLanguage } from '../i18n/i18n';

export default function SettingsScreen({ navigation }: any) {
  const [language, setLanguageState] = useState(getLanguage());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const handleLanguageChange = (lang: string) => {
    setLanguageState(lang);
    setLanguage(lang);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Language Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌐 Language</Text>
        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              language === 'en' && styles.selectedLanguage,
            ]}
            onPress={() => handleLanguageChange('en')}
          >
            <Text style={styles.languageText}>🇺🇸 English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.languageButton,
              language === 'fr' && styles.selectedLanguage,
            ]}
            onPress={() => handleLanguageChange('fr')}
          >
            <Text style={styles.languageText}>🇫🇷 Français</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Audio Section */}
      <View style={styles.section}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>🔊 Sound Effects</Text>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: '#767577', true: '#81c784' }}
            thumbColor={soundEnabled ? '#4caf50' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Display Section */}
      <View style={styles.section}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>✨ Animations</Text>
          <Switch
            value={animationsEnabled}
            onValueChange={setAnimationsEnabled}
            trackColor={{ false: '#767577', true: '#81c784' }}
            thumbColor={animationsEnabled ? '#4caf50' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Game Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ About</Text>
        <Text style={styles.infoText}>
          Crapette Mobile Game v1.0
        </Text>
        <Text style={styles.infoText}>
          A classic two-player card game with AI opponent.
        </Text>
        <Text style={styles.infoText}>
          Master your strategy and challenge the AI!
        </Text>
      </View>

      {/* Rules Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📖 How to Play</Text>
        <Text style={styles.rulesText}>
          1. Move cards to build foundations (Ace to King)
        </Text>
        <Text style={styles.rulesText}>
          2. Arrange tableau in descending order with alternating colors
        </Text>
        <Text style={styles.rulesText}>
          3. Use reserve cards strategically
        </Text>
        <Text style={styles.rulesText}>
          4. First to complete all foundations wins!
        </Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Menu')}
      >
        <Text style={styles.backButtonText}>Back to Menu</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  optionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ecf0f1',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLanguage: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  infoText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 8,
    lineHeight: 20,
  },
  rulesText: {
    fontSize: 12,
    color: '#34495e',
    marginBottom: 8,
    lineHeight: 18,
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

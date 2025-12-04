/**
 * Menu Screen - Main game menu
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { t } from '../i18n/i18n';

export default function MenuScreen({ navigation }: any) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>♠️ CRAPETTE ♠️</Text>
        <Text style={styles.subtitle}>The Classic Card Game</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('AIGame', { opponent: 'easy' })}
        >
          <Text style={styles.buttonText}>Play vs Easy AI</Text>
          <Text style={styles.buttonSubtext}>Perfect for learning</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('AIGame', { opponent: 'medium' })}
        >
          <Text style={styles.buttonText}>Play vs Medium AI</Text>
          <Text style={styles.buttonSubtext}>Fair challenge</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('AIGame', { opponent: 'hard' })}
        >
          <Text style={styles.buttonText}>Play vs Hard AI</Text>
          <Text style={styles.buttonSubtext}>Expert difficulty</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, styles.settingsButton]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.buttonText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Master the art of Crapette! Challenge yourself against AI opponents.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ecf0f1',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  buttonContainer: {
    gap: 12,
    marginVertical: 20,
  },
  primaryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingsButton: {
    backgroundColor: '#95a5a6',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  buttonSubtext: {
    fontSize: 12,
    color: '#ecf0f1',
    marginTop: 4,
  },
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#bdc3c7',
  },
  footerText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

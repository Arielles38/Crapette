/**
 * AI Lobby Screen - Select difficulty
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function AILobbyScreen({ navigation }: any) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Difficulty</Text>
        <Text style={styles.subtitle}>Choose your AI opponent</Text>
      </View>

      <View style={styles.optionContainer}>
        <TouchableOpacity
          style={[styles.option, styles.easyOption]}
          onPress={() => navigation.navigate('AIGame', { opponent: 'easy' })}
        >
          <Text style={styles.optionTitle}>🟢 Easy</Text>
          <Text style={styles.optionDescription}>
            AI makes mostly random moves. Great for learning.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, styles.mediumOption]}
          onPress={() => navigation.navigate('AIGame', { opponent: 'medium' })}
        >
          <Text style={styles.optionTitle}>🟡 Medium</Text>
          <Text style={styles.optionDescription}>
            Balanced AI. Makes mostly good moves with some variance.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, styles.hardOption]}
          onPress={() => navigation.navigate('AIGame', { opponent: 'hard' })}
        >
          <Text style={styles.optionTitle}>🔴 Hard</Text>
          <Text style={styles.optionDescription}>
            Expert AI. Always makes the best move. Very challenging!
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  optionContainer: {
    gap: 12,
    marginVertical: 20,
  },
  option: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  easyOption: {
    backgroundColor: '#2ecc71',
    opacity: 0.9,
  },
  mediumOption: {
    backgroundColor: '#f39c12',
    opacity: 0.9,
  },
  hardOption: {
    backgroundColor: '#e74c3c',
    opacity: 0.9,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 13,
    color: '#ecf0f1',
    lineHeight: 18,
  },
  backButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

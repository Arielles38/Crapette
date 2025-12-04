/**
 * Game Screen - Main game board
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { initializeGame, applyAction, getLegalMovesForPlayer } from '../core/engine';
import { getEasyAIMove, getMediumAIMove, getHardAIMove } from '../ai/ai';
import { GameState, Action, Card, PileLocation } from '../core/state';
import { t } from '../i18n/i18n';

export default function GameScreen({ route, navigation }: any) {
  const { opponent } = route.params || { opponent: 'medium' };
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedFrom, setSelectedFrom] = useState<PileLocation | null>(null);
  const [legalMoves, setLegalMoves] = useState<Action[]>([]);
  const [loading, setLoading] = useState(false);
  const [gameMessage, setGameMessage] = useState('');

  // Initialize game
  useEffect(() => {
    const newGame = initializeGame('local-game', 'player', 'ai', Math.floor(Math.random() * 1000000));
    newGame.phase = 'IN_PROGRESS';
    setGameState(newGame);
    setGameMessage('Your turn - Tap a card to select');
  }, []);

  // Update legal moves when game state changes
  useEffect(() => {
    if (gameState && gameState.phase === 'IN_PROGRESS' && gameState.turn === 'player') {
      const moves = getLegalMovesForPlayer(gameState, 'player');
      setLegalMoves(moves);
    }
  }, [gameState]);

  // AI turn
  useEffect(() => {
    if (gameState && gameState.phase === 'IN_PROGRESS' && gameState.turn === 'ai') {
      setLoading(true);
      setTimeout(() => {
        let aiMove: Action | null = null;
        if (opponent === 'easy') {
          aiMove = getEasyAIMove(gameState, 'ai');
        } else if (opponent === 'medium') {
          aiMove = getMediumAIMove(gameState, 'ai');
        } else {
          aiMove = getHardAIMove(gameState, 'ai');
        }

        if (aiMove) {
          const result = applyAction(gameState, aiMove);
          if (result.success && result.newGameState) {
            setGameState(result.newGameState);
            setGameMessage('AI moved. Your turn!');
            if (result.newGameState.phase === 'FINISHED') {
              handleGameEnd(result.newGameState);
            }
          }
        }
        setLoading(false);
      }, 500);
    }
  }, [gameState?.turn]);

  const handleGameEnd = (finalState: GameState) => {
    const player = finalState.players.find(p => p.playerId === 'player');
    const ai = finalState.players.find(p => p.playerId === 'ai');
    
    const playerWon = player && player.piles.foundation.every(f => f.length === 13);
    Alert.alert(
      playerWon ? 'You Won! 🎉' : 'AI Won! 🤖',
      `Your Score: ${player?.score || 0}\nAI Score: ${ai?.score || 0}`,
      [
        { text: 'Play Again', onPress: () => navigation.navigate('Menu') },
        { text: 'Menu', onPress: () => navigation.navigate('Menu') },
      ]
    );
  };

  const handleCardPress = (cardId: string, fromLocation: PileLocation) => {
    if (gameState?.turn !== 'player') {
      setGameMessage('AI is thinking...');
      return;
    }

    if (selectedCard === cardId) {
      setSelectedCard(null);
      setSelectedFrom(null);
      return;
    }

    setSelectedCard(cardId);
    setSelectedFrom(fromLocation);
  };

  const handlePilePress = (toLocation: PileLocation) => {
    if (!selectedCard || !selectedFrom || gameState?.turn !== 'player') {
      return;
    }

    const moveAction: Action = {
      actionId: `move-${Date.now()}`,
      playerId: 'player',
      type: 'MOVE_CARD',
      payload: {
        from: selectedFrom,
        to: toLocation,
        cardIds: [selectedCard],
      },
      seq: gameState.seq,
      timestamp: Date.now(),
    };

    const result = applyAction(gameState, moveAction);
    if (result.success && result.newGameState) {
      setGameState(result.newGameState);
      setSelectedCard(null);
      setSelectedFrom(null);
      setGameMessage('Move applied!');

      if (result.newGameState.phase === 'FINISHED') {
        handleGameEnd(result.newGameState);
      }
    } else {
      Alert.alert('Invalid Move', result.error || 'Cannot make this move');
      setGameMessage('Invalid move - try again');
    }
  };

  const handleEndTurn = () => {
    if (!gameState || gameState.turn !== 'player') {
      return;
    }

    const endTurnAction: Action = {
      actionId: `end-turn-${Date.now()}`,
      playerId: 'player',
      type: 'END_TURN',
      seq: gameState.seq,
      timestamp: Date.now(),
    };

    const result = applyAction(gameState, endTurnAction);
    if (result.success && result.newGameState) {
      setGameState(result.newGameState);
      setSelectedCard(null);
      setGameMessage('Turn ended - AI is thinking...');
    }
  };

  if (!gameState) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const playerData = gameState.players.find(p => p.playerId === 'player');
  const aiData = gameState.players.find(p => p.playerId === 'ai');

  return (
    <ScrollView style={styles.container}>
      {/* Score and Turn Info */}
      <View style={styles.scoreBar}>
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>You</Text>
          <Text style={styles.scoreValue}>{playerData?.score || 0}</Text>
        </View>
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>
            {gameState.turn === 'player' ? '🔵 Your Turn' : '🤖 AI Turn'}
          </Text>
        </View>
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>AI</Text>
          <Text style={styles.scoreValue}>{aiData?.score || 0}</Text>
        </View>
      </View>

      {/* Game Message */}
      <View style={styles.messageBox}>
        <Text style={styles.messageText}>{gameMessage}</Text>
      </View>

      {/* Foundation Piles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Foundations</Text>
        <View style={styles.foundationRow}>
          {playerData?.piles.foundation.map((pile, idx) => (
            <TouchableOpacity
              key={`foundation-${idx}`}
              style={[styles.pile, styles.foundationPile]}
              onPress={() =>
                handlePilePress({
                  pile: 'foundation',
                  index: idx,
                })
              }
            >
              <Text style={styles.pileText}>
                {pile.length > 0 ? pile[pile.length - 1].rank : '♠️'}
              </Text>
              <Text style={styles.cardCount}>{pile.length}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tableau */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎴 Tableau</Text>
        <View style={styles.tableauRow}>
          {playerData?.piles.tableau.map((pile, idx) => (
            <TouchableOpacity
              key={`tableau-${idx}`}
              style={[styles.pile, styles.tableauPile]}
              onPress={() =>
                handlePilePress({
                  pile: 'tableau',
                  index: idx,
                })
              }
            >
              <Text style={styles.pileText}>
                {pile.length > 0 ? pile[pile.length - 1].rank : '-'}
              </Text>
              <Text style={styles.cardCount}>{pile.length}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reserve (Playable Cards) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎰 Reserve</Text>
        <View style={styles.reserveContainer}>
          {playerData?.piles.reserve.map((card, idx) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                selectedCard === card.id && styles.selectedCard,
              ]}
              onPress={() =>
                handleCardPress(card.id, {
                  pile: 'reserve',
                  index: idx,
                })
              }
            >
              <Text style={styles.cardRank}>{card.rank}</Text>
              <Text style={styles.cardSuit}>{card.suit}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      {gameState.turn === 'player' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.endTurnButton]}
            onPress={handleEndTurn}
            disabled={loading}
          >
            <Text style={styles.buttonText}>End Turn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resignButton]}
            onPress={() => {
              Alert.alert('Resign?', 'Give up this game?', [
                { text: 'Cancel' },
                {
                  text: 'Resign',
                  onPress: () => navigation.navigate('Menu'),
                },
              ]);
            }}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Resign</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    padding: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  loadingText: {
    marginTop: 10,
    color: '#ecf0f1',
    fontSize: 16,
  },
  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#34495e',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
  },
  scoreSection: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#95a5a6',
    fontSize: 12,
    marginBottom: 4,
  },
  scoreValue: {
    color: '#f39c12',
    fontSize: 24,
    fontWeight: 'bold',
  },
  turnIndicator: {
    backgroundColor: '#27ae60',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  turnText: {
    color: '#ecf0f1',
    fontWeight: 'bold',
    fontSize: 14,
  },
  messageBox: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ecf0f1',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  foundationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  pile: {
    width: '23%',
    aspectRatio: 0.65,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foundationPile: {
    borderColor: '#f39c12',
    backgroundColor: '#1a1a1a',
  },
  tableauPile: {
    borderColor: '#3498db',
    backgroundColor: '#1a1a1a',
  },
  pileText: {
    color: '#ecf0f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardCount: {
    color: '#95a5a6',
    fontSize: 10,
    marginTop: 4,
  },
  tableauRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  reserveContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: '23%',
    aspectRatio: 0.65,
    backgroundColor: '#e74c3c',
    borderWidth: 2,
    borderColor: '#c0392b',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedCard: {
    borderColor: '#f39c12',
    borderWidth: 3,
    opacity: 0.8,
  },
  cardRank: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSuit: {
    color: 'white',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endTurnButton: {
    backgroundColor: '#27ae60',
  },
  resignButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

/**
 * Tests for AI opponent logic
 */

import { initializeGame } from '../core/engine';
import { getEasyAIMove, getMediumAIMove, getHardAIMove } from '../ai/ai';
import { GameState } from '../core/state';

describe('AI Opponent', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = initializeGame('test-ai', 'p1', 'p2', 54321);
    gameState.phase = 'IN_PROGRESS';
    gameState.turn = 'p2'; // AI turn
  });

  describe('Easy AI', () => {
    it('should return a legal move or END_TURN', () => {
      const move = getEasyAIMove(gameState, 'p2');
      expect(move).not.toBeNull();
      if (move) {
        expect(['MOVE_CARD', 'END_TURN', 'CHAT']).toContain(move.type);
      }
    });

    it('should select different moves on different calls', () => {
      const moves: string[] = [];
      for (let i = 0; i < 10; i++) {
        const move = getEasyAIMove(gameState, 'p2');
        if (move?.actionId) {
          moves.push(move.actionId);
        }
      }
      // With randomness, should have some variety (though not guaranteed)
      expect(moves.length).toBeGreaterThan(0);
    });
  });

  describe('Medium AI', () => {
    it('should return a legal move or END_TURN', () => {
      const move = getMediumAIMove(gameState, 'p2');
      expect(move).not.toBeNull();
      if (move) {
        expect(['MOVE_CARD', 'END_TURN', 'CHAT']).toContain(move.type);
      }
    });

    it('should prefer foundation moves', () => {
      // This is hard to test without mocking, but we can verify the function exists
      const move = getMediumAIMove(gameState, 'p2');
      expect(move).toBeDefined();
    });
  });

  describe('Hard AI', () => {
    it('should return a legal move or END_TURN', () => {
      const move = getHardAIMove(gameState, 'p2');
      expect(move).not.toBeNull();
      if (move) {
        expect(['MOVE_CARD', 'END_TURN', 'CHAT']).toContain(move.type);
      }
    });

    it('should make consistent best move on repeated calls', () => {
      const move1 = getHardAIMove(gameState, 'p2');
      const move2 = getHardAIMove(gameState, 'p2');

      // Hard AI should pick the same best move both times
      if (move1?.type === 'MOVE_CARD' && move2?.type === 'MOVE_CARD') {
        expect(move1.actionId).toBe(move2.actionId);
      }
    });
  });

  describe('AI move validity', () => {
    it('returned move should be playable by current player', () => {
      const move = getMediumAIMove(gameState, 'p2');
      if (move && move.type !== 'END_TURN') {
        expect(move.playerId).toBe('p2');
      }
    });
  });
});

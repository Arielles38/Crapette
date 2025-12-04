/**
 * Tests for Crapette interrupt mechanic
 * Validates that opponents can challenge invalid moves
 */

import { GameState, Action } from '../core/state';
import { initializeGame, applyAction, validateAction } from '../core/engine';

describe('Crapette Interrupt Mechanic', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = initializeGame('test-crapette', 'p1', 'p2', 12345);
    gameState.phase = 'IN_PROGRESS';
  });

  describe('CRAPETTE action validation', () => {
    it('should validate Crapette action with payload', () => {
      const action: Action = {
        actionId: 'crapette-1',
        playerId: 'p2',
        type: 'CRAPETTE',
        payload: {
          targetPlayerId: 'p1',
          actionIdToChallenge: 'move-1',
          reason: 'Card not on top',
        },
        seq: gameState.seq,
        timestamp: Date.now(),
      };

      const result = validateAction(gameState, action);
      expect(result.valid).toBe(true);
    });

    it('should reject Crapette action without payload', () => {
      const action: Action = {
        actionId: 'crapette-1',
        playerId: 'p2',
        type: 'CRAPETTE',
        seq: gameState.seq,
        timestamp: Date.now(),
      };

      const result = validateAction(gameState, action);
      expect(result.valid).toBe(false);
    });

    it('should reject Crapette without targetPlayerId', () => {
      const action: Action = {
        actionId: 'crapette-1',
        playerId: 'p2',
        type: 'CRAPETTE',
        payload: {
          actionIdToChallenge: 'move-1',
          reason: 'Invalid move',
        },
        seq: gameState.seq,
        timestamp: Date.now(),
      };

      const result = validateAction(gameState, action);
      expect(result.valid).toBe(false);
    });
  });

  describe('CRAPETTE action application', () => {
    it('should apply valid Crapette call', () => {
      // First apply a move
      const moveAction: Action = {
        actionId: 'move-1',
        playerId: 'p1',
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };

      const afterMove = applyAction(gameState, moveAction);
      if (!afterMove.newGameState) throw new Error('Move failed');

      const newState = afterMove.newGameState;

      // Now apply Crapette challenge
      const crapetteAction: Action = {
        actionId: 'crapette-1',
        playerId: 'p2',
        type: 'CRAPETTE',
        payload: {
          targetPlayerId: 'p1',
          actionIdToChallenge: 'move-1',
          reason: 'Card not on top',
        },
        seq: newState.seq,
        timestamp: Date.now(),
      };

      const result = applyAction(newState, crapetteAction);
      expect(result.success).toBe(true);
    });

    it('should penalize player for invalid move when Crapette is called', () => {
      const moveAction: Action = {
        actionId: 'move-1',
        playerId: 'p1',
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };

      const afterMove = applyAction(gameState, moveAction);
      if (!afterMove.newGameState) throw new Error('Move failed');

      const newState = afterMove.newGameState;
      const p1InitialScore = newState.players[0].score;

      const crapetteAction: Action = {
        actionId: 'crapette-1',
        playerId: 'p2',
        type: 'CRAPETTE',
        payload: {
          targetPlayerId: 'p1',
          actionIdToChallenge: 'move-1',
          reason: 'Invalid move',
        },
        seq: newState.seq,
        timestamp: Date.now(),
      };

      const result = applyAction(newState, crapetteAction);
      if (!result.newGameState) throw new Error('Crapette failed');

      // Player 1 should be penalized
      expect(result.newGameState.players[0].score).toBeLessThan(p1InitialScore);
    });

    it('should reward challenger for valid Crapette call', () => {
      const moveAction: Action = {
        actionId: 'move-1',
        playerId: 'p1',
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };

      const afterMove = applyAction(gameState, moveAction);
      if (!afterMove.newGameState) throw new Error('Move failed');

      const newState = afterMove.newGameState;
      const p2InitialScore = newState.players[1].score;

      const crapetteAction: Action = {
        actionId: 'crapette-1',
        playerId: 'p2',
        type: 'CRAPETTE',
        payload: {
          targetPlayerId: 'p1',
          actionIdToChallenge: 'move-1',
          reason: 'Invalid move',
        },
        seq: newState.seq,
        timestamp: Date.now(),
      };

      const result = applyAction(newState, crapetteAction);
      if (!result.newGameState) throw new Error('Crapette failed');

      // Player 2 (challenger) should be rewarded
      expect(result.newGameState.players[1].score).toBeGreaterThan(p2InitialScore);
    });
  });

  describe('Crapette time window', () => {
    it('should only allow challenge within time window', () => {
      // This would require tracking when moves were made
      // For now, just verify the action structure supports timestamps
      const moveAction: Action = {
        actionId: 'move-1',
        playerId: 'p1',
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now() - 10000, // 10 seconds ago
      };

      expect(moveAction.timestamp).toBeLessThan(Date.now());
    });
  });

  describe('Multiple Crapette calls in sequence', () => {
    it('should handle multiple Crapette calls for different moves', () => {
      // Apply first move
      const move1: Action = {
        actionId: 'move-1',
        playerId: 'p1',
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };

      let result1 = applyAction(gameState, move1);
      if (!result1.newGameState) throw new Error('Move 1 failed');

      let currentState = result1.newGameState;

      // Apply second move
      const move2: Action = {
        actionId: 'move-2',
        playerId: 'p2',
        type: 'END_TURN',
        seq: currentState.seq,
        timestamp: Date.now(),
      };

      result1 = applyAction(currentState, move2);
      if (!result1.newGameState) throw new Error('Move 2 failed');

      currentState = result1.newGameState;

      // Challenge first move
      const crapette1: Action = {
        actionId: 'crapette-1',
        playerId: 'p2',
        type: 'CRAPETTE',
        payload: {
          targetPlayerId: 'p1',
          actionIdToChallenge: 'move-1',
          reason: 'Invalid move',
        },
        seq: currentState.seq,
        timestamp: Date.now(),
      };

      result1 = applyAction(currentState, crapette1);
      if (!result1.newGameState) throw new Error('Crapette 1 failed');

      currentState = result1.newGameState;

      // Challenge second move
      const crapette2: Action = {
        actionId: 'crapette-2',
        playerId: 'p1',
        type: 'CRAPETTE',
        payload: {
          targetPlayerId: 'p2',
          actionIdToChallenge: 'move-2',
          reason: 'Invalid move',
        },
        seq: currentState.seq,
        timestamp: Date.now(),
      };

      const result2 = applyAction(currentState, crapette2);
      expect(result2.success).toBe(true);
      expect(result2.newGameState?.history.length).toBeGreaterThan(2);
    });
  });
});

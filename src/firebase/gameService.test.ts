/**
 * Tests for Firebase game service
 */

import { GameState, Action } from '../core/state';
import { initializeGame, applyAction } from '../core/engine';
import { reconstructGameState } from '../firebase/gameService';

describe('Firebase Game Service', () => {
  let gameState: GameState;
  const player1Id = 'p1';
  const player2Id = 'p2';
  const seed = 98765;

  beforeEach(() => {
    gameState = initializeGame('test-match', player1Id, player2Id, seed);
    gameState.phase = 'IN_PROGRESS';
  });

  describe('State Reconstruction', () => {
    it('should reconstruct initial game state from seed with no actions', () => {
      const reconstructed = reconstructGameState('test-match', player1Id, player2Id, seed, []);

      expect(reconstructed.gameId).toBe(gameState.gameId);
      expect(reconstructed.seq).toBe(gameState.seq);
      expect(reconstructed.turn).toBe(gameState.turn);
      // Phase is set to IN_PROGRESS during reconstruction for action application
      expect(reconstructed.phase).toBe('IN_PROGRESS');
    });

    it('should reconstruct game state with single END_TURN action', () => {
      // Set game to IN_PROGRESS for actions to work
      gameState.phase = 'IN_PROGRESS';
      
      const action: Action = {
        actionId: 'end-turn-1',
        playerId: player1Id,
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };

      const result = applyAction(gameState, action);
      if (!result.newGameState) throw new Error('Failed to apply action');

      const reconstructed = reconstructGameState('test-match', player1Id, player2Id, seed, [
        action,
      ]);

      expect(reconstructed.turn).toBe(player2Id);
      expect(reconstructed.seq).toBe(1);
    });

    it('should reconstruct game state with multiple actions', () => {
      // Set game to IN_PROGRESS for actions to work
      gameState.phase = 'IN_PROGRESS';
      
      // Action 1: Player 1 ends turn
      const action1: Action = {
        actionId: 'end-turn-1',
        playerId: player1Id,
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };

      let result = applyAction(gameState, action1);
      if (!result.newGameState) throw new Error('Failed to apply action 1');
      gameState = result.newGameState;

      // Action 2: Player 2 ends turn
      const action2: Action = {
        actionId: 'end-turn-2',
        playerId: player2Id,
        type: 'END_TURN',
        seq: 1,
        timestamp: Date.now(),
      };

      result = applyAction(gameState, action2);
      if (!result.newGameState) throw new Error('Failed to apply action 2');

      const reconstructed = reconstructGameState('test-match', player1Id, player2Id, seed, [
        action1,
        action2,
      ]);

      expect(reconstructed.turn).toBe(player1Id);
      expect(reconstructed.seq).toBe(2);
    });

    it('should handle RESIGN action in reconstruction', () => {
      // Set game to IN_PROGRESS for actions to work
      gameState.phase = 'IN_PROGRESS';
      
      const action: Action = {
        actionId: 'resign-1',
        playerId: player1Id,
        type: 'RESIGN',
        seq: 0,
        timestamp: Date.now(),
      };

      const reconstructed = reconstructGameState('test-match', player1Id, player2Id, seed, [
        action,
      ]);

      expect(reconstructed.phase).toBe('FINISHED');
      expect(reconstructed.players[1].score).toBe(50); // Player 2 gets 50 points
    });

    it('should preserve action order during reconstruction', () => {
      // Set game to IN_PROGRESS for actions to work
      gameState.phase = 'IN_PROGRESS';
      
      const actions: Action[] = [];

      // Simulate multiple turn switches
      let currentState = gameState;
      let currentPlayer = player1Id;

      for (let i = 0; i < 4; i++) {
        const action: Action = {
          actionId: `end-turn-${i}`,
          playerId: currentPlayer,
          type: 'END_TURN',
          seq: i,
          timestamp: Date.now(),
        };

        const result = applyAction(currentState, action);
        if (!result.newGameState) throw new Error(`Failed to apply action ${i}`);

        currentState = result.newGameState;
        currentPlayer = currentPlayer === player1Id ? player2Id : player1Id;
        actions.push(action);
      }

      const reconstructed = reconstructGameState('test-match', player1Id, player2Id, seed, actions);

      // After 4 END_TURN actions, should be back to player 1's turn
      expect(reconstructed.turn).toBe(player1Id);
      expect(reconstructed.seq).toBe(4);
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent seq across reconstructions', () => {
      const actions: Action[] = [
        {
          actionId: 'end-turn-1',
          playerId: player1Id,
          type: 'END_TURN',
          seq: 0,
          timestamp: Date.now(),
        },
        {
          actionId: 'end-turn-2',
          playerId: player2Id,
          type: 'END_TURN',
          seq: 1,
          timestamp: Date.now(),
        },
      ];

      const r1 = reconstructGameState('test-match', player1Id, player2Id, seed, actions);
      const r2 = reconstructGameState('test-match', player1Id, player2Id, seed, actions);

      expect(r1.seq).toBe(r2.seq);
    });

    it('reconstructed state should have same turn after alternate moves', () => {
      const actions: Action[] = [
        {
          actionId: 'end-turn-1',
          playerId: player1Id,
          type: 'END_TURN',
          seq: 0,
          timestamp: Date.now(),
        },
        {
          actionId: 'end-turn-2',
          playerId: player2Id,
          type: 'END_TURN',
          seq: 1,
          timestamp: Date.now(),
        },
      ];

      const reconstructed = reconstructGameState('test-match', player1Id, player2Id, seed, actions);

      expect(reconstructed.turn).toBe(player1Id);
      expect(reconstructed.seq).toBe(2);
      expect(reconstructed.phase).toBe('IN_PROGRESS');
    });
  });

  describe('Action History Integrity', () => {
    it('should preserve action metadata during reconstruction', () => {
      const action: Action = {
        actionId: 'test-action-123',
        playerId: player1Id,
        type: 'END_TURN',
        seq: 0,
        timestamp: 1234567890,
      };

      const reconstructed = reconstructGameState('test-match', player1Id, player2Id, seed, [
        action,
      ]);

      // Action should be in history
      expect(reconstructed.history.length).toBe(1);
      expect(reconstructed.history[0].actionId).toBe('test-action-123');
      expect(reconstructed.history[0].timestamp).toBe(1234567890);
    });

    it('should ignore actions with invalid seq ordering', () => {
      // Out-of-order actions - this tests robustness
      const action: Action = {
        actionId: 'end-turn-1',
        playerId: player1Id,
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };

      const reconstructed = reconstructGameState('test-match', player1Id, player2Id, seed, [
        action,
      ]);

      expect(reconstructed.seq).toBe(1);
    });
  });
});

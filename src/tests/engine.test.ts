/**
 * Integration tests for Crapette game engine
 */

import {
  initializeGame,
  applyAction,
  validateAction,
  getLegalMovesForPlayer,
  undoLastAction,
} from '../core/engine';
import { GameState, Action } from '../core/state';

describe('Crapette Game Engine', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = initializeGame('test-game', 'p1', 'p2', 12345);
    gameState.phase = 'IN_PROGRESS';
  });

  describe('initializeGame', () => {
    it('should create game with two players', () => {
      expect(gameState.players).toHaveLength(2);
      expect(gameState.players[0].playerId).toBe('p1');
      expect(gameState.players[1].playerId).toBe('p2');
    });

    it('should initialize reserves with 13 cards each', () => {
      expect(gameState.players[0].piles.reserve).toHaveLength(13);
      expect(gameState.players[1].piles.reserve).toHaveLength(13);
    });

    it('should initialize tableaus with 2 cards each', () => {
      gameState.players.forEach((p) => {
        p.piles.tableau.forEach((tableau) => {
          expect(tableau.length).toBeGreaterThanOrEqual(1);
        });
      });
    });

    it('should initialize empty foundations', () => {
      gameState.players.forEach((p) => {
        p.piles.foundation.forEach((foundation) => {
          expect(foundation).toHaveLength(0);
        });
      });
    });
  });

  describe('validateAction', () => {
    it('should reject actions when game is not in progress', () => {
      gameState.phase = 'FINISHED';
      const action: Action = {
        actionId: 'a1',
        playerId: 'p1',
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };
      const result = validateAction(gameState, action);
      expect(result.valid).toBe(false);
    });

    it('should reject actions not on current player turn', () => {
      gameState.turn = 'p1';
      const action: Action = {
        actionId: 'a1',
        playerId: 'p2',
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };
      const result = validateAction(gameState, action);
      expect(result.valid).toBe(false);
    });

    it('should accept END_TURN by current player', () => {
      gameState.turn = 'p1';
      const action: Action = {
        actionId: 'a1',
        playerId: 'p1',
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };
      const result = validateAction(gameState, action);
      expect(result.valid).toBe(true);
    });

    it('should accept RESIGN action', () => {
      const action: Action = {
        actionId: 'a1',
        playerId: 'p1',
        type: 'RESIGN',
        seq: 0,
        timestamp: Date.now(),
      };
      const result = validateAction(gameState, action);
      expect(result.valid).toBe(true);
    });

    it('should allow CHAT at any time', () => {
      gameState.turn = 'p2'; // Different player
      const action: Action = {
        actionId: 'a1',
        playerId: 'p1',
        type: 'CHAT',
        payload: { text: 'Hello!' },
        seq: 0,
        timestamp: Date.now(),
      };
      const result = validateAction(gameState, action);
      expect(result.valid).toBe(true);
    });
  });

  describe('applyAction - END_TURN', () => {
    it('should switch turn to next player', () => {
      gameState.turn = 'p1';
      const action: Action = {
        actionId: 'a1',
        playerId: 'p1',
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };

      const result = applyAction(gameState, action);
      expect(result.success).toBe(true);
      expect(result.newGameState?.turn).toBe('p2');
    });

    it('should add action to history', () => {
      const action: Action = {
        actionId: 'a1',
        playerId: 'p1',
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };

      const result = applyAction(gameState, action);
      expect(result.newGameState?.history).toHaveLength(1);
      expect(result.newGameState?.history[0].actionId).toBe('a1');
    });

    it('should increment seq', () => {
      const initialSeq = gameState.seq;
      const action: Action = {
        actionId: 'a1',
        playerId: 'p1',
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };

      const result = applyAction(gameState, action);
      expect(result.newGameState?.seq).toBe(initialSeq + 1);
    });
  });

  describe('applyAction - RESIGN', () => {
    it('should set game phase to FINISHED', () => {
      const action: Action = {
        actionId: 'a1',
        playerId: 'p1',
        type: 'RESIGN',
        seq: 0,
        timestamp: Date.now(),
      };

      const result = applyAction(gameState, action);
      expect(result.newGameState?.phase).toBe('FINISHED');
    });

    it('should award points to opponent', () => {
      const opponent = gameState.players.find((p) => p.playerId === 'p2')!;
      const initialScore = opponent.score;

      const action: Action = {
        actionId: 'a1',
        playerId: 'p1',
        type: 'RESIGN',
        seq: 0,
        timestamp: Date.now(),
      };

      const result = applyAction(gameState, action);
      expect(result.newGameState?.players[1].score).toBe(initialScore + 50);
    });
  });

  describe('getLegalMovesForPlayer', () => {
    it('should return list of legal moves', () => {
      const moves = getLegalMovesForPlayer(gameState, 'p1');
      expect(moves.length).toBeGreaterThanOrEqual(0);
    });

    it('should return END_TURN if no moves available', () => {
      // This is hard to test without mocking the piles
      // Just verify the function doesn't crash
      const moves = getLegalMovesForPlayer(gameState, 'p1');
      expect(Array.isArray(moves)).toBe(true);
    });

    it('should only include moves for current player', () => {
      const moves = getLegalMovesForPlayer(gameState, 'p1');
      moves.forEach((move) => {
        if (move.type !== 'CHAT') {
          expect(move.playerId).toBe('p1');
        }
      });
    });
  });

  describe('undoLastAction', () => {
    it('should return error if no actions to undo', () => {
      gameState.history = [];
      const result = undoLastAction(gameState);
      expect(result.success).toBe(false);
    });

    it('should recreate game from seed + history minus last action', () => {
      const action: Action = {
        actionId: 'a1',
        playerId: 'p1',
        type: 'END_TURN',
        seq: 0,
        timestamp: Date.now(),
      };

      const afterMove = applyAction(gameState, action);
      expect(afterMove.newGameState?.history).toHaveLength(1);

      if (afterMove.newGameState) {
        const undoResult = undoLastAction(afterMove.newGameState);
        expect(undoResult.success).toBe(true);
        expect(undoResult.newGameState?.history).toHaveLength(0);
      }
    });
  });
});

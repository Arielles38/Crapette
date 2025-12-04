/**
 * AI opponent for Crapette card game
 * Implements rule-based heuristics for move selection
 */

import { GameState, Action } from '../core/state';
import { getLegalMovesForPlayer } from '../core/engine';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Score a move based on heuristics
 */
function scoreMove(move: Action, _gameState: GameState, _playerId: string): number {
  let score = 0;

  if (move.type !== 'MOVE_CARD') {
    return score;
  }

  const payload = move.payload;
  if (!payload) return score;

  // Prefer moves to foundation (highest priority)
  if (payload.to.pile === 'foundation') {
    score += 100;
  }

  // Prefer moves that clear reserve
  if (payload.from.pile === 'reserve') {
    score += 50;
  }

  // Slightly prefer tableau to tableau moves (opens up cards)
  if (payload.from.pile === 'tableau' && payload.to.pile === 'tableau') {
    score += 10;
  }

  // Penalty for moving from foundation (should not do this)
  if (payload.from.pile === 'foundation') {
    score -= 1000;
  }

  return score;
}

/**
 * Select next move for AI player
 */
export function selectAIMove(
  gameState: GameState,
  playerId: string,
  difficulty: AIDifficulty = 'medium'
): Action | null {
  const legalMoves = getLegalMovesForPlayer(gameState, playerId);

  if (legalMoves.length === 0) {
    // No legal moves, end turn
    return {
      actionId: `ai-end-turn-${Date.now()}`,
      playerId,
      type: 'END_TURN',
      seq: gameState.seq,
      timestamp: Date.now(),
    };
  }

  // Score each move
  const scoredMoves = legalMoves.map((move) => ({
    move,
    score: scoreMove(move, gameState, playerId),
  }));

  // Sort by score (descending)
  scoredMoves.sort((a, b) => b.score - a.score);

  // Select based on difficulty
  let selectedIndex = 0;

  if (difficulty === 'easy') {
    // Random from top 3
    selectedIndex = Math.floor(Math.random() * Math.min(3, scoredMoves.length));
  } else if (difficulty === 'medium') {
    // Mostly top choice, sometimes second
    selectedIndex = Math.random() < 0.8 ? 0 : Math.min(1, scoredMoves.length - 1);
  } else {
    // Always top choice
    selectedIndex = 0;
  }

  return scoredMoves[selectedIndex].move;
}

/**
 * Simulate N plies of lookahead for AI (optional advanced move)
 */
export function evaluateMoveWithLookahead(
  move: Action,
  gameState: GameState,
  _depth: number = 1
): number {
  // Simplified: just score the immediate move
  // Full minimax would require game simulation
  return scoreMove(move, gameState, move.playerId);
}

/**
 * Easy AI: random legal move
 */
export function getEasyAIMove(gameState: GameState, playerId: string): Action | null {
  return selectAIMove(gameState, playerId, 'easy');
}

/**
 * Medium AI: heuristic-based with some randomness
 */
export function getMediumAIMove(gameState: GameState, playerId: string): Action | null {
  return selectAIMove(gameState, playerId, 'medium');
}

/**
 * Hard AI: best move according to heuristics
 */
export function getHardAIMove(gameState: GameState, playerId: string): Action | null {
  return selectAIMove(gameState, playerId, 'hard');
}

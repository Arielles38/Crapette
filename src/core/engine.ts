/**
 * Core Crapette game engine: state transitions, move application, turn management
 */

import {
  GameState,
  Action,
  ValidationResult,
  ApplyResult,
  GameEvent,
  MovePayload,
  CrapettePayload,
  Card,
} from './state';
import {
  validateMove,
  hasPlayerWon,
  canPlaceOnFoundation,
  canPlaceOnTableau,
  createDeck,
  deterministicShuffle,
} from './rules';

/**
 * Initialize a new game with two players
 */
export function initializeGame(
  gameId: string,
  player1Id: string,
  player2Id: string,
  seed: number
): GameState {
  const deck = createDeck();
  const shuffled = deterministicShuffle(deck, seed);

  // Deal 13 cards to each player's reserve, rest to stock
  const p1Reserve = shuffled.slice(0, 13);
  const p2Reserve = shuffled.slice(13, 26);
  const p1Tableaus = [
    [shuffled[26], shuffled[27]],
    [shuffled[28], shuffled[29]],
    [shuffled[30], shuffled[31]],
    [shuffled[32], shuffled[33]],
  ];
  const p2Tableaus = [
    [shuffled[34], shuffled[35]],
    [shuffled[36], shuffled[37]],
    [shuffled[38], shuffled[39]],
    [shuffled[40], shuffled[41]],
  ];

  return {
    gameId,
    seed,
    phase: 'STARTING',
    turn: player1Id,
    players: [
      {
        playerId: player1Id,
        name: `Player 1`,
        connected: true,
        score: 0,
        piles: {
          reserve: p1Reserve,
          tableau: p1Tableaus,
          foundation: [[], [], [], []],
        },
      },
      {
        playerId: player2Id,
        name: `Player 2`,
        connected: true,
        score: 0,
        piles: {
          reserve: p2Reserve,
          tableau: p2Tableaus,
          foundation: [[], [], [], []],
        },
      },
    ],
    history: [],
    seq: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Validate an action before applying it
 */
export function validateAction(gameState: GameState, action: Action): ValidationResult {
  // Check if game is in progress
  if (gameState.phase !== 'IN_PROGRESS') {
    return { valid: false, reason: 'Game is not in progress' };
  }

  // Check if it's the player's turn (except for chat/resign/crapette)
  // CRAPETTE is an interrupt action, allowed on opponent's turn
  if (action.type !== 'CHAT' && action.type !== 'RESIGN' && action.type !== 'CRAPETTE') {
    if (action.playerId !== gameState.turn) {
      return { valid: false, reason: 'Not your turn' };
    }
  }

  const player = gameState.players.find((p) => p.playerId === action.playerId);
  if (!player) {
    return { valid: false, reason: 'Player not found' };
  }

  // Type-specific validation
  switch (action.type) {
    case 'MOVE_CARD': {
      const payload = action.payload as MovePayload;
      if (!payload || !payload.from || !payload.to || !payload.cardIds) {
        return { valid: false, reason: 'Invalid move payload' };
      }

      // Get source pile
      let sourcePile: Card[] = [];
      if (payload.from.pile === 'reserve') {
        sourcePile = player.piles.reserve;
      } else if (payload.from.pile === 'tableau') {
        sourcePile = player.piles.tableau[payload.from.index] || [];
      } else if (payload.from.pile === 'foundation') {
        sourcePile = player.piles.foundation[payload.from.index] || [];
      }

      // Get destination pile
      let destPile: Card[] = [];
      const destPlayer = gameState.players.find((p) => p.playerId === action.playerId);
      if (!destPlayer) return { valid: false, reason: 'Destination player not found' };

      if (payload.to.pile === 'reserve') {
        destPile = destPlayer.piles.reserve;
      } else if (payload.to.pile === 'tableau') {
        destPile = destPlayer.piles.tableau[payload.to.index] || [];
      } else if (payload.to.pile === 'foundation') {
        destPile = destPlayer.piles.foundation[payload.to.index] || [];
      }

      // Get cards to move
      const cardsToMove = payload.cardIds
        .map((id) => sourcePile.find((c) => c.id === id))
        .filter((c) => c !== undefined) as Card[];

      if (cardsToMove.length === 0) {
        return { valid: false, reason: 'Cards to move not found' };
      }

      // Validate move
      const moveType = payload.to.pile as 'foundation' | 'tableau' | 'reserve';
      if (moveType === 'reserve') {
        return { valid: false, reason: 'Cannot move to reserve' };
      }

      return validateMove(sourcePile, destPile, moveType, cardsToMove);
    }

    case 'END_TURN':
      return { valid: true, turnEnd: true };

    case 'RESIGN':
      return { valid: true };

    case 'CRAPETTE': {
      const payload = action.payload as CrapettePayload;
      if (!payload || !payload.targetPlayerId || !payload.actionIdToChallenge) {
        return { valid: false, reason: 'Invalid Crapette payload' };
      }
      return { valid: true };
    }

    case 'CHAT':
      return { valid: true };

    default:
      return { valid: false, reason: `Unknown action type: ${action.type}` };
  }
}

/**
 * Apply an action to game state and return new state
 */
export function applyAction(gameState: GameState, action: Action): ApplyResult {
  // Validate first
  const validation = validateAction(gameState, action);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  let newState = JSON.parse(JSON.stringify(gameState)) as GameState;
  const events: GameEvent[] = [];

  try {
    switch (action.type) {
      case 'MOVE_CARD': {
        const payload = action.payload as MovePayload;
        const player = newState.players.find((p) => p.playerId === action.playerId)!;

        // Get source and dest piles
        let sourcePile: Card[];
        let destPile: Card[];

        if (payload.from.pile === 'reserve') {
          sourcePile = player.piles.reserve;
        } else if (payload.from.pile === 'tableau') {
          sourcePile = player.piles.tableau[payload.from.index];
        } else {
          sourcePile = player.piles.foundation[payload.from.index];
        }

        if (payload.to.pile === 'tableau') {
          destPile = player.piles.tableau[payload.to.index];
        } else {
          destPile = player.piles.foundation[payload.to.index];
        }

        // Move cards
        const cardsToMove: Card[] = [];
        for (const cardId of payload.cardIds) {
          const idx = sourcePile.findIndex((c) => c.id === cardId);
          if (idx >= 0) {
            cardsToMove.push(...sourcePile.splice(idx, sourcePile.length - idx));
            break;
          }
        }

        destPile.push(...cardsToMove);

        // Check if player won
        if (hasPlayerWon(player)) {
          newState.phase = 'FINISHED';
          player.score += 100; // Bonus for winning
          events.push({ type: 'GAME_WON', playerId: action.playerId, timestamp: Date.now() });
        } else {
          // Move to next player's turn
          const currentIdx = newState.players.findIndex((p) => p.playerId === action.playerId);
          newState.turn = newState.players[(currentIdx + 1) % newState.players.length].playerId;
          events.push({ type: 'TURN_ENDED', playerId: action.playerId, timestamp: Date.now() });
        }

        events.push({ type: 'MOVE_APPLIED', playerId: action.playerId, timestamp: Date.now() });
        break;
      }

      case 'END_TURN': {
        const currentIdx = newState.players.findIndex((p) => p.playerId === action.playerId);
        newState.turn = newState.players[(currentIdx + 1) % newState.players.length].playerId;
        events.push({ type: 'TURN_ENDED', playerId: action.playerId, timestamp: Date.now() });
        break;
      }

      case 'RESIGN': {
        newState.phase = 'FINISHED';
        const opponent = newState.players.find((p) => p.playerId !== action.playerId)!;
        opponent.score += 50; // Bonus for opponent's resignation
        events.push({
          type: 'MOVE_REJECTED',
          playerId: action.playerId,
          data: { reason: 'Player resigned' },
          timestamp: Date.now(),
        });
        break;
      }

      case 'CRAPETTE': {
        const payload = action.payload as CrapettePayload;
        const challengedAction = newState.history.find(
          (a) => a.actionId === payload.actionIdToChallenge
        );

        if (!challengedAction) {
          return { success: false, error: 'Action to challenge not found' };
        }

        // For now, accept all Crapette calls as valid
        // In a full game, would validate the challenged move
        const targetPlayer = newState.players.find((p) => p.playerId === payload.targetPlayerId)!;
        targetPlayer.score -= 10; // Penalty for making invalid move
        const challenger = newState.players.find((p) => p.playerId === action.playerId)!;
        challenger.score += 5; // Bonus for valid challenge

        // Undo the challenged action
        // TODO: Implement full undo logic

        events.push({
          type: 'CRAPETTE_VALID',
          playerId: action.playerId,
          data: { challengedActionId: payload.actionIdToChallenge },
          timestamp: Date.now(),
        });
        break;
      }

      case 'CHAT': {
        // No state change, just event
        events.push({
          type: 'MOVE_APPLIED',
          playerId: action.playerId,
          data: { message: action.payload },
          timestamp: Date.now(),
        });
        break;
      }
    }

    // Add action to history
    newState.history.push(action);
    newState.seq++;
    newState.lastUpdated = Date.now();

    return {
      success: true,
      newGameState: newState,
      events,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Undo the last action
 */
export function undoLastAction(gameState: GameState): ApplyResult {
  if (gameState.history.length === 0) {
    return { success: false, error: 'No actions to undo' };
  }

  // Recreate game from seed + history (minus last action)
  const newState = initializeGame(
    gameState.gameId,
    gameState.players[0].playerId,
    gameState.players[1].playerId,
    gameState.seed
  );

  newState.phase = 'IN_PROGRESS';
  const historyWithoutLast = gameState.history.slice(0, -1);

  for (const action of historyWithoutLast) {
    const result = applyAction(newState, action);
    if (!result.success || !result.newGameState) {
      return { success: false, error: 'Failed to replay history during undo' };
    }
    Object.assign(newState, result.newGameState);
  }

  return { success: true, newGameState: newState, events: [] };
}

/**
 * Get list of legal moves for a player (for UI or AI)
 */
export function getLegalMovesForPlayer(gameState: GameState, playerId: string): Action[] {
  const player = gameState.players.find((p) => p.playerId === playerId);
  if (!player) return [];

  const moves: Action[] = [];
  let actionCount = 0;

  // Check reserve -> foundation
  const reserveTop = player.piles.reserve[player.piles.reserve.length - 1];
  if (reserveTop) {
    for (let i = 0; i < player.piles.foundation.length; i++) {
      if (canPlaceOnFoundation(player.piles.foundation[i], reserveTop)) {
        moves.push({
          actionId: `move-${actionCount++}`,
          playerId,
          type: 'MOVE_CARD',
          payload: {
            from: { pile: 'reserve', index: 0 },
            to: { pile: 'foundation', index: i },
            cardIds: [reserveTop.id],
          },
          seq: gameState.seq,
          timestamp: Date.now(),
        });
      }
    }
  }

  // Check reserve -> tableau
  if (reserveTop) {
    for (let i = 0; i < player.piles.tableau.length; i++) {
      if (canPlaceOnTableau(player.piles.tableau[i], reserveTop)) {
        moves.push({
          actionId: `move-${actionCount++}`,
          playerId,
          type: 'MOVE_CARD',
          payload: {
            from: { pile: 'reserve', index: 0 },
            to: { pile: 'tableau', index: i },
            cardIds: [reserveTop.id],
          },
          seq: gameState.seq,
          timestamp: Date.now(),
        });
      }
    }
  }

  // Check tableau -> foundation and tableau -> tableau
  for (let fromIdx = 0; fromIdx < player.piles.tableau.length; fromIdx++) {
    const tableauTop = player.piles.tableau[fromIdx][player.piles.tableau[fromIdx].length - 1];
    if (tableauTop) {
      // To foundation
      for (let i = 0; i < player.piles.foundation.length; i++) {
        if (canPlaceOnFoundation(player.piles.foundation[i], tableauTop)) {
          moves.push({
            actionId: `move-${actionCount++}`,
            playerId,
            type: 'MOVE_CARD',
            payload: {
              from: { pile: 'tableau', index: fromIdx },
              to: { pile: 'foundation', index: i },
              cardIds: [tableauTop.id],
            },
            seq: gameState.seq,
            timestamp: Date.now(),
          });
        }
      }

      // To other tableaus
      for (let toIdx = 0; toIdx < player.piles.tableau.length; toIdx++) {
        if (fromIdx !== toIdx && canPlaceOnTableau(player.piles.tableau[toIdx], tableauTop)) {
          moves.push({
            actionId: `move-${actionCount++}`,
            playerId,
            type: 'MOVE_CARD',
            payload: {
              from: { pile: 'tableau', index: fromIdx },
              to: { pile: 'tableau', index: toIdx },
              cardIds: [tableauTop.id],
            },
            seq: gameState.seq,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  return moves;
}

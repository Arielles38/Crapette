/**
 * Game service: Manages real-time sync of game state with Firebase
 * Handles action replication, state reconciliation, and turn management
 */

import { ref, set, push, get, onValue, update } from 'firebase/database';
import { database } from './firebaseConfig';
import { GameState, Action } from '../core/state';
import { applyAction, initializeGame } from '../core/engine';

const MATCHES_PATH = 'matches';
const ACTIONS_PATH = 'actions';
const STATE_PATH = 'state';

/**
 * Create a new game match in Firebase
 */
export async function createMatch(
  matchId: string,
  player1Id: string,
  player2Id: string,
  seed: number
): Promise<GameState> {
  const gameState = initializeGame(matchId, player1Id, player2Id, seed);

  if (!database) {
    // In test/dev mode without Firebase
    return gameState;
  }

  try {
    // Store initial game state
    const matchRef = ref(database, `${MATCHES_PATH}/${matchId}`);
    await set(matchRef, {
      gameId: gameState.gameId,
      seed: gameState.seed,
      phase: gameState.phase,
      turn: gameState.turn,
      seq: gameState.seq,
      lastUpdated: gameState.lastUpdated,
      player1Id,
      player2Id,
      createdAt: Date.now(),
    });

    // Store full game state in a separate location (for reconstruction)
    const stateRef = ref(database, `${MATCHES_PATH}/${matchId}/${STATE_PATH}`);
    await set(stateRef, gameState);

    return gameState;
  } catch (error) {
    console.error('Failed to create match:', error);
    throw error;
  }
}

/**
 * Add an action to the match's action history
 */
export async function addActionToMatch(
  matchId: string,
  action: Action
): Promise<void> {
  try {
    const actionsRef = ref(database, `${MATCHES_PATH}/${matchId}/${ACTIONS_PATH}`);
    const newActionRef = push(actionsRef);
    
    await set(newActionRef, {
      actionId: action.actionId,
      playerId: action.playerId,
      type: action.type,
      payload: action.payload,
      seq: action.seq,
      timestamp: action.timestamp,
    });

    // Update match metadata
    const matchRef = ref(database, `${MATCHES_PATH}/${matchId}`);
    await update(matchRef, {
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error('Failed to add action:', error);
    throw error;
  }
}

/**
 * Subscribe to all actions in a match
 * Returns unsubscribe function
 */
export function subscribeToMatchActions(
  matchId: string,
  onActionsUpdate: (actions: Action[]) => void
): () => void {
  const actionsRef = ref(database, `${MATCHES_PATH}/${matchId}/${ACTIONS_PATH}`);

  const unsubscribe = onValue(
    actionsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onActionsUpdate([]);
        return;
      }

      const actionsData = snapshot.val();
      const actions: Action[] = [];

      for (const key in actionsData) {
        const action = actionsData[key];
        actions.push({
          actionId: action.actionId,
          playerId: action.playerId,
          type: action.type,
          payload: action.payload,
          seq: action.seq,
          timestamp: action.timestamp,
        } as Action);
      }

      // Sort by seq to maintain order
      actions.sort((a, b) => a.seq - b.seq);
      onActionsUpdate(actions);
    },
    (error) => {
      console.error('Error subscribing to match actions:', error);
    }
  );

  return unsubscribe;
}

/**
 * Get full match state from Firebase (for initialization)
 */
export async function getMatchState(matchId: string): Promise<GameState | null> {
  try {
    const stateRef = ref(database, `${MATCHES_PATH}/${matchId}/${STATE_PATH}`);
    const snapshot = await get(stateRef);

    if (snapshot.exists()) {
      return snapshot.val() as GameState;
    }
    return null;
  } catch (error) {
    console.error('Failed to get match state:', error);
    return null;
  }
}

/**
 * Reconstruct game state from seed + action history
 * Used to verify state consistency between client and server
 */
export function reconstructGameState(
  gameId: string,
  player1Id: string,
  player2Id: string,
  seed: number,
  actions: Action[]
): GameState {
  let gameState = initializeGame(gameId, player1Id, player2Id, seed);
  
  // Set to IN_PROGRESS so actions can be applied
  gameState.phase = 'IN_PROGRESS';

  // Apply each action in sequence
  for (const action of actions) {
    const result = applyAction(gameState, action);
    if (result.success && result.newGameState) {
      gameState = result.newGameState;
    } else {
      console.warn('Failed to apply action during reconstruction:', action, result.error);
    }
  }

  return gameState;
}

/**
 * Check if state is consistent by reconstructing from history
 */
export async function verifyStateConsistency(
  matchId: string,
  currentState: GameState
): Promise<boolean> {
  try {
    // Get all actions from Firebase
    const actionsRef = ref(database, `${MATCHES_PATH}/${matchId}/${ACTIONS_PATH}`);
    const snapshot = await get(actionsRef);

    if (!snapshot.exists()) {
      return true;
    }

    const actionsData = snapshot.val();
    const actions: Action[] = [];

    for (const key in actionsData) {
      const action = actionsData[key];
      actions.push({
        actionId: action.actionId,
        playerId: action.playerId,
        type: action.type,
        payload: action.payload,
        seq: action.seq,
        timestamp: action.timestamp,
      } as Action);
    }

    actions.sort((a, b) => a.seq - b.seq);

    // Reconstruct from seed
    const reconstructed = reconstructGameState(
      currentState.gameId,
      currentState.players[0].playerId,
      currentState.players[1].playerId,
      currentState.seed,
      actions
    );

    // Compare key properties
    return (
      reconstructed.seq === currentState.seq &&
      reconstructed.turn === currentState.turn &&
      reconstructed.phase === currentState.phase &&
      reconstructed.players[0].score === currentState.players[0].score &&
      reconstructed.players[1].score === currentState.players[1].score
    );
  } catch (error) {
    console.error('Error verifying state consistency:', error);
    return false;
  }
}

/**
 * End a match and record final state
 */
export async function endMatch(
  matchId: string,
  finalState: GameState
): Promise<void> {
  try {
    const matchRef = ref(database, `${MATCHES_PATH}/${matchId}`);
    await update(matchRef, {
      phase: finalState.phase,
      finalScore1: finalState.players[0].score,
      finalScore2: finalState.players[1].score,
      endedAt: Date.now(),
    });
  } catch (error) {
    console.error('Failed to end match:', error);
    throw error;
  }
}

/**
 * Subscribe to match metadata (phase, turn, scores)
 * Returns unsubscribe function
 */
export function subscribeToMatchMetadata(
  matchId: string,
  onUpdate: (metadata: {
    phase: string;
    turn: string;
    seq: number;
    lastUpdated: number;
  }) => void
): () => void {
  const matchRef = ref(database, `${MATCHES_PATH}/${matchId}`);

  const unsubscribe = onValue(
    matchRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        return;
      }

      const data = snapshot.val();
      onUpdate({
        phase: data.phase,
        turn: data.turn,
        seq: data.seq,
        lastUpdated: data.lastUpdated,
      });
    },
    (error) => {
      console.error('Error subscribing to match metadata:', error);
    }
  );

  return unsubscribe;
}

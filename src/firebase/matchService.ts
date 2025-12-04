/**
 * Firebase matchmaking and real-time sync service
 */

import { database } from './firebaseConfig';
import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  query,
  orderByChild,
  limitToFirst,
} from 'firebase/database';
import { GameState } from '../core/state';

/**
 * Create a new match in Firebase
 */
export async function createMatch(matchId: string, initialState: GameState): Promise<void> {
  try {
    await set(ref(database, `matches/${matchId}`), {
      ...initialState,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Failed to create match:', error);
    throw error;
  }
}

/**
 * Join a match (add player to match)
 */
export async function joinMatch(matchId: string, playerId: string): Promise<void> {
  try {
    await update(ref(database, `matches/${matchId}`), {
      [`players/${playerId}/connected`]: true,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Failed to join match:', error);
    throw error;
  }
}

/**
 * Add an action to match history
 */
export async function addAction(
  matchId: string,
  action: any
): Promise<void> {
  try {
    await set(ref(database, `matches/${matchId}/history/${action.actionId}`), {
      ...action,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Failed to add action:', error);
    throw error;
  }
}

/**
 * Update match state (seq, turn, etc.)
 */
export async function updateMatchState(
  matchId: string,
  updates: Partial<GameState>
): Promise<void> {
  try {
    await update(ref(database, `matches/${matchId}`), {
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Failed to update match state:', error);
    throw error;
  }
}

/**
 * Get match state (one-time fetch)
 */
export async function getMatch(matchId: string): Promise<GameState | null> {
  try {
    const snapshot = await get(ref(database, `matches/${matchId}`));
    return snapshot.val() || null;
  } catch (error) {
    console.error('Failed to get match:', error);
    throw error;
  }
}

/**
 * Subscribe to match state updates (real-time)
 */
export function subscribeToMatch(
  matchId: string,
  callback: (state: GameState) => void
): () => void {
  const unsubscribe = onValue(
    ref(database, `matches/${matchId}`),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    }
  );

  return unsubscribe;
}

/**
 * Leave a match (mark player as disconnected)
 */
export async function leaveMatch(matchId: string, playerId: string): Promise<void> {
  try {
    await update(ref(database, `matches/${matchId}`), {
      [`players/${playerId}/connected`]: false,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Failed to leave match:', error);
    throw error;
  }
}

/**
 * Delete a finished match (cleanup)
 */
export async function deleteMatch(matchId: string): Promise<void> {
  try {
    await remove(ref(database, `matches/${matchId}`));
  } catch (error) {
    console.error('Failed to delete match:', error);
    throw error;
  }
}

/**
 * Find available matches (players waiting)
 */
export async function findAvailableMatches(): Promise<any[]> {
  try {
    const snapshot = await get(
      query(
        ref(database, 'matches'),
        orderByChild('phase'),
        limitToFirst(10)
      )
    );

    if (snapshot.exists()) {
      return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
        id,
        ...data,
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to find available matches:', error);
    throw error;
  }
}

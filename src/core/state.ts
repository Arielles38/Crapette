/**
 * Core game state types and interfaces for Crapette card game
 */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string; // e.g., "AS" (Ace of Spades)
  rank: Rank;
  suit: Suit;
  value: number; // 1-13
}

export type PileType = 'reserve' | 'tableau' | 'foundation';

export interface PileLocation {
  pile: PileType;
  index?: number; // For tableau/foundation (which pile)
}

export interface Pile {
  type: PileType;
  cards: Card[];
}

export interface PlayerPiles {
  reserve: Card[]; // Single pile for reserve
  tableau: Card[][]; // Usually 4 piles
  foundation: Card[][]; // Usually 4 piles (one per suit)
}

export interface PlayerState {
  playerId: string;
  name: string;
  connected: boolean;
  score: number;
  piles: PlayerPiles;
}

export type GamePhase = 'LOBBY' | 'STARTING' | 'IN_PROGRESS' | 'PAUSED' | 'FINISHED';

export interface GameState {
  gameId: string;
  seed: number; // For deterministic shuffle
  phase: GamePhase;
  turn: string; // playerId of current player
  players: PlayerState[];
  history: Action[];
  seq: number; // Sequence number for state updates
  lastUpdated: number; // Timestamp
}

export type ActionType =
  | 'MOVE_CARD'
  | 'DRAW'
  | 'END_TURN'
  | 'UNDO'
  | 'RESIGN'
  | 'CRAPETTE'
  | 'READY'
  | 'CHAT';

export interface MovePayload {
  from: {
    pile: PileType;
    index: number; // For tableau/foundation pile index
  };
  to: {
    pile: PileType;
    index: number;
  };
  cardIds: string[]; // Can move multiple cards in sequence
}

export interface CrapettePayload {
  targetPlayerId: string;
  actionIdToChallenge: string;
  reason: string; // Brief reason for the challenge
}

export interface Action {
  actionId: string;
  playerId: string;
  type: ActionType;
  payload?: MovePayload | CrapettePayload | any;
  seq: number;
  timestamp: number;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  turnEnd?: boolean; // Does this action end the turn?
}

export interface ApplyResult {
  success: boolean;
  newGameState?: GameState;
  error?: string;
  events?: GameEvent[];
}

export type GameEventType =
  | 'MOVE_APPLIED'
  | 'MOVE_REJECTED'
  | 'CRAPETTE_CALLED'
  | 'CRAPETTE_VALID'
  | 'CRAPETTE_INVALID'
  | 'TURN_ENDED'
  | 'GAME_WON'
  | 'PLAYER_DISCONNECTED'
  | 'PLAYER_RECONNECTED';

export interface GameEvent {
  type: GameEventType;
  playerId?: string;
  data?: any;
  timestamp: number;
}

export interface CrapetteState {
  lastMoveFlaggedAt?: number; // Timestamp of last move that can be challenged
  crapetteTimeWindowMs: number; // Window to call Crapette (e.g., 5000ms)
}

/**
 * Crapette-specific rule validation and implementation
 */

import { Card, Rank, Suit, ValidationResult, PlayerState } from './state';

const RANK_ORDER: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_VALUES: { [key in Rank]: number } = {
  A: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
};

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RED_SUITS: Suit[] = ['hearts', 'diamonds'];
// const BLACK_SUITS: Suit[] = ['spades', 'clubs'];

/**
 * Create a standard 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANK_ORDER) {
      const id = `${rank}${suit.charAt(0).toUpperCase()}`;
      deck.push({
        id,
        rank,
        suit,
        value: RANK_VALUES[rank],
      });
    }
  }

  return deck;
}

/**
 * Deterministic shuffle using seed (Fisher-Yates)
 */
export function deterministicShuffle(cards: Card[], seed: number): Card[] {
  const deck = [...cards];
  let rng = seed;

  // Simple LCG for reproducible randomness
  const random = (): number => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  };

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

/**
 * Check if a card can be placed on a foundation
 * Foundation rules: ascending by rank, single suit, starts with Ace
 */
export function canPlaceOnFoundation(
  foundation: Card[],
  card: Card
): boolean {
  if (foundation.length === 0) {
    return card.rank === 'A';
  }

  const topCard = foundation[foundation.length - 1];
  return (
    topCard.suit === card.suit &&
    RANK_VALUES[card.rank] === RANK_VALUES[topCard.rank] + 1
  );
}

/**
 * Check if a card can be placed on a tableau
 * Tableau rules: descending by rank, alternating colors (red/black)
 */
export function canPlaceOnTableau(
  tableau: Card[],
  card: Card
): boolean {
  if (tableau.length === 0) {
    return true; // Any card can start an empty tableau pile
  }

  const topCard = tableau[tableau.length - 1];
  const isRed = RED_SUITS.includes(card.suit);
  const topIsRed = RED_SUITS.includes(topCard.suit);

  return (
    RANK_VALUES[card.rank] === RANK_VALUES[topCard.rank] - 1 &&
    isRed !== topIsRed
  );
}

/**
 * Check if a sequence of cards can be moved from one tableau to another
 * All cards in the sequence must follow tableau rules
 */
export function isValidTableauSequence(cards: Card[]): boolean {
  for (let i = 0; i < cards.length - 1; i++) {
    const current = cards[i];
    const next = cards[i + 1];
    const currentIsRed = RED_SUITS.includes(current.suit);
    const nextIsRed = RED_SUITS.includes(next.suit);

    if (
      RANK_VALUES[next.rank] !== RANK_VALUES[current.rank] - 1 ||
      currentIsRed === nextIsRed
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Get top card from a pile (if exists)
 */
export function getTopCard(pile: Card[]): Card | null {
  return pile.length > 0 ? pile[pile.length - 1] : null;
}

/**
 * Validate that a player can move cards from source to destination
 * This is used for Crapette interrupt verification
 */
export function validateMove(
  fromPile: Card[],
  toPile: Card[],
  toType: 'foundation' | 'tableau',
  cardsToMove: Card[]
): ValidationResult {
  if (cardsToMove.length === 0) {
    return { valid: false, reason: 'No cards to move' };
  }

  const topCard = getTopCard(fromPile);
  if (!topCard) {
    return { valid: false, reason: 'Source pile is empty' };
  }

  // Check that cards to move are at the top of source pile
  if (cardsToMove[0].id !== topCard.id) {
    return { valid: false, reason: 'Cards are not on top of source pile' };
  }

  // For multiple cards, they must be a valid tableau sequence
  if (cardsToMove.length > 1 && !isValidTableauSequence(cardsToMove)) {
    return { valid: false, reason: 'Cards do not form a valid sequence' };
  }

  // Check destination rules
  if (toType === 'foundation') {
    if (cardsToMove.length > 1) {
      return { valid: false, reason: 'Can only move one card to foundation' };
    }
    if (!canPlaceOnFoundation(toPile, cardsToMove[0])) {
      return { valid: false, reason: 'Card cannot be placed on foundation' };
    }
  } else if (toType === 'tableau') {
    const firstCard = cardsToMove[0];
    if (!canPlaceOnTableau(toPile, firstCard)) {
      return { valid: false, reason: 'Card cannot be placed on tableau' };
    }
  }

  return { valid: true, turnEnd: true };
}

/**
 * Check if a player has won (all cards in foundations)
 */
export function hasPlayerWon(player: PlayerState): boolean {
  const totalCards = player.piles.reserve.length +
    player.piles.tableau.flat().length +
    player.piles.foundation.flat().length;

  const foundationCards = player.piles.foundation.flat().length;

  return totalCards === foundationCards && foundationCards === 52;
}

/**
 * Get all legal moves for a player's current position (for AI)
 */
export function getLegalMoves(
  playerPiles: PlayerState['piles']
): Array<{ from: Card; fromType: 'reserve' | 'tableau'; toType: 'foundation' | 'tableau' }> {
  const moves: Array<{
    from: Card;
    fromType: 'reserve' | 'tableau';
    toType: 'foundation' | 'tableau';
  }> = [];

  // Check reserve -> foundation
  const reserveTop = getTopCard(playerPiles.reserve);
  if (reserveTop) {
    for (let i = 0; i < playerPiles.foundation.length; i++) {
      if (canPlaceOnFoundation(playerPiles.foundation[i], reserveTop)) {
        moves.push({ from: reserveTop, fromType: 'reserve', toType: 'foundation' });
      }
    }
  }

  // Check reserve -> tableau
  if (reserveTop) {
    for (let i = 0; i < playerPiles.tableau.length; i++) {
      if (canPlaceOnTableau(playerPiles.tableau[i], reserveTop)) {
        moves.push({ from: reserveTop, fromType: 'reserve', toType: 'tableau' });
      }
    }
  }

  // Check tableau -> foundation
  for (let i = 0; i < playerPiles.tableau.length; i++) {
    const tableauTop = getTopCard(playerPiles.tableau[i]);
    if (tableauTop) {
      for (let j = 0; j < playerPiles.foundation.length; j++) {
        if (canPlaceOnFoundation(playerPiles.foundation[j], tableauTop)) {
          moves.push({ from: tableauTop, fromType: 'tableau', toType: 'foundation' });
        }
      }
    }
  }

  // Check tableau -> tableau
  for (let i = 0; i < playerPiles.tableau.length; i++) {
    const tableauTop = getTopCard(playerPiles.tableau[i]);
    if (tableauTop) {
      for (let j = 0; j < playerPiles.tableau.length; j++) {
        if (i !== j && canPlaceOnTableau(playerPiles.tableau[j], tableauTop)) {
          moves.push({ from: tableauTop, fromType: 'tableau', toType: 'tableau' });
        }
      }
    }
  }

  return moves;
}

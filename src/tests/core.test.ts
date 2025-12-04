/**
 * Unit tests for Crapette game rules and validation
 */

import {
  createDeck,
  deterministicShuffle,
  canPlaceOnFoundation,
  canPlaceOnTableau,
  isValidTableauSequence,
  validateMove,
  // hasPlayerWon,
  // getLegalMoves,
} from '../core/rules';
import { Rank } from '../core/state';

describe('Crapette Game Rules', () => {
  describe('createDeck', () => {
    it('should create a deck with 52 cards', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    it('should have unique card ids', () => {
      const deck = createDeck();
      const ids = deck.map((c) => c.id);
      expect(new Set(ids).size).toBe(52);
    });
  });

  describe('deterministicShuffle', () => {
    it('should produce the same order for the same seed', () => {
      const deck1 = createDeck();
      const deck2 = createDeck();

      const shuffled1 = deterministicShuffle(deck1, 12345);
      const shuffled2 = deterministicShuffle(deck2, 12345);

      expect(shuffled1.map((c) => c.id)).toEqual(shuffled2.map((c) => c.id));
    });

    it('should produce different orders for different seeds', () => {
      const deck1 = createDeck();
      const deck2 = createDeck();

      const shuffled1 = deterministicShuffle(deck1, 12345);
      const shuffled2 = deterministicShuffle(deck2, 54321);

      expect(shuffled1.map((c) => c.id)).not.toEqual(shuffled2.map((c) => c.id));
    });
  });

  describe('canPlaceOnFoundation', () => {
    it('should allow Ace on empty foundation', () => {
      const ace = { id: 'AS', rank: 'A' as Rank, suit: 'spades' as const, value: 1 };
      expect(canPlaceOnFoundation([], ace)).toBe(true);
    });

    it('should not allow non-Ace on empty foundation', () => {
      const two = { id: '2S', rank: '2' as Rank, suit: 'spades' as const, value: 2 };
      expect(canPlaceOnFoundation([], two)).toBe(false);
    });

    it('should allow ascending same suit', () => {
      const ace = { id: 'AS', rank: 'A' as Rank, suit: 'spades' as const, value: 1 };
      const two = { id: '2S', rank: '2' as Rank, suit: 'spades' as const, value: 2 };
      expect(canPlaceOnFoundation([ace], two)).toBe(true);
    });

    it('should not allow wrong suit', () => {
      const ace = { id: 'AS', rank: 'A' as Rank, suit: 'spades' as const, value: 1 };
      const two = { id: '2H', rank: '2' as Rank, suit: 'hearts' as const, value: 2 };
      expect(canPlaceOnFoundation([ace], two)).toBe(false);
    });

    it('should not allow non-ascending rank', () => {
      const ace = { id: 'AS', rank: 'A' as Rank, suit: 'spades' as const, value: 1 };
      const three = { id: '3S', rank: '3' as Rank, suit: 'spades' as const, value: 3 };
      expect(canPlaceOnFoundation([ace], three)).toBe(false);
    });
  });

  describe('canPlaceOnTableau', () => {
    it('should allow any card on empty tableau', () => {
      const king = { id: 'KS', rank: 'K' as Rank, suit: 'spades' as const, value: 13 };
      expect(canPlaceOnTableau([], king)).toBe(true);
    });

    it('should allow descending opposite color', () => {
      const king = { id: 'KS', rank: 'K' as Rank, suit: 'spades' as const, value: 13 };
      const queen = {
        id: 'QH',
        rank: 'Q' as Rank,
        suit: 'hearts' as const,
        value: 12,
      };
      expect(canPlaceOnTableau([king], queen)).toBe(true);
    });

    it('should not allow same color', () => {
      const king = { id: 'KS', rank: 'K' as Rank, suit: 'spades' as const, value: 13 };
      const queen = {
        id: 'QS',
        rank: 'Q' as Rank,
        suit: 'spades' as const,
        value: 12,
      };
      expect(canPlaceOnTableau([king], queen)).toBe(false);
    });

    it('should not allow non-descending rank', () => {
      const king = { id: 'KS', rank: 'K' as Rank, suit: 'spades' as const, value: 13 };
      const queen = { id: 'QH', rank: 'Q' as Rank, suit: 'hearts' as const, value: 12 };
      expect(canPlaceOnTableau([king], queen)).toBe(true); // K to Q is valid (descending 1 rank)

      const jack = { id: 'JH', rank: 'J' as Rank, suit: 'hearts' as const, value: 11 };
      expect(canPlaceOnTableau([king], jack)).toBe(false); // K to J is not allowed (skips Queen)
    });
  });

  describe('isValidTableauSequence', () => {
    it('should validate a valid descending sequence', () => {
      const king = { id: 'KS', rank: 'K' as Rank, suit: 'spades' as const, value: 13 };
      const queen = {
        id: 'QH',
        rank: 'Q' as Rank,
        suit: 'hearts' as const,
        value: 12,
      };
      const jack = { id: 'JS', rank: 'J' as Rank, suit: 'spades' as const, value: 11 };

      expect(isValidTableauSequence([king, queen, jack])).toBe(true);
    });

    it('should reject same color in sequence', () => {
      const king = { id: 'KS', rank: 'K' as Rank, suit: 'spades' as const, value: 13 };
      const queen = {
        id: 'QS',
        rank: 'Q' as Rank,
        suit: 'spades' as const,
        value: 12,
      };

      expect(isValidTableauSequence([king, queen])).toBe(false);
    });

    it('should reject non-descending sequence', () => {
      const king = { id: 'KS', rank: 'K' as Rank, suit: 'spades' as const, value: 13 };
      const ten = { id: '10H', rank: '10' as Rank, suit: 'hearts' as const, value: 10 };

      expect(isValidTableauSequence([king, ten])).toBe(false);
    });
  });

  describe('validateMove', () => {
    it('should reject move from empty pile', () => {
      const result = validateMove([], [], 'foundation', []);
      expect(result.valid).toBe(false);
    });

    it('should reject moving cards not on top', () => {
      const king = { id: 'KS', rank: 'K' as Rank, suit: 'spades' as const, value: 13 };
      const queen = {
        id: 'QH',
        rank: 'Q' as Rank,
        suit: 'hearts' as const,
        value: 12,
      };
      const jack = { id: 'JS', rank: 'J' as Rank, suit: 'spades' as const, value: 11 };

      const result = validateMove([king, queen, jack], [], 'tableau', [king]);
      expect(result.valid).toBe(false);
    });

    it('should allow valid foundation move', () => {
      const ace = { id: 'AS', rank: 'A' as Rank, suit: 'spades' as const, value: 1 };
      const result = validateMove([ace], [], 'foundation', [ace]);
      expect(result.valid).toBe(true);
    });

    it('should reject multiple cards to foundation', () => {
      const king = { id: 'KS', rank: 'K' as Rank, suit: 'spades' as const, value: 13 };
      const queen = {
        id: 'QH',
        rank: 'Q' as Rank,
        suit: 'hearts' as const,
        value: 12,
      };
      const result = validateMove([king, queen], [], 'foundation', [king, queen]);
      expect(result.valid).toBe(false);
    });
  });
});

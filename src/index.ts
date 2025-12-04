/**
 * Main entry point for Crapette mobile game
 */

console.log('Crapette Mobile Game - Starting...');

// Import and initialize Firebase
import './firebase/firebaseConfig';

// Import game core
import { createDeck, deterministicShuffle } from './core/rules';

// Import i18n
import i18n from './i18n/i18n';

console.log('Core modules loaded successfully');
console.log('Current language:', i18n.language);

// Example: Create a shuffled deck
const deck = createDeck();
const shuffled = deterministicShuffle(deck, 12345);

console.log(`Deck created with ${deck.length} cards`);
console.log(`Shuffled with seed 12345: ${shuffled[0].id}, ${shuffled[1].id}, ...`);

export { createDeck, deterministicShuffle };

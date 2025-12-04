import random

class Card:
    def __init__(self, rank, suit):
        self.rank = rank
        self.suit = suit

    def color(self):
        return 'red' if self.suit in ['♥', '♦'] else 'black'

    def __str__(self):
        return f"{self.rank}{self.suit}"

    def __eq__(self, other):
        return isinstance(other, Card) and self.rank == other.rank and self.suit == other.suit

class Deck:
    def __init__(self):
        ranks = ['A'] + [str(n) for n in range(2, 11)] + ['J', 'Q', 'K']
        suits = ['♠', '♥', '♦', '♣']
        self.cards = [Card(rank, suit) for rank in ranks for suit in suits]
        random.shuffle(self.cards)

    def draw(self, n):
        return [self.cards.pop() for _ in range(n)]


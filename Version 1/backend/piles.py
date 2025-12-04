class CenterPiles:
    def __init__(self):
        self.piles = [[] for _ in range(8)]

    def show(self):
        print("\nCenter piles:")
        for i, pile in enumerate(self.piles):
            top = pile[-1] if pile else "Empty"
            print(f"  Pile {i+1}: {top}")

    def can_play(self, card, pile_index):
        pile = self.piles[pile_index]
        order = ['A'] + [str(n) for n in range(2, 11)] + ['J', 'Q', 'K']
        if not pile:
            return card.rank == 'A'
        top = pile[-1]
        return top.suit == card.suit and order.index(card.rank) == order.index(top.rank) + 1

    def play_card(self, card, pile_index):
        self.piles[pile_index].append(card)

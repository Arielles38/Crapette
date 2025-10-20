class Player:
    def __init__(self, name, deck):
        self.name = name
        self.deck = deck
        self.crapette = self.deck.draw(13)
        self.tableau = self.deck.draw(4)
        self.talon = self.deck.cards
        self.waste = []

    def visible_cards(self):
        cards = self.tableau.copy()
        if self.crapette:
            cards.append(self.crapette[-1])
        if self.waste:
            cards.append(self.waste[-1])
        return cards

    def remove_card(self, card):
        if card in self.tableau:
            self.tableau.remove(card)
        elif self.crapette and self.crapette[-1] == card:
            self.crapette.pop()
        elif self.waste and self.waste[-1] == card:
            self.waste.pop()

    def show(self):
        print(f"\n--- {self.name} ---")
        print("Tableau:", ' | '.join(str(c) for c in self.tableau))
        print("Top of Crapette:", self.crapette[-1] if self.crapette else "Empty")
        print("Top of Waste:", self.waste[-1] if self.waste else "Empty")
        print(f"Talon: {len(self.talon)} cards left")

from card import Deck
from player import Player
from piles import CenterPiles
from utils import get_card_from_input

class Game:
    def __init__(self):
        self.deck1 = Deck()
        self.deck2 = Deck()
        self.players = [
            Player("Player 1", self.deck1),
            Player("Player 2", self.deck2)
        ]
        self.center = CenterPiles()
        self.turn = self.decide_first_player()

    def decide_first_player(self):
        order = ['A'] + [str(n) for n in range(2, 11)] + ['J', 'Q', 'K']
        p1 = self.players[0]
        p2 = self.players[1]
        v1 = order.index(p1.crapette[-1].rank)
        v2 = order.index(p2.crapette[-1].rank)
        return 0 if v1 > v2 else 1

    def play(self):
        print("🎴 Welcome to Interactive Crapette!\n")
        while not self.check_win():
            player = self.players[self.turn]
            player.show()
            self.center.show()

            user_input = input(f"\n{player.name}, choose a card (e.g. A♠), 'draw', or 'skip': ").strip()
            if user_input.lower() == 'draw':
                if player.talon:
                    card = player.talon.pop()
                    player.waste.append(card)
                    print(f"{player.name} drew {card} from talon.")
                else:
                    print("No cards left in talon.")
                self.end_turn()
                continue

            elif user_input.lower() == 'skip':
                print(f"{player.name} skips their turn.")
                self.end_turn()
                continue

            card = get_card_from_input(user_input)
            if not card:
                print("Invalid card format.")
                continue

            if card not in player.visible_cards():
                print("You can't play that card. It's not visible.")
                continue

            pile_num = input("Choose center pile (1–8): ").strip()
            if not pile_num.isdigit() or not (1 <= int(pile_num) <= 8):
                print("Invalid pile number.")
                continue

            pile_index = int(pile_num) - 1
            if self.center.can_play(card, pile_index):
                self.center.play_card(card, pile_index)
                player.remove_card(card)
                print(f"{player.name} plays {card} to center pile {pile_index + 1}.")
            else:
                print("You can't place that card there.")
                continue

            self.end_turn()

        print(f"\n🏆 {self.players[self.turn].name} wins!")

    def check_win(self):
        for player in self.players:
            if len(player.crapette) == 0 and len(player.talon) == 0 and not player.tableau:
                return True
        return False

    def end_turn(self):
        self.turn = 1 - self.turn

import pygame
import random

# Initialize Pygame
pygame.init()

# Screen settings
WIDTH, HEIGHT = 1200, 800
SCREEN = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Crapette – Play to Center Piles")

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GREEN = (50, 168, 82)
RED = (200, 60, 60)
GRAY = (180, 180, 180)
YELLOW = (255, 255, 0)

# Fonts
FONT = pygame.font.SysFont("arial", 20)

# Card settings
CARD_WIDTH, CARD_HEIGHT = 70, 100
PADDING = 20

# Suits & Ranks
SUITS = ['♠', '♥', '♦', '♣']
RANKS = ['A'] + [str(n) for n in range(2, 11)] + ['J', 'Q', 'K']

def create_deck():
    return [{'rank': r, 'suit': s, 'color': 'red' if s in ['♥', '♦'] else 'black'} for r in RANKS for s in SUITS]

def deal_cards():
    deck1 = create_deck()
    deck2 = create_deck()
    random.shuffle(deck1)
    random.shuffle(deck2)

    def extract_cards(deck, count):
        return [deck.pop() for _ in range(count)]

    player1 = {
        'tableau': extract_cards(deck1, 4),
        'crapette': extract_cards(deck1, 13),
        'talon': deck1,
        'waste': []
    }

    player2 = {
        'tableau': extract_cards(deck2, 4),
        'crapette': extract_cards(deck2, 13),
        'talon': deck2,
        'waste': []
    }

    center_piles = [[] for _ in range(8)]
    return player1, player2, center_piles

def draw_card(x, y, card, selected=False):
    rect = pygame.Rect(x, y, CARD_WIDTH, CARD_HEIGHT)
    pygame.draw.rect(SCREEN, YELLOW if selected else WHITE, rect)
    pygame.draw.rect(SCREEN, BLACK, rect, 2)

    rank_text = FONT.render(card['rank'], True, RED if card['color'] == 'red' else BLACK)
    suit_text = FONT.render(card['suit'], True, RED if card['color'] == 'red' else BLACK)
    SCREEN.blit(rank_text, (x + 10, y + 10))
    SCREEN.blit(suit_text, (x + 10, y + 40))

    return rect

def draw_slot(x, y):
    rect = pygame.Rect(x, y, CARD_WIDTH, CARD_HEIGHT)
    pygame.draw.rect(SCREEN, GRAY, rect, 2)
    return rect

def card_value(card):
    return RANKS.index(card['rank'])

def can_play_on_center(card, pile):
    if not pile:
        return card['rank'] == 'A'
    top = pile[-1]
    return top['suit'] == card['suit'] and card_value(card) == card_value(top) + 1

def main():
    clock = pygame.time.Clock()
    running = True

    player1, player2, center_piles = deal_cards()
    selected_card = None
    selected_from = None

    while running:
        SCREEN.fill(GREEN)
        card_areas = []
        center_areas = []

        # Draw center piles
        for i in range(8):
            x = PADDING + i * (CARD_WIDTH + 10)
            y = HEIGHT // 2 - CARD_HEIGHT // 2
            if center_piles[i]:
                rect = draw_card(x, y, center_piles[i][-1])
            else:
                rect = draw_slot(x, y)
            center_areas.append((rect, i))

        # Player 1 tableau
        y1 = HEIGHT - CARD_HEIGHT - 40
        for i, card in enumerate(player1['tableau']):
            x = PADDING + i * (CARD_WIDTH + 10)
            rect = draw_card(x, y1, card, selected_card == card)
            card_areas.append((rect, card, 'tableau'))

        # Player 1 Crapette
        if player1['crapette']:
            x = WIDTH - CARD_WIDTH - PADDING
            y = HEIGHT - CARD_HEIGHT - 40
            card = player1['crapette'][-1]
            rect = draw_card(x, y, card, selected_card == card)
            card_areas.append((rect, card, 'crapette'))

        # Player 1 Waste
        if player1['waste']:
            x = WIDTH - 3 * (CARD_WIDTH + 20)
            y = HEIGHT - CARD_HEIGHT - 40
            card = player1['waste'][-1]
            rect = draw_card(x, y, card, selected_card == card)
            card_areas.append((rect, card, 'waste'))

        # Player 2 tableau (not interactive yet)
        y2 = 40
        for i, card in enumerate(player2['tableau']):
            x = PADDING + i * (CARD_WIDTH + 10)
            draw_card(x, y2, card)

        # Player 2 Crapette
        if player2['crapette']:
            x = WIDTH - CARD_WIDTH - PADDING
            y = 40
            draw_card(x, y, player2['crapette'][-1])

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            elif event.type == pygame.MOUSEBUTTONDOWN:
                mouse_pos = pygame.mouse.get_pos()

                # Select a card
                for rect, card, source in card_areas:
                    if rect.collidepoint(mouse_pos):
                        selected_card = card
                        selected_from = source
                        print(f"Selected card: {card['rank']}{card['suit']} from {source}")

                # Try placing on center pile
                if selected_card:
                    for rect, pile_index in center_areas:
                        if rect.collidepoint(mouse_pos):
                            pile = center_piles[pile_index]
                            if can_play_on_center(selected_card, pile):
                                pile.append(selected_card)
                                print(f"✅ Moved {selected_card['rank']}{selected_card['suit']} to center pile {pile_index+1}")
                                if selected_from == 'tableau':
                                    player1['tableau'].remove(selected_card)
                                elif selected_from == 'crapette':
                                    player1['crapette'].pop()
                                elif selected_from == 'waste':
                                    player1['waste'].pop()
                                selected_card = None
                                selected_from = None
                            else:
                                print("❌ Invalid move.")

        pygame.display.flip()
        clock.tick(60)

    pygame.quit()

if __name__ == "__main__":
    main()

import pygame
import random

# Initialize Pygame
pygame.init()

# Screen settings
WIDTH, HEIGHT = 1200, 850
SCREEN = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Crapette – Click-to-Move Edition")

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GREEN = (0, 100, 80)
RED = (200, 60, 60)
GRAY = (160, 160, 160)
YELLOW = (255, 255, 0)
BLUE = (70, 130, 180)

# Fonts
FONT = pygame.font.SysFont("arial", 18)

# Card settings
CARD_WIDTH, CARD_HEIGHT = 70, 100
STACK_OFFSET = 20

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

    # For shared tableau, we deal 1 card per column for 8 columns.
    tableau = [[extract_cards(deck1 if i % 2 == 0 else deck2, 1)[0]] for i in range(8)]
    # For each player, Crapette gets 12 cards (11 hidden + 1 visible), and the remaining deck becomes the Talon.
    player1 = {
        'crapette': extract_cards(deck1, 12),
        'talon': deck1,
        'waste': []
    }
    player2 = {
        'crapette': extract_cards(deck2, 12),
        'talon': deck2,
        'waste': []
    }
    # Foundation: 8 piles (shared between players)
    foundation = [[] for _ in range(8)]
    return player1, player2, foundation, tableau


def card_value(card):
    return RANKS.index(card['rank'])


def can_play_on_tableau(card, target_card):
    # Check descending order (target's value must be one higher) and alternating color.
    return card_value(card) == card_value(target_card) - 1 and card['color'] != target_card['color']


def can_play_on_foundation(card, pile):
    if not pile:
        return card['rank'] == 'A'
    top = pile[-1]
    return top['suit'] == card['suit'] and card_value(card) == card_value(top) + 1


def draw_card(x, y, card, selected=False, hidden=False):
    rect = pygame.Rect(x, y, CARD_WIDTH, CARD_HEIGHT)
    color = YELLOW if selected else (GRAY if hidden else WHITE)
    pygame.draw.rect(SCREEN, color, rect)
    pygame.draw.rect(SCREEN, BLACK, rect, 2)
    if not hidden and 'rank' in card and 'suit' in card:
        rank_text = FONT.render(card['rank'], True, RED if card['color'] == 'red' else BLACK)
        suit_text = FONT.render(card['suit'], True, RED if card['color'] == 'red' else BLACK)
        SCREEN.blit(rank_text, (x + 10, y + 10))
        SCREEN.blit(suit_text, (x + 10, y + 40))
    return rect


def draw_slot(x, y, label=""):
    rect = pygame.Rect(x, y, CARD_WIDTH, CARD_HEIGHT)
    pygame.draw.rect(SCREEN, GRAY, rect, 2)
    if label:
        label_text = FONT.render(label, True, WHITE)
        SCREEN.blit(label_text, (x, y - 20))
    return rect


def draw_label(text, x, y):
    label = FONT.render(text, True, WHITE)
    SCREEN.blit(label, (x, y))


def main():
    clock = pygame.time.Clock()
    running = True

    player1, player2, foundation, tableau = deal_cards()
    selected_card = None
    selected_from = None
    selected_index = None  # For tableau, index of source column

    while running:
        SCREEN.fill(GREEN)
        card_areas = []      # Areas where a card is displayed (clickable)
        foundation_areas = []  # Areas for foundation piles
        tableau_areas = []     # Areas for tableau (only top card per column)

        # Layout constants
        spacing_x = 15
        start_x = (WIDTH - (8 * CARD_WIDTH + 7 * spacing_x)) // 2
        tableau_y = HEIGHT // 2 + 150
        foundation_y = HEIGHT // 2 - CARD_HEIGHT - 150

        # --- Draw Foundation (center; 8 piles in 1 row) ---
        for i in range(8):
            x = start_x + i * (CARD_WIDTH + spacing_x)
            pile = foundation[i]
            if pile:
                rect = draw_card(x, foundation_y, pile[-1])
            else:
                rect = draw_slot(x, foundation_y, "Foundation")
            foundation_areas.append((rect, i))

        # --- Draw Shared Tableau (8 columns) ---
        for i, stack in enumerate(tableau):
            x = start_x + i * (CARD_WIDTH + spacing_x)
            for j, card in enumerate(stack):
                y = tableau_y + j * STACK_OFFSET
                # Draw all cards; only top card becomes clickable
                selected = (selected_card == card)
                rect = draw_card(x, y, card, selected)
                if j == len(stack) - 1:
                    card_areas.append((rect, card, 'tableau', i))
                    tableau_areas.append((rect, i))
        
        # --- Draw Player 2 (Top row) ---
        top_y = 40
        draw_label("Player 2", 50, top_y - 40)
        # Talon for P2 (face-down stack)
        x_talon_p2 = 50
        for i in range(min(5, len(player2['talon']))):
            pygame.draw.rect(SCREEN, GRAY, (x_talon_p2 + i * 2, top_y + i * 2, CARD_WIDTH, CARD_HEIGHT))
            pygame.draw.rect(SCREEN, BLACK, (x_talon_p2 + i * 2, top_y + i * 2, CARD_WIDTH, CARD_HEIGHT), 2)
        talon_rect_p2 = pygame.Rect(x_talon_p2, top_y, CARD_WIDTH, CARD_HEIGHT)
        draw_label("Talon", x_talon_p2, top_y - 20)

        # Discard for P2
        x_discard_p2 = 200
        if player2['waste']:
            draw_card(x_discard_p2, top_y, player2['waste'][-1])
        else:
            draw_slot(x_discard_p2, top_y, "Discard")
        draw_label("Discard", x_discard_p2, top_y - 20)

        # Crapette for P2
        x_crapette_p2 = 350
        if player2['crapette']:
            for i in range(11):
                draw_card(x_crapette_p2 + i * 2, top_y, {}, hidden=True)
            draw_card(x_crapette_p2, top_y, player2['crapette'][-1])
        else:
            draw_slot(x_crapette_p2, top_y, "Crapette")
        draw_label("Crapette", x_crapette_p2, top_y - 20)

        # --- Draw Player 1 (Bottom row) ---
        bot_y = HEIGHT - CARD_HEIGHT - 40
        draw_label("Player 1", 50, bot_y + CARD_HEIGHT + 20)
        # Crapette for P1
        x_crapette_p1 = 350
        if player1['crapette']:
            for i in range(11):
                draw_card(x_crapette_p1 + i * 2, bot_y, {}, hidden=True)
            rect = draw_card(x_crapette_p1, bot_y, player1['crapette'][-1])
            card_areas.append((rect, player1['crapette'][-1], 'crapette', None))
        else:
            draw_slot(x_crapette_p1, bot_y, "Crapette")
        draw_label("Crapette", x_crapette_p1, bot_y - 20)

        # Discard for P1
        x_discard_p1 = 200
        if player1['waste']:
            rect = draw_card(x_discard_p1, bot_y, player1['waste'][-1])
            card_areas.append((rect, player1['waste'][-1], 'waste', None))
        else:
            draw_slot(x_discard_p1, bot_y, "Discard")
        draw_label("Discard", x_discard_p1, bot_y - 20)

        # Talon for P1 (face-down stack that shrinks as drawn)
        x_talon_p1 = 50
        for i in range(min(5, len(player1['talon']))):
            pygame.draw.rect(SCREEN, GRAY, (x_talon_p1 + i * 2, bot_y + i * 2, CARD_WIDTH, CARD_HEIGHT))
            pygame.draw.rect(SCREEN, BLACK, (x_talon_p1 + i * 2, bot_y + i * 2, CARD_WIDTH, CARD_HEIGHT), 2)
        talon_rect_p1 = pygame.Rect(x_talon_p1, bot_y, CARD_WIDTH, CARD_HEIGHT)
        draw_label("Talon", x_talon_p1, bot_y - 20)

        # --- Event Handling (Click-to-select then click-to-move) ---
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            elif event.type == pygame.MOUSEBUTTONDOWN:
                mouse_pos = pygame.mouse.get_pos()

                # Check if clicked on P1 talon (to draw card)
                if talon_rect_p1.collidepoint(mouse_pos):
                    if player1['talon']:
                        drawn = player1['talon'].pop()
                        player1['waste'].append(drawn)
                        print(f"🃏 Player 1 drew {drawn['rank']}{drawn['suit']} from Talon")

                # Select a card from shared tableau, crapette, or waste:
                for rect, card, source, index in card_areas:
                    if rect.collidepoint(mouse_pos):
                        selected_card = card
                        selected_from = source
                        selected_index = index
                        print(f"🟡 Selected {card['rank']}{card['suit']} from {source}")
                        # No break here; if multiple overlap, last one wins.

                # If a card is selected, try moving it:
                if selected_card:
                    # Try foundation move
                    for rect, i in foundation_areas:
                        if rect.collidepoint(mouse_pos):
                            pile = foundation[i]
                            if can_play_on_foundation(selected_card, pile):
                                pile.append(selected_card)
                                if selected_from == 'waste':
                                    player1['waste'].pop()
                                elif selected_from == 'crapette':
                                    player1['crapette'].pop()
                                elif selected_from == 'tableau':
                                    tableau[selected_index].pop()
                                print(f"✅ Moved {selected_card['rank']}{selected_card['suit']} to Foundation pile {i}")
                                selected_card = None
                                selected_from = None
                            else:
                                print(f"❌ Invalid foundation move for {selected_card['rank']}{selected_card['suit']}")

                           # Try tableau move (shared):
        if selected_card:
            for rect, i in tableau_areas:
                if rect.collidepoint(mouse_pos):
                    target_stack = tableau[i]

                    # If the stack is not empty, check if the move is legal
                    if target_stack:
                        top_card = target_stack[-1]
                        if can_play_on_tableau(selected_card, top_card):
                            target_stack.append(selected_card)
                            if selected_from == 'waste':
                                player1['waste'].pop()
                            elif selected_from == 'crapette':
                                player1['crapette'].pop()
                            elif selected_from == 'tableau':
                                tableau[selected_index].pop()
                            print(f"✅ Moved {selected_card['rank']}{selected_card['suit']} to Tableau column {i}")
                            selected_card = None
                            selected_from = None
                        else:
                            print(f"❌ Invalid tableau move: {selected_card['rank']}{selected_card['suit']} cannot be placed on {top_card['rank']}{top_card['suit']}")
                    else:
                        # Empty stack: move is allowed
                        tableau[i].append(selected_card)
                        if selected_from == 'waste':
                            player1['waste'].pop()
                        elif selected_from == 'crapette':
                            player1['crapette'].pop()
                        elif selected_from == 'tableau':
                            tableau[selected_index].pop()
                        print(f"✅ Moved {selected_card['rank']}{selected_card['suit']} to empty Tableau column {i}")
                        selected_card = None
                        selected_from = None

        pygame.display.flip()
        clock.tick(60)

    pygame.quit()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("🚨 An error occurred:", e)
        input("Press Enter to close...")



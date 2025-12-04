import pygame
import random
from ui_draw import draw_card, draw_slot, draw_label, draw_stack, draw_turn_button, draw_crapette_button, FONT
from ui_helpers import card_value, can_draw_talon, can_play_on_tableau, can_play_on_foundation, can_play_on_crapette, can_play_on_opponent_crapette, can_play_anywhere, has_any_valid_move, suggest_move
from ui_events import handle_selection, try_place_on_foundation, try_place_on_tableau, try_place_on_crapette, try_place_on_opponent_waste, try_draw_from_talon, handle_turn_button_click, handle_crapette_button_click
pygame.init()
WIDTH, HEIGHT = 1200, 850
SCREEN = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Crapette – Modular UI")

CARD_WIDTH, CARD_HEIGHT = 70, 100
GREEN = (0, 100, 80)

SUITS = ['♠', '♥', '♦', '♣']
SUIT_NAMES = {'♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs'}
RANKS = ['a'] + [str(n) for n in range(2, 11)] + ['j', 'q', 'k']

def check_card_id_uniqueness(p1, p2, t_left, t_right):
    all_cards = (
        p1['crapette'] + p1['talon'] + p1['waste'] +
        p2['crapette'] + p2['talon'] + p2['waste'] +
        [c for stack in t_left + t_right for c in stack]
    )

    print(f"🧾 Total cards in play: {len(all_cards)}")
    
    ids = [card['id'] for card in all_cards]
    owners = [card['owner'] for card in all_cards]
    
    duplicates = set([x for x in ids if ids.count(x) > 1])

    if duplicates:
        print(f"❌ Duplicate card IDs found:")
        for dup_id in duplicates:
            dup_cards = [card for card in all_cards if card['id'] == dup_id]
            for card in dup_cards:
                print(f"   - {card['id']} → {card['rank']} of {card['suit_name']} (Owner: {card['owner']})")
    else:
        print("✅ All card IDs are unique.")

    # Optional stats
    red_count = owners.count("red")
    blue_count = owners.count("blue")
    print(f"🟥 Red cards in play: {red_count}")
    print(f"🟦 Blue cards in play: {blue_count}")

def create_deck(owner):
    return [{
        'id': f"{owner}_{SUIT_NAMES[s]}_{r.lower()}",  # e.g., red_diamonds_8
        'rank': r.lower(),  # important: lowercase to match ranks
        'suit': s,
        'color': 'red' if s in ['♥', '♦'] else 'black',
        'suit_name': SUIT_NAMES[s],
        'owner': owner  # 🆕 distinguish red vs blue decks
    } for r in RANKS for s in SUITS]

def deal_cards():
    deck1 = create_deck("red")
    ids1 = [card['id'] for card in deck1]
    duplicates1 = set([x for x in ids1 if ids1.count(x) > 1])
    print(f"🔍 Duplicates in deck1 (red): {duplicates1}")
    print(f"🧾 Red deck size: {len(deck1)}")  # Should be 52
    
    deck2 = create_deck("blue")
    ids2 = [card['id'] for card in deck2]
    duplicates2 = set([x for x in ids2 if ids2.count(x) > 1])
    print(f"🔍 Duplicates in deck2 (blue): {duplicates2}")
    print(f"🧾 Blue deck size: {len(deck2)}")  # Should be 52
    
    random.shuffle(deck1)
    random.shuffle(deck2)
    
    def extract(deck, count): return [deck.pop() for _ in range(count)]
    
    # First extract tableau and crapette, then assign the rest as talon
    tableau_left = [[extract(deck1, 1)[0]] for _ in range(4)]
    tableau_right = [[extract(deck2, 1)[0]] for _ in range(4)]

    crapette1 = extract(deck1, 13)
    crapette2 = extract(deck2, 13)

     # Reveal top card of talon without moving to waste
    p1 = {'crapette': crapette1, 'talon': deck1, 'waste': []}
    p2 = {'crapette': crapette2, 'talon': deck2, 'waste': []}

    foundation_left = [[] for _ in range(4)]
    foundation_right = [[] for _ in range(4)]

    return p1, p2, foundation_left, foundation_right, tableau_left, tableau_right

def check_duplicates_by_id(player1, player2, tableau_left, tableau_right):
    all_cards = (
        player1['crapette'] + player1['talon'] + player1['waste'] +
        player2['crapette'] + player2['talon'] + player2['waste'] +
        [c for stack in tableau_left + tableau_right for c in stack]
    )
    seen = {}
    for card in all_cards:
        if card['id'] in seen:
            print(f"❌ Duplicate detected → {card['id']}, owners: {seen[card['id']]} + {card['owner']}")
        else:
            seen[card['id']] = card['owner']

def finalize_turn(player, current_turn):
    if player['talon']:
        card = player['talon'].pop()
        player['waste'].append(card)
        print(f"📥 {current_turn} moves {card['rank']} of {card['suit_name']} to discard pile.")
    else:
        print(f"🕳️ {current_turn}'s talon is empty.")

    next_turn = "Player 2" if current_turn == "Player 1" else "Player 1"
    print(f"🔁 Turn changes to {next_turn}")
    return next_turn

def main():
    turn_locked = False
    revealed_talon_card_p1 = None
    revealed_talon_card_p2 = None
    end_turn_btn = pygame.Rect(0, 0, 0, 0)
    crapette_btn = pygame.Rect(0, 0, 0, 0)
    clock = pygame.time.Clock()
    player1, player2, foundation_left, foundation_right, tableau_left, tableau_right = deal_cards()
    selected_card, selected_from, selected_index = None, None, None
    # ✅ Debug check for card ID uniqueness
    check_card_id_uniqueness(player1, player2, tableau_left, tableau_right)
    current_turn = "Player 1"
    running = True
    suggestion_text = ""  # Holds help message between frames

    while running:
        SCREEN.fill(GREEN)
        card_areas, foundation_areas, tableau_areas = [], [], []

        # Bottom Player (Player 1)
        bot_y = HEIGHT - CARD_HEIGHT - 50

        draw_label("Talon", 50, bot_y, SCREEN)
        talon_color = (220, 220, 220) if current_turn == "Player 1" else (100, 100, 100)

        # Draw stacked backs
        for i in range(min(5, len(player1['talon']))):
            draw_card(50 + i * 2, bot_y, {}, hidden=True, screen=SCREEN, back_color="red")

        # ✅ Only draw Player 1's talon card if NO other moves are possible
        if current_turn == "Player 1" and player1.get('revealed'):
                draw_card(50, bot_y, player1['revealed'], selected_card == player1['revealed'], screen=SCREEN)


        draw_label("Discard", 180, bot_y, SCREEN)
        if player1['waste']:
            top = player1['waste'][-1]
            rect = draw_card(180, bot_y, top, selected_card is top, screen=SCREEN)
            card_areas.append((rect, top, 'waste', None))
        else:
            draw_slot(180, bot_y, SCREEN)

        draw_label("Crapette", 310, bot_y, SCREEN)
        if player1['crapette']:
            for i in range(11):
                draw_card(310 + i * 2, bot_y, {}, hidden=True, screen=SCREEN, back_color="red")
            top = player1['crapette'][-1]
            rect = draw_card(310, bot_y, top, selected_card == top, screen=SCREEN, back_color="red")
            card_areas.append((rect, top, 'crapette', None))
        else:
            draw_slot(310, bot_y, SCREEN)

        # Top Player (Player 2)
        draw_label("Talon", 50, 50, SCREEN)
        for i in range(min(5, len(player2['talon']))):
            draw_card(50 + i * 2, 50, {}, hidden=True, screen=SCREEN, back_color="blue")

        # ✅ Only draw Player 2's talon card if NO other moves are possible
        if current_turn == "Player 2" and player2.get('revealed'):
                draw_card(50, 50, player2['revealed'], selected_card == player2['revealed'], screen=SCREEN)


        if player2['waste']:
            top = player2['waste'][-1]
            rect = draw_card(180, 50, top, selected_card is top, screen=SCREEN)
            card_areas.append((rect, top, 'p2_waste', None))  # ✅ Add this!
        else:
            draw_slot(180, 50, SCREEN)

        draw_label("Crapette", 310, 50, SCREEN)
        if player2['crapette']:
            for i in range(11):  # Back cards
                draw_card(310 + i * 2, 50, {}, hidden=True, screen=SCREEN, back_color="blue")
            top = player2['crapette'][-1]
            rect = draw_card(310, 50, top, selected_card == top, screen=SCREEN, back_color="blue")
            card_areas.append((rect, top, 'p2_crapette', None))
        else:
            draw_slot(310, 50, SCREEN)

        # ✅ Always draw buttons every frame
        end_turn_btn = draw_turn_button(current_turn, SCREEN)
        crapette_btn = draw_crapette_button(SCREEN)

        # Foundation + Tableau Layout
        fx_left = WIDTH // 2 - CARD_WIDTH - 20
        fx_right = WIDTH // 2 + 20
        fy_start = 200
        tx_left = fx_left - CARD_WIDTH - 20
        tx_right = fx_right + CARD_WIDTH + 20
        
        foundation_suits = ['♥', '♠', '♣', '♦']
        
        for i in range(4):
            y = fy_start + i * (CARD_HEIGHT + 10)
            suit = foundation_suits[i]
            
            # Left foundation
            if foundation_left[i]:
                lc = foundation_left[i][-1]
                rect_l = draw_card(fx_left, y, lc, selected_card is lc, screen=SCREEN)
            else:
                rect_l = draw_slot(fx_left, y, SCREEN)
                color = (200, 0, 0) if suit in ['♥', '♦'] else (0, 0, 0)
                suit_text = FONT.render(suit, True, color)
                text_rect = suit_text.get_rect(center=(fx_left + CARD_WIDTH // 2, y + CARD_HEIGHT // 2))
                SCREEN.blit(suit_text, text_rect)

            # Right foundation
            if foundation_right[i]:
                rc = foundation_right[i][-1]
                rect_r = draw_card(fx_right, y, rc, selected_card is rc, screen=SCREEN)
            else:
                rect_r = draw_slot(fx_right, y, SCREEN)
                color = (200, 0, 0) if suit in ['♥', '♦'] else (0, 0, 0)
                suit_text = FONT.render(suit, True, color)
                text_rect = suit_text.get_rect(center=(fx_right + CARD_WIDTH // 2, y + CARD_HEIGHT // 2))
                SCREEN.blit(suit_text, text_rect)

            foundation_areas.append((rect_l, 'left', i))
            foundation_areas.append((rect_r, 'right', i))

            if tableau_left[i]:
                stack_rects = draw_stack(tx_left, y, tableau_left[i], selected_card, screen=SCREEN, direction='left')
                top_rect, top_card = stack_rects[-1]
                card_areas.append((top_rect, top_card, 'tableau_left', i))
                tableau_areas.append((top_rect, 'left', i))
            else:
                tableau_areas.append((draw_slot(tx_left, y, SCREEN), 'left', i))

            if tableau_right[i]:
                stack_rects = draw_stack(tx_right, y, tableau_right[i], selected_card, screen=SCREEN, direction='right')
                top_rect, top_card = stack_rects[-1]
                card_areas.append((top_rect, top_card, 'tableau_right', i))
                tableau_areas.append((top_rect, 'right', i))
            else:
                tableau_areas.append((draw_slot(tx_right, y, SCREEN), 'right', i))

        # 🎯 Now check for events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_h:
                    if current_turn == "Player 1":
                        suggestion_text = suggest_move(player1, player2, foundation_left, foundation_right, tableau_left, tableau_right)
                    else:
                        suggestion_text = suggest_move(player2, player1, foundation_left, foundation_right, tableau_left, tableau_right)
                    print(f"🧠 Hint: {suggestion_text}")
            
            elif event.type == pygame.MOUSEBUTTONDOWN:
                mx, my = pygame.mouse.get_pos()
                
                # ✅ button clicks
                if end_turn_btn.collidepoint((mx, my)):
                    turn_locked = False
                    player = player1 if current_turn == "Player 1" else player2
                
                    # ♻️ Automatically move revealed talon card to waste if still on top
                    if current_turn == "Player 1" and revealed_talon_card_p1 and player1['talon'] and player1['talon'][-1] == revealed_talon_card_p1:
                        card = player1['talon'].pop()
                        player1['waste'].append(card)
                        print(f"♻️ Player 1 auto-moved {card['rank']} of {card['suit_name']} to waste")

                    elif current_turn == "Player 2" and revealed_talon_card_p2 and player2['talon'] and player2['talon'][-1] == revealed_talon_card_p2:
                        card = player2['talon'].pop()
                        player2['waste'].append(card)
                        print(f"♻️ Player 2 auto-moved {card['rank']} of {card['suit_name']} to waste")    
                    
                    current_turn = finalize_turn(player, current_turn)
                
                # 🔘 Crapette button
                _ = handle_crapette_button_click((mx, my), crapette_btn)

                # 🔹 Talon Click Handling
                if 50 <= mx <= 50 + CARD_WIDTH and bot_y <= my <= bot_y + CARD_HEIGHT:
                    if current_turn == "Player 1" and player1['talon']:
                        # If already revealed, toggle selection
                        if player1.get("revealed"):
                            if selected_card == player1["revealed"]:
                                selected_card = selected_from = selected_index = None
                                print("🟢 Deselected revealed talon card.")
                            else:
                                selected_card = player1["revealed"]
                                selected_from = "revealed"
                                selected_index = None
                                print(f"🟢 Selected {selected_card['rank']} of {selected_card['suit_name']}")
                            continue
                        
                        # Crapette and move checks before revealing
                        if player1['crapette']:
                            top_crapette = player1['crapette'][-1]    
                            if can_play_anywhere(top_crapette, player1, player2, foundation_left, foundation_right, tableau_left, tableau_right):
                                print("❌ Crapette card must be used before talon.")
                                continue

                        # Then check if ANY other move is possible
                        if has_any_valid_move(player1, player2, foundation_left, foundation_right, tableau_left, tableau_right):
                            print("❌ You still have possible moves. Talon is not allowed.")
                            continue
                        
                        # Reveal if none already
                        player1["revealed"] = player1["talon"].pop()
                        print(f"🃏 Player 1 revealed {player1['revealed']['rank']} of {player1['revealed']['suit_name']}")
                        continue

                if 50 <= mx <= 50 + CARD_WIDTH and 50 <= my <= 50 + CARD_HEIGHT:
                    if current_turn == "Player 2" and player2['talon']:
                        # If already revealed, toggle selection
                        if player2.get("revealed"):
                            if selected_card == player2["revealed"]:
                                selected_card = selected_from = selected_index = None
                                print("🟢 Deselected revealed talon card.")
                            else:
                                selected_card = player2["revealed"]
                                selected_from = "revealed"
                                selected_index = None
                                print(f"🟢 Selected {selected_card['rank']} of {selected_card['suit_name']}")
                            continue
                        
                        # First check if crapette has a playable card
                        if player2['crapette']:
                            top_crapette = player2['crapette'][-1]
                            if can_play_anywhere(top_crapette, player2, player1, foundation_left, foundation_right, tableau_left, tableau_right):
                                print("❌ Crapette card must be used before talon.")
                                continue
                        
                        # Then check if ANY other move is possible
                        if has_any_valid_move(player2, player1, foundation_left, foundation_right, tableau_left, tableau_right):
                            print("❌ You still have possible moves. Talon is not allowed.")
                            continue
                        
                        # Reveal if allowed
                        player2["revealed"] = player2["talon"].pop()
                        print(f"🃏 Player 2 revealed {player2['revealed']['rank']} of {player2['revealed']['suit_name']}")
                        continue
                    
                # 🟢 Card interaction
                if selected_card and not turn_locked:
                    piles = {
                        'mouse': (mx, my),
                        'player1': player1,
                        'player2': player2,
                        'tableau_left': tableau_left,
                        'tableau_right': tableau_right,
                        'foundation_left': foundation_left,
                        'foundation_right': foundation_right,
                        'can_play_on_foundation': can_play_on_foundation,
                        'can_play_on_tableau': can_play_on_tableau,
                        'can_play_on_crapette': can_play_on_crapette,
                        'card_value': card_value,
                        'current_turn': current_turn
                    }

                    placed = (
                        try_place_on_foundation(foundation_areas, selected_card, selected_from, selected_index, piles) or
                        try_place_on_tableau(tableau_areas, selected_card, selected_from, selected_index, piles) or
                        try_place_on_crapette(player2['crapette'], selected_card, selected_from, selected_index, piles) or
                        try_place_on_opponent_waste(selected_card, selected_from, selected_index, piles)
                    )
                    if placed:
                        selected_card = selected_from = selected_index = None
                    else:
                        new_card, new_from, new_index = handle_selection(card_areas, (mx, my), (selected_card, selected_from, selected_index))
                        print(f"DEBUG → new: {new_card}, selected: {selected_card}, is same object: {new_card is selected_card}")

                    if new_card is None:
                        # 🟢 Clicked on empty space — deselect
                        selected_card = selected_from = selected_index = None
                        print("🟢 Deselected (empty space or same card)")
                    else:
                        # 🟢 Selected a different card
                        selected_card = new_card
                        selected_from = new_from
                        selected_index = new_index
                        print(f"🟢 Selected {new_card['rank']} of {new_card['suit_name']}")
                else:
                    # 🟢 Initial selection
                    new_card, new_from, new_index = handle_selection(card_areas, (mx, my), (selected_card, selected_from, selected_index))
                    if new_card is None:
                        selected_card = selected_from = selected_index = None
                        print("🟢 Deselected (clicked empty space)")
                    else:
                        selected_card = new_card
                        selected_from = new_from
                        selected_index = new_index
                        print(f"🟢 Selected {new_card['rank']} of {new_card['suit_name']}")

                # 🔘 Draw Turn and Crapette buttons
                end_turn_btn = draw_turn_button(current_turn, SCREEN)
                crapette_btn = draw_crapette_button(SCREEN)
        if suggestion_text:
            help_surface = FONT.render(suggestion_text, True, (255, 255, 255))  # white text
            SCREEN.blit(help_surface, (50, HEIGHT - 30))  # draw it near the bottom

        pygame.display.flip()
        clock.tick(60)

    pygame.quit()

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print("🚨 An error occurred:", e)
        input("Press Enter to close...")

from ui_helpers import can_play_anywhere


def handle_selection(card_areas, pos, current_selected):
    for rect, card, source, index in card_areas:
        if rect.collidepoint(pos):
            if current_selected and current_selected[0] == card:
                return None, None, None  # Deselect if same card clicked
            return card, source, index
    return None, None, None # Clicked outside → deselect

FOUNDATION_SUIT_INDEX = {'♥': 0, '♠': 1, '♣': 2, '♦': 3}

def try_place_on_foundation(foundations, selected_card, selected_from, selected_index, piles):
    correct_index = FOUNDATION_SUIT_INDEX[selected_card['suit']]
    
    for rect, side, i in foundations:
        if i != correct_index:
            continue  # ❌ Skip slots not for this suit
        
        pile = piles['foundation_left'][i] if side == 'left' else piles['foundation_right'][i]
        
        if rect.collidepoint(piles['mouse']) and piles['can_play_on_foundation'](selected_card, pile):
            pile.append(selected_card)
            remove_card_from_source(piles, selected_from, selected_index)
            return True
            
    return False


def try_place_on_tableau(tableaus, selected_card, selected_from, selected_index, piles):
    for rect, side, i in tableaus:
        pile = piles['tableau_left'][i] if side == 'left' else piles['tableau_right'][i]
        if rect.collidepoint(piles['mouse']) and (not pile or piles['can_play_on_tableau'](selected_card, pile[-1])):
            pile.append(selected_card)
            remove_card_from_source(piles, selected_from, selected_index)
            return True
    return False

def try_place_on_crapette(opponent_crapette, selected_card, selected_from, selected_index, piles):
    if opponent_crapette and piles['can_play_on_crapette'](selected_card, opponent_crapette[-1]):
        opponent_crapette.append(selected_card)
        remove_card_from_source(piles, selected_from, selected_index)
        return True
    return False

def try_place_on_opponent_waste(selected_card, selected_from, selected_index, piles):
    """
    Allows placing a card on the opponent's waste pile (discard pile).
    Rules:
    - Must alternate colors.
    - Rank must be +1 or -1 from the top card.
    """
    current_turn = piles['current_turn']
    source_player = piles['player1'] if current_turn == "Player 1" else piles['player2']
    opponent = piles['player2'] if current_turn == "Player 1" else piles['player1']

    target_waste = opponent['waste']
    if not target_waste:
        return False

    top = target_waste[-1]
    if (
        selected_card['color'] != top['color'] and
        abs(piles['card_value'](selected_card) - piles['card_value'](top)) == 1
    ):
        target_waste.append(selected_card)
        remove_card_from_source(piles, selected_from, selected_index)
        print(f"🔁 Played {selected_card['rank']} on opponent's discard pile")
        return True

    return False


def remove_card_from_source(piles, source, index):
    if source == 'crapette':
        piles['player1']['crapette'].pop()
    elif source == 'waste':
        piles['player1']['waste'].pop()
    elif source == 'tableau_left':
        piles['tableau_left'][index].pop()
    elif source == 'tableau_right':
        piles['tableau_right'][index].pop()

def try_draw_from_talon(mouse_pos, current_turn, player1, player2, card_width, card_height, bot_y, foundation_left, foundation_right, tableau_left, tableau_right):
    # Player 1 (bottom)
    if current_turn == "Player 1" and 50 <= mouse_pos[0] <= 50 + card_width and bot_y <= mouse_pos[1] <= bot_y + card_height:
        if player1['crapette']:
            top_crapette = player1['crapette'][-1]
            if can_play_anywhere(top_crapette, player1, player2, foundation_left, foundation_right, tableau_left, tableau_right):
                print("❌ Player 1 must use crapette card before talon.")
                return False
        if player1['talon']:
            card = player1['talon'].pop()
            player1['waste'].append(card)
            print(f"🃏 Player 1 drew {card['rank']} of {card['suit_name']}")
            return True

    # Player 2 (top)
    if current_turn == "Player 2" and 50 <= mouse_pos[0] <= 50 + card_width and 50 <= mouse_pos[1] <= 50 + card_height:
        if player2['crapette']:
            top_crapette = player2['crapette'][-1]
            if can_play_anywhere(top_crapette, player2, player1, foundation_left, foundation_right, tableau_left, tableau_right):
                print("❌ Player 2 must use crapette card before talon.")
                return False
        if player2['talon']:
            card = player2['talon'].pop()
            player2['waste'].append(card)
            print(f"🃏 Player 2 drew {card['rank']} of {card['suit_name']}")
            return True

    return False
    
    # Switch turn
    next_turn = "Player 2" if current_turn == "Player 1" else "Player 1"
    print(f"🔁 Turn changes to {next_turn}")
    return next_turn

def handle_turn_button_click(mouse_pos, end_turn_btn, current_turn):
    if end_turn_btn.collidepoint(mouse_pos):
        next_turn = "Player 2" if current_turn == "Player 1" else "Player 1"
        print(f"🔁 Turn changed to {next_turn}")
        return next_turn
    return current_turn


def handle_crapette_button_click(mouse_pos, crapette_btn):
    if crapette_btn.collidepoint(mouse_pos):
        print("🛑 Crapette claimed! (Check logic here)")
        return True
    return False

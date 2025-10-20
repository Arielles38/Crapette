RANKS = ['a'] + [str(n) for n in range(2, 11)] + ['j', 'q', 'k']

def card_value(card):
    return RANKS.index(card['rank'])

def can_draw_talon(player, opponent, foundation_left, foundation_right, tableau_left, tableau_right):
    return not (
        player['crapette'] and can_play_anywhere(
            player['crapette'][-1],
            player,
            opponent,
            foundation_left,
            foundation_right,
            tableau_left,
            tableau_right
        )
    )

def has_any_valid_move(player, opponent, foundation_left, foundation_right, tableau_left, tableau_right):
    def is_progressive_move(card, target):
        return (
            card['color'] != target['color'] and
            card_value(card) == card_value(target) - 1
        )

    # 1️⃣ Check crapette
    if player['crapette']:
        card = player['crapette'][-1]
        for pile in foundation_left + foundation_right:
            if can_play_on_foundation(card, pile):
                return True
        for pile in tableau_left + tableau_right:
            if pile and is_progressive_move(card, pile[-1]):
                if len(pile) > 1:  # Avoid just swapping into 1-card piles
                    return True
            elif not pile:
                return True
        if opponent['waste']:
            top = opponent['waste'][-1]
            if (
                card['suit'] == top['suit']
                and abs(card_value(card) - card_value(top)) == 1
                and card['color'] != top['color']
            ):
                return True

    # 2️⃣ Check waste
    if player['waste']:
        card = player['waste'][-1]
        for pile in foundation_left + foundation_right:
            if can_play_on_foundation(card, pile):
                return True
        for pile in tableau_left + tableau_right:
            if pile and is_progressive_move(card, pile[-1]):
                if len(pile) > 1:# Avoid pointless cycle
                    return True
            elif not pile:
                return True

    # 3️⃣ Tableau to foundation or **meaningful tableau moves only**
    for tableau in [tableau_left, tableau_right]:
        for i, pile in enumerate(tableau):
            if pile:
                card = pile[-1]

                # Try to move to foundation
                for f_pile in foundation_left + foundation_right:
                    if can_play_on_foundation(card, f_pile):
                        return True

                # Try moving to another tableau **only if the pile has more than 1 card**
                if len(pile) > 1:
                    for j, target in enumerate(tableau):
                        if i != j and target:
                            if is_progressive_move(card, target[-1]):
                                # Prevent back-and-forth loops: only allow if destination has more than 1 card
                             if len(target) > 1:    
                                return True
                        elif i != j and not target:
                            # Allow move to empty tableau only if it's not just to reshuffle
                            return True

    # 4️⃣ Crapette to opponent's crapette pile
    if player['crapette'] and opponent['crapette']:
        card = player['crapette'][-1]
        top = opponent['crapette'][-1]
        if can_play_on_opponent_crapette(card, top):
            return True
        
    return False

def can_play_on_tableau(card, target):
    return card_value(card) == card_value(target) - 1 and card['color'] != target['color']

def can_play_on_foundation(card, pile):
    if not pile:
        return card['rank'] == 'a'
    top = pile[-1]
    return top['suit'] == card['suit'] and card_value(card) == card_value(top) + 1

def can_play_on_crapette(card, target):
    return card['suit'] == target['suit'] and abs(card_value(card) - card_value(target)) == 1

def can_play_on_opponent_crapette(card, top):
    return (
        card['suit'] == top['suit'] and
        abs(card_value(card) - card_value(top)) == 1
    )

def can_play_anywhere(card, player1, player2, foundation_left, foundation_right, tableau_left, tableau_right):
    # Check foundations (left and right)
    for pile in foundation_left + foundation_right:
        if can_play_on_foundation(card, pile):
            return True

    # Check tableau
    for pile in tableau_left + tableau_right:
        if pile: 
            top = pile[-1]
            if can_play_on_tableau(card, top):
                return True
        else:
            # Optional: Allow placing on empty tableau (if game rules allow this)
            return True

    # Check if can be placed on opponent's waste
    if player2['waste']:
        top = player2['waste'][-1]
        if (
            card['suit'] == top['suit']
            and abs(card_value(card) - card_value(top)) == 1
            and card['color'] != top['color']
        ):
            return True

    return False

def suggest_move(player, opponent, foundation_left, foundation_right, tableau_left, tableau_right):
    def check_foundations(card):
        for pile in foundation_left + foundation_right:
            if can_play_on_foundation(card, pile):
                return True
        return False

    # Check crapette
    if player['crapette']:
        card = player['crapette'][-1]
        if check_foundations(card):
            return f"You can move {card['rank']} of {card['suit_name']} from Crapette to Foundation."
        for i, pile in enumerate(tableau_left + tableau_right):
            if pile and can_play_on_tableau(card, pile[-1]):
                return f"You can move {card['rank']} of {card['suit_name']} from Crapette to Tableau pile {i + 1}."
            if not pile:
                return f"You can move {card['rank']} of {card['suit_name']} from Crapette to an empty Tableau pile."
        if opponent['waste']:
            top = opponent['waste'][-1]
            if card['suit'] == top['suit'] and abs(card_value(card) - card_value(top)) == 1 and card['color'] != top['color']:
                return f"You can move {card['rank']} of {card['suit_name']} from Crapette to opponent's Waste."

    # Check waste
    if player['waste']:
        card = player['waste'][-1]
        if check_foundations(card):
            return f"You can move {card['rank']} of {card['suit_name']} from Waste to Foundation."
        for i, pile in enumerate(tableau_left + tableau_right):
            if pile and can_play_on_tableau(card, pile[-1]):
                return f"You can move {card['rank']} of {card['suit_name']} from Waste to Tableau pile {i + 1}."
            if not pile:
                return f"You can move {card['rank']} of {card['suit_name']} from Waste to an empty Tableau pile."

    # Check tableau top cards
    for side, tableau in zip(["left", "right"], [tableau_left, tableau_right]):
        for i, pile in enumerate(tableau):
            if pile:
                card = pile[-1]
                if check_foundations(card):
                    return f"You can move {card['rank']} of {card['suit_name']} from Tableau {side} pile {i + 1} to Foundation."
                for j, other_pile in enumerate(tableau):
                    if i != j and other_pile:
                        if can_play_on_tableau(card, other_pile[-1]):
                            return f"You can move {card['rank']} of {card['suit_name']} from Tableau {side} pile {i + 1} to pile {j + 1}."
                    if i != j and not other_pile:
                        return f"You can move {card['rank']} of {card['suit_name']} from Tableau {side} pile {i + 1} to empty pile {j + 1}."

    return "🤷 No valid moves found."


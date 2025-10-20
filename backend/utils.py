def get_card_from_input(user_input):
    ranks = ['A'] + [str(n) for n in range(2, 11)] + ['J', 'Q', 'K']
    suits = ['♠', '♥', '♦', '♣']
    rank = user_input[:-1]
    suit = user_input[-1]
    if rank in ranks and suit in suits:
        from card import Card
        return Card(rank, suit)
    return None

import pygame

pygame.font.init()  # 🔧 Initialize fonts

CARD_WIDTH, CARD_HEIGHT = 70, 100
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GRAY = (160, 160, 160)
YELLOW = (255, 255, 0)
RED = (200, 60, 60)
BLUE = (70, 130, 180)
FONT = pygame.font.SysFont("arial", 18)

import os
# Bigger, bolder font for card ranks/suits
CARD_FONT = pygame.font.SysFont("arial", 22, bold=True)

def draw_card(x, y, card, selected=False, hidden=False, screen=None, back_color="blue"):
    rect = pygame.Rect(x, y, CARD_WIDTH, CARD_HEIGHT)
    
    if hidden:
        back_file = "red_back.png" if back_color == "red" else "blue_back.png"
        back_path = os.path.join("..","assets", "cards", back_file)
        try:
            back_img = pygame.image.load(back_path)
            back_img = pygame.transform.scale(back_img, (CARD_WIDTH, CARD_HEIGHT))
            screen.blit(back_img, (x, y))
        except Exception as e:
            print(f"⚠️ Error loading back image: {e}")
            pygame.draw.rect(screen, (0, 255, 0), rect, 3)
        return rect  # ✅ Stop here if it's a hidden card
    
    # Draw card front (image or fallback)
    try:
        RANK_IMAGE_MAP = {'a': 'ace', 'j': 'jack', 'q': 'queen', 'k': 'king'}
        rank = card['rank'].lower()
        mapped_rank = RANK_IMAGE_MAP.get(rank, rank)
        filename = f"{card['suit_name']}_{mapped_rank}.png"
        image_path = os.path.join("..","assets", "cards", filename)
        img = pygame.image.load(image_path)
        img = pygame.transform.scale(img, (CARD_WIDTH, CARD_HEIGHT))
        screen.blit(img, (x, y))
    except Exception as e:
        print(f"⚠️ Error loading image for {card}: {e}")
        pygame.draw.rect(screen, (255, 255, 255), rect)
        pygame.draw.rect(screen, (0, 0, 0), rect, 2)

    # Overlay rank/suit in corners
    if card and 'rank' in card and 'suit' in card:
        text_color = (200, 0, 0) if card['color'] == 'red' else (0, 0, 0)
        rank = card['rank'].upper()
        suit = card['suit']

    if selected:
        pygame.draw.rect(screen, (50, 200, 100), rect, 3) # ✅ Green border when selected

    return rect

def draw_slot(x, y, screen):
    rect = pygame.Rect(x, y, CARD_WIDTH, CARD_HEIGHT)
    pygame.draw.rect(screen, GRAY, rect)
    pygame.draw.rect(screen, BLACK, rect, 2)
    return rect


def draw_label(text, x, y, screen):
    label = FONT.render(text, True, WHITE)
    screen.blit(label, (x, y - 20))


def draw_stack(x, y, stack, selected_card, screen, direction='down'):
    offset = 20
    rects = []
    for i, card in enumerate(stack):
        if direction == 'down':
            rect = draw_card(x, y + i * offset, card, selected_card is card, screen=screen)
        elif direction == 'right':
            rect = draw_card(x + i * offset, y, card, selected_card is card, screen=screen)
        elif direction == 'left':
            rect = draw_card(x - i * offset, y, card, selected_card is card, screen=screen)
        rects.append((rect, card))
    return rects

def draw_turn_button(current_turn, screen):
    btn = pygame.Rect(screen.get_width() - 200, screen.get_height() - 60, 160, 40)
    pygame.draw.rect(screen, (70, 130, 180), btn)
    pygame.draw.rect(screen, (255, 255, 255), btn, 2)
    label = f"End Turn ({current_turn})"
    screen.blit(FONT.render(label, True, (255, 255, 255)), (btn.x + 10, btn.y + 10))
    return btn

def draw_crapette_button(screen):
    btn = pygame.Rect(screen.get_width() - 200, screen.get_height() - 110, 160, 40)
    pygame.draw.rect(screen, (200, 60, 60), btn)
    pygame.draw.rect(screen, (255, 255, 255), btn, 2)
    screen.blit(FONT.render("Claim Crapette!", True, (255, 255, 255)), (btn.x + 10, btn.y + 10))
    return btn
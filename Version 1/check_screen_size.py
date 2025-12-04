import pygame

pygame.init()
info = pygame.display.Info()
screen = pygame.display.set_mode((info.current_w, info.current_h))
print(f"Screen resolution: {info.current_w} x {info.current_h}")
pygame.quit()

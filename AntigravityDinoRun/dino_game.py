import pygame
import random
import sys
import os

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 1000
SCREEN_HEIGHT = 400
FPS = 60

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Game Settings
GRAVITY = 0.6
JUMP_STRENGTH = -12
GAME_SPEED_START = 5
MAX_GAME_SPEED = 13

# Sprite Coordinates (x, y, width, height)
# Based on analysis and user feedback:
# Frame 1: Jump (Sprite 0)
# Frame 2: Stand/Blink (Sprite 1)
# Frame 3: Run 1 (Sprite 3)
# Frame 4: Run 2 (Part of Sprite 4?)
# Frame 5: Dead (Part of Sprite 4?)
# Sprite 4 was 184w. 184/2 = 92. So likely Frame 4 and 5 are in Sprite 4.

SPRITES = {
    'dino_jump': (1338, 2, 88, 94),      # TREX_IDLE (Frame 1)
    'dino_stand': (1426, 2, 88, 94),     # TREX_BLINK (Frame 2)
    'dino_run': [
        (1514, 2, 88, 94),             # TREX_RUN_1 (Frame 3)
        (1602, 2, 88, 94)              # TREX_RUN_2 (Frame 4)
    ],
    'dino_dead': (1690, 2, 88, 94),    # TREX_CRASH (Frame 5)
    
    # Ducking (Not in JSON, using previous best guess based on position)
    'dino_duck': [(1866, 36, 118, 92), (1984, 36, 118, 92)], 
    
    'cactus_small': [
        (446, 2, 34, 70),   # CACTUS_SMALL_1
        (480, 2, 68, 70),   # CACTUS_SMALL_2
        (548, 2, 102, 70)   # CACTUS_SMALL_3
    ],
    'cactus_large': [
        (652, 2, 50, 100),  # CACTUS_LARGE_1
        (702, 2, 100, 100)  # CACTUS_LARGE_2
    ],
    
    'bird': [
        (260, 2, 92, 80),   # PTERODACTYL_1
        (352, 2, 92, 80)    # PTERODACTYL_2
    ],
    
    'ground': (2, 104, 2400, 24),
    'cloud': (166, 2, 92, 28)
}

class SpriteSheet:
    def __init__(self, filename):
        self.sheet = pygame.image.load(filename).convert_alpha()

    def get_image(self, x, y, width, height, scale=1.0):
        image = pygame.Surface((width, height), pygame.SRCALPHA)
        image.blit(self.sheet, (0, 0), (x, y, width, height))
        if scale != 1.0:
            image = pygame.transform.scale(image, (int(width * scale), int(height * scale)))
        return image

class Dino:
    def __init__(self, sprite_sheet):
        self.sprite_sheet = sprite_sheet
        # Load Images
        self.imgs_run = [sprite_sheet.get_image(*coord, scale=0.5) for coord in SPRITES['dino_run']]
        self.imgs_duck = [sprite_sheet.get_image(*coord, scale=0.5) for coord in SPRITES['dino_duck']]
        self.img_jump = sprite_sheet.get_image(*SPRITES['dino_jump'], scale=0.5)
        self.img_dead = sprite_sheet.get_image(*SPRITES['dino_dead'], scale=0.5)
        
        self.image = self.imgs_run[0]
        self.rect = self.image.get_rect()
        self.rect.x = 50
        self.rect.y = SCREEN_HEIGHT - 100
        
        self.vel_y = 0
        self.is_jumping = False
        self.is_ducking = False
        self.run_index = 0
        self.duck_index = 0
        self.step_timer = 0
        self.dead = False

    def jump(self):
        if not self.is_jumping and not self.is_ducking:
            self.is_jumping = True
            self.vel_y = JUMP_STRENGTH

    def update(self, user_input):
        if self.dead:
            self.image = self.img_dead
            return

        # Variable Jump Height
        if self.is_jumping:
            self.vel_y += GRAVITY
            self.rect.y += self.vel_y
            
            # If user releases space, cut jump short
            if self.vel_y < -3 and not (user_input[pygame.K_SPACE] or user_input[pygame.K_UP]):
                self.vel_y = -3

            if self.rect.bottom >= SCREEN_HEIGHT - 20:
                self.rect.bottom = SCREEN_HEIGHT - 20
                self.is_jumping = False
                self.vel_y = 0
            self.image = self.img_jump
        
        # Duck
        elif user_input[pygame.K_DOWN]:
            self.is_ducking = True
            self.is_jumping = False
            self.rect.y = SCREEN_HEIGHT - 20 - 40
            
            self.step_timer += 1
            if self.step_timer > 5:
                self.duck_index = (self.duck_index + 1) % len(self.imgs_duck)
                self.image = self.imgs_duck[self.duck_index]
                self.step_timer = 0
            
            current_bottom = self.rect.bottom
            self.rect = self.image.get_rect()
            self.rect.x = 50
            self.rect.bottom = current_bottom
            
        # Run
        else:
            self.is_ducking = False
            self.is_jumping = False
            self.rect.y = SCREEN_HEIGHT - 20 - 60
            
            self.step_timer += 1
            if self.step_timer > 5:
                self.run_index = (self.run_index + 1) % len(self.imgs_run)
                self.image = self.imgs_run[self.run_index]
                self.step_timer = 0
            
            current_bottom = self.rect.bottom
            self.rect = self.image.get_rect()
            self.rect.x = 50
            self.rect.bottom = current_bottom

    def draw(self, screen):
        screen.blit(self.image, self.rect)

class Obstacle:
    def __init__(self, sprite_sheet, type):
        self.type = type
        if type == 'cactus_small':
            # 1, 2, or 3 small cacti
            group_size = random.randint(0, 2) # 0=1, 1=2, 2=3
            coords = SPRITES['cactus_small'][group_size]
            self.image = sprite_sheet.get_image(*coords, scale=0.5)
            self.rect = self.image.get_rect()
            self.rect.bottom = SCREEN_HEIGHT - 20
        elif type == 'cactus_large':
             # 1 or 2 large cacti
            group_size = random.randint(0, len(SPRITES['cactus_large']) - 1)
            coords = SPRITES['cactus_large'][group_size]
            self.image = sprite_sheet.get_image(*coords, scale=0.5)
            self.rect = self.image.get_rect()
            self.rect.bottom = SCREEN_HEIGHT - 20
        elif type == 'bird':
            self.images = [sprite_sheet.get_image(*coord, scale=0.5) for coord in SPRITES['bird']]
            self.image = self.images[0]
            self.rect = self.image.get_rect()
            
            height_choice = random.choice(['low', 'mid', 'high'])
            if height_choice == 'low':
                self.rect.bottom = SCREEN_HEIGHT - 25
            elif height_choice == 'mid':
                self.rect.bottom = SCREEN_HEIGHT - 55
            else:
                self.rect.bottom = SCREEN_HEIGHT - 90
            
            self.index = 0
            self.timer = 0

        self.rect.x = SCREEN_WIDTH

    def update(self, speed):
        self.rect.x -= speed
        if self.type == 'bird':
            self.timer += 1
            if self.timer > 10:
                self.index = (self.index + 1) % len(self.images)
                self.image = self.images[self.index]
                self.timer = 0

    def draw(self, screen):
        screen.blit(self.image, self.rect)

class Cloud:
    def __init__(self, sprite_sheet):
        self.image = sprite_sheet.get_image(*SPRITES['cloud'], scale=0.5)
        self.rect = self.image.get_rect()
        self.rect.x = SCREEN_WIDTH + random.randint(0, 300)
        self.rect.y = random.randint(50, 150)
        self.speed = random.randint(1, 3)

    def update(self):
        self.rect.x -= self.speed
        if self.rect.right < 0:
            self.rect.x = SCREEN_WIDTH + random.randint(0, 300)
            self.rect.y = random.randint(50, 150)

    def draw(self, screen):
        screen.blit(self.image, self.rect)

def main():
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Dino Jump")
    clock = pygame.time.Clock()
    font = pygame.font.Font(None, 36)
    
    if not os.path.exists('sprite.png'):
        print("Error: sprite.png not found")
        return
        
    sprite_sheet = SpriteSheet('sprite.png')
    
    dino = Dino(sprite_sheet)
    obstacles = []
    clouds = [Cloud(sprite_sheet) for _ in range(3)]
    spawn_timer = 0
    score = 0
    game_speed = GAME_SPEED_START
    game_over = False
    
    ground_img = sprite_sheet.get_image(*SPRITES['ground'])
    ground_x = 0
    
    running = True
    while running:
        clock.tick(FPS)
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE or event.key == pygame.K_UP:
                    if game_over:
                        dino = Dino(sprite_sheet)
                        obstacles = []
                        spawn_timer = 0
                        score = 0
                        game_speed = GAME_SPEED_START
                        game_over = False
                    else:
                        dino.jump()

        user_input = pygame.key.get_pressed()

        screen.fill(WHITE)
        
        if not game_over:
            ground_x -= game_speed
            if ground_x <= -ground_img.get_width():
                ground_x = 0
        
        screen.blit(ground_img, (ground_x, SCREEN_HEIGHT - 50))
        screen.blit(ground_img, (ground_x + ground_img.get_width(), SCREEN_HEIGHT - 50))

        if not game_over:
            for cloud in clouds:
                cloud.update()
            
            dino.update(user_input)
            
            spawn_timer += 1
            if spawn_timer > random.randint(60, 100):
                # Spawn Logic
                rand_val = random.random()
                if score > 10 and rand_val < 0.2:
                    obstacles.append(Obstacle(sprite_sheet, 'bird'))
                elif rand_val < 0.6:
                    obstacles.append(Obstacle(sprite_sheet, 'cactus_small'))
                else:
                    obstacles.append(Obstacle(sprite_sheet, 'cactus_large'))
                spawn_timer = 0
            
            for obstacle in obstacles[:]:
                obstacle.update(game_speed)
                if obstacle.rect.right < 0:
                    obstacles.remove(obstacle)
                    score += 1
                    if score % 5 == 0:
                        game_speed = min(game_speed + 0.5, MAX_GAME_SPEED)
                
                dino_hitbox = dino.rect.inflate(-10, -10)
                obstacle_hitbox = obstacle.rect.inflate(-10, -10)
                if dino_hitbox.colliderect(obstacle_hitbox):
                    game_over = True
                    dino.dead = True

            dino.draw(screen)
            for obstacle in obstacles:
                obstacle.draw(screen)
                
            score_text = font.render(f"Score: {score}", True, BLACK)
            screen.blit(score_text, (10, 10))
            
        else:
            game_over_text = font.render("GAME OVER", True, BLACK)
            restart_text = font.render("Press SPACE to Restart", True, BLACK)
            screen.blit(game_over_text, (SCREEN_WIDTH//2 - 70, SCREEN_HEIGHT//2 - 20))
            screen.blit(restart_text, (SCREEN_WIDTH//2 - 120, SCREEN_HEIGHT//2 + 20))
            
            for cloud in clouds:
                cloud.draw(screen)
            dino.draw(screen)
            for obstacle in obstacles:
                obstacle.draw(screen)

        pygame.display.flip()

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()

import pygame
import random

# Initialize Pygame
pygame.init()

# Screen dimensions
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600

# Colors
WHITE = (255, 255, 255)
BLUE = (100, 149, 237)
YELLOW = (255, 255, 0)
BLACK = (0, 0, 0)

class SolarEnergyGame:
    def __init__(self):
        # Setup the display
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Solar Energy Collector")
        
        # Game clock
        self.clock = pygame.time.Clock()
        
        # Solar panel
        self.solar_panel_width = 100
        self.solar_panel_height = 50
        self.solar_panel_x = SCREEN_WIDTH // 2 - self.solar_panel_width // 2
        self.solar_panel_y = SCREEN_HEIGHT - 100
        
        # Solar rays
        self.rays = []
        self.score = 0
        
        # Fonts
        self.font = pygame.font.Font(None, 36)
        
    def create_ray(self):
        # Create a solar ray that falls from the top
        x = random.randint(0, SCREEN_WIDTH)
        ray = {
            'x': x,
            'y': 0,
            'speed': random.randint(3, 7)
        }
        self.rays.append(ray)
    
    def run(self):
        running = True
        ray_timer = 0
        
        while running:
            # Event handling
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                
                # Move solar panel with mouse
                if event.type == pygame.MOUSEMOTION:
                    self.solar_panel_x = event.pos[0] - self.solar_panel_width // 2
            
            # Clear the screen
            self.screen.fill(BLUE)
            
            # Create solar rays periodically
            ray_timer += 1
            if ray_timer > 30:
                self.create_ray()
                ray_timer = 0
            
            # Update and draw rays
            for ray in self.rays[:]:
                ray['y'] += ray['speed']
                
                # Check if ray is caught by solar panel
                if (self.solar_panel_x < ray['x'] < self.solar_panel_x + self.solar_panel_width and
                    self.solar_panel_y < ray['y'] < self.solar_panel_y + self.solar_panel_height):
                    self.score += 1
                    self.rays.remove(ray)
                
                # Remove rays that go off screen
                if ray['y'] > SCREEN_HEIGHT:
                    self.rays.remove(ray)
                
                # Draw ray
                pygame.draw.circle(self.screen, YELLOW, (ray['x'], int(ray['y'])), 5)
            
            # Draw solar panel
            pygame.draw.rect(self.screen, WHITE, 
                             (self.solar_panel_x, self.solar_panel_y, 
                              self.solar_panel_width, self.solar_panel_height))
            
            # Draw score
            score_text = self.font.render(f"Energy Collected: {self.score}", True, BLACK)
            self.screen.blit(score_text, (10, 10))
            
            # Update display
            pygame.display.flip()
            
            # Control game speed
            self.clock.tick(60)
        
        # Quit the game
        pygame.quit()

# Run the game
if __name__ == "__main__":
    game = SolarEnergyGame()
    game.run()
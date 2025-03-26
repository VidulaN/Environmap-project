import pygame

# Initialize pygame
pygame.init()

# Constants
WIDTH, HEIGHT = 800, 600
BACKGROUND_IMAGE = "london_map.jpg"  # Replace with an actual map image
STATION_COLOR = (0, 255, 0)
LINE_COLOR = (0, 200, 0)
LINE_WIDTH = 5

# District Line station coordinates (relative to the map image)
DISTRICT_LINE_STATIONS = [
    (100, 500),  # Richmond
    (200, 450),  # Gunnersbury
    (300, 400),  # Earl's Court
    (400, 350),  # Victoria
    (500, 320),  # Tower Hill
    (600, 300),  # Whitechapel
    (700, 280),  # Upminster
]

# Load map image
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("District Line Overlay")
background = pygame.image.load(BACKGROUND_IMAGE)
background = pygame.transform.scale(background, (WIDTH, HEIGHT))

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    # Draw background
    screen.blit(background, (0, 0))
    
    # Draw District Line
    for i in range(len(DISTRICT_LINE_STATIONS) - 1):
        pygame.draw.line(screen, LINE_COLOR, DISTRICT_LINE_STATIONS[i], DISTRICT_LINE_STATIONS[i+1], LINE_WIDTH)
    
    # Draw stations
    for station in DISTRICT_LINE_STATIONS:
        pygame.draw.circle(screen, STATION_COLOR, station, 8)
    
    pygame.display.flip()

pygame.quit()

"""Fit the AI drawn eight-view male body to the game's 112 px pose grid."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "assets/mannequin/v2/source-art/warden-male-base-ai-raw.png"
TARGET = ROOT / "assets/mannequin/v2/source-art/warden-male-base-ai-112.png"

image = Image.open(SOURCE).convert("RGBA")
assert image.width % 8 == 4 and image.height == 724, image.size
cell_width = image.width // 8
sheet = Image.new("RGBA", (112 * 8, 112))
for direction in range(8):
    left = direction * cell_width
    cell = image.crop((left, 0, left + cell_width, image.height))
    pixels = cell.load()
    for y in range(cell.height):
        for x in range(cell.width):
            r, g, b, a = pixels[x, y]
            # The reference edit left a few bright red guide pixels on the contour.
            fringe = r > 110 and r > 1.45 * g and r > 1.4 * b
            if a < 225 or fringe:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                pixels[x, y] = (r, g, b, 255)
    bounds = cell.getbbox()
    assert bounds is not None
    figure = cell.crop(bounds)
    width = round(figure.width * 69 / figure.height)
    figure = figure.resize((width, 69), Image.Resampling.NEAREST)
    sheet.alpha_composite(figure, (direction * 112 + (112 - width) // 2, 32))
sheet.save(TARGET)
print(TARGET)

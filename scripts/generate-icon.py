from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

size = 256
image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
pixels = image.load()

# A soft dark rounded-square background with a violet glow.
mask = Image.new("L", (size, size), 0)
ImageDraw.Draw(mask).rounded_rectangle((8, 8, 248, 248), radius=58, fill=255)
for y in range(size):
    for x in range(size):
        if mask.getpixel((x, y)):
            distance = ((x - 190) ** 2 + (y - 55) ** 2) ** 0.5
            glow = max(0, 1 - distance / 230)
            pixels[x, y] = (
                int(22 + glow * 18),
                int(24 + glow * 10),
                int(39 + glow * 38),
                255,
            )

draw = ImageDraw.Draw(image)
draw.ellipse((55, 49, 181, 175), fill=(151, 130, 255, 255))
draw.ellipse((103, 30, 205, 135), fill=(30, 31, 51, 255))
draw.ellipse((172, 163, 190, 181), fill=(79, 220, 184, 255))
draw.ellipse((199, 139, 208, 148), fill=(157, 140, 255, 220))

image.save(ASSETS / "icon.png")
image.save(
    ASSETS / "icon.ico",
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)

"""Fill the bracelet with the cushion's own color. No division, no gold bleed."""
from PIL import Image, ImageFilter
import numpy as np

rgb = np.asarray(Image.open(r"public/images/yara-bracelet/bracelet-gift-box.webp").convert("RGB")).astype(np.float32)
mask = np.asarray(Image.open(r"public/images/yara-bracelet/bracelet-mask.png").convert("L"))
fill = np.asarray(Image.fromarray(mask).filter(ImageFilter.MaxFilter(13))) > 16
band = np.zeros_like(fill)
band[610:890, 90:1020] = True
fill &= band
print("fill", int(fill.sum()))

ring = np.asarray(Image.fromarray((fill.astype(np.uint8) * 255), mode="L").filter(ImageFilter.MaxFilter(21))) > 16
ring = ring & ~fill & band
seed = np.median(rgb[ring], axis=0)
print("seed", seed.astype(int), "ring", int(ring.sum()))

color = rgb.copy()
color[fill] = seed

def blur_rgb(arr, radius):
    image = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGB")
    return np.asarray(image.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32)

for radius in (22, 14, 9, 5):
    blurred = blur_rgb(color, radius)
    color[fill] = blurred[fill]
    color[~fill] = rgb[~fill]

# Hard replace inside the hole so the gold photograph cannot bleed back.
plate = rgb.copy()
plate[fill] = color[fill]
feather = np.asarray(
    Image.fromarray((fill.astype(np.uint8) * 255), mode="L").filter(ImageFilter.GaussianBlur(3.5))
).astype(np.float32) / 255.0
edge = (feather > 0.04) & ~fill
plate[edge] = rgb[edge] * (1 - feather[edge, None]) + color[edge] * feather[edge, None]
rng = np.random.default_rng(11)
speck = rng.normal(0, 1, plate.shape).astype(np.float32)
speck = np.asarray(
    Image.fromarray(np.clip(speck[:, :, 0] * 40 + 128, 0, 255).astype(np.uint8), mode="L").filter(ImageFilter.GaussianBlur(0.8))
).astype(np.float32)
speck = (speck - speck.mean()) / (speck.std() + 1e-3)
donor = rgb[590:650, 300:700]
donor_std = float((donor - blur_rgb(donor, 1.4)).std())
ys, xs = np.where(fill)
plate[ys, xs, 0] = np.clip(plate[ys, xs, 0] + speck[ys, xs] * donor_std * 0.55, 0, 255)
plate[ys, xs, 1] = np.clip(plate[ys, xs, 1] + speck[ys, xs] * donor_std * 0.22, 0, 255)
plate[ys, xs, 2] = np.clip(plate[ys, xs, 2] + speck[ys, xs] * donor_std * 0.18, 0, 255)
plate = np.clip(plate, 0, 255)
print("center", plate[735:765, 520:560].mean(axis=(0, 1)).astype(int))
print("beside", rgb[748:762, 380:420].mean(axis=(0, 1)).astype(int))

out = Image.fromarray(plate.astype(np.uint8))
out.save(r"public/images/yara-bracelet/bracelet-box-empty.webp", "WEBP", quality=86, method=6)
out.resize((543, 724), Image.Resampling.LANCZOS).save(r"scripts/plate-full.webp", quality=84)
out.crop((150, 640, 930, 880)).save(r"scripts/plate-crop.webp", quality=90)

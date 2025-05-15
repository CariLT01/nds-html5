import numpy as np
import numba as nb
from PIL import Image
from tqdm import tqdm

# Kernel for computing single-octave Perlin noise, compiled with Numba
@nb.njit(parallel=True, fastmath=True, cache=True)
def _perlin_kernel(img, gradients, size, res):
    def fade(t):
        return 6*t**5 - 15*t**4 + 10*t**3

    cell = size / res
    for y in nb.prange(size):
        for x in range(size):
            gx = (x / cell) % 1.0
            gy = (y / cell) % 1.0
            ix = int(x // cell)
            iy = int(y // cell)
            ix1 = (ix + 1) % res
            iy1 = (iy + 1) % res

            # Fetch gradient vectors
            g00 = gradients[iy,   ix  ]
            g10 = gradients[iy,   ix1]
            g01 = gradients[iy1,  ix  ]
            g11 = gradients[iy1,  ix1]

            # Distance vectors
            d00x, d00y = gx,    gy
            d10x, d10y = gx-1.0,gy
            d01x, d01y = gx,    gy-1.0
            d11x, d11y = gx-1.0,gy-1.0

            # Dot products
            s = g00[0]*d00x + g00[1]*d00y
            t = g10[0]*d10x + g10[1]*d10y
            u = g01[0]*d01x + g01[1]*d01y
            v = g11[0]*d11x + g11[1]*d11y

            # Interpolation
            wx = fade(gx)
            wy = fade(gy)
            a = s + wx * (t - s)
            b = u + wx * (v - u)
            img[y, x] = a + wy * (b - a)

@nb.njit(fastmath=True, cache=True)
def _normalize(img):
    min_val = np.min(img)
    max_val = np.max(img)
    return (img - min_val) / (max_val - min_val)


def generate_tileable_perlin(size, res):
    """
    Generates a single-octave tileable Perlin noise image.
    """
    # Create random gradient vectors
    angles = 2 * np.pi * np.random.rand(res+1, res+1)
    gradients = np.zeros((res+1, res+1, 2), dtype=np.float32)
    gradients[..., 0] = np.cos(angles)
    gradients[..., 1] = np.sin(angles)

    img = np.zeros((size, size), dtype=np.float32)
    # Compute noise in parallel
    _perlin_kernel(img, gradients, size, res)
    # Normalize to [0..1]
    img = _normalize(img)
    return img


def generate_fractal_perlin(size, base_res, octaves=5, lacunarity=2.0, persistence=0.5):
    """
    Generates fractal (fBM) tileable Perlin noise by summing multiple octaves.
    """
    total = np.zeros((size, size), dtype=np.float32)
    amplitude = 1.0
    frequency = 1.0
    max_amp = 0.0

    for _ in tqdm(range(octaves)):
        res = int(base_res * frequency)
        noise = generate_tileable_perlin(size, res)
        total += noise * amplitude
        max_amp += amplitude
        amplitude *= persistence
        frequency *= lacunarity

    total /= max_amp
    img = (total * 255).astype(np.uint8)
    return img

if __name__ == "__main__":
    size = 4096
    base_res = 32
    octaves = 5
    fractal_img = generate_fractal_perlin(size, base_res, octaves)
    Image.fromarray(fractal_img, mode='L').save('out.png')

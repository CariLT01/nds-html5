import numpy as np
from PIL import Image

# Configuration parameters
cubemap_size = 512  # Size of each cubemap face image
sun_direction = np.array([-1.0, 0.7, 0.0])  # Afternoon sun in the west, slightly elevated
sun_direction /= np.linalg.norm(sun_direction)  # Normalize

# Rayleigh scattering coefficients (normalized by blue wavelength)
scattering_coeff = np.array([
    1.0 / (650**4),  # Red
    1.0 / (550**4),  # Green
    1.0 / (450**4),  # Blue
])
scattering_coeff /= scattering_coeff[2]  # Normalize to make blue 1.0

# Sun color (reddish tint for afternoon)
sun_color = np.array([1.0, 0.6, 0.3])  # RGB multipliers

# Zenith and horizon colors for sky gradient
zenith_color = np.array([0.2, 0.5, 1.0])  # Deep blue
horizon_color = np.array([1.0, 0.4, 0.1])  # Warm orange/red

brightness = 1.2  # Overall brightness adjustment
gamma = 2.2  # Gamma correction factor

# Cubemap faces to generate
faces = ['right', 'left', 'top', 'bottom', 'front', 'back']

def compute_direction(face, u, v):
    """Compute direction vector for a cubemap face and UV coordinates."""
    if face == 'right':
        x, y, z = 1.0, v, -u
    elif face == 'left':
        x, y, z = -1.0, v, u
    elif face == 'top':
        x, y, z = u, 1.0, v
    elif face == 'bottom':
        x, y, z = u, -1.0, -v
    elif face == 'front':
        x, y, z = u, -v, 1.0
    elif face == 'back':
        x, y, z = -u, -v, -1.0
    else:
        raise ValueError(f"Invalid face: {face}")
    direction = np.array([x, y, z])
    return direction / np.linalg.norm(direction)

for face in faces:
    print(f"Generating {face} face...")
    img = Image.new('RGB', (cubemap_size, cubemap_size))
    pixels = img.load()

    for i in range(cubemap_size):
        for j in range(cubemap_size):
            # Convert pixel to UV in [-1, 1]
            u = (2.0 * i / (cubemap_size - 1)) - 1.0
            v = (2.0 * j / (cubemap_size - 1)) - 1.0

            # Compute direction vector
            direction = compute_direction(face, u, v)

            # Rayleigh phase function
            cos_theta = np.dot(direction, sun_direction)
            phase = 1.0 + cos_theta ** 2

            # Elevation-based sky color blending
            elevation = np.clip(direction[1], 0.0, 1.0)  # Use upward component
            blend = 1.0 - np.exp(-elevation * 5.0)  # Smooth transition
            sky_color = zenith_color * blend + horizon_color * (1.0 - blend)

            # Combine all color components
            color = phase * scattering_coeff * sun_color * sky_color * brightness
            color = np.clip(color, 0.0, 1.0)  # Prevent overexposure

            # Gamma correction
            color = color ** (1.0 / gamma)

            # Convert to 8-bit RGB
            r, g, b = (color * 255).astype(np.uint8)
            pixels[i, j] = (r, g, b)

    img.save(f"{face}.png")

print("Cubemap generation complete.")
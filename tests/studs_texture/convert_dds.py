from PIL import Image
import imageio.v2 as imageio

# Load DDS file
img = imageio.imread('tests/studs_texture/studs.dds')

# Convert to PNG and save
Image.fromarray(img).save('tests/studs_texture/studs.png')
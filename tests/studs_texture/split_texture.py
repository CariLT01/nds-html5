from PIL import Image

# Load the image
img = Image.open("tests/studs_texture/studs.png")
width, height = img.size
part_height = height // 4

# Split and save
for i in range(4):
    box = (0, i * part_height, width, (i + 1) * part_height)
    part = img.crop(box)
    part.save(f"tests/studs_texture/studs_sect_{i + 1}.png")
from PIL import Image

im = Image.open("yellowSS.png")
im = im.convert("RGB")
pv = im.getpixel((10,15))
print("pv: ", pv)

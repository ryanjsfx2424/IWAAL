from PIL import Image

images = [
"./MintTransparency.png",
"./MintedTransparency.png",
"./OpenseaTransparency.png",
"./TwitterTransparency.png",
"./PlusTransparency.png",
"./MinusTransparency.png",
"./IndicatorTransparency.png",
"./MintedIndicatorTransparency.png"
]

for image in images:
  im = Image.open(image)
  im2 = im.crop(im.getbbox())
  im2.save(image.replace(".png","") + "_cropped.png")

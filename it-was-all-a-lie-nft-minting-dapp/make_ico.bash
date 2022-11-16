convert favicon.png -scale 16 16.png
convert favicon.png -scale 24 24.png
convert favicon.png -scale 32 32.png
convert favicon.png -scale 48 48.png
convert favicon.png -scale 64 64.png
convert favicon.png -scale 72 72.png
convert favicon.png -scale 96 96.png
convert favicon.png -scale 128 128.png
convert favicon.png -scale 192 192.png
convert favicon.png -scale 256 256.png
convert favicon.png -scale 512 512.png

convert 16.png 24.png 32.png 48.png 64.png 72.png 96.png 128.png 192.png 256.png 512.png favicon.ico

rm {16,24,32,48,64,72,96,128,192,256,512}.png

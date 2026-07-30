import os
from pathlib import Path
from PIL import Image
import PIL.Image as pil_image
import io
import numpy as np
import argparse
import cv2



def visualize_tif(path, save_path):
    with open(path, 'rb') as f:
        tif = pil_image.open(io.BytesIO(f.read()))
    array = np.array(tif)
    max_val = np.amax(array)
    normalized = (array / max_val)
    im = pil_image.fromarray(normalized)
    im.save(save_path)

def convertTifToImage(path, save_path):
    im = Image.open(path)
    out = im.convert("RGB")
    out.save(save_path, "png", quality=90)

def handleFileInPath(path, save_path):
    if os.path.exists(path) == False:
        print("error path!")
        return

    if os.path.exists(save_path) == False:
        os.mkdir(save_path)

    for i in Path(path).glob('*'):
       basename = os.path.basename(i) 
       filename, file_extension = os.path.splitext(basename)

       if file_extension == '.tif':
           pathCache = os.path.join(save_path, filename + ".tif")
           pathImage = os.path.join(save_path, filename + ".png")
           visualize_tif(i, pathCache)
           convertTifToImage(pathCache, pathImage)
           print("convert success %s" %(filename))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", action='store')
    parser.add_argument("--dist", action='store')
     
    args = parser.parse_args()
    handleFileInPath(args.source, args.dist)



"""
HOW TO USE:
`python deserialize.py <import_path> <export_dir>`

REQUIRED DEPENDENCIES:
- lz4       `pip install lz4`
- Pillow    `pip install Pillow`
- decrunch  `pip install decrunch`
- UnityPack (provided)
"""


import sys
import os
import json
from io import BytesIO
from vendor.UnityPack import unitypack

def open_asset(import_path, export_dir, second_export):
    with open(import_path, 'rb') as f:
        bundle = unitypack.load(f)
        for asset in bundle.assets:
            outFiles = []
            for id, object in asset.objects.items():
                #print(object)
                data = object.read()

                openType = "wb"
                exportDests = []
                writeData = ""

                forceExtract = False

                # Try to get file names before data so we don't waste computation time extracting things we're not going to overwrite
                
                if hasattr(data, "name"):
                    exportDests.append(export_dir + "/" + data.name)
                    if len(second_export) > 0:
                        exportDests.append(second_export + "/" + data.name)

                if object.type == 'Texture2D':
                    for i, dest in enumerate(exportDests):
                        exportDests[i] = dest + ".png"

                elif object.type == 'ConstTextScriptableObject':
                    forceExtract = True 

                if forceExtract or (len(exportDests) > 0 and not os.path.exists(exportDests[0])):
                    if object.type == 'ConstTextScriptableObject':
                        for key, value in data.items():
                            try:
                                jsonData = json.dumps(value, indent = 4)
                                outData = {
                                    "writeData": jsonData,
                                    "openType": "w",
                                    "exportDests": [export_dir + "/" + key + ".json"]
                                }
                                if len(second_export) > 0:
                                    outData["exportDests"].append(second_export + "/" + key + ".json")
                                outFiles.append(outData)                                
                            except:
                                print(key, "not serializable")     

                    elif object.type == 'TextAsset':
                        writeData = data.script
                        if type(data.script) is str:
                            openType = "w"

                    elif object.type == 'Texture2D':
                        try:
                            from PIL import ImageOps
                        except ImportError:
                            print('ImportError')
                            continue
                        try:
                            image = data.image
                        except NotImplementedError as e:
                            print('\tNotImplementedError: ' + str(e))
                            continue
                        if image is None:
                            print('\tEmpty Image')
                            continue
                        img = ImageOps.flip(image)
                        output = BytesIO()
                        img.save(output, format='png')
                        openType = "wb"
                        writeData = output.getvalue()
                
                if writeData:
                    outFiles.append({
                        "writeData": writeData,
                        "exportDests": exportDests,
                        "openType": openType
                    })

            for outData in outFiles:
                for dest in outData["exportDests"]:
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    with open(dest, outData["openType"]) as fi:
                        fi.write(outData["writeData"])
                        print('<DESERIALIZE>', import_path, '->', dest)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print('Not enough arguments.')
        sys.exit()
    open_asset(sys.argv[1], sys.argv[2], sys.argv[3])
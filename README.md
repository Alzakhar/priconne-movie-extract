# priconne-cdn-extract<br>Princess Connect Re:Dive - Data download and extraction tool

This is a tool for downloading data from PriConne's CDN and decrypting/extracting it into a workable format. 
This is built on work by [S'pugn](https://github.com/Expugn/priconne-en_db-fetch), which was built on work by [esterTion](https://redive.estertion.win/).
The main differences are that this tool was not built specifically for Priconne Quest Helper, and it keeps old versions of files around so you can see the complete history.

**NOTE: If you are just looking to grab some assets, you are probably better off downloading them from esterTion's site.** If you are looking to grab the EN version database, you are probably better off using S'pugn's tool. The main reason I made this was to get a full history of database changes, along with the dates of the changes.

## Requirements
#### System
Node.js `v11.15.0` or above<br>
Python 3

#### Python packages
- **lz4** `pip install lz4`
- **Pillow** `pip install Pillow`
- **decrunch** `pip install decrunch`
- **UnityPack** (provided) [GitHub](https://github.com/HearthSim/UnityPack)
- **Pillow** `pip install Pillow`

## Use

First, you will need to create a config.js file. An example config file is provided.

This tool is broken into three stages, which should be run in order. They are broken up so you don't have to run the whole script every time.

 * *check* - Check for manifest updates to see if there is anything that needs to be downloaded.
 * *download* - Download any new updated files.
 * *extract* - Convert unity3d files into usable images and text.

 If you download everything, it will take up a lot of space - more than quadruple the space the assets themselves take, because the latest version of the assets are copied into a "latest" folder for convenience, and because both the raw and extracted versions are saved.

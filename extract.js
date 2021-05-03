const fs = require('fs');
const path = require('path');

const python_tools = require("./python-tools/python-tools");

const output_dir = "out";
const extract_skip = [
	"all",
	"howtoplay",
	"jukebox",
	"lipsyncothers",
	"minigame",
	"resourcedefine",
	"room",
	"shader",
	"sound"
]

run();

function run(server = "en") {
    const server_out_dir = path.join(output_dir, server);
    fs.readdirSync(server_out_dir, { withFileTypes: true })
        .filter(function(path) {
            return path.isDirectory();
        })
        .forEach(async function(manifestPath) {
        	if (extract_skip.indexOf(manifestPath.name) > -1) return;
            const manifest_dir = path.join(server_out_dir, manifestPath.name);
            const asset_version_file = path.join(manifest_dir, 'asset-versions.json');
            const asset_version_info = JSON.parse(fs.readFileSync(asset_version_file, 'utf8'));

            let latestVersionPath = path.join(manifest_dir, "raw", "latest");
            if (!fs.existsSync(latestVersionPath)) {
                fs.mkdirSync(latestVersionPath, { recursive: true });
            }

            let latestVersionPathDecrypted = path.join(manifest_dir, "extract", "latest");
            if (!fs.existsSync(latestVersionPathDecrypted)) {
                fs.mkdirSync(latestVersionPathDecrypted, { recursive: true });
            }

            for (var file in asset_version_info.files) {
                let filePath = file.split("/").slice(-1)[0];
                for (var version in asset_version_info.files[file].versions) {
                    let versionPath = path.join(manifest_dir, "raw", version);
                    if (!fs.existsSync(versionPath)) {
                        fs.mkdirSync(versionPath, { recursive: true });
                    }

                    let versionPathDecrypted = path.join(manifest_dir, "extract", version);
                    if (!fs.existsSync(versionPathDecrypted)) {
                        fs.mkdirSync(versionPathDecrypted, { recursive: true });
                    }

                    let versionFilePath = path.join(versionPath, filePath);
                    if (fs.existsSync(versionFilePath)) {
                        // console.log("EXTRACTING " + versionFilePath);
                        let type = "asset";
                        if (manifestPath.name === "sound") {
                            type = "sound";
                        }
                        
                        if (asset_version_info.files[file].latestHash === asset_version_info.files[file].versions[version].hash) {
                        	let result = await python_tools.deserialize(versionFilePath, versionPathDecrypted, latestVersionPathDecrypted);
                        }
                        else {
                        	let result = await python_tools.deserialize(versionFilePath, versionPathDecrypted);
                        }
                    }
                }
            }
            console.log("DONE EXTRACTING " + manifestPath.name)
        });
}


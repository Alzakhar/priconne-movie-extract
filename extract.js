const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const python_tools = require("./python-tools/python-tools");
const config = require('./config');
const utils = require('./utils');

config.servers.forEach(function(server) {
    run(server);
});

function run(server = "en") {
    const server_out_dir = path.join(config.outDir, server);
    fs.readdirSync(server_out_dir, { withFileTypes: true })
        .filter(function(path) {
            return path.isDirectory();
        })
        .forEach(async function(manifestPath) {
            if (config.includeManifests.indexOf(manifestPath.name) === -1) return;
            const manifest_dir = path.join(server_out_dir, manifestPath.name);
            const asset_version_file = path.join(manifest_dir, 'asset-versions.json');
            const asset_version_info = JSON.parse(fs.readFileSync(asset_version_file, 'utf8'));

            let latestVersionPath = path.join(manifest_dir, "raw", "latest");
            if (!fs.existsSync(latestVersionPath)) {
                fs.mkdirSync(latestVersionPath, { recursive: true });
            }

            let latestVersionExtractPath = path.join(manifest_dir, "extract", "latest");
            if (!fs.existsSync(latestVersionExtractPath)) {
                fs.mkdirSync(latestVersionExtractPath, { recursive: true });
            }

            for (var file in asset_version_info.files) {
                let filePath = file.split("/").slice(-1)[0];
                for (var version in asset_version_info.files[file].versions) {
                    let versionPath = path.join(manifest_dir, "raw", version);
                    if (!fs.existsSync(versionPath)) {
                        fs.mkdirSync(versionPath, { recursive: true });
                    }

                    let versionedExtractPath = path.join(manifest_dir, "extract", version);
                    if (!fs.existsSync(versionedExtractPath)) {
                        fs.mkdirSync(versionedExtractPath, { recursive: true });
                    }

                    let versionedFilePath = path.join(versionPath, filePath);
                    if (fs.existsSync(versionedFilePath)) {
                        // console.log("EXTRACTING " + versionedFilePath);
                        
                        let isLatestVersion = (asset_version_info.files[file].latestHash === asset_version_info.files[file].versions[version].hash);
                        let isCdb = file.slice(-4) === ".cdb";
                        
                        
                        if (isCdb) {
                            let dbName = "master"; // file.slice(0, -4)
                            // I'm on linux so I need to use wine. Not able to recompile coneshell.dll from source.
                            exec('wine Coneshell_call.exe -cdb ' + versionedFilePath + ' ' + versionedExtractPath + "/" + dbName, (error, stdout, stderr) => {
                                if (error) throw error;
                                if (stderr) //throw stderr;
                                console.log("[[" + server + ']] DOWNLOADED AND CONVERTED DATABASE; SAVED AS ' + versionedExtractPath + "/" + dbName);
                            });
                            if (isLatestVersion) {
                                exec('cp ' + versionedExtractPath + "/" + dbName + ' ' + latestVersionExtractPath + "/" + dbName, (error, stdout, stderr) => {
                                    if (error) throw error;
                                    // if (stderr) throw stderr;
                                });
                            }
                        }
                        else {
                            if (isLatestVersion) {
                                let result = await python_tools.deserialize(versionedFilePath, versionedExtractPath, latestVersionExtractPath);
                            }
                            else {
                                let result = await python_tools.deserialize(versionedFilePath, versionedExtractPath);
                            }
                        }
                    }
                }
            }
            console.log("[[" + server + "]] DONE EXTRACTING " + manifestPath.name)
        });
}


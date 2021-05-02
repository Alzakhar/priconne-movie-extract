const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const utils = require('./utils');

const output_dir = "out";
const _max_test_amount = 20;

const cdnHosts = {
    "en": "assets-priconne-redive-us.akamaized.net",
    "jp": "prd-priconne-redive.akamaized.net"
}
const default_version = 10000000;

run();

function run(server = "en") {
    // CHECK IF DATABASE DIRECTORY EXISTS
    const server_out_dir = path.join(output_dir, server);
    if (!fs.existsSync(server_out_dir)) {
        fs.mkdirSync(server_out_dir, { recursive: true });
    }
    (async function() {
        let versionConfig = await checkTruthVersions(server);
        for (var manifestFile in versionConfig.files) {
            let manifestName = manifestFile.replace("manifest/", "").replace("_assetmanifest", "").replace("soundmanifest", "sound");
            let assetVersions = checkAssetVersions(manifestName, versionConfig.files[manifestFile].versions, server);
            console.log("DONE WITH " + manifestFile)
        }
    })();
}

function checkTruthVersions(server) {
    return new Promise(function(resolve) {
        // READ CURRENT DATABASE VERSION
        let version_info;
        const version_file = path.join(output_dir, server, 'versions.json');
        if (fs.existsSync(version_file)) {
            // DATABASE VERSION FILE EXISTS
            version_info = JSON.parse(fs.readFileSync(version_file, 'utf8'));
            console.log('EXISTING VERSION FILE FOUND: LATEST VERSION =', version_info['latestVersion']);
        }
        else {
            // DATABASE VERSION FILE DOES NOT EXIST, START FROM SCRATCH
            version_info = {
                latestVersion: default_version,
                files: {}
            };
            console.log('VERSION FILE NOT FOUND. STARTING FROM ' + default_version);
        }

        console.log('CHECKING FOR NEW DATA...');
        (async () => {
            // FIND NEW TRUTH VERSION
            const test_increment = 10;
            let guess = version_info.latestVersion + test_increment;
            let numGuesses = 0;
            do {
                numGuesses++;
                console.log('[GUESS]'.padEnd(10), guess, '(' + numGuesses + '/' + _max_test_amount + ')');
                const res = await fetchManifest(guess, "manifest", server);
                if (res) {
                    console.log('[SUCCESS]'.padEnd(10), guess, ' RETURNED STATUS CODE 200 (VALID TRUTH VERSION)');
                    version_info.latestVersion = guess;
                    version_info.latestDate = res.date;
                    res.body.split('\n').forEach(function(manifestLine) {
                        if (manifestLine.length <= 0) return;
                        let lineData = utils.parseManifestLine(manifestLine);
                        if (!version_info.files[lineData.file]) {
                            version_info.files[lineData.file] = {
                                versions: {}
                            }
                        }
                        if (version_info.files[lineData.file].latestHash !== lineData.hash) {
                            if (!version_info.files[lineData.file].versions[guess]) {
                                version_info.files[lineData.file].versions[guess] = {}
                            }
                            version_info.files[lineData.file].versions[guess].hash = lineData.hash;
                            version_info.files[lineData.file].versions[guess].date = res.date;
                            version_info.files[lineData.file].latestHash = lineData.hash;
                            version_info.files[lineData.file].latestDate = res.date;
                        }
                    });

                    // RESET LOOP
                    numGuesses = 0;
                }

                guess += test_increment;
            } while (numGuesses < _max_test_amount);

            fs.writeFile(version_file, JSON.stringify(version_info, null, "\t"), function (err) {
                if (err) throw err;
            });

            resolve(version_info)
        })();
    });
}

function checkAssetVersions(manifest, versions, server) {
    // TODO: movies not in manifest manifest
    return new Promise(function(resolve) {
        // READ CURRENT DATABASE VERSION
        let asset_version_info;
        const manifest_dir = path.join(output_dir, server, manifest)
        if (!fs.existsSync(manifest_dir)) {
            fs.mkdirSync(manifest_dir, { recursive: true });
        }
        const asset_version_file = path.join(manifest_dir, 'asset-versions.json');
        if (fs.existsSync(asset_version_file)) {
            asset_version_info = JSON.parse(fs.readFileSync(asset_version_file, 'utf8'));
        }
        else {
            asset_version_info = {
                latestVersion: default_version,
                files: {}
            };
        }

        (async () => {
            let truthVersions = Object.keys(versions).sort();
            for (var i = 0; i < truthVersions.length; i++) {
                let version = truthVersions[i];
                if ((version*1) > asset_version_info.latestVersion) {
                    console.log('CHECKING FOR NEW ' + manifest + ' ASSETS IN TRUTH VERSION ' + version + '...');
                    const res = await fetchManifest(version, manifest, server);
                    if (!res) {
                        throw Error('Manifest ' + manifest + ' version ' + version + ' not found!');
                    }
                    asset_version_info.latestVersion = version;
                    asset_version_info.latestDate = res.date;
                    res.body.split('\n').forEach(function(manifestLine) {
                        if (manifestLine.length <= 0) return;
                        let lineData = utils.parseManifestLine(manifestLine);
                        if (!asset_version_info.files[lineData.file]) {
                            asset_version_info.files[lineData.file] = {
                                versions: {}
                            }
                        }
                        if (asset_version_info.files[lineData.file].latestHash !== lineData.hash) {
                            if (!asset_version_info.files[lineData.file].versions[version]) {
                                asset_version_info.files[lineData.file].versions[version] = {}
                            }
                            asset_version_info.files[lineData.file].versions[version].hash = lineData.hash;
                            asset_version_info.files[lineData.file].versions[version].date = res.date;
                            asset_version_info.files[lineData.file].latestHash = lineData.hash;
                            asset_version_info.files[lineData.file].latestDate = res.date;
                        }
                    });
                }
            }

            fs.writeFile(asset_version_file, JSON.stringify(asset_version_info, null, "\t"), function (err) {
                if (err) throw err;
            });

            resolve(asset_version_info)
        })()
    });
}

function fetchManifest(truthVersion, manifest, server) {
    const host = cdnHosts[server];
    let path = '/dl/Resources/' + truthVersion + '/Jpn/AssetBundles/Android/manifest/' + manifest + '_assetmanifest';
    if (manifest === "sound") {
        path = '/dl/Resources/' + truthVersion + '/Jpn/Sound/manifest/sound2manifest';
    }
    else if (manifest === 'movie') {
        path = '/dl/Resources/' + truthVersion + '/Jpn/Movie/SP/High/manifest/moviemanifest';
    }
    return fetch("https://" + host + path).then(function(res) {
        if (res.status === 200) {
            return res.text().then(function(body) {
                return Promise.resolve({
                    body: body,
                    date: res.headers.get('last-modified')
                });
            });
        }
        else {
            return null;
        }
    });
}

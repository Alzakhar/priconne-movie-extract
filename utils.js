function parseManifestLine(line) {
    lineSplit = line.split(",");
    return {
        file: lineSplit[0],
        hash: lineSplit[1],
        collection: lineSplit[2],
        size: lineSplit[3]
    }
}

const cdnHosts = {
    "en": "assets-priconne-redive-us.akamaized.net",
    "jp": "prd-priconne-redive.akamaized.net"
}

const defaultVersion = {
    "en": 10000000,
    "jp": 10010800
}

module.exports = {
	parseManifestLine,
	cdnHosts,
	defaultVersion
}
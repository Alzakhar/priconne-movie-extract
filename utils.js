function parseManifestLine(line) {
    lineSplit = line.split(",");
    return {
        file: lineSplit[0],
        hash: lineSplit[1],
        collection: lineSplit[2],
        size: lineSplit[3]
    }
}

module.exports = {
	parseManifestLine
}
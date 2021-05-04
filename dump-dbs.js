const fs = require('fs');
const path = require('path');
const sqlite3 = require("better-sqlite3");

const config = require('./config');
const utils = require('./utils');

// Copied the code from sqlite-to-json package and editing so I can pretty print my JSON
// And run synchronously
// const SqliteToJson = module.exports = function SqliteToJson(opts) {
const SqliteToJson = function SqliteToJson(opts) {
	opts = opts || {};
	if (!opts.client) {
		throw new Error('No sqlite3 client provided.');
	}
	this.client = opts.client;
};

SqliteToJson.prototype.tables = function () {
	var query = "SELECT name FROM sqlite_master WHERE type='table'";
	let tables = this.client.prepare(query).all();
	return tables.map(function (result) {
		return result.name;
	});
};

SqliteToJson.prototype.save = function (table, destFolder) {
	let tableData = this.client.prepare('SELECT * FROM '+table).all();

	// json
	fs.writeFileSync(destFolder + "/" + table + ".json", JSON.stringify(tableData, null, "\t"), function(writeErr) {
		if (writeErr) console.error(writeErr);
	});

	// csv
	var headers = [];
	if (tableData.length > 0) {
		headers = Object.keys(tableData[0]);
	}
	var fileData = headers.join(",") + "\n";
	tableData.forEach(function(row) {
		var nextRow = [];
		headers.forEach(function(header) {
			let dataVal = row[header] + "";
			nextRow.push("\"" + dataVal.replace(/"/g, "\"\"") + "\"");
		});
		fileData += nextRow.join(",") + "\n";
	});
	fs.writeFileSync(destFolder + "/" + table + ".csv", fileData, function (writeErr) {
		if (writeErr) console.error(writeErr);
	})
};

var sqliteJson = SqliteToJson;

config.servers.forEach(function(server) {
	let extractPath = path.join(config.outDir, server, "masterdata", "extract");
	let versions = fs.readdirSync(extractPath);
	versions.forEach(function(version) {
		if (version === "latest" || !fs.existsSync(path.join(extractPath, version, "sqlite_stat1.json"))) {
			console.log("Dumping JSON and CSV for " + server + " master db version " + version);
			var exporter = new sqliteJson({
				client: new sqlite3(path.join(extractPath, version, "master"))
			});

			//dumpTables.forEach(function(table) {
			exporter.tables().forEach(function(table) {
				let tableFolder = path.join(extractPath, version)
				exporter.save(table, tableFolder, function(){});
			});
		}
	})
});

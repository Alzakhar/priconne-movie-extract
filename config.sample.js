module.exports = {
	outDir: "out",
	servers: [ "en", "jp" ],
	maxChecks: 20,
	includeManifests: [
		// "all",
		// "animation",
		// "arcade",
		"banner",
		// "bg",
		"clanbattle",
		// "comic",
		// "consttext",
		"event",
		// "font",
		// "howtoplay",
		"icon",
		// "jukebox",
		// "lipsyncothers",
		"loginbonus",
		"masterdata",
		// "minigame",
		// "resourcedefine",
		// "room",
		// "shader",
		// "sound",
		// Sound extraction not yet built into the extraction script, 
		// but the tools are provided. Use critools with the criware-key, ex:
		// node node_modules/critools/src/index.js acb2wavs -k 3201512 out/en/sound/raw/latest/vo_btl_104501.acb
		// "spine",
		// "storydata",
		"unit"
	]
}
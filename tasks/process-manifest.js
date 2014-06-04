var crypto = require('crypto'),
	fs = require("fs"),
	grunt = require("grunt");

/*
 * Processes the manifest.yml file, replacing ${random-word} with a random word.
 */
module.exports = function() {
	// create a small hash of the current directory, which includes project and pipeline UUID
	var hash = crypto.createHash('md5').update(__dirname).digest('hex'),
		randomWord = (hash + "").substring(0, 4),
		manifest = fs.readFileSync("manifest.yml", { encoding: "utf-8" });
	
	// replace ${random-word} in the manifest with the hash
	manifest = manifest.replace("${random-word}", randomWord);
	fs.writeFileSync("manifest.yml", manifest);
};

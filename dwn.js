const fs = require('fs');
const path = require('path');
const https = require('https')
const utils = require('./utils');
const readline = require('readline/promises');

const process = require('node:process');




async function download(cdnHost, filepath, server) {
  const fileStream = fs.createReadStream(filepath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    let lineData = utils.parseManifestLine(line);
    let hash = lineData.hash;
    let filePath = "https://" + cdnHost + '/dl/pool/Movie/' + hash.substr(0, 2) + '/' + hash;
    const dirPath = path.join(__dirname, "output", server);
    var folderPath = path.join(dirPath, "m", "t")
    if (!fs.existsSync(folderPath)){
      fs.mkdirSync(folderPath, {recursive: true});
    };
    https.get(filePath, (res) => {

      var outputPath = `${dirPath}/${lineData.file}`;
      const writeStream = fs.createWriteStream(outputPath);
  
      res.pipe(writeStream);
  
      writeStream.on("finish", () => {
        writeStream.close();
        console.log(`${lineData.file} downloaded!`);
  
      });
    }).on('error', (e)=> {
        console.log(e.message);
          
      }
      )
    }
}
async function frontEnd(){
  const rl = readline.createInterface({
    input: process.stdin, 
    output: process.stdout
  });

  const server = await rl.question('Pick which server you want the movie data from.\nOptions are (en/jp/all).\n');
  if (server === "all"){
    utils.servers.forEach((server)=>
      {
        download(utils.cdnHosts[`${server}`], `movie2manifest_${server}`, `${server}`);
      }
    );
  }
  else
  {
    if (server === "en"){
      // Crunchyroll decided to change the name of the movie manifest after v10008500. Oh well.
      download(utils.cdnHosts[`${server}`], `moviemanifest_${server}`, `${server}`);
    }
    else {
      download(utils.cdnHosts[`${server}`], `movie2manifest_${server}`, `${server}`);
    }
  }
};
frontEnd();
process.on('uncaughtException', (err)=> console.log(err));





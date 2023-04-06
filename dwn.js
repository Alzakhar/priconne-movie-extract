const fs = require('fs');
const path = require('path');
const https = require('https')
const utils = require('./utils');
const readline = require('readline/promises');
// check if readline/promises provides same functionality as readline
//const readline = require("readline");
const process = require('node:process');

const servers = ["jp", "en"]


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
    download(utils.cdnHosts[`${server}`], `movie2manifest_${server}`, `${server}`);
  }
}
//frontEnd();
process.on('uncaughtException', (err)=> console.log(err));
download1(utils.cdnHosts["en"], "movie2manifest_en", "en");



// something fun

const Axios = require('axios')  
const ProgressBar = require('progress')

async function download1(cdnHost, filepath, server) {  
  //url
  const fileStream = fs.createReadStream(filepath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    let lineData = utils.parseManifestLine(line);
    let hash = lineData.hash;
    let url = "https://" + cdnHost + '/dl/pool/Movie/' + hash.substr(0, 2) + '/' + hash;
    const dirPath = path.join(__dirname, server)
    if (!fs.existsSync(dirPath)){
      fs.mkdirSync(dirPath);
  };
  console.log('Connecting …')
  const { data, headers } = await Axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })
  const totalLength = headers['content-length']

  console.log('Starting download')
  const progressBar = new ProgressBar(`-> downloading ${lineData.file} [:bar] :percent :etas \n`, {
      width: 40,
      complete: '|',
      incomplete: ' ',
      renderThrottle: 1,
      total: parseInt(totalLength)
    })

    var outputPath = `${dirPath}/${lineData.file}`;
    const writeStream = fs.createWriteStream(outputPath);

    

    
  data.on('data', (chunk) => {
    progressBar.tick(chunk.length)
   console.log(`% of file ${lineData.file} completed`,(progressBar.curr/totalLength)*100)
  })
  data.pipe(writeStream);
  writeStream.on("finish", () => {
      writeStream.close();
      console.log(`${lineData.file} downloaded!`);
    })
}
}   
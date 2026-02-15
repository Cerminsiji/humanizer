import fs from "fs";
import https from "https";

const FILE = "data.json";

// Dataset open-source Indonesia (contoh raw GitHub)
const SOURCES = [
  "https://raw.githubusercontent.com/kmkurn/id-nlp-resource/master/colloquial-indonesian-lexicon.csv",
  "https://raw.githubusercontent.com/Wikidepia/indonesian_datasets/master/datasets/paraphrase.txt"
];

// fungsi ambil data dari URL
function fetchURL(url){
  return new Promise((resolve,reject)=>{
    https.get(url,res=>{
      let data="";
      res.on("data",chunk=>data+=chunk);
      res.on("end",()=>resolve(data));
    }).on("error",reject);
  });
}

// ekstrak kalimat natural
function extractSentences(text){
  return text
    .split(/[\n\.]/)
    .map(s=>s.trim())
    .filter(s=>s.length>20 && s.length<120);
}

async function main(){

  let dataset = JSON.parse(fs.readFileSync(FILE));

  let collected = [];

  for(const url of SOURCES){
    try{
      const txt = await fetchURL(url);
      collected.push(...extractSentences(txt));
      console.log("Loaded:", url);
    }catch(e){
      console.log("Failed:", url);
    }
  }

  // ambil 20 kalimat random
  const random = collected
    .sort(()=>0.5-Math.random())
    .slice(0,20);

  for(const kalimat of random){
    if(!dataset.tone_local.includes(kalimat)){
      dataset.tone_local.push(kalimat);
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(dataset,null,2));
  console.log("Dataset updated ✔");
}

main();

import fs from "fs";
import https from "https";

const FILE = "data.json";

const SOURCES = [

  // IndoSum sample
  "https://raw.githubusercontent.com/irfnrdh/indosum/master/data/train.article.txt",

  // Colloquial Indonesian
  "https://raw.githubusercontent.com/kmkurn/id-nlp-resource/master/colloquial-indonesian-lexicon.csv",

  // OSCAR Indonesian sample
  "https://huggingface.co/datasets/oscar-corpus/OSCAR-2301/resolve/main/id.txt",

  // OpenSubtitles Indonesian sample
  "https://raw.githubusercontent.com/opensubtitles/opensubtitles-scraper/master/subtitles/sample-id.txt",

  // Wikipedia random
  "https://id.wikipedia.org/api/rest_v1/page/random/summary"
];

// fetch url
function fetchURL(url){
  return new Promise((resolve,reject)=>{
    https.get(url,res=>{
      let data="";
      res.on("data",d=>data+=d);
      res.on("end",()=>resolve(data));
    }).on("error",reject);
  });
}

// ekstrak kalimat natural
function extract(text){
  return text
    .replace(/[\n\r]/g," ")
    .split(/[.!?]/)
    .map(s=>s.trim())
    .filter(s=>s.length>40 && s.length<140);
}

async function main(){

  let dataset = JSON.parse(fs.readFileSync(FILE));
  let collected = [];

  for(const url of SOURCES){
    try{
      const txt = await fetchURL(url);

      if(url.includes("wikipedia")){
        const json = JSON.parse(txt);
        collected.push(...extract(json.extract || ""));
      }else{
        collected.push(...extract(txt));
      }

      console.log("Loaded:", url);
    }catch(e){
      console.log("Failed:", url);
    }
  }

  if(collected.length === 0){
    console.log("Tidak ada kalimat baru");
    return;
  }

  // random 30 kalimat
  const random = collected
    .sort(()=>0.5-Math.random())
    .slice(0,30);

  let added = 0;

  for(const kalimat of random){
    if(!dataset.tone_local.includes(kalimat)){
      dataset.tone_local.push(kalimat);
      added++;
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(dataset,null,2));

  console.log(`Dataset updated ✔ Added ${added}`);
}

main();

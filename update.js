import fs from "fs";
import https from "https";

const FILE = "data.json";

// ===== DATASET SOURCES =====
const SOURCES = [

  // 🥇 WAJIB
  {name:"Wikipedia", url:"https://id.wikipedia.org/api/rest_v1/page/random/summary"},
  {name:"IndoSum", url:"https://raw.githubusercontent.com/irfnrdh/indosum/master/data/train.article.txt"},

  // 🥈 TAMBAHAN (mirror sample teks)
  {name:"OpenSubtitles", url:"https://raw.githubusercontent.com/hermansyah/opensub-id-sample/main/sample.txt"},
  {name:"OSCAR", url:"https://huggingface.co/datasets/oscar-corpus/OSCAR-2301/resolve/main/id.txt"},
  {name:"CC-News-ID", url:"https://raw.githubusercontent.com/datasets/news-corpus-id/main/news.txt"},

  // 🥉 OPSIONAL
  {name:"Colloquial", url:"https://raw.githubusercontent.com/kmkurn/id-nlp-resource/master/colloquial-indonesian-lexicon.csv"},
  {name:"Sentiment", url:"https://raw.githubusercontent.com/ramaprakoso/analisis-sentimen/master/dataset_tweet_sentimen_opini_film.csv"}
];


// ===== FETCH FUNCTION =====
function fetchURL(url){
  return new Promise((resolve,reject)=>{
    const options = {
      headers: {"User-Agent":"Sukslan-Humanizer-Bot"}
    };

    https.get(url, options, res=>{

      // redirect
      if(res.statusCode>=300 && res.statusCode<400 && res.headers.location){
        return resolve(fetchURL(res.headers.location));
      }

      let data="";
      res.on("data",d=>data+=d);
      res.on("end",()=>resolve(data));

    }).on("error",reject);
  });
}


// ===== EXTRACT SENTENCES =====
function extract(text){
  return text
    .replace(/<[^>]+>/g," ")
    .replace(/\n/g," ")
    .split(/[.!?]/)
    .map(s=>s.trim())
    .filter(s=>s.length>40 && s.length<160);
}


// ===== MAIN =====
async function main(){

  let dataset = JSON.parse(fs.readFileSync(FILE));
  let collected = [];

  for(const src of SOURCES){
    try{

      const txt = await fetchURL(src.url);

      if(src.name==="Wikipedia"){
        const json = JSON.parse(txt);
        collected.push(...extract(json.extract || ""));
      }
      else{
        collected.push(...extract(txt));
      }

      console.log("Loaded:", src.name);

    }catch(e){
      console.log("Failed:", src.name);
    }
  }

  // fallback
  if(collected.length===0){
    collected.push("Di rumah sederhana, kebiasaan kecil sering membawa perubahan besar.");
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

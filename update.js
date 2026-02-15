import fs from "fs";
import https from "https";

const FILE = "data.json";

const SOURCES = [
  "https://sukslan.blogspot.com/feeds/posts/default?alt=json",
  "https://id.wikipedia.org/api/rest_v1/page/random/summary",
  "https://raw.githubusercontent.com/irfnrdh/indosum/master/data/train.article.txt"
];

// fetch dengan user-agent + redirect
function fetchURL(url){
  return new Promise((resolve,reject)=>{
    const options = {
      headers: {
        "User-Agent": "Sukslan-Humanizer-Bot/1.0"
      }
    };

    https.get(url, options, res => {

      // redirect handler
      if(res.statusCode >= 300 && res.statusCode < 400 && res.headers.location){
        return resolve(fetchURL(res.headers.location));
      }

      let data="";
      res.on("data",d=>data+=d);
      res.on("end",()=>resolve(data));

    }).on("error",reject);
  });
}

// ekstrak kalimat natural
function extract(text){
  return text
    .replace(/<[^>]+>/g," ")
    .replace(/\n/g," ")
    .split(/[.!?]/)
    .map(s=>s.trim())
    .filter(s=>s.length>50 && s.length<160);
}

async function main(){

  let dataset = JSON.parse(fs.readFileSync(FILE));
  let collected = [];

  for(const url of SOURCES){
    try{
      const txt = await fetchURL(url);

      // RSS Sukslan
      if(url.includes("blogspot")){
        const json = JSON.parse(txt);
        const posts = json.feed.entry || [];

        posts.forEach(p=>{
          collected.push(...extract(p.summary?.$t || ""));
          collected.push(...extract(p.title?.$t || ""));
        });

        console.log("Loaded RSS Sukslan");
      }

      // Wikipedia
      else if(url.includes("wikipedia")){
        const json = JSON.parse(txt);
        collected.push(...extract(json.extract || ""));
        console.log("Loaded Wikipedia");
      }

      // IndoSum
      else{
        collected.push(...extract(txt));
        console.log("Loaded IndoSum");
      }

    }catch(e){
      console.log("Failed:", url, e.message);
    }
  }

  // fallback kalau kosong
  if(collected.length === 0){
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

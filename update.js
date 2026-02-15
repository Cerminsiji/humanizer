import fs from "fs";
import https from "https";

const FILE = "data.json";

// sumber pasti bisa diakses
const SOURCES = [
  "https://id.wikipedia.org/api/rest_v1/page/random/summary",
  "https://sukslan.blogspot.com/feeds/posts/default?alt=json"
];

function fetchURL(url){
  return new Promise((resolve,reject)=>{
    https.get(url,res=>{
      let data="";
      res.on("data",d=>data+=d);
      res.on("end",()=>resolve(data));
    }).on("error",reject);
  });
}

function extract(text){
  return text
    .replace(/<[^>]+>/g," ")
    .split(/[.!?]/)
    .map(s=>s.trim())
    .filter(s=>s.length>40 && s.length<160);
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
      }

      if(url.includes("blogspot")){
        const json = JSON.parse(txt);
        const posts = json.feed.entry || [];
        posts.forEach(p=>{
          collected.push(...extract(p.summary?.$t || ""));
        });
      }

      console.log("Loaded:", url);

    }catch(e){
      console.log("Failed:", url, e.message);
    }
  }

  // jika tidak ada data, paksa test
  if(collected.length === 0){
    collected.push("Di rumah sederhana, kebiasaan kecil sering membawa perubahan besar.");
  }

  const random = collected
    .sort(()=>0.5-Math.random())
    .slice(0,20);

  let added = 0;

  for(const kalimat of random){
    if(!dataset.tone_local.includes(kalimat)){
      dataset.tone_local.push(kalimat);
      added++;
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(dataset,null,2));

  console.log("Added:", added);
}

main();

import fs from "fs";
import https from "https";

const FILE = "data.csv";
const MAX_ROWS = 5000;

const SOURCES = [
  {name:"wikipedia", url:"https://id.wikipedia.org/api/rest_v1/page/random/summary"},
  {name:"rss", url:"https://sukslan.blogspot.com/feeds/posts/default?alt=json"},
  {name:"indosum", url:"https://raw.githubusercontent.com/irfnrdh/indosum/master/data/train.article.txt"}
];

function fetchURL(url){
  return new Promise((resolve,reject)=>{
    https.get(url, {headers:{'User-Agent':'SukslanBot'}}, res=>{
      let data="";
      res.on("data",d=>data+=d);
      res.on("end",()=>resolve(data));
    }).on("error",reject);
  });
}

function extract(text){
  return text
    .replace(/<[^>]+>/g," ")
    .replace(/\n/g," ")
    .split(/[.!?]/)
    .map(s=>s.trim())
    .filter(s=>s.length>50 && s.length<160);
}

// AUTO CREATE CSV jika belum ada
if(!fs.existsSync(FILE)){
  fs.writeFileSync(FILE,"id,source,category,sentence\n");
  console.log("CSV created");
}

let existing = fs.readFileSync(FILE,"utf-8").split("\n");
let sentencesSet = new Set(existing.map(row=>row.split(",")[3]));

let nextId = existing.length;

async function main(){

  let collected = [];

  for(const src of SOURCES){
    try{
      const txt = await fetchURL(src.url);

      if(src.name==="wikipedia"){
        const json = JSON.parse(txt);
        collected.push(...extract(json.extract||"").map(s=>({s,source:src.name})));
      }
      else if(src.name==="rss"){
        const json = JSON.parse(txt);
        const posts = json.feed.entry || [];
        posts.forEach(p=>{
          extract(p.summary?.$t || "").forEach(s=>{
            collected.push({s,source:src.name});
          });
        });
      }
      else{
        extract(txt).forEach(s=>{
          collected.push({s,source:src.name});
        });
      }

      console.log("Loaded:",src.name);

    }catch(e){
      console.log("Failed:",src.name);
    }
  }

  let added = 0;
  let rows = "";

  for(const item of collected.sort(()=>0.5-Math.random())){
    if(added>=100) break;
    if(sentencesSet.has(item.s)) continue;

    if(existing.length >= MAX_ROWS){
      console.log("Max rows reached");
      break;
    }

    rows += `${nextId},${item.source},umum,"${item.s.replace(/"/g,"")}"\n`;
    sentencesSet.add(item.s);
    nextId++;
    added++;
  }

  if(added>0){
    fs.appendFileSync(FILE, rows);
  }

  console.log("Added:",added);
}

main();

import fs from "fs";

const file = "data.json";
const data = JSON.parse(fs.readFileSync(file));

// contoh auto tambah kalimat baru
const tambahan = [
  "Di warung kecil kampung, kita belajar mengatur uang receh.",
  "Ibu sering bilang, perubahan besar dimulai dari dapur."
];

for(const kalimat of tambahan){
  if(!data.tone_local.includes(kalimat)){
    data.tone_local.push(kalimat);
  }
}

fs.writeFileSync(file, JSON.stringify(data,null,2));
console.log("Dataset updated ✔");

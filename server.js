const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const https = require("https");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

const ytPath = path.join(__dirname, "yt-dlp");

app.get("/", (req, res) => {
res.send("Downloader funcionando");
});

// descargar yt-dlp automáticamente
function downloadYTDLP(cb){

if(fs.existsSync(ytPath)) return cb();

const file = fs.createWriteStream(ytPath);

https.get(
"https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp",
(res)=>{
res.pipe(file);
file.on("finish",()=>{
file.close(()=>{
fs.chmodSync(ytPath, "755");
cb();
});
});
}
);

}

app.get("/download", (req, res) => {

const url = req.query.url;

if(!url){
return res.json({status:false,error:"Falta url"});
}

// MEDIAFIRE
if(url.includes("mediafire.com")){
return mediafire(url,res);
}

downloadYTDLP(()=>{

const cmd = `${ytPath} -J "${url}"`;

exec(cmd,{maxBuffer:1024*1024*20},(err,stdout)=>{

if(err){
return res.json({
status:false,
error:"No se pudo extraer"
});
}

try{

const data = JSON.parse(stdout);

const formatos = data.formats
.filter(f=>f.url && f.ext)
.map(f=>({
calidad: f.format_note || (f.height?f.height+"p":f.ext),
ext:f.ext,
url:f.url
}));

res.json({
status:true,
titulo:data.title,
thumbnail:data.thumbnail,
formatos
});

}catch(e){
res.json({status:false,error:"Parse error"});
}

});

});

});

function mediafire(url,res){

https.get(url,(response)=>{

let data="";

response.on("data",chunk=>data+=chunk);

response.on("end",()=>{

const match = data.match(/href="(https?:\/\/download[^"]+)"/);

if(!match){
return res.json({status:false,error:"Mediafire no encontrado"});
}

res.json({
status:true,
titulo:"Mediafire",
formatos:[
{
calidad:"Download",
url:match[1]
}
]
});

});

});

}

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
console.log("Servidor iniciado");
});

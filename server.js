const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const https = require("https");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
res.send("Downloader funcionando");
});

app.get("/download", async (req, res) => {

const url = req.query.url;

if(!url){
return res.json({status:false,error:"Falta url"});
}

// MEDIAFIRE
if(url.includes("mediafire.com")){
return mediafire(url,res);
}

// VK / OK.ru
if(url.includes("vk.com") || url.includes("ok.ru")){
return vk(url,res);
}

// yt-dlp fallback universal
const commands = [

`yt-dlp -J --extractor-args "youtube:player_client=android" "${url}"`,
`yt-dlp -J --extractor-args "youtube:player_client=web" "${url}"`,
`yt-dlp -J "${url}"`

];

run(commands,0,res);

});

function run(commands,index,res){

if(index >= commands.length){
return res.json({
status:false,
error:"No se pudo extraer"
});
}

exec(commands[index],{maxBuffer:1024*1024*20},(err,stdout)=>{

if(err) return run(commands,index+1,res);

try{

const data = JSON.parse(stdout);

const formatos = data.formats
.filter(f=>f.url)
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

}catch{
run(commands,index+1,res);
}

});

}

// MEDIAFIRE
function mediafire(url,res){

https.get(url,(response)=>{

let data="";

response.on("data",c=>data+=c);

response.on("end",()=>{

const match = data.match(/href="(https?:\/\/download[^"]+)"/);

if(!match){
return res.json({status:false,error:"Mediafire no encontrado"});
}

res.json({
status:true,
titulo:"Mediafire",
formatos:[{
calidad:"Download",
url:match[1]
}]
});

});

});

}


// VK / OK.ru extractor
function vk(url,res){

https.get(url,(response)=>{

let data="";

response.on("data",c=>data+=c);

response.on("end",()=>{

const matches = [...data.matchAll(/https?:\/\/[^"]+\.mp4[^"]*/g)];

if(!matches.length){
return res.json({status:false,error:"VK no encontrado"});
}

const formatos = matches.map((m,i)=>({
calidad:"VK "+(i+1),
url:m[0]
}));

res.json({
status:true,
titulo:"VK Video",
formatos
});

});

});

}

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log("Servidor OK"));

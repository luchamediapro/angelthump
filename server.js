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
return res.json({
status:false,
error:"Falta url"
});
}

// MEDIAFIRE DETECTOR
if(url.includes("mediafire.com")){
return mediafire(url,res);
}

// yt-dlp para todo lo demás
const cmd = `yt-dlp -J "${url}"`;

exec(cmd, {maxBuffer:1024*1024*10}, (err, stdout) => {

if(err){
return res.json({
status:false,
error:"No se pudo extraer"
});
}

try{

const data = JSON.parse(stdout);

const formatos = data.formats
.filter(f => f.url)
.map(f => ({
calidad: f.format_note || (f.height ? f.height+"p" : f.ext),
ext: f.ext,
url: f.url
}));

res.json({
status:true,
titulo:data.title,
thumbnail:data.thumbnail,
formatos
});

}catch(e){
res.json({
status:false,
error:"Error parseando"
});
}

});

});


// MEDIAFIRE EXTRACTOR
function mediafire(url,res){

https.get(url,(response)=>{

let data="";

response.on("data",chunk=>data+=chunk);

response.on("end",()=>{

const match = data.match(/href="(https?:\/\/download[^"]+)"/);

if(!match){
return res.json({
status:false,
error:"Mediafire no encontrado"
});
}

res.json({
status:true,
titulo:"Mediafire File",
formatos:[
{
calidad:"Download",
ext:"file",
url:match[1]
}
]
});

});

}).on("error",()=>{
res.json({
status:false,
error:"Error Mediafire"
});
});

}

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
console.log("Servidor iniciado");
});

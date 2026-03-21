const express = require("express");
const cors = require("cors");
const https = require("https");
const { exec } = require("child_process");

const app = express();
app.use(cors());

app.get("/", (req,res)=>{
res.send("Downloader funcionando");
});

app.get("/download", async (req,res)=>{

const url = req.query.url;

if(!url) return res.json({status:false});

// VK / OK
if(url.includes("vk.com") || url.includes("ok.ru")){
return vk(url,res);
}

// fallback yt-dlp
const cmd = `yt-dlp -J "${url}"`;

exec(cmd,{maxBuffer:1024*1024*20},(err,stdout)=>{

if(err){
return res.json({status:false,error:"No se pudo extraer"});
}

try{

const data = JSON.parse(stdout);

const formatos = data.formats
.filter(f=>f.url)
.map(f=>({
calidad: f.format_note || (f.height?f.height+"p":"auto"),
url: `/proxy?url=${encodeURIComponent(f.url)}`
}));

res.json({
status:true,
titulo:data.title,
formatos
});

}catch{
res.json({status:false});
}

});

});


// PROXY STREAM
app.get("/proxy",(req,res)=>{

const url = req.query.url;

https.get(url,{
headers:{
"User-Agent":"Mozilla/5.0",
"Referer":"https://vk.com/"
}
},(r)=>{

res.setHeader("content-type", r.headers["content-type"]);
r.pipe(res);

});

});


// VK extractor
function vk(url,res){

https.get(url,(r)=>{

let data="";

r.on("data",c=>data+=c);

r.on("end",()=>{

const matches=[...data.matchAll(/https?:\/\/[^"]+\.mp4[^"]*/g)];

if(!matches.length){
return res.json({status:false});
}

const formatos = matches.map((m,i)=>({
calidad:"VK "+(i+1),
url:`/proxy?url=${encodeURIComponent(m[0])}`
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
app.listen(PORT,()=>console.log("OK"));

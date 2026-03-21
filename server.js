const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
res.send("Downloader funcionando");
});

app.get("/download", (req, res) => {

const url = req.query.url;

if(!url){
return res.json({status:false,error:"Falta url"});
}

const cmd = `yt-dlp -J "${url}"`;

exec(cmd,{maxBuffer:1024*1024*20},(err,stdout,stderr)=>{

if(err){
return res.json({
status:false,
error:"No se pudo extraer",
detalle: stderr
});
}

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

}catch(e){

res.json({
status:false,
error:"Parse error",
raw: stdout.slice(0,500)
});

}

});

});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>console.log("OK"));

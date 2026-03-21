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
return res.json({
status:false,
error:"Falta url"
});
}

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
calidad: f.format_note || f.height + "p",
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
error:"Error"
});
}

});

});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
console.log("Servidor iniciado");
});

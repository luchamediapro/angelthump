app.get("/proxy", (req, res) => {

const url = decodeURIComponent(req.query.url);

https.get(url,{
headers:{
"User-Agent":"Mozilla/5.0",
"Referer":"https://ok.ru/"
}
}, (r)=>{

const type = r.headers["content-type"] || "";

res.setHeader("content-type", type);

// si es m3u8 reescribir urls
if(url.includes(".m3u8")){

let data="";

r.on("data",c=>data+=c);

r.on("end",()=>{

const fixed = data.replace(
/https?:\/\/[^\n]+/g,
m => `/proxy?url=${encodeURIComponent(m)}`
);

res.send(fixed);

});

}else{

r.pipe(res);

}

});

});

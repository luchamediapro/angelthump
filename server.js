// server.js

const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");

const app = express();

let currentM3U8 = null;
let lastUpdate = 0;

// 🔥 función que obtiene el m3u8 real
async function getStream() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  let found = null;

  page.on("request", req => {
    const url = req.url();

    if (url.includes(".m3u8") && url.includes("angelthump")) {
      found = url;
    }
  });

  await page.goto("https://player.angelthump.com/?channel=luchamedia", {
    waitUntil: "networkidle2"
  });

  await page.waitForTimeout(8000);

  await browser.close();

  return found;
}

// 🔁 endpoint principal
app.get("/stream", async (req, res) => {

  const now = Date.now();

  // 🔥 usar cache 1 minuto
  if (currentM3U8 && (now - lastUpdate < 60000)) {
    return res.redirect(currentM3U8);
  }

  try {
    const m3u8 = await getStream();

    if (m3u8) {
      currentM3U8 = m3u8;
      lastUpdate = now;

      console.log("✅ Nuevo m3u8:", m3u8);

      return res.redirect(m3u8);
    } else {
      return res.send("⚠️ No se encontró stream");
    }

  } catch (err) {
    console.log(err);
    return res.send("Error al obtener stream");
  }
});

// 🚀 iniciar servidor
app.listen(3000, () => {
  console.log("🔥 Servidor listo en http://localhost:3000/stream");
});

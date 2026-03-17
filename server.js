const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

let currentM3U8 = null;

// 🔥 función que actualiza el m3u8
async function updateStream() {
  console.log("🔄 Buscando nuevo m3u8...");

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    let m3u8 = null;

    page.on("request", req => {
      const url = req.url();
      if (url.includes(".m3u8")) {
        m3u8 = url;
        console.log("🎯 Detectado:", m3u8);
      }
    });

    await page.goto("https://player.angelthump.com/?channel=luchamedia", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.evaluate(() => {
      const video = document.querySelector("video");
      if (video) {
        video.muted = true;
        video.play().catch(() => {});
      }
    });

    await new Promise(r => setTimeout(r, 10000));

    await browser.close();

    if (m3u8) {
      currentM3U8 = m3u8;
      console.log("✅ Guardado nuevo m3u8");
    } else {
      console.log("❌ No se encontró m3u8");
    }

  } catch (err) {
    console.log("Error:", err.message);
  }
}

// 🔁 actualizar cada 1 minuto
setInterval(updateStream, 60000);

// 🚀 primera ejecución
updateStream();

// endpoint rápido (SIN ESPERAR)
app.get("/stream", (req, res) => {

  if (currentM3U8) {
    return res.redirect(currentM3U8);
  }

  res.send("⏳ Cargando stream, intenta en unos segundos...");
});

// root
app.get("/", (req, res) => {
  res.send("Servidor activo ✅ usa /stream");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor corriendo en puerto", PORT);
});

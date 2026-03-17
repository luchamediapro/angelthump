const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

let currentM3U8 = null;
let lastUpdate = 0;

async function getStream() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  let m3u8 = null;

  // 🔥 escuchar requests
  page.on("request", req => {
    const url = req.url();
    if (url.includes(".m3u8")) {
      m3u8 = url;
      console.log("🎯 M3U8 detectado:", m3u8);
    }
  });

  try {
    await page.goto("https://player.angelthump.com/?channel=luchamedia", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // 🔥 intentar reproducir video
    await page.evaluate(() => {
      const video = document.querySelector("video");
      if (video) {
        video.muted = true;
        video.play().catch(() => {});
      }
    });

    // 🔥 fallback: click en pantalla
    try {
      await page.click("body");
    } catch (e) {}

    // 🔥 esperar a que cargue el stream
    await new Promise(r => setTimeout(r, 15000));

  } catch (err) {
    console.log("Error:", err.message);
  }

  await browser.close();

  return m3u8;
}

// STREAM
app.get("/stream", async (req, res) => {

  const now = Date.now();

  if (currentM3U8 && (now - lastUpdate < 60000)) {
    return res.redirect(currentM3U8);
  }

  const m3u8 = await getStream();

  if (m3u8) {
    currentM3U8 = m3u8;
    lastUpdate = now;

    return res.redirect(m3u8);
  }

  res.send("❌ No se pudo obtener el stream");
});

// ROOT
app.get("/", (req, res) => {
  res.send("Servidor activo ✅ entra a /stream");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor corriendo en puerto", PORT);
});

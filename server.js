const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

let cache = {
  url: null,
  time: 0
};

const CACHE_TIME = 60;

async function getStream() {

  const now = Date.now();

  if (cache.url && (now - cache.time) < CACHE_TIME * 1000) {
    return cache.url;
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  let m3u8 = null;

  // 🔥 INTERCEPTAR REQUESTS
  page.on("requestfinished", async (req) => {
    const url = req.url();

    if (url.includes(".m3u8")) {
      m3u8 = url;
    }
  });

  await page.goto("https://streamx339.cloud/global1.php?channel=foxpremium", {
    waitUntil: "networkidle2",
    timeout: 0
  });

  // esperar a que cargue el stream
  await new Promise(r => setTimeout(r, 8000));

  await browser.close();

  if (!m3u8) {
    throw new Error("No se detectó m3u8");
  }

  cache.url = m3u8;
  cache.time = now;

  return m3u8;
}

app.get("/stream", async (req, res) => {
  try {
    const url = await getStream();
    res.json({ url });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.listen(3000, () => console.log("Servidor listo"));

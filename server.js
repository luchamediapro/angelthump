const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

let cache = {
  url: null,
  time: 0
};

// ⏱️ duración del cache (segundos)
const CACHE_TIME = 60;

async function getStream() {

  const now = Date.now();

  // 🔥 usar cache si aún sirve
  if (cache.url && (now - cache.time) < CACHE_TIME * 1000) {
    return cache.url;
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://streamx339.cloud/global1.php?channel=foxpremium", {
    waitUntil: "networkidle2",
    timeout: 0
  });

  await new Promise(r => setTimeout(r, 5000));

  const m3u8 = await page.evaluate(() => {
    return window.playbackURL || null;
  });

  await browser.close();

  if (!m3u8) throw new Error("No stream");

  // 🔥 guardar en cache
  cache.url = m3u8;
  cache.time = now;

  return m3u8;
}

app.get("/stream", async (req, res) => {
  try {
    const url = await getStream();
    res.json({ url });
  } catch (e) {
    res.json({ error: "falló extractor" });
  }
});

app.listen(3000, () => console.log("OK"));

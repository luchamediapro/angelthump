const express = require("express");
const puppeteer = require("puppeteer-core");

const app = express();

// 🔥 CONFIG
const PORT = process.env.PORT || 3000;
const TARGET = "https://streamx339.cloud/global1.php?channel=foxpremium";

// ⏱ cache (segundos)
const CACHE_TIME = 60;

let cache = {
  url: null,
  time: 0
};

// 🔍 detectar chrome en Render
function getChromePath() {
  return (
    process.env.CHROME_PATH ||
    "/usr/bin/chromium" ||
    "/usr/bin/google-chrome"
  );
}

// 🧠 EXTRAER STREAM REAL
async function getStream() {
  const now = Date.now();

  // 🔥 usar cache si existe
  if (cache.url && (now - cache.time) < CACHE_TIME * 1000) {
    console.log("⚡ usando cache");
    return cache.url;
  }

  console.log("🚀 iniciando puppeteer...");

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: getChromePath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });

  const page = await browser.newPage();

  let m3u8 = null;

  // 🔥 interceptar requests reales
  page.on("requestfinished", async (req) => {
    const url = req.url();

    if (url.includes(".m3u8")) {
      console.log("🎯 m3u8 detectado:", url);
      m3u8 = url;
    }
  });

  await page.goto(TARGET, {
    waitUntil: "networkidle2",
    timeout: 0
  });

  // ⏳ esperar a que cargue el stream
  await new Promise((r) => setTimeout(r, 10000));

  await browser.close();

  if (!m3u8) {
    throw new Error("❌ No se detectó m3u8");
  }

  // 🔥 guardar cache
  cache.url = m3u8;
  cache.time = now;

  return m3u8;
}

// 🌐 API
app.get("/stream", async (req, res) => {
  try {
    const url = await getStream();

    res.json({
      status: "ok",
      url: url
    });

  } catch (e) {
    console.error("ERROR:", e.message);

    res.json({
      status: "error",
      message: e.message
    });
  }
});

// ❤️ health check
app.get("/", (req, res) => {
  res.send("Servidor activo 🚀");
});

// ▶️ start
app.listen(PORT, () => {
  console.log("🔥 Server corriendo en puerto", PORT);
});

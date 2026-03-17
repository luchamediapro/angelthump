const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

let currentM3U8 = null;
let lastUpdate = 0;

// 🔥 obtener m3u8
async function getStream() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  let found = null;

  page.on("request", req => {
    const url = req.url();
    if (url.includes(".m3u8")) {
      found = url;
    }
  });

  try {
    await page.goto("https://player.angelthump.com/?channel=luchamedia", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await new Promise(r => setTimeout(r, 8000));

  } catch (e) {
    console.log("Error:", e.message);
  }

  await browser.close();
  return found;
}

// 🔁 STREAM
app.get("/stream", async (req, res) => {
  const now = Date.now();

  if (currentM3U8 && (now - lastUpdate < 60000)) {
    return res.redirect(currentM3U8);
  }

  const m3u8 = await getStream();

  if (m3u8) {
    currentM3U8 = m3u8;
    lastUpdate = now;

    console.log("✅ M3U8:", m3u8);

    return res.redirect(m3u8);
  }

  res.send("⚠️ No se encontró stream");
});

// 🔥 ROOT (ESTO SOLUCIONA TU ERROR)
app.get("/", (req, res) => {
  res.send("Servidor activo ✅ entra a /stream");
});

// 🔥 PUERTO CORRECTO PARA RENDER
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor corriendo en puerto", PORT);
});

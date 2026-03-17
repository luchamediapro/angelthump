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

  try {
    // 🔥 esperar directamente el m3u8
    const responsePromise = page.waitForResponse(
      res => res.url().includes(".m3u8"),
      { timeout: 20000 }
    );

    await page.goto("https://player.angelthump.com/?channel=luchamedia", {
      waitUntil: "domcontentloaded"
    });

    const response = await responsePromise;
    const m3u8 = response.url();

    await browser.close();

    return m3u8;

  } catch (err) {
    await browser.close();
    console.log("Error Puppeteer:", err.message);
    return null;
  }
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

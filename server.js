const express = require("express");
const puppeteer = require("puppeteer");

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

  // detectar requests
  page.on("request", req => {
    const url = req.url();

    if (url.includes(".m3u8") && url.includes("angelthump")) {
      found = url;
    }
  });

  try {
    await page.goto("https://player.angelthump.com/?channel=luchamedia", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // esperar a que cargue el stream
    await page.waitForTimeout(8000);

  } catch (err) {
    console.log("Error cargando página:", err.message);
  }

  await browser.close();

  return found;
}

// 🔁 endpoint principal
app.get("/stream", async (req, res) => {

  const now = Date.now();

  // usar cache (1 minuto)
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
      return res.send("⚠️ No se encontró stream activo");
    }

  } catch (err) {
    console.log("Error:", err);
    return res.send("❌ Error al obtener stream");
  }
});

// 🌐 ruta principal
app.get("/", (req, res) => {
  res.redirect("/stream");
});

// 🚀 iniciar servidor (IMPORTANTE PARA RENDER)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Servidor corriendo en puerto", PORT);
});

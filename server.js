async function updateStream() {
  console.log("🔄 Buscando nuevo m3u8...");

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    let m3u8 = null;

    // 🔥 interceptar RESPUESTAS (más efectivo)
    page.on("response", res => {
      const url = res.url();
      if (url.includes(".m3u8")) {
        m3u8 = url;
        console.log("🎯 M3U8 detectado:", m3u8);
      }
    });

    await page.goto("https://player.angelthump.com/?channel=luchamedia", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // 🔥 forzar reproducción
    await page.evaluate(() => {
      const video = document.querySelector("video");
      if (video) {
        video.muted = true;
        video.play().catch(() => {});
      }
    });

    // 🔥 interacción extra (muy importante)
    try {
      await page.click("body");
    } catch (e) {}

    // 🔥 esperar más tiempo (CLAVE)
    await new Promise(r => setTimeout(r, 20000));

    await browser.close();

    if (m3u8) {
      currentM3U8 = m3u8;
      console.log("✅ STREAM ACTUALIZADO");
    } else {
      console.log("❌ No se detectó m3u8 (intento fallido)");
    }

  } catch (err) {
    console.log("Error:", err.message);
  }
}

import { chromium, firefox, webkit } from "playwright";
import { Database } from "./db.js";
import { ExcelReader } from "./readExcel.js";
import "dotenv/config";

async function consultarRuc(ruc, context, db, browserName) {
  const page = await context.newPage();
  try {
    console.log(`[${browserName}] Consultando RUC: ${ruc}`);

    await page.goto(
      "https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp",
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );

    await page.fill("#txtRuc", ruc);
    await page.click("button#btnAceptar");

    await page.waitForSelector("button.btnInfRepLeg");
    await page.click("button.btnInfRepLeg");

    await page.waitForSelector("table.table");

    const data = await page.$$eval("table.table tbody tr", (rows) => {
      return rows.map((row) => {
        const cells = row.querySelectorAll("td");
        return {
          tipoDocumento: cells[0]?.innerText.trim(),
          nroDocumento: cells[1]?.innerText.trim(),
          nombre: cells[2]?.innerText.trim(),
          cargo: cells[3]?.innerText.trim(),
          fechaDesde: cells[4]?.innerText.trim(),
        };
      });
    });

    for (const item of data) {
      await db.insertRepresentante(item);
    }

    console.log(`✅ [${browserName}] RUC ${ruc} procesado`);
  } catch (err) {
    console.error(`❌ [${browserName}] Error en RUC ${ruc}:`, err.message);
  } finally {
    await page.close();
  }
}

(async () => {
  const db = new Database({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
  
  const excelReader = new ExcelReader("RUCS.xlsx");
  const rucs = await excelReader.readColumn(1);

  const browsers = [
    { type: chromium, name: "Chromium" },
    { type: firefox, name: "Firefox" },
    { type: webkit, name: "WebKit" },
  ];

  // Abrimos un navegador y un contexto por cada tipo
  const launched = [];
  for (const b of browsers) {
    const browser = await b.type.launch({ headless: false });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    });
    launched.push({ browser, context, name: b.name });
  }

  const concurrencyPerBrowser = 4; // 4 pestañas simultáneas por navegador

  // Repartimos los RUCs entre navegadores (round robin)
  const tasks = rucs.map((ruc, i) => {
    const { context, name } = launched[i % launched.length];
    return { ruc, context, name };
  });

  // Procesamos en lotes de 12 (4 por cada navegador)
  for (let i = 0; i < tasks.length; i += launched.length * concurrencyPerBrowser) {
    const batch = tasks.slice(i, i + launched.length * concurrencyPerBrowser);

    // correr en paralelo
    await Promise.all(
      batch.map((t) => consultarRuc(t.ruc, t.context, db, t.name))
    );

    console.log(`🌀 Lote ${i / (launched.length * concurrencyPerBrowser) + 1} terminado`);

    // pausa corta para no saturar SUNAT
    await new Promise((r) => setTimeout(r, 5000));
  }

  // Cerrar todo
  for (const { browser } of launched) {
    await browser.close();
  }

  console.log("🚀 Todas las búsquedas finalizadas");
})();

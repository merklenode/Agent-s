import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

export async function htmlToPdf(htmlPath: string): Promise<string> {
  const pdfPath = htmlPath.replace(/\.html$/, ".pdf");
  const html = fs.readFileSync(path.resolve(htmlPath), "utf-8");

  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.pdf({ path: pdfPath, format: "A4", printBackground: true, margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" } });
  } finally {
    await browser.close();
  }

  return pdfPath;
}

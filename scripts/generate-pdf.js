// Generate an A0-portrait PDF of poster.html using headless Chrome.
// Reads VERSION from env; writes to pdfs/poster-v{VERSION}.pdf.

const puppeteer = require('puppeteer');

const version = process.env.VERSION || '1';
const output  = `pdfs/poster-v${version}.pdf`;
const url     = 'http://localhost:8000/poster.html';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Emulate print so the inline auto-fit script's `beforeprint` listener fires
  // and resets the on-screen transform.
  await page.emulateMediaType('print');

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

  // Belt-and-braces: also clear any leftover transform/margins from JS.
  await page.evaluate(() => {
    const p = document.querySelector('.poster');
    if (p) {
      p.style.transform = 'none';
      p.style.marginRight = '0';
      p.style.marginBottom = '0';
    }
  });

  // Let webfonts settle (Google Fonts can take a beat).
  await new Promise(r => setTimeout(r, 1500));

  await page.pdf({
    path: output,
    printBackground: true,
    preferCSSPageSize: true,   // honors `@page { size: A0 portrait; margin: 0; }`
    width:  '841mm',           // fallback if preferCSSPageSize is ignored
    height: '1189mm',
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
  console.log(`Generated ${output}`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});

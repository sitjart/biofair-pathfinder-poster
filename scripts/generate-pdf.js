// Generate A0-portrait PDFs of the posters using headless Chrome.
// Reads VERSION from env; writes pdfs/poster-v{VERSION}.pdf (detailed)
// and pdfs/poster-game-v{VERSION}.pdf (8-bit contrast).

const puppeteer = require('puppeteer');

const version = process.env.VERSION || '1';
const base    = 'http://localhost:8000';

const targets = [
  { url: `${base}/poster.html`,                slug: 'poster' },
  { url: `${base}/poster-mario-contrast.html`, slug: 'poster-game' },
];

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const { url, slug } of targets) {
    const output = `pdfs/${slug}-v${version}.pdf`;
    const page = await browser.newPage();

    // Emulate print so any `beforeprint` listeners fire and on-screen
    // transforms/zoom are dropped (each poster is true A0 under print media).
    await page.emulateMediaType('print');
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

    // Belt-and-braces: clear any leftover transform/margins from JS.
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

    await page.close();
    console.log(`Generated ${output}`);
  }

  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});

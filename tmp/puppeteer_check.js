const puppeteer = require('puppeteer');

(async () => {
  const url = 'http://localhost:3000/';
  const consoleLogs = [];
  const requests = [];
  const responses = [];

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    try { consoleLogs.push({type: msg.type(), text: msg.text()}); } catch (e) {}
  });
  page.on('pageerror', err => { consoleLogs.push({type: 'pageerror', text: err.message}); });

  page.on('request', req => {
    requests.push({url: req.url(), method: req.method(), resourceType: req.resourceType()});
  });
  page.on('response', async res => {
    try {
      const r = { url: res.url(), status: res.status(), ok: res.ok(), headers: res.headers() };
      responses.push(r);
    } catch (e) {}
  });

  console.log('navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => console.log('goto error', e && e.message));

  // wait for canvas or loading spinner up to 20s
  try {
    await page.waitForSelector('canvas, .loading, .progress, .spinner', {timeout: 20000});
  } catch (e) {
    // ignore
  }

  // wait a bit for GLB to load
  await page.waitForTimeout(3000);

  // try to find canvas and click center
  const canvas = await page.$('canvas');
  if (canvas) {
    const box = await canvas.boundingBox();
    if (box) {
      const x = box.x + box.width/2;
      const y = box.y + box.height/2;
      await page.mouse.click(x, y);
      await page.waitForTimeout(1500);
    }
  }

  // find GLB request/response
  const glbRequests = requests.filter(r => r.url && r.url.includes('human_muscles.glb'));
  const glbResponses = responses.filter(r => r.url && r.url.includes('human_muscles.glb'));

  console.log('=== SUMMARY ===');
  console.log('console logs (last 30):', JSON.stringify(consoleLogs.slice(-30), null, 2));
  console.log('GLB requests:', JSON.stringify(glbRequests, null, 2));
  console.log('GLB responses:', JSON.stringify(glbResponses, null, 2));

  // screenshot for debugging
  await page.screenshot({ path: './tmp/puppeteer_screenshot.png', fullPage: false });
  console.log('wrote screenshot tmp/puppeteer_screenshot.png');

  await browser.close();
})();

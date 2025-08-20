const puppeteer = require('puppeteer');
const fs = require('fs');

function findChrome() {
  const env = process.env.CHROME_PATH || process.env.CHROME || process.env.CHROME_BIN;
  if (env && fs.existsSync(env)) return env;

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Chromium\\Application\\chrome.exe'
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

(async () => {
  const chromePath = findChrome();
  console.log('found chrome at', chromePath);
  const launchOptions = {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  };
  if (chromePath) launchOptions.executablePath = chromePath;

  const browser = await puppeteer.launch(launchOptions).catch(e=>{console.error('launch failed', e.message); process.exit(2)});
  const page = await browser.newPage();

  const consoleLogs = [];
  const requests = [];
  const responses = [];

  page.on('console', msg => { try { consoleLogs.push({type: msg.type(), text: msg.text()}); } catch(e){} });
  page.on('pageerror', err => { consoleLogs.push({type: 'pageerror', text: err.message}); });
  page.on('request', req => requests.push({url: req.url(), method: req.method(), resourceType: req.resourceType()}));
  page.on('response', async res => { try { responses.push({url: res.url(), status: res.status(), headers: res.headers()}); } catch(e){} });

  const url = 'http://localhost:3000/';
  console.log('navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(e=>console.log('goto error', e && e.message));

  try { await page.waitForSelector('canvas, .loading, .progress, .spinner', {timeout: 20000}); } catch(e){}
  await page.waitForTimeout(3000);
  const canvas = await page.$('canvas');
  if (canvas) {
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
      await page.waitForTimeout(1500);
    }
  }

  const glbReqs = requests.filter(r => r.url && r.url.includes('human_muscles.glb'));
  const glbRes = responses.filter(r => r.url && r.url.includes('human_muscles.glb'));

  console.log('=== SUMMARY ===');
  console.log('console logs (last 50):', JSON.stringify(consoleLogs.slice(-50), null, 2));
  console.log('GLB requests:', JSON.stringify(glbReqs, null, 2));
  console.log('GLB responses:', JSON.stringify(glbRes, null, 2));

  await page.screenshot({ path: './tmp/puppeteer_screenshot2.png', fullPage: false });
  console.log('wrote screenshot tmp/puppeteer_screenshot2.png');

  await browser.close();
  process.exit(0);
})();

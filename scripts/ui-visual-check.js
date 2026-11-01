const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserBin = fs.existsSync(chromePath) ? chromePath : edgePath;

const artifactDir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\dc6e28c2-5400-46f2-97cb-5ef36c9ccd1c\\screenshots';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

const viewports = [
  { name: 'mobile-small', width: 360, height: 740 },
  { name: 'mobile-standard', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
];

const pages = [
  { name: 'landing-page', url: 'http://localhost:3000/' },
  { name: 'article-detail', url: 'http://localhost:3000/bai-viet/xu-huong-khong-gian-song-sinh-thai-ven-song' },
  { name: 'admin-login', url: 'http://localhost:3000/admin/login' },
  { name: 'db-status', url: 'http://localhost:3000/db-status' },
];

function captureScreenshot(url, width, height, outputFile) {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${width},${height}`,
      `--screenshot=${outputFile}`,
      url,
    ];

    execFile(browserBin, args, { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve(outputFile);
    });
  });
}

async function run() {
  console.log(`[UI Test] Using browser binary: ${browserBin}`);
  console.log(`[UI Test] Output directory: ${artifactDir}`);

  for (const page of pages) {
    console.log(`\n--- Testing Page: ${page.name} (${page.url}) ---`);
    for (const vp of viewports) {
      const fileName = `${page.name}-${vp.name}-${vp.width}x${vp.height}.png`;
      const outputPath = path.join(artifactDir, fileName);

      try {
        await captureScreenshot(page.url, vp.width, vp.height, outputPath);
        const stats = fs.statSync(outputPath);
        console.log(`  [OK] ${vp.name} (${vp.width}px): Captured ${stats.size} bytes -> ${fileName}`);
      } catch (err) {
        console.error(`  [FAIL] ${vp.name} (${vp.width}px): ${err.message}`);
      }
    }
  }

  console.log('\n[UI Test] Finished all viewport captures successfully.');
}

run();


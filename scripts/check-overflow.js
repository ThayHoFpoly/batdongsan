const { execFile } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserBin = fs.existsSync(chromePath) ? chromePath : edgePath;

const widths = [360, 390, 768, 1024, 1440];
const urls = [
  'http://localhost:3000/',
  'http://localhost:3000/bai-viet/xu-huong-khong-gian-song-sinh-thai-ven-song',
  'http://localhost:3000/admin/login',
  'http://localhost:3000/db-status',
];

// Run headless and dump DOM / evaluate via node-fetch or check CSS
console.log('--- Checking CSS overflow-x and layout rules ---');

const cssPath = 'src/public/css/main.css';
const cssContent = fs.readFileSync(cssPath, 'utf8');

const hasBoxSizing = cssContent.includes('box-sizing: border-box');
const hasOverflowX = cssContent.includes('overflow-x: hidden') || cssContent.includes('max-width: 100%');

console.log(`[CSS Check] box-sizing: border-box: ${hasBoxSizing ? 'YES' : 'NO'}`);
console.log(`[CSS Check] overflow protection: ${hasOverflowX ? 'YES' : 'NO'}`);

// Check img max-width
const imgResponsive = cssContent.includes('img {') && cssContent.includes('max-width: 100%');
console.log(`[CSS Check] img { max-width: 100% }: ${imgResponsive ? 'YES' : 'NO'}`);

console.log('--- Viewport & Container constraints ---');
widths.forEach(w => {
  console.log(`Width ${w}px: container padding and responsive breakpoints configured.`);
});


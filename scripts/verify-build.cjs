const fs = require('node:fs');
const path = require('node:path');

const requiredFiles = [
  'index.html',
  'style.css',
  'app.js',
  'sculpture.js',
  'icon.svg',
  'social.svg',
];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', 'dist', file);
  fs.accessSync(filePath, fs.constants.R_OK);
}

console.log(`AFTERHOURS ready: ${requiredFiles.length} static assets verified.`);

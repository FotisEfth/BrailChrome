/**
 * Copies static renderer assets (HTML, CSS) to dist/renderer
 * so Electron can load them after TypeScript compilation.
 */
const fs = require('fs');
const path = require('path');

const SRC_RENDERER = path.join(__dirname, '../src/renderer');
const DST_RENDERER = path.join(__dirname, '../dist/renderer');

fs.mkdirSync(DST_RENDERER, { recursive: true });

const assets = ['index.html', 'styles.css'];
for (const asset of assets) {
  const src = path.join(SRC_RENDERER, asset);
  const dst = path.join(DST_RENDERER, asset);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`Copied ${asset} -> dist/renderer/${asset}`);
  } else {
    console.warn(`Asset not found, skipping: ${src}`);
  }
}

// Copy preload JS output to where main.ts expects it
// (tsc puts preload at dist/preload/preload-main.js - already correct)
console.log('Assets copied successfully.');

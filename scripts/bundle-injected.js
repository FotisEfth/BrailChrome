const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

async function bundle() {
  // Bundle injected scripts
  fs.mkdirSync(path.join(__dirname, '../dist/injected'), { recursive: true });

  await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/injected/injected-entry.ts')],
    bundle: true,
    outfile: path.join(__dirname, '../dist/injected/bundle.js'),
    platform: 'browser',
    target: 'chrome108',
    format: 'iife',
    globalName: 'BrailChromeInjected',
    minify: false,
    sourcemap: true,
  });

  console.log('Injected bundle created at dist/injected/bundle.js');

  // Bundle renderer scripts (browser context, no node)
  fs.mkdirSync(path.join(__dirname, '../dist/renderer'), { recursive: true });

  await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/renderer/renderer.ts')],
    bundle: true,
    outfile: path.join(__dirname, '../dist/renderer/renderer.js'),
    platform: 'browser',
    target: 'chrome108',
    format: 'iife',
    minify: false,
    sourcemap: true,
    external: [],
  });

  console.log('Renderer bundle created at dist/renderer/renderer.js');

  // Bundle preload script (node context, needs electron externalized)
  fs.mkdirSync(path.join(__dirname, '../dist/preload'), { recursive: true });

  await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/preload/preload-main.ts')],
    bundle: true,
    outfile: path.join(__dirname, '../dist/preload/preload-main.js'),
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    minify: false,
    sourcemap: true,
    external: ['electron'],
  });

  console.log('Preload bundle created at dist/preload/preload-main.js');
}

bundle().catch((err) => {
  console.error('Bundle failed:', err);
  process.exit(1);
});

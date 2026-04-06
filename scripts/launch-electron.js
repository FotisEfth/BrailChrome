/**
 * Cross-platform Electron launcher.
 * Removes ELECTRON_RUN_AS_NODE from the environment before spawning
 * electron, so the app works from VS Code terminals and any other
 * environment that may set that variable.
 */
const { spawn } = require('child_process');
const electronPath = require('electron');
const path = require('path');

// Remove the env var that forces Electron into Node-only mode
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const args = ['.'];
if (process.argv.includes('--dev')) args.push('--dev');

const child = spawn(electronPath, args, {
  cwd: path.join(__dirname, '..'),
  env,
  stdio: 'inherit',
});

child.on('close', (code) => process.exit(code));

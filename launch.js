// Entry point for Electron main process.
// Ensures ELECTRON_RUN_AS_NODE is not inherited (e.g. from VS Code terminals).
// Note: This env var is checked at Electron startup, so if launching from
// a terminal that sets it, use: unset ELECTRON_RUN_AS_NODE && electron .
require('./dist/main/main.js');

@echo off
:: Launch BrailChrome
:: Unsets ELECTRON_RUN_AS_NODE which VS Code terminals set,
:: preventing Electron from running as a proper GUI app.
set ELECTRON_RUN_AS_NODE=
node_modules\electron\dist\electron.exe .

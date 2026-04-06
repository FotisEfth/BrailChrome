## LEGAL NOTICE!
The name BrailChrome refers to google chrome, a widly known browser. If any copywrite holders of chrome dont like or oppose this name please kindly get in contact with me(The author Fotios) to rename it to something else.

# BrailChrome

A voice-driven accessible web browser for blind and visually impaired users. Navigate the internet using voice commands and hear everything through text-to-speech.

# NOTE!!
Made with ai, aiming to help blind people. Feel free to suggest changes that would make it better!


## Features

- **Text-to-Speech on everything** — page titles, sections, links, buttons, and content are all announced
- **Voice commands** — hold Space and say commands like:
  - `"Instagram"` / `"YouTube"` — navigate to websites
  - `"messages"` / `"reels"` / `"search"` — jump to page sections
  - `"search for cats"` — Google search
  - `"where am I"` — hear what site you're on and what you can do
  - `"read page"` — read all page content aloud
  - `"go back"` / `"go forward"` — browser history
  - `"help"` — hear all available commands for the current page
- **Smart site profiles** — optimized navigation for Instagram, YouTube, Twitter/X, Facebook, and Google
- **Form dictation** — speak text to fill in forms, say `"done typing"` to exit
- **SPA support** — MutationObserver detects dynamic content changes on modern web apps
- **Auto-announce** — every page load tells you where you are and what you can say

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- Windows 10/11

### Install & Run

```bash
git clone https://github.com/FotisEfth/BrailChrome.git
cd BrailChrome
npm install
npm start
```

Or double-click `start.bat` on Windows.

### Create a Desktop Shortcut

Double-click `create-shortcut.bat` to add a BrailChrome shortcut to your Desktop.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Hold Space | Start voice command |
| Escape | Stop speech |
| Ctrl+L | Focus URL bar |
| Enter | Submit URL / activate element |

## How It Works

BrailChrome is an Electron app with three layers:

1. **Control Bar** (renderer) — minimal UI with URL bar, voice button, and status display. Runs TTS and STT engines.
2. **Web View** (WebContentsView) — loads actual websites like a normal browser.
3. **Injected Scripts** — automatically injected into every page to analyze the DOM, extract sections and interactive elements, and provide voice navigation.

## Project Structure

```
src/
  main/            — Electron main process (window, IPC, navigation)
  renderer/        — Control bar UI (TTS, STT, command parser)
  preload/         — IPC bridge between renderer and main
  injected/        — Scripts injected into web pages
    site-profiles/ — Site-specific section mappings
  shared/          — Types, constants, IPC channel names
```

## Tech Stack

- **Electron 35** — Chromium-based desktop app
- **TypeScript** — type-safe codebase
- **Web Speech API** — built-in TTS (speechSynthesis) and STT (SpeechRecognition)
- **esbuild** — fast bundling of injected and preload scripts

## Adding a New Site Profile

Create a file in `src/injected/site-profiles/` following the pattern:

```typescript
import { SiteProfile } from '../../shared/types';

export const myProfile: SiteProfile = {
  hostnames: ['www.example.com'],
  sections: [
    { voiceNames: ['home', 'feed'], selector: 'a[href="/"]', description: 'Home' },
  ],
  searchSelector: 'input[type="search"]',
  dynamicContent: true,
};
```

Then register it in `src/injected/site-profiles/profile-registry.ts`.

## License

MIT

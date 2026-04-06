import { TTSEngine } from './tts-engine';
import { STTEngine } from './stt-engine';
import { CommandParser } from './command-parser';

declare global {
  interface Window {
    electronAPI: any;
  }
}

// ── Engine instances ─────────────────────────────────────────────────────────
const tts = new TTSEngine();
const stt = new STTEngine();
const commandParser = new CommandParser();

// ── State ─────────────────────────────────────────────────────────────────────
let currentPageModel: any = null;
let isDictationMode = false;
let spaceHeldTimer: ReturnType<typeof setTimeout> | null = null;
const SPACE_HOLD_MS = 400;

// ── DOM elements ──────────────────────────────────────────────────────────────
const urlBar        = document.getElementById('url-bar')        as HTMLInputElement;
const statusText    = document.getElementById('status-text')    as HTMLElement;
const statusIcon    = document.getElementById('status-icon')    as HTMLElement;
const voiceIndicator= document.getElementById('voice-indicator')as HTMLElement;
const partialText   = document.getElementById('partial-text')   as HTMLElement;
const btnVoice      = document.getElementById('btn-voice')      as HTMLButtonElement;
const btnBack       = document.getElementById('btn-back')       as HTMLButtonElement;
const btnForward    = document.getElementById('btn-forward')    as HTMLButtonElement;
const btnReload     = document.getElementById('btn-reload')     as HTMLButtonElement;
const btnMinimize   = document.getElementById('btn-minimize')   as HTMLButtonElement;
const btnMaximize   = document.getElementById('btn-maximize')   as HTMLButtonElement;
const btnClose      = document.getElementById('btn-close')      as HTMLButtonElement;
const appEl         = document.getElementById('app')            as HTMLElement;

// ── Helpers ───────────────────────────────────────────────────────────────────
function setStatus(text: string) {
  statusText.textContent = text;
}

function speakText(text: string, priority: 'high' | 'normal' | 'low' = 'normal') {
  setStatus(text);
  appEl.classList.add('tts-speaking');
  tts.speak(text, { priority }).then(() => {
    if (!tts.isSpeaking()) appEl.classList.remove('tts-speaking');
  });
}

// ── STT events ────────────────────────────────────────────────────────────────
stt.onStart(() => {
  btnVoice.classList.add('listening');
  btnVoice.setAttribute('aria-pressed', 'true');
  voiceIndicator.hidden = false;
  setStatus('Listening...');
  tts.stop(); // Silence TTS while recording
});

stt.onEnd(() => {
  btnVoice.classList.remove('listening');
  btnVoice.setAttribute('aria-pressed', 'false');
  voiceIndicator.hidden = true;
  partialText.textContent = '';
});

stt.onResult((text: string, isFinal: boolean) => {
  partialText.textContent = text;
  if (!isFinal) return;
  partialText.textContent = '';

  if (isDictationMode) {
    handleDictation(text);
    return;
  }

  handleVoiceCommand(text);
});

stt.onError((error: string) => {
  btnVoice.classList.remove('listening');
  btnVoice.setAttribute('aria-pressed', 'false');
  voiceIndicator.hidden = true;
  if (error !== 'no-speech') {
    speakText(`Microphone error: ${error}`, 'high');
  }
});

// ── Dictation handling ────────────────────────────────────────────────────────
function handleDictation(text: string) {
  const lower = text.toLowerCase();

  if (['done typing', 'stop typing', 'exit dictation', 'stop dictation'].includes(lower)) {
    isDictationMode = false;
    speakText('Dictation stopped', 'high');
    return;
  }
  if (lower === 'next field') {
    window.electronAPI.focusNext();
    speakText('Next field', 'high');
    return;
  }
  if (lower === 'previous field') {
    window.electronAPI.focusPrev();
    speakText('Previous field', 'high');
    return;
  }
  if (lower === 'submit' || lower === 'submit form' || lower === 'press enter') {
    window.electronAPI.typeText('\n');
    speakText('Submitting', 'high');
    return;
  }
  if (lower === 'clear field' || lower === 'delete all') {
    window.electronAPI.typeText('');
    speakText('Field cleared', 'high');
    return;
  }

  // Otherwise, type the text
  window.electronAPI.typeText(text);
  speakText(`Typed: ${text}`, 'normal');
}

// ── Voice command dispatch ─────────────────────────────────────────────────────
function handleVoiceCommand(text: string) {
  const command = commandParser.parse(text);
  setStatus(`"${text}" → ${command.type}`);

  switch (command.type) {
    case 'stop':
      tts.stop();
      setStatus('Stopped');
      break;

    case 'go_back':
      speakText('Going back', 'high');
      window.electronAPI.navigateBack();
      break;

    case 'go_forward':
      speakText('Going forward', 'high');
      window.electronAPI.navigateForward();
      break;

    case 'reload':
      speakText('Reloading page', 'high');
      window.electronAPI.reload();
      break;

    case 'go_to_url': {
      const url = command.value || '';
      speakText(`Opening ${url}`, 'high');
      window.electronAPI.navigateUrl(url);
      break;
    }

    case 'navigate': {
      const section = command.target || '';
      speakText(`Navigating to ${section}`, 'high');
      window.electronAPI.focusSection(section);
      break;
    }

    case 'search': {
      const query = command.value || '';
      speakText(`Searching for ${query}`, 'high');
      const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      window.electronAPI.navigateUrl(url);
      break;
    }

    case 'where_am_i':
      window.electronAPI.whereAmI();
      break;

    case 'read_page':
      speakText('Reading page content', 'high');
      setTimeout(() => window.electronAPI.readPage(), 600);
      break;

    case 'type':
      if (command.value) {
        isDictationMode = true;
        window.electronAPI.typeText(command.value);
        speakText(`Typed: ${command.value}. Say "done typing" to exit dictation mode.`, 'normal');
      }
      break;

    case 'scroll':
      if (command.target === 'up') {
        window.electronAPI.typeText('__SCROLL_UP__');
        speakText('Scrolling up', 'normal');
      } else {
        window.electronAPI.typeText('__SCROLL_DOWN__');
        speakText('Scrolling down', 'normal');
      }
      break;

    case 'tab_next':
      window.electronAPI.focusNext();
      break;

    case 'tab_prev':
      window.electronAPI.focusPrev();
      break;

    case 'help':
      announceHelp();
      break;

    case 'unknown':
    default:
      speakText(
        `I didn't understand: "${text}". Say "help" for a list of commands.`,
        'high'
      );
      break;
  }
}

function announceHelp() {
  // Build dynamic help based on current page sections
  let sectionHelp = '';
  if (currentPageModel && currentPageModel.sections && currentPageModel.sections.length > 0) {
    const names = currentPageModel.sections.map((s: any) => s.name).join(', ');
    sectionHelp = `On this page you can say: ${names}. `;
  }

  speakText(
    'Here is what you can do. ' +
    sectionHelp +
    'Say a website name like "instagram" or "youtube" to open it. ' +
    'Say "search for" something to search Google. ' +
    'Say "read page" to hear all the content on this page. ' +
    'Say "where am I" to hear what site you are on. ' +
    'Say "go back" or "go forward" for browser history. ' +
    'Say "scroll down" or "scroll up" to scroll the page. ' +
    'Say "stop" to stop me talking. ' +
    'Hold Space to give a command.',
    'high'
  );
}

// ── IPC listeners ─────────────────────────────────────────────────────────────
window.electronAPI.onSpeak((text: string) => {
  speakText(text, 'high');
});

window.electronAPI.onStopSpeaking(() => {
  tts.stop();
  appEl.classList.remove('tts-speaking');
  setStatus('Stopped');
});

window.electronAPI.onPageLoaded((model: any) => {
  if (!model) return;
  currentPageModel = model;
  commandParser.updateSections(
    (model.sections || []).map((s: any) => s.name)
  );

  // Build a natural announcement of the site and what the user can do
  const siteName = model.title || 'Untitled page';
  let announcement = `You are on ${siteName}.`;

  if (model.sections && model.sections.length > 0) {
    const names = model.sections.map((s: any) => s.name);
    if (names.length <= 4) {
      announcement += ` You can say: ${names.join(', ')}.`;
    } else {
      announcement += ` You can say: ${names.slice(0, 4).join(', ')}, and ${names.length - 4} more.`;
    }
    announcement += ' Say "help" for more commands.';
  } else {
    announcement += ' Hold Space and say what you want to do.';
  }

  speakText(announcement, 'high');
  urlBar.value = model.url || '';
});

window.electronAPI.onPageModelUpdated((model: any) => {
  if (!model) return;
  currentPageModel = model;
  commandParser.updateSections(
    (model.sections || []).map((s: any) => s.name)
  );
});

window.electronAPI.onElementFocused((info: any) => {
  if (!info) return;

  const parts: string[] = [];
  if (info.label) parts.push(info.label);
  if (info.role && info.role !== 'generic' && info.role !== 'element') {
    parts.push(info.role);
  }
  if (info.position) parts.push(info.position);

  if (info.isInput) {
    parts.push('editable field');
    if (!isDictationMode) {
      parts.push('Say "type" then your text to fill this field');
    }
  }

  if (parts.length > 0) {
    speakText(parts.join('. '), 'normal');
  }
});

window.electronAPI.onNavStateChanged((state: any) => {
  urlBar.value = state.url || '';
  btnBack.disabled    = !state.canGoBack;
  btnForward.disabled = !state.canGoForward;
  if (state.loading) setStatus('Loading...');
});

window.electronAPI.onFocusUrlBar(() => {
  urlBar.focus();
  urlBar.select();
});

// ── Button event listeners ────────────────────────────────────────────────────
btnVoice.addEventListener('click', () => startVoice());

btnBack.addEventListener('click', () => {
  speakText('Going back', 'high');
  window.electronAPI.navigateBack();
});

btnForward.addEventListener('click', () => {
  speakText('Going forward', 'high');
  window.electronAPI.navigateForward();
});

btnReload.addEventListener('click', () => {
  speakText('Reloading', 'high');
  window.electronAPI.reload();
});

btnMinimize.addEventListener('click', () => window.electronAPI.windowMinimize());
btnMaximize.addEventListener('click', () => window.electronAPI.windowMaximize());
btnClose.addEventListener('click',    () => window.electronAPI.windowClose());

// ── URL bar ───────────────────────────────────────────────────────────────────
urlBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const url = urlBar.value.trim();
    if (url) {
      window.electronAPI.navigateUrl(url);
      speakText(`Opening ${url}`, 'high');
      urlBar.blur();
    }
  }
  if (e.key === 'Escape') {
    urlBar.blur();
  }
});

// ── Global keyboard shortcuts ─────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  const urlFocused = urlBar === document.activeElement;

  // Space hold → activate voice (only when URL bar is not focused)
  if (e.code === 'Space' && !urlFocused && !e.repeat) {
    spaceHeldTimer = setTimeout(() => {
      spaceHeldTimer = null;
      startVoice();
    }, SPACE_HOLD_MS);
  }

  // Escape → stop TTS
  if (e.key === 'Escape') {
    tts.stop();
    appEl.classList.remove('tts-speaking');
    setStatus('Stopped');
    if (spaceHeldTimer) { clearTimeout(spaceHeldTimer); spaceHeldTimer = null; }
    isDictationMode = false;
  }

  // Tab → hand off to page focus manager (when URL bar not focused)
  if (e.key === 'Tab' && !urlFocused) {
    e.preventDefault();
    if (e.shiftKey) {
      window.electronAPI.focusPrev();
    } else {
      window.electronAPI.focusNext();
    }
  }

  // Ctrl+L → focus URL bar
  if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
    e.preventDefault();
    urlBar.focus();
    urlBar.select();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'Space' && spaceHeldTimer) {
    clearTimeout(spaceHeldTimer);
    spaceHeldTimer = null;
  }
});

// ── Voice activation ──────────────────────────────────────────────────────────
function startVoice() {
  if (!stt.isAvailable()) {
    speakText(
      'Voice recognition is not available in this environment. ' +
      'Please use the keyboard: Tab to navigate, Ctrl+L for the address bar.',
      'high'
    );
    return;
  }

  // Brief silence before listening so TTS does not feed back into microphone
  tts.stop();
  setTimeout(() => {
    stt.startListening().catch((_e) => {
      speakText('Could not start microphone. Check permissions.', 'high');
    });
  }, 250);
}

// ── Initial greeting ──────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  // Wait for TTS voices to load (async on Windows/Electron) before greeting
  tts.waitForVoices().then(() => {
    speakText(
      'BrailChrome ready. ' +
      'Hold Space and speak to control the browser. ' +
      'You can say a website name to open it, or say "help" for all commands.',
      'high'
    );
  });
});

export const DEFAULT_SETTINGS = {
  ttsRate: 1.2,
  ttsVolume: 1.0,
  ttsVoice: '',
  claudeApiKey: '',
  useClaudeForCommands: false,
  startPage: 'https://www.google.com',
};

export const SHORTCUT_KEYS = {
  WAKE: 'Space',
  STOP: 'Escape',
  TAB_NEXT: 'Tab',
  TAB_PREV: 'Shift+Tab',
  WHERE_AM_I: 'CmdOrCtrl+W',
  READ_PAGE: 'CmdOrCtrl+R',
  FOCUS_URL: 'CmdOrCtrl+L',
  HELP: 'CmdOrCtrl+H',
  BACK: 'Alt+Left',
  FORWARD: 'Alt+Right',
};

export const COMMANDS = {
  NAVIGATE_WORDS: ['go to', 'open', 'navigate to', 'show me', 'take me to', 'click on', 'go'],
  BACK_WORDS: ['go back', 'back', 'previous page', 'return'],
  FORWARD_WORDS: ['go forward', 'forward', 'next page'],
  READ_WORDS: ['read', 'read page', 'read everything', 'read all'],
  WHERE_WORDS: ['where am i', 'what is this', 'current', 'where', 'location'],
  SEARCH_WORDS: ['search for', 'search', 'find', 'look for'],
  HELP_WORDS: ['help', 'commands', 'what can i say'],
  TYPE_WORDS: ['type', 'write', 'enter', 'input'],
  STOP_WORDS: ['stop', 'quiet', 'silence', 'shut up'],
  SCROLL_DOWN_WORDS: ['scroll down', 'down', 'more', 'next'],
  SCROLL_UP_WORDS: ['scroll up', 'up', 'top'],
  RELOAD_WORDS: ['reload', 'refresh'],
};

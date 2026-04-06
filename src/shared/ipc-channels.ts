export const IPC = {
  // Main -> Renderer
  PAGE_LOADED: 'page-loaded',
  PAGE_MODEL_UPDATED: 'page-model-updated',
  ELEMENT_FOCUSED: 'element-focused',
  SPEAK: 'speak',
  STOP_SPEAKING: 'stop-speaking',
  NAV_STATE_CHANGED: 'nav-state-changed',

  // Renderer -> Main
  VOICE_COMMAND: 'voice-command',
  NAVIGATE_URL: 'navigate-url',
  NAVIGATE_BACK: 'navigate-back',
  NAVIGATE_FORWARD: 'navigate-forward',
  RELOAD: 'reload',
  FOCUS_NEXT: 'focus-next',
  FOCUS_PREV: 'focus-prev',
  FOCUS_SECTION: 'focus-section',
  CLICK_CURRENT: 'click-current',
  TYPE_TEXT: 'type-text',
  WHERE_AM_I: 'where-am-i',
  READ_PAGE: 'read-page',
  STOP_TTS: 'stop-tts',
  GET_PAGE_MODEL: 'get-page-model',
  SAVE_SETTINGS: 'save-settings',
  GET_SETTINGS: 'get-settings',

  // Injected -> Main (via console.log bridge)
  INJECTED_READY: 'injected-ready',
  ELEMENT_INFO: 'element-info',
  PAGE_ANALYZED: 'page-analyzed',
  FOCUS_CHANGED: 'focus-changed',
} as const;

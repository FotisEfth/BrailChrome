export interface PageSection {
  id: string;
  name: string;
  selector: string;
  element?: any;
  voiceNames: string[];
}

export interface FocusableElement {
  index: number;
  tag: string;
  role: string;
  label: string;
  selector: string;
  type?: string;
  isInput: boolean;
}

export interface PageModel {
  title: string;
  url: string;
  sections: PageSection[];
  focusableCount: number;
  currentFocusIndex: number;
}

export interface ParsedCommand {
  type:
    | 'navigate'
    | 'read'
    | 'click'
    | 'type'
    | 'scroll'
    | 'go_back'
    | 'go_forward'
    | 'go_to_url'
    | 'search'
    | 'where_am_i'
    | 'help'
    | 'stop'
    | 'tab_next'
    | 'tab_prev'
    | 'read_page'
    | 'reload'
    | 'unknown';
  target?: string;
  value?: string;
  confidence: number;
}

export interface SiteProfile {
  hostnames: string[];
  sections: ProfileSection[];
  searchSelector?: string;
  dynamicContent?: boolean;
}

export interface ProfileSection {
  voiceNames: string[];
  selector: string;
  description?: string;
}

export interface AppSettings {
  ttsRate: number;
  ttsVolume: number;
  ttsVoice: string;
  claudeApiKey: string;
  useClaudeForCommands: boolean;
  startPage: string;
}

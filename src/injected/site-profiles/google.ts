import { SiteProfile } from '../../shared/types';

export const googleProfile: SiteProfile = {
  hostnames: ['www.google.com', 'google.com', 'www.google.co.uk', 'google.co.uk'],
  sections: [
    { voiceNames: ['search', 'search bar', 'search box'], selector: 'input[name="q"], textarea[name="q"]', description: 'Search box' },
    { voiceNames: ['results', 'search results'], selector: '#search, #rso', description: 'Search results' },
    { voiceNames: ['images'], selector: 'a[href*="tbm=isch"], a[data-sc="I"]', description: 'Image results' },
    { voiceNames: ['videos'], selector: 'a[href*="tbm=vid"]', description: 'Video results' },
    { voiceNames: ['news'], selector: 'a[href*="tbm=nws"]', description: 'News results' },
    { voiceNames: ['maps'], selector: 'a[href*="maps.google"]', description: 'Maps' },
    { voiceNames: ['shopping'], selector: 'a[href*="tbm=shop"]', description: 'Shopping' },
    { voiceNames: ['next page', 'more results'], selector: '#pnnext, a[aria-label="Next page"]', description: 'Next page of results' },
    { voiceNames: ['gmail', 'mail'], selector: 'a[href*="mail.google"]', description: 'Gmail' },
  ],
  searchSelector: 'input[name="q"], textarea[name="q"]',
  dynamicContent: false,
};

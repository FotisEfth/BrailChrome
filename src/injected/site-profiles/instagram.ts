import { SiteProfile } from '../../shared/types';

export const instagramProfile: SiteProfile = {
  hostnames: ['www.instagram.com', 'instagram.com'],
  sections: [
    { voiceNames: ['home', 'feed'], selector: 'a[href="/"]', description: 'Home feed' },
    { voiceNames: ['search', 'explore'], selector: 'a[href="/explore/"], a[href*="search"]', description: 'Search and explore' },
    { voiceNames: ['reels'], selector: 'a[href="/reels/"]', description: 'Reels' },
    { voiceNames: ['messages', 'dms', 'inbox', 'direct'], selector: 'a[href*="/direct/"]', description: 'Direct messages' },
    { voiceNames: ['notifications', 'alerts'], selector: 'a[href*="notifications"], a[aria-label*="Notification"]', description: 'Notifications' },
    { voiceNames: ['create', 'new post', 'upload'], selector: 'a[href*="/create/"], svg[aria-label*="New post"]', description: 'Create new post' },
    { voiceNames: ['profile', 'my profile', 'account'], selector: 'a[href]:has(img[alt*="profile picture"]), a[href]:has(span img[data-testid])', description: 'Your profile' },
    { voiceNames: ['stories'], selector: '[role="menu"] a, div[role="button"]:has(canvas)', description: 'Stories' },
  ],
  searchSelector: 'input[aria-label*="Search"], input[placeholder*="Search"]',
  dynamicContent: true,
};

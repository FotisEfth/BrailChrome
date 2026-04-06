import { SiteProfile } from '../../shared/types';

export const facebookProfile: SiteProfile = {
  hostnames: ['www.facebook.com', 'facebook.com', 'web.facebook.com'],
  sections: [
    { voiceNames: ['home', 'feed', 'news feed'], selector: 'a[href="/"], a[aria-label="Home"]', description: 'News feed' },
    { voiceNames: ['friends', 'friend requests'], selector: 'a[href*="/friends"], a[aria-label*="Friend"]', description: 'Friends' },
    { voiceNames: ['watch', 'videos'], selector: 'a[href*="/watch"], a[aria-label="Watch"]', description: 'Watch videos' },
    { voiceNames: ['marketplace', 'shop'], selector: 'a[href*="/marketplace"]', description: 'Marketplace' },
    { voiceNames: ['groups'], selector: 'a[href*="/groups"]', description: 'Groups' },
    { voiceNames: ['gaming'], selector: 'a[href*="/gaming"]', description: 'Gaming' },
    { voiceNames: ['notifications', 'alerts'], selector: 'a[aria-label*="Notification"], div[aria-label*="Notification"]', description: 'Notifications' },
    { voiceNames: ['messages', 'messenger', 'chat'], selector: 'a[aria-label*="Messenger"], a[href*="/messages"]', description: 'Messenger' },
    { voiceNames: ['profile', 'my profile'], selector: 'a[aria-label*="your profile"], a[href*="/me"]', description: 'Your profile' },
    { voiceNames: ['search'], selector: 'input[aria-label="Search Facebook"], input[placeholder*="Search"]', description: 'Search' },
    { voiceNames: ['create', 'new post'], selector: 'div[aria-label*="Create a post"], div[role="button"]:has(span)', description: 'Create post' },
  ],
  searchSelector: 'input[aria-label="Search Facebook"], input[placeholder*="Search"]',
  dynamicContent: true,
};

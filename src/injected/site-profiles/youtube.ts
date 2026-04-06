import { SiteProfile } from '../../shared/types';

export const youtubeProfile: SiteProfile = {
  hostnames: ['www.youtube.com', 'youtube.com', 'm.youtube.com'],
  sections: [
    { voiceNames: ['home'], selector: 'a[href="/"], ytd-guide-entry-renderer a[href="/"]', description: 'Home' },
    { voiceNames: ['shorts'], selector: 'a[href*="/shorts"]', description: 'Shorts' },
    { voiceNames: ['subscriptions', 'subs'], selector: 'a[href*="/feed/subscriptions"]', description: 'Subscriptions' },
    { voiceNames: ['library', 'my videos'], selector: 'a[href*="/feed/library"]', description: 'Library' },
    { voiceNames: ['history', 'watch history'], selector: 'a[href*="/feed/history"]', description: 'History' },
    { voiceNames: ['trending'], selector: 'a[href*="/feed/trending"]', description: 'Trending' },
    { voiceNames: ['music'], selector: 'a[href*="/feed/music"], a[title="Music"]', description: 'Music' },
    { voiceNames: ['gaming'], selector: 'a[href*="/gaming"]', description: 'Gaming' },
    { voiceNames: ['search'], selector: 'input#search, button#search-icon-legacy', description: 'Search' },
    { voiceNames: ['notifications', 'alerts'], selector: 'button[aria-label*="Notification"]', description: 'Notifications' },
    { voiceNames: ['comments'], selector: '#comments, ytd-comments', description: 'Comments section' },
    { voiceNames: ['description', 'about'], selector: '#description, ytd-video-secondary-info-renderer', description: 'Video description' },
    { voiceNames: ['play', 'player', 'video'], selector: '#movie_player, video', description: 'Video player' },
  ],
  searchSelector: 'input#search',
  dynamicContent: true,
};

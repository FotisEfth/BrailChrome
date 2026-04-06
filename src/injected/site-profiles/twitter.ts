import { SiteProfile } from '../../shared/types';

export const twitterProfile: SiteProfile = {
  hostnames: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'],
  sections: [
    { voiceNames: ['home', 'feed', 'timeline'], selector: 'a[href="/home"], a[data-testid="AppTabBar_Home_Link"]', description: 'Home timeline' },
    { voiceNames: ['explore', 'trending', 'discover'], selector: 'a[href="/explore"], a[data-testid="AppTabBar_Explore_Link"]', description: 'Explore and trending' },
    { voiceNames: ['notifications', 'alerts'], selector: 'a[href="/notifications"], a[data-testid="AppTabBar_Notifications_Link"]', description: 'Notifications' },
    { voiceNames: ['messages', 'dms', 'inbox'], selector: 'a[href="/messages"], a[data-testid="AppTabBar_DirectMessage_Link"]', description: 'Direct messages' },
    { voiceNames: ['bookmarks', 'saved'], selector: 'a[href*="/bookmarks"]', description: 'Bookmarks' },
    { voiceNames: ['profile', 'my profile'], selector: 'a[data-testid="AppTabBar_Profile_Link"]', description: 'Your profile' },
    { voiceNames: ['search'], selector: 'input[data-testid="SearchBox_Search_Input"], input[aria-label*="Search"]', description: 'Search' },
    { voiceNames: ['compose', 'tweet', 'post', 'new post'], selector: 'a[data-testid="SideNav_NewTweet_Button"], a[href="/compose/tweet"]', description: 'Compose new post' },
    { voiceNames: ['lists'], selector: 'a[href*="/lists"]', description: 'Lists' },
  ],
  searchSelector: 'input[data-testid="SearchBox_Search_Input"], input[aria-label*="Search"]',
  dynamicContent: true,
};

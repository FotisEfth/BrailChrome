import { SiteProfile } from '../../shared/types';
import { instagramProfile } from './instagram';
import { youtubeProfile } from './youtube';
import { twitterProfile } from './twitter';
import { googleProfile } from './google';
import { facebookProfile } from './facebook';
import { genericProfile } from './generic';

const profiles: SiteProfile[] = [
  instagramProfile,
  youtubeProfile,
  twitterProfile,
  googleProfile,
  facebookProfile,
];

export function getProfileForUrl(url: string): SiteProfile {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    for (const profile of profiles) {
      if (profile.hostnames.some((h) => hostname === h || hostname.endsWith('.' + h))) {
        return profile;
      }
    }
  } catch {
    // invalid URL
  }
  return genericProfile;
}

export function getAllVoiceNames(profile: SiteProfile): string[] {
  const names: string[] = [];
  for (const section of profile.sections) {
    names.push(...section.voiceNames);
  }
  return names;
}

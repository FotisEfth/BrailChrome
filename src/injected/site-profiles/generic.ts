import { SiteProfile } from '../../shared/types';

// Fallback profile for any unrecognized site — uses ARIA landmarks and semantic HTML
export const genericProfile: SiteProfile = {
  hostnames: [],
  sections: [
    { voiceNames: ['navigation', 'nav', 'menu'], selector: 'nav, [role="navigation"]', description: 'Navigation' },
    { voiceNames: ['main', 'content', 'main content'], selector: 'main, [role="main"]', description: 'Main content' },
    { voiceNames: ['search', 'search bar'], selector: 'input[type="search"], input[name="q"], input[name="search"], input[aria-label*="search" i], [role="search"] input', description: 'Search' },
    { voiceNames: ['header', 'top', 'banner'], selector: 'header, [role="banner"]', description: 'Page header' },
    { voiceNames: ['footer', 'bottom'], selector: 'footer, [role="contentinfo"]', description: 'Page footer' },
    { voiceNames: ['sidebar', 'aside'], selector: 'aside, [role="complementary"]', description: 'Sidebar' },
    { voiceNames: ['form', 'login', 'sign in'], selector: 'form', description: 'Form' },
    { voiceNames: ['articles', 'posts'], selector: 'article', description: 'Articles' },
    { voiceNames: ['headings', 'sections'], selector: 'h1, h2, h3', description: 'Section headings' },
  ],
  searchSelector: 'input[type="search"], input[name="q"], input[name="search"], [role="search"] input',
  dynamicContent: false,
};

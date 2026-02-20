import type { Venue } from '../../types';

const SITE_NAME = 'Courts Finder';

/** Sport type label for meta/alt: join sport_types or default "Court". */
export function getSportTypeLabel(venue: Venue): string {
  const types = venue.sport_types;
  if (Array.isArray(types) && types.length > 0) {
    return types.map((t) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean).join(', ') || 'Court';
  }
  return 'Court';
}

/** SEO title: {Venue Name} | {Sport Type} Court in {MTR Station} | Courts Finder */
export function getVenueTitle(venue: Venue): string {
  const sport = getSportTypeLabel(venue);
  return `${venue.name} | ${sport} Court in ${venue.mtrStation} | ${SITE_NAME}`;
}

/** Meta description: Book {Venue Name} today. Featuring {Sport Type} facilities located just {Walking Distance} from {MTR Station}. Check pricing and amenities here. */
export function getVenueDescription(venue: Venue): string {
  const sport = getSportTypeLabel(venue);
  return `Book ${venue.name} today. Featuring ${sport} facilities located just ${venue.walkingDistance} min from ${venue.mtrStation}. Check pricing and amenities here.`;
}

/** Image alt: {Venue Name} {Sport Type} area */
export function getVenueImageAlt(venue: Venue): string {
  const sport = getSportTypeLabel(venue);
  return `${venue.name} ${sport} area`;
}

function setMeta(name: string, content: string, isProperty = false): void {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setOgTag(property: string, content: string): void {
  setMeta(property, content, true);
}

const DEFAULT_TITLE = `Courts Finder | Find Sports Courts in Hong Kong`;
const DEFAULT_DESCRIPTION = `Find and book sports courts near MTR stations. Compare prices, amenities, and walking distance.`;

/** Apply dynamic meta and OG tags for a venue (detail page). Call when venue is shown. */
export function applyVenueSeo(venue: Venue, baseUrl: string): void {
  const title = getVenueTitle(venue);
  const description = getVenueDescription(venue);
  const image = venue.org_icon || (venue.images && venue.images[0]) || '';

  document.title = title;
  setMeta('description', description);
  setOgTag('og:title', title);
  setOgTag('og:description', description);
  setOgTag('og:type', 'business.business');
  if (image) {
    const imageUrl = image.startsWith('http') ? image : new URL(image, baseUrl).href;
    setOgTag('og:image', imageUrl);
  }

  injectVenueJsonLd(venue, baseUrl);
}

/** Reset to default meta when leaving venue detail. */
export function resetSeoToDefault(): void {
  document.title = DEFAULT_TITLE;
  setMeta('description', DEFAULT_DESCRIPTION);
  setOgTag('og:title', DEFAULT_TITLE);
  setOgTag('og:description', DEFAULT_DESCRIPTION);
  setOgTag('og:type', 'website');
  removeJsonLd();
}

/** Category page SEO: /search/:sport */
export function applySearchPageSeo(sportSlug: string): void {
  const sport = sportSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const title = `${sport} Courts Hong Kong | ${SITE_NAME}`;
  const description = `Find ${sport.toLowerCase()} courts near MTR stations. Compare prices, amenities, and book today.`;
  document.title = title;
  setMeta('description', description);
  setOgTag('og:title', title);
  setOgTag('og:description', description);
  setOgTag('og:type', 'website');
  removeJsonLd();
}

/** Schema.org SportsActivityLocation JSON-LD */
function injectVenueJsonLd(venue: Venue, baseUrl: string): void {
  removeJsonLd();
  const sport = getSportTypeLabel(venue);
  const image = venue.org_icon || (venue.images && venue.images[0]);
  const imageUrl = image && image.startsWith('http') ? image : image ? new URL(image, baseUrl).href : undefined;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: venue.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.address,
    },
    image: imageUrl ? [imageUrl] : undefined,
    priceRange: venue.startingPrice ? `$${venue.startingPrice}` : undefined,
  };
  if (venue.coordinates?.lat != null && venue.coordinates?.lng != null) {
    (jsonLd as Record<string, unknown>).geo = {
      '@type': 'GeoCoordinates',
      latitude: venue.coordinates.lat,
      longitude: venue.coordinates.lng,
    };
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(jsonLd);
  script.setAttribute('data-seo-venue', '1');
  document.head.appendChild(script);
}

function removeJsonLd(): void {
  document.querySelectorAll('script[data-seo-venue="1"]').forEach((el) => el.remove());
}

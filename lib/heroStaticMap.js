/**
 * Landing hero Static Maps URL builder. Keep pin logic in sync with src/utils/heroStaticMap.ts.
 */
import { getDistrictBySlug, getVenueDistrictSlug } from './hkDistricts.js';

const HERO_PIN_COUNT = 12;
const REGION_ORDER = ['hk-island', 'kowloon', 'new-territories'];
const PINS_PER_REGION = HERO_PIN_COUNT / REGION_ORDER.length;

const MAP_CENTER = { lat: 22.3499, lng: 114.1194 };
const MAP_ZOOM = 11;
const MARKER_COLOR = '0x007a67';

function isValidLat(n) {
  return Number.isFinite(n) && n >= -90 && n <= 90;
}

function isValidLng(n) {
  return Number.isFinite(n) && n >= -180 && n <= 180;
}

export function normalizeVenueLatLng(coords) {
  if (!coords) return null;

  let lat;
  let lng;

  if (typeof coords === 'object' && coords !== null) {
    if (coords.type === 'Point' && Array.isArray(coords.coordinates) && coords.coordinates.length >= 2) {
      lng = Number(coords.coordinates[0]);
      lat = Number(coords.coordinates[1]);
    } else if ('lat' in coords || 'latitude' in coords) {
      lat = Number(coords.lat ?? coords.latitude);
      lng = Number(coords.lng ?? coords.longitude);
    }
  } else if (Array.isArray(coords) && coords.length >= 2) {
    const a = Number(coords[0]);
    const b = Number(coords[1]);
    if (isValidLat(a) && isValidLng(b)) {
      lat = a;
      lng = b;
    } else if (isValidLng(a) && isValidLat(b)) {
      lng = a;
      lat = b;
    }
  }

  if (lat === undefined || lng === undefined) return null;
  if (!isValidLat(lat) || !isValidLng(lng)) {
    if (isValidLat(lng) && isValidLng(lat)) return { lat: lng, lng: lat };
    return null;
  }
  return { lat, lng };
}

function locationKey(coords) {
  return `${Math.round(coords.lat * 1e5) / 1e5},${Math.round(coords.lng * 1e5) / 1e5}`;
}

function inferRegionFromCoords(coords) {
  if (coords.lat <= 22.295 && coords.lng >= 114.12 && coords.lng <= 114.29) return 'hk-island';
  if (coords.lat > 22.295 && coords.lat < 22.355 && coords.lng >= 114.1 && coords.lng <= 114.26) {
    return 'kowloon';
  }
  return 'new-territories';
}

function regionOf(venue, coords) {
  const slug = getVenueDistrictSlug(venue);
  const district = slug ? getDistrictBySlug(slug) : undefined;
  return district?.region ?? inferRegionFromCoords(coords);
}

function pinCandidates(venues) {
  const seen = new Set();
  const out = [];

  const sorted = [...venues].sort((a, b) => a.id - b.id);
  for (const venue of sorted) {
    const coords = normalizeVenueLatLng(venue.coordinates);
    if (!coords) continue;
    const key = locationKey(coords);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: venue.id,
      lat: coords.lat,
      lng: coords.lng,
      region: regionOf(venue, coords),
      partnership: Boolean(venue.membership_enabled),
    });
  }
  return out;
}

/** Partnership first, then fill HK Island / Kowloon / NT. Deterministic for a stable image URL. */
export function selectHeroMapPins(venues, limit = HERO_PIN_COUNT) {
  const pool = pinCandidates(venues);
  if (pool.length <= limit) return pool;

  const quota = {
    'hk-island': PINS_PER_REGION,
    kowloon: PINS_PER_REGION,
    'new-territories': PINS_PER_REGION,
  };
  const selected = [];
  const used = new Set();

  const take = (partnershipOnly, region) => {
    if (quota[region] <= 0) return false;
    const next = pool.find(
      (p) => !used.has(p.id) && p.region === region && p.partnership === partnershipOnly,
    );
    if (!next) return false;
    selected.push(next);
    used.add(next.id);
    quota[region] -= 1;
    return true;
  };

  for (const partnershipOnly of [true, false]) {
    let progressed = true;
    while (selected.length < limit && progressed) {
      progressed = false;
      for (const region of REGION_ORDER) {
        if (selected.length >= limit) break;
        if (take(partnershipOnly, region)) progressed = true;
      }
    }
  }

  for (const pin of pool) {
    if (selected.length >= limit) break;
    if (used.has(pin.id)) continue;
    selected.push(pin);
    used.add(pin.id);
  }

  return selected;
}

export function buildHeroStaticMapUrl(venues, apiKey) {
  const key = (apiKey || '').trim();
  if (!key) return null;

  const pins = selectHeroMapPins(venues);
  if (pins.length === 0) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/staticmap');
  url.searchParams.set('center', `${MAP_CENTER.lat},${MAP_CENTER.lng}`);
  url.searchParams.set('zoom', String(MAP_ZOOM));
  url.searchParams.set('size', '640x360');
  url.searchParams.set('scale', '2');
  url.searchParams.set('maptype', 'roadmap');
  url.searchParams.set('format', 'png');
  url.searchParams.set('key', key);

  const locations = pins.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|');
  url.searchParams.set('markers', `color:${MARKER_COLOR}|${locations}`);

  return url.toString();
}

export const HERO_MAP_IMAGE_PATH = '/api/hero-map';

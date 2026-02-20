// Database: Google Cloud SQL via backend API (see server/ and CLOUD_SQL_SETUP.md).
// Set VITE_API_URL in .env to your backend URL (e.g. http://localhost:3001).
import { Venue } from './types';

// Empty = same-origin (e.g. Vercel: frontend and /api/* on same domain). Set for local dev or external API.
const API_BASE = import.meta.env.VITE_API_URL ?? '';

if (import.meta.env.DEV && !API_BASE) {
  console.warn(
    'VITE_API_URL is not set. For local dev with the Node server, set VITE_API_URL=http://localhost:3001 in .env'
  );
}

// DB uses quoted camelCase ("mtrStation", "socialLink", "orgIcon"). App uses org_icon.
function rowToVenue(row: any): Venue {
  if (!row) return row;

  // Parse images from string back to array
  let images = row.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch (e) {
      images = [];
    }
  }

  // Parse coordinates from string
  let coords = row.coordinates;
  if (typeof coords === 'string') {
    try {
      coords = JSON.parse(coords);
    } catch (e) {
      coords = null;
    }
  }

  // Parse pricing from string (JSON object)
  let pricing = row.pricing;
  if (typeof pricing === 'string') {
    try {
      pricing = JSON.parse(pricing);
    } catch (e) {
      pricing = { type: 'text' as const, content: '' };
    }
  }
  if (!pricing || typeof pricing !== 'object') {
    pricing = { type: 'text' as const, content: '' };
  }

  // Parse amenities from string (JSON array)
  let amenities = row.amenities;
  if (typeof amenities === 'string') {
    try {
      amenities = JSON.parse(amenities);
    } catch (e) {
      amenities = [];
    }
  }

  let sport_types = row.sport_types;
  if (typeof sport_types === 'string') {
    try {
      sport_types = JSON.parse(sport_types);
    } catch {
      sport_types = undefined;
    }
  }
  if (!Array.isArray(sport_types)) sport_types = undefined;

  const { orgIcon, ...rest } = row;
  return {
    ...rest,
    images: Array.isArray(images) ? images : [],
    coordinates: coords,
    pricing: pricing,
    amenities: Array.isArray(amenities) ? amenities : [],
    org_icon: orgIcon ?? null,
    sport_types,
  } as Venue;
}

const VENUE_COLUMNS = new Set([
  'name', 'description', 'mtrStation', 'mtrExit', 'walkingDistance', 'address',
  'ceilingHeight', 'startingPrice', 'pricing', 'images', 'amenities', 'whatsapp',
  'socialLink', 'orgIcon', 'coordinates', 'sort_order',
]);

function venueToRow(venue: Record<string, any>): Record<string, any> {
  const { org_icon, ...rest } = venue;
  const result: Record<string, any> = {};
  Object.entries(rest).forEach(([key, value]) => {
    if (VENUE_COLUMNS.has(key) && value !== undefined) result[key] = value;
  });
  if (org_icon !== undefined && VENUE_COLUMNS.has('orgIcon')) {
    result.orgIcon = (org_icon === '' || org_icon === null) ? null : org_icon;
  }
  return result;
}

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const base = API_BASE.replace(/\/$/, '');
  const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  return fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
}

export const db = {
  async getVenues(): Promise<Venue[]> {
    // Empty API_BASE = same-origin (e.g. Vercel). No throw.
    const res = await apiFetch('/api/venues');
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map((row: any) => rowToVenue(row));
  },

  async upsertVenue(venue: Partial<Venue>): Promise<Venue> {
    // Empty API_BASE = same-origin (e.g. Vercel). No throw.
    const { sort_order: _so, id, ...rest } = venue as any;
    const needsOrgIconClear = (rest.org_icon === null || rest.org_icon === '');
    const dataToSave = venueToRow(rest);
    if (needsOrgIconClear) (dataToSave as Record<string, unknown>).orgIcon = null;

    const method = id ? 'PUT' : 'POST';
    const path = id ? `/api/venues/${id}` : '/api/venues';
    const res = await apiFetch(path, {
      method,
      body: JSON.stringify(dataToSave),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    const data = await res.json();
    return rowToVenue(data);
  },

  async deleteVenue(id: number): Promise<void> {
    // Empty API_BASE = same-origin (e.g. Vercel). No throw.
    const res = await apiFetch(`/api/venues/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
  },

  async updateVenueOrder(orderedIds: number[]): Promise<void> {
    // Empty API_BASE = same-origin (e.g. Vercel). No throw.
    const res = await apiFetch('/api/venues/order', {
      method: 'PATCH',
      body: JSON.stringify({ orderedIds }),
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
  },
};


export interface Pricing {
  type: 'text' | 'image';
  content: string;
  imageUrl?: string;
}

export interface Venue {
  id: number;
  name: string;
  description: string;
  mtrStation: string;
  mtrExit: string;
  walkingDistance: number;
  address: string;
  ceilingHeight: number;
  startingPrice: number;
  pricing: Pricing;
  images: string[];
  amenities: string[];
  whatsapp: string;
  socialLink?: string;
  org_icon?: string;
  sort_order?: number;
  /** For SEO: e.g. ["Pickleball", "Baseball"]. Joined for meta/slugs; used for /search/:sport. */
  sport_types?: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

export type Language = 'en' | 'zh';
export type AppTab = 'explore' | 'saved' | 'admin';

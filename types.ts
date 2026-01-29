
export interface Pricing {
  type: 'text' | 'image';
  content: string;
  imageUrl?: string;
}

export interface Venue {
  id: number;
  name: string;
  description: string; // New field
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
  sort_order?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export type Language = 'en' | 'zh';
export type AppTab = 'explore' | 'saved' | 'admin';

import type { Venue, Language, OperatingDayKey } from '../../types';
import type { GrindEventRow } from './grindEventFormat';
import { getVenueDistrictSlug, getDistrictDisplayName } from './hkDistricts';
import { getStationDisplayName } from './mtrStations';
import { slugify } from './slugify';

function clean(s: unknown): string {
  return typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '';
}

function sportLabel(venue: Venue, lang: Language): string {
  const data = venue.sport_data;
  if (Array.isArray(data) && data.length > 0) {
    const labels = data
      .map((d) => (lang === 'zh' && d.name_zh ? d.name_zh : (d.name || '').trim()))
      .filter(Boolean);
    return labels.join(', ') || 'Court';
  }
  const types = venue.sport_types;
  if (Array.isArray(types) && types.length > 0) {
    return types.map((t) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean).join(', ') || 'Court';
  }
  return 'Court';
}

function numOrNull(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Strip HTML to plain text for length checks / matching. */
export function stripHtml(html: string | undefined | null): string {
  if (!html?.trim()) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match Grind public events to this venue so the detail page does not
 * reuse the same site-wide events block on every location.
 */
export function eventMatchesVenue(ev: GrindEventRow, venue: Venue): boolean {
  const hay = [
    ev.location,
    ev.companyName,
    ev.company?.name,
    ev.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (!hay) return false;

  const name = clean(venue.name).toLowerCase();
  if (name.length >= 4 && hay.includes(name)) return true;

  // Brand prefix before district/paren (e.g. "Bay Pickle (Tin Hau)")
  const brand = name.replace(/\s*[(\[{].*$/, '').trim();
  if (brand.length >= 5 && hay.includes(brand)) return true;

  const addr = clean(venue.address).toLowerCase();
  if (addr.length >= 8) {
    const chunk = addr.slice(0, Math.min(24, addr.length));
    if (hay.includes(chunk)) return true;
  }

  const mtr = clean(venue.mtrStation).toLowerCase();
  if (mtr.length >= 3 && hay.includes(mtr) && brand.length >= 4 && hay.includes(brand.slice(0, 8))) {
    return true;
  }

  return false;
}

export type VenueSeoSection = {
  heading: string;
  paragraphs: string[];
};

export type VenueSeoNearbyVenue = {
  name: string;
  slug: string;
  district: string;
  mtr: string;
  walkMinutes: number | null;
  startingPrice: number | null;
};

export type VenueSeoFaqItem = {
  q: string;
  a: string;
};

export type VenueDistrictSummary = {
  heading: string;
  paragraphs: string[];
  districtSlug: string | null;
  venueCount: number;
  minPrice: number | null;
  maxPrice: number | null;
};

const OPERATING_DAY_KEYS: OperatingDayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const OPERATING_DAY_LABELS: Record<OperatingDayKey, { en: string; zh: string }> = {
  mon: { en: 'Mon', zh: '週一' },
  tue: { en: 'Tue', zh: '週二' },
  wed: { en: 'Wed', zh: '週三' },
  thu: { en: 'Thu', zh: '週四' },
  fri: { en: 'Fri', zh: '週五' },
  sat: { en: 'Sat', zh: '週六' },
  sun: { en: 'Sun', zh: '週日' },
};

function formatSlots(slots: [string, string][]): string {
  return slots.map((slot) => `${slot[0]}-${slot[1]}`).join(', ');
}

function summarizeOperatingHours(venue: Venue, lang: Language): string[] {
  if (!(venue.operating_hours_enabled ?? true) || !venue.operating_hours?.weekly) {
    return [lang === 'zh'
      ? '此頁未提供固定營業時間，建議預訂前先向場館確認。'
      : 'Fixed opening hours are not published on this page, so confirm directly with the venue before booking.'];
  }

  const lines = OPERATING_DAY_KEYS
    .map((day) => {
      const entry = venue.operating_hours?.weekly?.[day];
      if (!entry) return '';
      const label = lang === 'zh' ? OPERATING_DAY_LABELS[day].zh : OPERATING_DAY_LABELS[day].en;
      if (entry.closed) return `${label}: ${lang === 'zh' ? '休息' : 'Closed'}`;
      if (!entry.slots?.length) return `${label}: ${lang === 'zh' ? '未提供' : 'Not provided'}`;
      return `${label}: ${formatSlots(entry.slots)}`;
    })
    .filter(Boolean);

  const note = clean(venue.operating_hours?.note || '');
  if (note) lines.push(note);
  return lines.length ? lines : [lang === 'zh' ? '營業時間未提供。' : 'Opening hours not provided.'];
}

function getPrimarySportSlug(venue: Venue): string {
  const sportDataSlug = Array.isArray(venue.sport_data) ? clean(venue.sport_data[0]?.slug) : '';
  if (sportDataSlug) return sportDataSlug;
  const sportType = Array.isArray(venue.sport_types) ? clean(venue.sport_types[0]) : '';
  return sportType ? slugify(sportType) : '';
}

function getWebsiteUrl(venue: Venue): string {
  const raw = clean(venue.socialLink);
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const website = clean((parsed as Record<string, unknown>).website);
      if (website) return website;
      for (const key of ['instagram', 'facebook', 'x', 'threads', 'youtube']) {
        const url = clean((parsed as Record<string, unknown>)[key]);
        if (url) return url;
      }
    }
  } catch {
    // ignore JSON parse failure and fall through
  }
  return raw.startsWith('http') ? raw : '';
}

function buildBookingParagraphs(venue: Venue, lang: Language): string[] {
  const lines: string[] = [];
  const bookingUrl = clean(venue.booking_url);
  const whatsapp = clean(venue.whatsapp);
  const website = getWebsiteUrl(venue);

  if (lang === 'zh') {
    if (bookingUrl) lines.push(`可透過場館預訂連結直接查看可預訂時段：${bookingUrl}。`);
    if (whatsapp) lines.push('如需即時查詢或確認最新場租，可使用頁面上的 WhatsApp 按鈕聯絡場館。');
    if (!bookingUrl && website) lines.push(`如場館未提供獨立訂場連結，可先瀏覽其官方網站或社交頁面：${website}。`);
    if (!lines.length) lines.push('此頁未列出完整訂場流程，建議先查看聯絡方式，再向場館確認時段、收費與取消安排。');
    lines.push('預訂前請再次確認繁忙時段收費、最少租場時數及臨時改期安排。');
    return lines;
  }

  if (bookingUrl) lines.push(`Use the venue booking link to check booking availability directly: ${bookingUrl}.`);
  if (whatsapp) lines.push('For fast confirmation of rates or time slots, use the WhatsApp contact button on this page.');
  if (!bookingUrl && website) lines.push(`If no direct booking URL is listed, start with the venue website or social page: ${website}.`);
  if (!lines.length) lines.push('This page does not list a complete booking flow, so use the contact details above to confirm availability, pricing, and cancellation rules with the operator.');
  lines.push('Before you pay, confirm peak-hour pricing, minimum booking duration, and any rescheduling policy with the operator.');
  return lines;
}

export function buildVenueDistrictSummary(venue: Venue, allVenues: Venue[], lang: Language): VenueDistrictSummary | null {
  const districtSlug = getVenueDistrictSlug(venue);
  if (!districtSlug) return null;
  const districtName = getDistrictDisplayName(districtSlug, lang);
  const primarySport = getPrimarySportSlug(venue);
  const comparable = allVenues.filter((candidate) => {
    if (candidate.id === venue.id) return false;
    if (getVenueDistrictSlug(candidate) !== districtSlug) return false;
    if (!primarySport) return true;
    return getPrimarySportSlug(candidate) === primarySport;
  });
  const districtVenues = [venue, ...comparable];
  const prices = districtVenues
    .map((item) => numOrNull(item.startingPrice))
    .filter((value): value is number => value != null && value > 0)
    .sort((a, b) => a - b);
  const minPrice = prices.length ? prices[0] : null;
  const maxPrice = prices.length ? prices[prices.length - 1] : null;
  const sport = sportLabel(venue, lang);
  const heading = lang === 'zh'
    ? `${districtName}${sport}場地`
    : `${sport} courts in ${districtName}`;

  const rangeText = minPrice != null
    ? (maxPrice != null && maxPrice !== minPrice
      ? (lang === 'zh'
        ? `目前可見起始收費大約由每小時HK$${minPrice}至HK$${maxPrice}。`
        : `Visible starting prices currently range from about HK$${minPrice} to HK$${maxPrice} per hour.`)
      : (lang === 'zh'
        ? `目前可見起始收費約為每小時HK$${minPrice}。`
        : `Visible starting prices currently start at about HK$${minPrice} per hour.`))
    : (lang === 'zh'
      ? '此區場館未完整公開收費，預訂前請向營運方確認。'
      : 'Not every venue in this district publishes full pricing, so confirm rates directly before booking.');

  const paragraphs = lang === 'zh'
    ? [
        `${venue.name}位於${districtName}。Courts 目前收錄此區 ${districtVenues.length} 個相關場地，可用來比較位置、步行距離與基本收費。`,
        rangeText,
      ]
    : [
        `${venue.name} is one of ${districtVenues.length} comparable venues currently listed by Courts in ${districtName}. Use this district view to compare location, walking distance, and entry pricing.`,
        rangeText,
      ];

  return { heading, paragraphs, districtSlug, venueCount: districtVenues.length, minPrice, maxPrice };
}

export function buildVenueNearbyAlternatives(
  venue: Venue,
  allVenues: Venue[],
  lang: Language,
  limit = 4,
): VenueSeoNearbyVenue[] {
  const districtSlug = getVenueDistrictSlug(venue);
  const primarySport = getPrimarySportSlug(venue);
  const venueStation = clean(venue.mtrStation);

  return allVenues
    .filter((candidate) => candidate.id !== venue.id)
    .filter((candidate) => {
      const candidateDistrictSlug = getVenueDistrictSlug(candidate);
      const candidateSport = getPrimarySportSlug(candidate);
      return Boolean(
        (districtSlug && candidateDistrictSlug === districtSlug)
        || (primarySport && candidateSport === primarySport)
        || (venueStation && clean(candidate.mtrStation) === venueStation)
      );
    })
    .sort((a, b) => {
      const aWalk = numOrNull(a.walkingDistance) ?? 999;
      const bWalk = numOrNull(b.walkingDistance) ?? 999;
      if (aWalk !== bWalk) return aWalk - bWalk;
      const aPrice = numOrNull(a.startingPrice) ?? 99999;
      const bPrice = numOrNull(b.startingPrice) ?? 99999;
      if (aPrice !== bPrice) return aPrice - bPrice;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit)
    .map((candidate) => ({
      name: candidate.name,
      slug: slugify(candidate.name),
      district: getDistrictDisplayName(getVenueDistrictSlug(candidate) || '', lang) || '',
      mtr: clean(candidate.mtrStation) ? getStationDisplayName(clean(candidate.mtrStation), lang) : '',
      walkMinutes: numOrNull(candidate.walkingDistance),
      startingPrice: numOrNull(candidate.startingPrice),
    }));
}

export function buildVenueFaqItems(venue: Venue, allVenues: Venue[], lang: Language): VenueSeoFaqItem[] {
  const price = numOrNull(venue.startingPrice);
  const nearby = buildVenueNearbyAlternatives(venue, allVenues, lang, 3);
  const hours = summarizeOperatingHours(venue, lang).join('\n');
  const amenities = Array.isArray(venue.amenities)
    ? venue.amenities.map((item) => clean(item)).filter(Boolean).slice(0, 6)
    : [];
  const mtrRaw = clean(venue.mtrStation);
  const mtr = mtrRaw ? getStationDisplayName(mtrRaw, lang) : '';
  const exit = clean(venue.mtrExit);
  const walk = numOrNull(venue.walkingDistance);

  if (lang === 'zh') {
    return [
      {
        q: `${venue.name} 收費大約是多少？`,
        a: price != null && price > 0
          ? `${venue.name} 目前頁面顯示起步價約為每小時 HK$${price}。繁忙時段、球場類型及最新場租請以場館公布為準。`
          : `${venue.name} 未公開固定起步價，建議透過頁面的聯絡方式向場館確認最新場租。`,
      },
      {
        q: `如何前往 ${venue.name}？`,
        a: mtr
          ? `${venue.name} 鄰近港鐵 ${mtr}${exit ? `（${exit}出口）` : ''}${walk != null && walk > 0 ? `，步行約 ${walk} 分鐘。` : '。'}`
          : clean(venue.address)
            ? `${venue.name} 地址為 ${clean(venue.address)}，可使用頁面的 Google 地圖按鈕規劃路線。`
            : `建議使用頁面的地圖與聯絡資訊確認前往 ${venue.name} 的最佳路線。`,
      },
      { q: `${venue.name} 的營業時間是什麼？`, a: hours },
      { q: `如何預訂 ${venue.name}？`, a: buildBookingParagraphs(venue, lang)[0] },
      {
        q: `${venue.name} 附近還有其他可比較的場地嗎？`,
        a: nearby.length
          ? `可以。你亦可比較 ${nearby.map((item) => item.name).join('、')} 等附近場地，再查看其步行距離與起始收費。`
          : '可以。建議返回同區搜尋頁面，比較其他場地的步行距離、收費與場地規格。',
      },
      {
        q: `${venue.name} 提供哪些設施？`,
        a: amenities.length
          ? `${venue.name} 頁面列出的設施包括 ${amenities.join('、')}。實際供應情況仍需以場館現場安排為準。`
          : `${venue.name} 目前未列出完整設施清單，建議預訂前先向場館確認。`,
      },
    ];
  }

  return [
    {
      q: `How much does ${venue.name} cost?`,
      a: price != null && price > 0
        ? `${venue.name} currently shows a starting price of about HK$${price} per hour. Peak-time pricing, court type, and final rates should always be confirmed with the operator.`
        : `${venue.name} does not publish a fixed starting price on this page, so confirm the latest rates directly with the venue before booking.`,
    },
    {
      q: `How do I get to ${venue.name}?`,
      a: mtr
        ? `${venue.name} is near ${mtr} MTR${exit ? ` (Exit ${exit})` : ''}${walk != null && walk > 0 ? `, roughly a ${walk}-minute walk away.` : '.'}`
        : clean(venue.address)
          ? `${venue.name} is listed at ${clean(venue.address)}. Use the Google Maps button on this page for turn-by-turn directions.`
          : `Use the map and contact details on this page to confirm the best route to ${venue.name}.`,
    },
    { q: `What are the opening hours for ${venue.name}?`, a: hours },
    { q: `How do I book ${venue.name}?`, a: buildBookingParagraphs(venue, lang)[0] },
    {
      q: `Are there nearby alternatives to ${venue.name}?`,
      a: nearby.length
        ? `Yes. Comparable nearby options include ${nearby.map((item) => item.name).join(', ')}. You can open those venue pages to compare access, pricing, and amenities.`
        : 'Yes. Use the district links and related venue links on this page to compare other nearby options before booking.',
    },
    {
      q: `What amenities does ${venue.name} have?`,
      a: amenities.length
        ? `${venue.name} currently lists amenities such as ${amenities.join(', ')}. Availability may change, so confirm directly if a specific facility matters to your booking.`
        : `${venue.name} does not currently list a full amenities set on this page, so confirm directly if you need specific facilities before booking.`,
    },
  ];
}

/**
 * Location-unique, citable prose for venue pages (helps chain locations
 * that share membership copy). Built from structured venue fields only.
 */
export function buildVenueSeoSections(venue: Venue, lang: Language, allVenues: Venue[] = []): VenueSeoSection[] {
  const sport = sportLabel(venue, lang);
  const districtSlug = getVenueDistrictSlug(venue);
  const district = districtSlug ? getDistrictDisplayName(districtSlug, lang) : '';
  const mtrRaw = clean(venue.mtrStation);
  const mtr = mtrRaw
    ? (lang === 'zh' ? getStationDisplayName(mtrRaw, 'zh') : getStationDisplayName(mtrRaw, 'en'))
    : '';
  const exit = clean(venue.mtrExit);
  const walk = numOrNull(venue.walkingDistance);
  const courts = numOrNull(venue.court_count);
  const price = numOrNull(venue.startingPrice);
  const ceiling = numOrNull(venue.ceilingHeight);
  const addr = clean(venue.address);
  const amenities = Array.isArray(venue.amenities)
    ? venue.amenities.map((a) => clean(a)).filter(Boolean)
    : [];
  const customDesc = stripHtml(venue.description);

  const nearby = buildVenueNearbyAlternatives(venue, allVenues, lang, 4);
  const districtSummary = buildVenueDistrictSummary(venue, allVenues, lang);
  const sections: VenueSeoSection[] = [];

  sections.push({
    heading: lang === 'zh' ? `如何前往${venue.name}？` : `How do I get to ${venue.name}?`,
    paragraphs: [
      mtr
        ? (lang === 'zh'
          ? `多數訪客可經港鐵${mtr}${exit ? `（${exit}）` : ''}前往${venue.name}${walk != null && walk > 0 ? `，出站後步行約${walk}分鐘` : ''}。${addr ? `詳細地址：${addr}。` : ''}`
          : `Most visitors reach ${venue.name} via ${mtr} MTR${exit ? ` (Exit ${exit})` : ''}${walk != null && walk > 0 ? `, then about a ${walk}-minute walk` : ''}.${addr ? ` Address: ${addr}.` : ''}`)
        : (addr
          ? (lang === 'zh'
            ? `${venue.name}地址為${addr}。可使用此頁的 Google 地圖按鈕規劃路線。`
            : `${venue.name} is listed at ${addr}. Use the Google Maps button on this page for directions.`)
          : (lang === 'zh'
            ? '請先查看此頁提供的地址、地圖與聯絡資訊，再確認最佳路線。'
            : 'Check the address, map, and contact details on this page before you travel.')),
    ],
  });

  sections.push({
    heading: lang === 'zh' ? `${venue.name} 收費` : `How much does ${venue.name} cost per hour?`,
    paragraphs: [
      price != null && price > 0
        ? (lang === 'zh'
          ? `${venue.name} 目前顯示的起步價約為每小時 HK$${price}。`
          : `${venue.name} currently starts from about HK$${price} per hour.`)
        : (lang === 'zh'
          ? `${venue.name} 目前未公開固定起步價。`
          : `${venue.name} does not currently publish a fixed starting price on this page.`),
      customDesc.toLowerCase().includes('price') || customDesc.includes('收費')
        ? customDesc
        : (lang === 'zh'
          ? '繁忙時段、場地類型及最新場租請以場館公布為準。'
          : 'Peak pricing, court type, and final rates should be confirmed directly with the operator.'),
    ],
  });

  sections.push({
    heading: lang === 'zh' ? `${venue.name} 營業時間` : `${venue.name} opening hours`,
    paragraphs: summarizeOperatingHours(venue, lang),
  });

  sections.push({
    heading: lang === 'zh' ? `如何預訂 ${venue.name}？` : `How do I book ${venue.name}?`,
    paragraphs: buildBookingParagraphs(venue, lang),
  });

  if (districtSummary) {
    sections.push({
      heading: districtSummary.heading,
      paragraphs: districtSummary.paragraphs,
    });
  }

  const specParagraphs: string[] = [];
  if (courts != null && courts > 0) {
    specParagraphs.push(lang === 'zh'
      ? `此場館列出約 ${courts} 個球場。`
      : `This venue lists approximately ${courts} court${courts === 1 ? '' : 's'}.`);
  }
  if (ceiling != null && ceiling > 0) {
    specParagraphs.push(lang === 'zh'
      ? `已提供樓底高度約 ${ceiling} 米。`
      : `Published ceiling height is about ${ceiling}m.`);
  }
  if (!specParagraphs.length) {
    specParagraphs.push(lang === 'zh'
      ? '此頁未列出完整場地規格，建議預訂前直接向場館確認。'
      : 'This page does not yet list full court-spec details, so confirm dimensions and setup directly with the venue if needed.');
  }
  sections.push({
    heading: lang === 'zh' ? `${venue.name} 場地規格` : `What are the courts like at ${venue.name}?`,
    paragraphs: specParagraphs,
  });

  if (amenities.length) {
    sections.push({
      heading: lang === 'zh' ? `${venue.name} 設施` : `Facilities at ${venue.name}`,
      paragraphs: [lang === 'zh'
        ? `${venue.name} 目前列出的常用設施包括：${amenities.slice(0, 10).join('、')}。`
        : `${venue.name} currently lists amenities such as ${amenities.slice(0, 10).join(', ')}.`],
    });
  }

  if (nearby.length) {
    sections.push({
      heading: lang === 'zh' ? `${venue.name} 附近其他場地` : `Nearby alternatives to ${venue.name}`,
      paragraphs: [lang === 'zh'
        ? `如你想比較其他同區或相近站點的場地，可同時查看 ${nearby.map((item) => item.name).join('、')}。`
        : `If you want to compare nearby options, also review ${nearby.map((item) => item.name).join(', ')}.`],
    });
  }

  const overview: string[] = [];
  if (customDesc.length > 40) overview.push(customDesc);
  overview.push(
    lang === 'zh'
      ? `${venue.name}位於香港${district || '市區'}，提供${sport}場地服務。${price != null && price > 0 ? `已列出起步價約每小時HK$${price}。` : ''}`
      : `${venue.name} is a ${sport.toLowerCase()} venue${district ? ` in ${district}, Hong Kong.` : ' in Hong Kong.'}${price != null && price > 0 ? ` Starting price is about HK$${price} per hour.` : ''}`,
  );
  sections.push({
    heading: lang === 'zh' ? `${venue.name} 有什麼值得留意？` : `What should I know about ${venue.name}?`,
    paragraphs: overview,
  });

  return sections;
}

/** Flatten SEO sections into one meta/OG description (not shown in the page UI). */
export function flattenVenueSeoForMeta(
  venue: Venue,
  lang: Language,
  maxLen = 320,
  allVenues: Venue[] = [],
): string {
  const text = buildVenueSeoSections(venue, lang, allVenues)
    .flatMap((s) => s.paragraphs)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen - 1);
  const safer = cut.replace(/\s+\S*$/, '');
  return `${(safer || cut).trimEnd()}…`;
}

/** Stable YYYY-MM-DD that only changes when venue content changes (no DB updated_at). */
export function venueContentLastmod(venue: Record<string, unknown> | Venue): string {
  const rawUpdated = (venue as any).updated_at || (venue as any).updatedAt;
  if (rawUpdated) {
    const d = new Date(rawUpdated);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  const payload = JSON.stringify({
    name: (venue as any).name,
    description: (venue as any).description,
    address: (venue as any).address,
    mtrStation: (venue as any).mtrStation,
    pricing: (venue as any).pricing,
    images: (venue as any).images,
    startingPrice: (venue as any).startingPrice,
    court_count: (venue as any).court_count,
    amenities: (venue as any).amenities,
    operating_hours: (venue as any).operating_hours,
    membership_description: (venue as any).membership_description,
    coordinates: (venue as any).coordinates,
  });

  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash >>>= 0;

  const start = Date.UTC(2024, 0, 1);
  const span = Math.max(1, Date.now() - start);
  const t = start + (hash % span);
  return new Date(t).toISOString().slice(0, 10);
}

export function googleMapsDirectionsUrl(venue: Venue): string {
  const lat = numOrNull(venue.coordinates?.lat);
  const lng = numOrNull(venue.coordinates?.lng);
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  const addr = clean(venue.address);
  if (addr) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name)}`;
}

/** iframe embed URL (no Maps JS API key required). */
export function googleMapsEmbedUrl(venue: Venue): string | null {
  const lat = numOrNull(venue.coordinates?.lat);
  const lng = numOrNull(venue.coordinates?.lng);
  if (lat != null && lng != null) {
    return `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  }
  const addr = clean(venue.address);
  if (addr) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&z=16&output=embed`;
  }
  return null;
}

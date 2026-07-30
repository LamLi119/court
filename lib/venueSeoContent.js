/**
 * Citable venue/listing prose + static HTML for prerender (Node build scripts).
 * Logic mirrors src/utils/venueContent.ts — keep in sync when changing copy rules.
 */

import {
  getDistrictBySlug,
  getDistrictDisplayName,
  getRegionDisplayName,
  getVenueDistrictSlug,
} from './hkDistricts.js';
import { slugifyVenueName } from './venueOgMeta.js';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clean(s) {
  return typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '';
}

function numOrNull(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const OPERATING_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const OPERATING_DAY_LABELS = {
  mon: { en: 'Mon', zh: '週一' },
  tue: { en: 'Tue', zh: '週二' },
  wed: { en: 'Wed', zh: '週三' },
  thu: { en: 'Thu', zh: '週四' },
  fri: { en: 'Fri', zh: '週五' },
  sat: { en: 'Sat', zh: '週六' },
  sun: { en: 'Sun', zh: '週日' },
};

function formatSlots(slots) {
  return (slots || []).map((slot) => `${slot[0]}-${slot[1]}`).join(', ');
}

function summarizeOperatingHours(venue, lang = 'en') {
  if (venue?.operating_hours_enabled === false || !venue?.operating_hours?.weekly) {
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
  if (clean(venue?.operating_hours?.note)) lines.push(clean(venue.operating_hours.note));
  return lines.length ? lines : [lang === 'zh' ? '營業時間未提供。' : 'Opening hours not provided.'];
}

function getWebsiteUrl(venue) {
  const raw = clean(venue?.socialLink);
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (clean(parsed.website)) return clean(parsed.website);
    }
  } catch {
    // ignore
  }
  return raw.startsWith('http') ? raw : '';
}

function buildBookingParagraphs(venue, lang = 'en') {
  const lines = [];
  const bookingUrl = clean(venue?.booking_url);
  const whatsapp = clean(venue?.whatsapp);
  const website = getWebsiteUrl(venue);

  if (lang === 'zh') {
    if (bookingUrl) lines.push(`可透過場館預訂連結直接查看可預訂時段：${bookingUrl}。`);
    if (whatsapp) lines.push('如需即時查詢或確認最新場租，可使用頁面上的 WhatsApp 按鈕聯絡場館。');
    if (!bookingUrl && website) lines.push(`如場館未提供獨立訂場連結，可先瀏覽其官方網站：${website}。`);
    if (!lines.length) lines.push('此頁未列出完整訂場流程，建議先查看聯絡方式，再向場館確認時段、收費與取消安排。');
    lines.push('預訂前請再次確認繁忙時段收費、最少租場時數及臨時改期安排。');
    return lines;
  }

  if (bookingUrl) lines.push(`Use the venue booking link to check booking availability directly: ${bookingUrl}.`);
  if (whatsapp) lines.push('For fast confirmation of rates or time slots, use the WhatsApp contact button on this page.');
  if (!bookingUrl && website) lines.push(`If no direct booking URL is listed, start with the venue website: ${website}.`);
  if (!lines.length) lines.push('This page does not list a complete booking flow, so use the contact details above to confirm availability, pricing, and cancellation rules with the operator.');
  lines.push('Before you pay, confirm peak-hour pricing, minimum booking duration, and any rescheduling policy with the operator.');
  return lines;
}

function sportLabel(venue, lang = 'en') {
  const data = venue?.sport_data;
  if (Array.isArray(data) && data.length > 0) {
    const labels = data
      .map((d) => (lang === 'zh' && d.name_zh ? d.name_zh : (d.name || '').trim()))
      .filter(Boolean);
    return labels.join(', ') || 'Court';
  }
  const types = venue?.sport_types;
  if (Array.isArray(types) && types.length > 0) {
    return types.map((t) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean).join(', ') || 'Court';
  }
  return 'Court';
}

/** @returns {{ heading: string, paragraphs: string[] }[]} */
export function buildVenueSeoSections(venue, lang = 'en') {
  const sport = sportLabel(venue, lang);
  const districtSlug = getVenueDistrictSlug(venue);
  const district = districtSlug ? getDistrictDisplayName(districtSlug, lang) : '';
  const mtrRaw = clean(venue?.mtrStation);
  const mtr = mtrRaw || '';
  const exit = clean(venue?.mtrExit);
  const walk = numOrNull(venue?.walkingDistance);
  const courts = numOrNull(venue?.court_count);
  const price = numOrNull(venue?.startingPrice);
  const ceiling = numOrNull(venue?.ceilingHeight);
  const addr = clean(venue?.address);
  const amenities = Array.isArray(venue?.amenities)
    ? venue.amenities.map((a) => clean(a)).filter(Boolean)
    : [];
  const customDesc = clean(venue?.description?.replace?.(/<[^>]+>/g, ' ') || venue?.description);

  const overview = [];
  if (customDesc && customDesc.length > 40) overview.push(customDesc);
  if (lang === 'zh') {
    overview.push(`${venue.name}位於香港${district || '市區'}，提供${sport}場地服務。${price != null && price > 0 ? `已列出起步價約每小時HK$${price}。` : ''}`);
  } else {
    overview.push(`${venue.name} is a ${sport.toLowerCase()} venue${district ? ` in ${district}, Hong Kong.` : ' in Hong Kong.'}${price != null && price > 0 ? ` Starting price is about HK$${price} per hour.` : ''}`);
  }

  const specParagraphs = [];
  if (courts != null && courts > 0) specParagraphs.push(lang === 'zh' ? `此場館列出約 ${courts} 個球場。` : `This venue lists approximately ${courts} court${courts === 1 ? '' : 's'}.`);
  if (ceiling != null && ceiling > 0) specParagraphs.push(lang === 'zh' ? `已提供樓底高度約 ${ceiling} 米。` : `Published ceiling height is about ${ceiling}m.`);
  if (!specParagraphs.length) specParagraphs.push(lang === 'zh' ? '此頁未列出完整場地規格，建議預訂前直接向場館確認。' : 'This page does not yet list full court-spec details, so confirm dimensions and setup directly with the venue if needed.');

  return [
    {
      heading: lang === 'zh' ? `如何前往${venue.name}？` : `How do I get to ${venue.name}?`,
      paragraphs: [
        mtr
          ? (lang === 'zh'
            ? `多數訪客可經港鐵${mtr}${exit ? `（${exit}）` : ''}前往${venue.name}${walk != null && walk > 0 ? `，出站後步行約${walk}分鐘` : ''}。${addr ? `詳細地址：${addr}。` : ''}`
            : `Most visitors reach ${venue.name} via ${mtr} MTR${exit ? ` (Exit ${exit})` : ''}${walk != null && walk > 0 ? `, then about a ${walk}-minute walk` : ''}.${addr ? ` Address: ${addr}.` : ''}`)
          : (addr
            ? (lang === 'zh'
              ? `${venue.name}地址為${addr}。可使用 Google 地圖取得路線。`
              : `${venue.name} is listed at ${addr}. Use Get Directions on this page to open Google Maps.`)
            : (lang === 'zh' ? '請於場地詳情頁查看最新地址與開放時間。' : 'Check the address and hours on this page, then open Google Maps for turn-by-turn directions.')),
      ],
    },
    {
      heading: lang === 'zh' ? `${venue.name} 收費` : `How much does ${venue.name} cost per hour?`,
      paragraphs: [
        price != null && price > 0
          ? (lang === 'zh' ? `${venue.name} 目前顯示的起步價約為每小時 HK$${price}。` : `${venue.name} currently starts from about HK$${price} per hour.`)
          : (lang === 'zh' ? `${venue.name} 目前未公開固定起步價。` : `${venue.name} does not currently publish a fixed starting price on this page.`),
        lang === 'zh' ? '繁忙時段、場地類型及最新場租請以場館公布為準。' : 'Peak pricing, court type, and final rates should be confirmed directly with the operator.',
      ],
    },
    {
      heading: lang === 'zh' ? `${venue.name} 營業時間` : `${venue.name} opening hours`,
      paragraphs: summarizeOperatingHours(venue, lang),
    },
    {
      heading: lang === 'zh' ? `如何預訂 ${venue.name}？` : `How do I book ${venue.name}?`,
      paragraphs: buildBookingParagraphs(venue, lang),
    },
    {
      heading: lang === 'zh' ? `${district || '香港'}${sport}場地` : `${sport} courts in ${district || 'Hong Kong'}`,
      paragraphs: [lang === 'zh'
        ? `${venue.name} 可作為你比較同區場地的位置、步行距離與基本收費的起點。`
        : `${venue.name} can act as a starting point for comparing location, walking distance, and starting price against other venues in the same area.`],
    },
    {
      heading: lang === 'zh' ? `${venue.name} 場地規格` : `What are the courts like at ${venue.name}?`,
      paragraphs: specParagraphs,
    },
    {
      heading: lang === 'zh' ? `${venue.name} 設施` : `Facilities at ${venue.name}`,
      paragraphs: [amenities.length
        ? (lang === 'zh' ? `${venue.name} 目前列出的常用設施包括：${amenities.slice(0, 8).join('、')}。` : `${venue.name} currently lists amenities such as ${amenities.slice(0, 8).join(', ')}.`)
        : (lang === 'zh' ? '此頁未列出完整設施清單，建議預訂前先向場館確認。' : 'This page does not currently list a full amenities set, so confirm specific facilities before booking.')],
    },
    {
      heading: lang === 'zh' ? `${venue.name} 有什麼值得留意？` : `What should I know about ${venue.name}?`,
      paragraphs: overview,
    },
  ];
}

function sectionsToArticleHtml(sections, { h1, pageUrl } = {}) {
  const parts = ['<article data-seo-static="1" lang="en">'];
  if (h1) parts.push(`<h1>${escapeHtml(h1)}</h1>`);
  if (pageUrl) parts.push(`<p><a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></p>`);
  for (const sec of sections) {
    parts.push(`<h2>${escapeHtml(sec.heading)}</h2>`);
    for (const p of sec.paragraphs) {
      parts.push(`<p>${escapeHtml(p)}</p>`);
    }
  }
  parts.push('</article>');
  return parts.join('\n');
}

export function buildVenueStaticBodyHtml(venue, { pageUrl, lang = 'en' } = {}) {
  const sections = buildVenueSeoSections(venue, lang);
  const h1 = venue?.name ? `${venue.name} | ${sportLabel(venue, lang)}` : 'Venue';
  return sectionsToArticleHtml(sections, { h1, pageUrl });
}

export function buildListingStaticBodyHtml({
  title,
  intro,
  venues = [],
  baseUrl,
  limit = 80,
} = {}) {
  const base = (baseUrl || '').replace(/\/$/, '');
  const items = [];
  for (const v of venues.slice(0, limit)) {
    const slug = slugifyVenueName(v?.name);
    if (!slug) continue;
    const districtSlug = getVenueDistrictSlug(v);
    const district = districtSlug ? getDistrictDisplayName(districtSlug, 'en') : '';
    const region = districtSlug
      ? getRegionDisplayName(getDistrictBySlug(districtSlug)?.region || 'hk-island', 'en')
      : '';
    items.push(
      `<li><a href="${escapeHtml(`${base}/venues/${slug}`)}">${escapeHtml(v.name || slug)}</a>`
        + (district ? ` — ${escapeHtml(district)}${region ? `, ${escapeHtml(region)}` : ''}` : '')
        + '</li>',
    );
  }
  return [
    '<article data-seo-static="1" lang="en">',
    `<h1>${escapeHtml(title || 'Sports courts in Hong Kong')}</h1>`,
    `<p>${escapeHtml(intro || '')}</p>`,
    items.length ? `<nav aria-label="Venues"><ul>${items.join('')}</ul></nav>` : '',
    '</article>',
  ].join('\n');
}

export function buildHomeStaticBodyHtml({ intro, sportLinksHtml = '', districtLinksHtml = '' } = {}) {
  return [
    '<article data-seo-static="1" lang="en">',
    '<h1>Courts by The Ground — Hong Kong sports venue directory</h1>',
    `<p>${escapeHtml(intro || '')}</p>`,
    sportLinksHtml ? `<nav aria-label="Sports"><ul>${sportLinksHtml}</ul></nav>` : '',
    districtLinksHtml ? `<nav aria-label="Districts"><ul>${districtLinksHtml}</ul></nav>` : '',
    '<p>Part of <a href="https://theground.io">The Ground</a> (theground.io). For free public leisure facilities, see the LCSD facilities directory.</p>',
    '</article>',
  ].join('\n');
}

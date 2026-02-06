<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Venue, Language } from '../../types';
import { getStationDisplayName } from '../utils/mtrStations';
import ImageCarousel from './ImageCarousel.vue';

const ALLOWED_TAGS = new Set([
  'b', 'i', 'u', 's', 'strong', 'em', 'br', 'p', 'span', 'div',
  'blockquote', 'pre', 'code', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3'
]);
const VOID_TAGS = new Set(['br']);
const ALLOWED_ATTR = new Set(['href', 'target', 'rel']);

function decodeHtmlEntities(str: string): string {
  if (typeof document === 'undefined') return str;
  const el = document.createElement('textarea');
  el.innerHTML = str;
  return el.value;
}

function escapeAttr(val: string): string {
  return val.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) return Array.from(el.childNodes).map(sanitizeNode).join('');
  let out = '<' + tag;
  for (const attr of el.attributes) {
    if (ALLOWED_ATTR.has(attr.name.toLowerCase())) out += ' ' + attr.name + '="' + escapeAttr(attr.value) + '"';
  }
  out += '>';
  if (!VOID_TAGS.has(tag)) {
    for (const child of el.childNodes) out += sanitizeNode(child);
    out += '</' + tag + '>';
  }
  return out;
}

function sanitizeDescription(html: string | undefined): string {
  if (!html?.trim()) return '';
  const decoded = decodeHtmlEntities(html);
  if (typeof DOMParser === 'undefined') return decoded;
  const doc = new DOMParser().parseFromString('<div>' + decoded + '</div>', 'text/html');
  const div = doc.body.firstElementChild;
  return div ? Array.from(div.childNodes).map(sanitizeNode).join('') : '';
}

const props = defineProps<{
  venue: Venue;
  onBack: () => void;
  language: Language;
  t: (key: string) => string;
  darkMode: boolean;
  savedVenues: number[];
  toggleSave: (id: number) => void;
  isAdmin: boolean;
  onEdit: () => void;
}>();

const allDetailImages = computed(() => [...(props.venue.images || [])]);

const fullscreenImages = ref<string[]>([]);
const fullscreenIndex = ref(0);
const showFullscreen = computed(() => fullscreenImages.value.length > 0);
const currentFullscreenSrc = computed(
  () => fullscreenImages.value[fullscreenIndex.value] ?? null
);

const openFullscreen = (src: string) => {
  const list = allDetailImages.value;
  const idx = list.indexOf(src);
  if (idx >= 0) {
    fullscreenImages.value = list;
    fullscreenIndex.value = idx;
  } else {
    fullscreenImages.value = [src];
    fullscreenIndex.value = 0;
  }
};

const closeFullscreen = () => {
  fullscreenImages.value = [];
};

const fullscreenPrev = () => {
  const n = fullscreenImages.value.length;
  if (n <= 1) return;
  fullscreenIndex.value = fullscreenIndex.value === 0 ? n - 1 : fullscreenIndex.value - 1;
};

const fullscreenNext = () => {
  const n = fullscreenImages.value.length;
  if (n <= 1) return;
  fullscreenIndex.value = fullscreenIndex.value === n - 1 ? 0 : fullscreenIndex.value + 1;
};

const isSaved = () => props.savedVenues.includes(props.venue.id);

const handleWhatsApp = () => {
  const message = encodeURIComponent(
    `你好，我係經TheGround.io嘅介紹嚟book場！Hi! Here to book a court, found you via TheGround.io`
  );
  window.open(
    `https://wa.me/${props.venue.whatsapp.replace(/[^0-9]/g, '')}?text=${message}`,
    '_blank'
  );
};

const openGoogleMaps = () => {
  const encodedAddress = encodeURIComponent(props.venue.address);
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
};

function parseSocialLinks(s: string | undefined): { name: string; url: string }[] {
  if (!s?.trim()) return [];
  try {
    const p = JSON.parse(s);
    if (p && typeof p === 'object') {
      const entries = [
        { key: 'instagram', url: p.instagram, label: 'Instagram' },
        { key: 'facebook', url: p.facebook, label: 'Facebook' },
        { key: 'x', url: p.x, label: 'X' },
        { key: 'threads', url: p.threads, label: 'Threads' },
        { key: 'youtube', url: p.youtube, label: 'YouTube' },
        { key: 'website', url: p.website, label: 'Website' }
      ];
      return entries.filter((e) => e.url && typeof e.url === 'string').map((e) => ({ name: e.label, url: e.url }));
    }
  } catch (_) {}
  return s.startsWith('http') ? [{ name: 'View on social', url: s }] : [];
}

const socialLinksList = () => parseSocialLinks(props.venue.socialLink);

const openSocialLink = (url: string) => {
  if (url) window.open(url, '_blank');
};
</script>

<template>
  <div
    class="min-h-screen pb-24 md:pb-20 animate-in fade-in duration-300"
    :class="darkMode ? 'bg-gray-900' : 'bg-white'"
  >
    <!-- Fullscreen image lightbox with carousel -->
    <Teleport to="body">
      <div
        v-if="showFullscreen"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="View full image"
        @click.self="closeFullscreen"
      >
        <button
          type="button"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-2xl leading-none"
          aria-label="Close"
          @click="closeFullscreen"
        >
          ×
        </button>
        <template v-if="fullscreenImages.length > 1">
          <button
            type="button"
            class="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg text-gray-800 text-xl"
            aria-label="Previous"
            @click.stop="fullscreenPrev"
          >
            ←
          </button>
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg text-gray-800 text-xl"
            aria-label="Next"
            @click.stop="fullscreenNext"
          >
            →
          </button>
          <div
            class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-1.5 bg-black/40 rounded-full text-white text-sm font-bold"
          >
            {{ fullscreenIndex + 1 }} / {{ fullscreenImages.length }}
          </div>
        </template>
        <img
          v-if="currentFullscreenSrc"
          :src="currentFullscreenSrc"
          class="max-w-full max-h-full object-contain"
          alt="Full size"
          @click.stop
        />
      </div>
    </Teleport>
    <div
      class="sticky top-0 z-[70] px-4 py-3 flex items-center justify-between border-b backdrop-blur-md"
      :class="darkMode ? 'bg-gray-900/90 border-gray-800 text-white' : 'bg-white/90 border-gray-100 text-gray-900'"
    >
      <button
        class="p-2 rounded-full"
        @click="onBack"
      >
        ←
      </button>
      <h1 class="text-lg font-[900] truncate max-w-[200px] md:max-w-md flex items-center gap-2">
        <img
          v-if="venue.org_icon"
          :src="venue.org_icon"
          class="w-8 h-8 rounded-lg flex-shrink-0 object-cover"
          alt=""
        />
        <span class="truncate">{{ venue.name }}</span>
      </h1>
      <div class="flex gap-2">
        <button
          v-if="isAdmin"
          class="p-2 bg-blue-500 text-white rounded-full"
          @click="onEdit"
        >
          ✏️
        </button>
        <button
          class="p-2 rounded-full"
          :class="isSaved() ? 'bg-red-500 text-white' : (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-500')"
          @click="toggleSave(venue.id)"
        >
          {{ isSaved() ? '❤️' : '🤍' }}
        </button>
      </div>
    </div>

    <div class="container mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
          <ImageCarousel :images="venue.images" :on-image-click="openFullscreen" />
          <div class="space-y-6">
            <h2
              class="text-[24px] md:text-[32px] font-[900] tracking-tight flex items-center gap-3"
              :class="darkMode ? 'text-white' : 'text-gray-900'"
            >
              <img
                v-if="venue.org_icon"
                :src="venue.org_icon"
                class="w-12 h-12 md:w-14 md:h-14 rounded-xl flex-shrink-0 object-cover"
                alt=""
              />
              <span>{{ venue.name }}</span>
            </h2>
            <template v-if="socialLinksList().length > 0">
            </template>
            <div
              class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] font-[400]"
              :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
            >
              <span>🚇 {{ getStationDisplayName(venue.mtrStation, language) }} ({{ venue.mtrExit }})</span>
              <span>
                {{ venue.walkingDistance }} {{ t('min') }} {{ t('walk') }}
              </span>
              <span>
                {{ venue.ceilingHeight }}m {{ t('ceilingHeight') }}
              </span>
            </div>
            <div
              v-if="venue.description"
              class="text-[14px] font-[400] leading-relaxed description-html"
              :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
              v-html="sanitizeDescription(venue.description)"
            ></div>
            <div class="space-y-2">
              <h3 class="text-[11px] uppercase tracking-widest font-bold opacity-60">{{ t('pricing') }}</h3>
              <div
                v-if="venue.pricing.type === 'text' && venue.pricing.content"
                class="p-4 rounded-[12px] border text-[14px] description-html"
                :class="darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'"
                v-html="sanitizeDescription(venue.pricing.content)"
              ></div>
              <button
                v-else-if="venue.pricing.imageUrl"
                type="button"
                class="w-full rounded-[12px] overflow-hidden border dark:border-gray-600 cursor-pointer block text-left"
                @click="openFullscreen(venue.pricing.imageUrl!)"
              >
                <img :src="venue.pricing.imageUrl" class="w-full" alt="Pricing" />
              </button>
            </div>
            <!-- Desktop: social links at left bottom with full URL -->
            <template v-if="socialLinksList().length > 0">
              <div class="hidden lg:block space-y-3 pt-6 border-t" :class="darkMode ? 'border-gray-700' : 'border-gray-200'">
                <h3 class="text-[12px] uppercase tracking-widest font-bold opacity-50">
                  {{ language === 'en' ? 'Social links' : '社群連結' }}
                </h3>
                <div class="space-y-2">
                  <a
                    v-for="link in socialLinksList()"
                    :key="link.url"
                    :href="link.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block p-3 rounded-[8px] border text-left break-all text-[13px] hover:opacity-80 transition-opacity"
                    :class="darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700/50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'"
                  >
                    <span class="font-bold block mb-1">{{ link.name }}</span>
                    <span class="opacity-80 text-[12px]">{{ link.url }}</span>
                  </a>
                </div>
              </div>
            </template>
            <!-- Mobile: social links, Book now (no fixed bar) -->
            <div class="lg:hidden space-y-6 pt-4">
              <template v-if="socialLinksList().length > 0">
                <div class="space-y-2">
                  <h3 class="text-[11px] uppercase tracking-widest font-bold opacity-60">
                    {{ language === 'en' ? 'Social links' : '社群連結' }}
                  </h3>
                  <div class="space-y-2">
                    <a
                      v-for="link in socialLinksList()"
                      :key="link.url"
                      :href="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="block p-3 rounded-[8px] border text-left break-all text-[13px] hover:opacity-80 transition-opacity"
                      :class="darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700/50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'"
                    >
                      <span class="font-bold block mb-1">{{ link.name }}</span>
                      <span class="opacity-80 text-[12px]">{{ link.url }}</span>
                    </a>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div class="hidden lg:block lg:col-span-1">
          <div
            class="sticky top-24 space-y-6 p-8 rounded-[16px] shadow-2xl border"
            :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
          >
          
            <div class="space-y-4">
              <h3 class="text-[12px] uppercase tracking-widest font-bold opacity-50">
                Location
              </h3>
              <div
              class="p-6 rounded-[16px] border"
                :class="darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'"
              >
                <p class="text-[14px] leading-relaxed" :class="darkMode ? 'text-gray-300' : 'text-gray-700'">
                  {{ venue.address }}
                </p>
                <button
                  class="w-full px-4 py-3 rounded-[8px] bg-[#007a67] text-white font-bold"
                  @click="openGoogleMaps"
                >
                  📍 Open in Google Maps
                </button>
              </div> 
            </div>
            <span class="text-[12px] uppercase tracking-widest font-bold opacity-50 block mb-1">
              Starting from
            </span>
            <div class="flex items-baseline gap-1 mb-6">
              <span class="text-[32px] font-[900] text-[#007a67]">
                ${{ venue.startingPrice }}
              </span>
              <span class="text-[14px] opacity-60">
                /hr
              </span>
            </div>
            <button
              class="w-full py-5 rounded-[8px] text-white font-[900] text-xl bg-[#007a67]"
              @click="handleWhatsApp"
            >
              💬 {{ t('bookNow') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile: fixed bar – Book now only -->
    <div
      class="fixed bottom-16 left-0 right-0 z-50 p-4 border-t lg:hidden"
      :class="darkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'"
    >
      <div class="flex items-center justify-between gap-4 max-w-lg mx-auto">
        <div class="flex items-baseline gap-1 min-w-0">
          <span class="text-[12px] uppercase tracking-widest font-bold opacity-50 whitespace-nowrap">From</span>
          <span class="text-[22px] font-[900] text-[#007a67]">${{ venue.startingPrice }}</span>
          <span class="text-[14px] opacity-60">/hr</span>
        </div>
        <button
          class="flex-shrink-0 w-full max-w-[200px] py-4 rounded-[12px] text-white font-[900] text-lg bg-[#007a67]"
          @click="handleWhatsApp"
        >
          💬 {{ t('bookNow') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.description-html :deep(h1) { font-size: 1.5rem; font-weight: 800; margin: 0.75em 0 0.25em; }
.description-html :deep(h2) { font-size: 1.25rem; font-weight: 700; margin: 0.5em 0 0.25em; }
.description-html :deep(h3) { font-size: 1.1rem; font-weight: 600; margin: 0.5em 0 0.25em; }
.description-html :deep(blockquote) { border-left: 4px solid currentColor; padding-left: 1rem; margin: 0.5em 0; opacity: 0.9; }
.description-html :deep(pre),
.description-html :deep(code) { font-family: ui-monospace, monospace; font-size: 0.9em; background: rgba(0,0,0,0.06); padding: 0.15em 0.4em; border-radius: 4px; }
.description-html :deep(pre) { display: block; padding: 0.75rem; overflow-x: auto; }
.description-html :deep(div) { display: block; margin: 0.35em 0; }
.description-html :deep(ul) { list-style: disc; padding-left: 1.5rem; margin: 0.5em 0; }
.description-html :deep(ol) { list-style: decimal; padding-left: 1.5rem; margin: 0.5em 0; }
.description-html :deep(li) { margin: 0.25em 0; }
.description-html :deep(a) { color: #007a67; text-decoration: underline; }
.description-html :deep(a:hover) { opacity: 0.85; }
</style>

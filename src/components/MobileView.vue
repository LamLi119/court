<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Venue, Language } from '../../types';
import MapView from './MapView.vue';
import MobileVenueCard from './MobileVenueCard.vue';
import VenueDetail from './VenueDetail.vue';
import CourtCard from './CourtCard.vue';

const props = defineProps<{
  mode: 'map' | 'list';
  setMode: (m: 'map' | 'list') => void;
  venues: Venue[];
  selectedVenue: Venue | null;
  onSelectVenue: (v: Venue | null) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  mtrFilter: string;
  setMtrFilter: (s: string) => void;
  distanceFilter: string;
  setDistanceFilter: (s: string) => void;
  language: Language;
  t: (key: string) => string;
  darkMode: boolean;
  savedVenues: number[];
  toggleSave: (id: number) => void;
  isAdmin: boolean;
  onEditVenue: (id: number, v: any) => void;
  availableStations: string[];
}>();

const showDetailPage = ref(false);

const currentIndex = computed(() => {
  if (!props.selectedVenue) return -1;
  return props.venues.findIndex(v => v.id === props.selectedVenue!.id);
});

const showStickyCard = computed(() => props.mode === 'map' && !!props.selectedVenue);

const selectInitialVenue = () => {
  if (!props.selectedVenue && props.venues.length > 0) {
    props.onSelectVenue(props.venues[0]);
  }
};

watch(
  () => props.mode,
  (val) => {
    if (val === 'map') {
      selectInitialVenue();
    } else if (val === 'list') {
      showDetailPage.value = false;
      props.onSelectVenue(null);
    }
  },
  { immediate: true }
);

const goPrevVenue = () => {
  if (props.venues.length === 0) return;
  const idx = currentIndex.value;
  const prevIndex = idx > 0 ? idx - 1 : props.venues.length - 1;
  const target = props.venues[prevIndex];
  if (target) props.onSelectVenue(target);
};

const goNextVenue = () => {
  if (props.venues.length === 0) return;
  const idx = currentIndex.value;
  const nextIndex = idx >= 0 && idx < props.venues.length - 1 ? idx + 1 : 0;
  const target = props.venues[nextIndex];
  if (target) props.onSelectVenue(target);
};
</script>

<template>
  <VenueDetail
    v-if="showDetailPage && selectedVenue"
    :venue="selectedVenue"
    :onBack="() => (showDetailPage = false)"
    :language="language"
    :t="t"
    :darkMode="darkMode"
    :savedVenues="savedVenues"
    :toggleSave="toggleSave"
    :isAdmin="isAdmin"
    :onEdit="() => onEditVenue(selectedVenue!.id, selectedVenue!)"
  />

  <div
    v-else-if="mode === 'map'"
    class="relative h-[calc(100vh-64px)] overflow-hidden"
  >
    <div
      class="absolute top-4 left-4 right-4 z-20 space-y-2 pointer-events-none transition-all duration-300"
    >
      <div class="pointer-events-auto flex items-center gap-2">
        <div class="flex-1">
          <input
            type="text"
            :value="searchQuery"
            :placeholder="t('search')"
            class="w-full px-6 py-4 border rounded-[16px] shadow-2xl focus:ring-2 focus:ring-[#007a67] focus:outline-none transition-all"
            :class="darkMode ? 'bg-gray-800/90 border-gray-700 text-white backdrop-blur' : 'bg-white/90 border-gray-100 text-gray-900 backdrop-blur'"
            @input="e => setSearchQuery((e.target as HTMLInputElement).value)"
          />
        </div>
        <div
          class="pointer-events-auto flex rounded-[999px] p-0.5 border text-[10px] font-[700]"
          :class="darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white/90 border-gray-200 text-gray-700'"
        >
          <button
            class="px-2 py-1 rounded-[999px]"
            :class="props.mode === 'map' ? 'bg-[#007a67] text-white shadow-sm' : 'opacity-60'"
            @click="props.setMode('map')"
          >
            Map
          </button>
          <button
            class="px-2 py-1 rounded-[999px]"
            :class="props.mode === 'list' ? 'bg-[#007a67] text-white shadow-sm' : 'opacity-60'"
            @click="props.setMode('list')"
          >
            List
          </button>
        </div>
      </div>
      <div class="flex gap-2 pb-2 pointer-events-auto overflow-hidden">
        <div class="flex-1 relative">
          <input
            list="station-list-mobile"
            :value="mtrFilter"
            :placeholder="t('mtrStation')"
            class="w-full px-4 py-2 border rounded-[8px] text-[12px] font-[700] shadow-md focus:ring-2 focus:ring-[#007a67] focus:outline-none transition-all"
            :class="darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-100'"
            @input="e => setMtrFilter((e.target as HTMLInputElement).value)"
          />
          <datalist id="station-list-mobile">
            <option
              v-for="station in availableStations"
              :key="station"
              :value="station"
            />
          </datalist>
        </div>
        <select
          :value="distanceFilter"
          class="flex-[0.7] px-4 py-2 border rounded-[8px] text-[12px] font-[700] shadow-md appearance-none transition-all whitespace-nowrap"
          :class="darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-100'"
          @change="e => setDistanceFilter((e.target as HTMLSelectElement).value)"
        >
          <option value="">{{ t('allDistances') }}</option>
          <option value="5">{{ t('lessThan5') }}</option>
          <option value="10">{{ t('lessThan10') }}</option>
        </select>
      </div>
    </div>

    <MapView
      :venues="venues"
      :selectedVenue="selectedVenue"
      :onSelectVenue="(v: Venue) => onSelectVenue(v)"
      :language="language"
      :darkMode="darkMode"
    />

    <div
      v-if="showStickyCard && selectedVenue"
      class="fixed inset-x-0 bottom-20 z-40 pb-safe px-3"
    >
      <div
        class="rounded-[16px] shadow-[0_-10px_30px_rgba(0,0,0,0.25)] border mb-3"
        :class="darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'"
      >
      <div class="flex items-center justify-between px-4 pt-3 pb-1 text-[12px] font-[700] uppercase tracking-widest opacity-60">
        <span>
          {{ language === 'en' ? 'Court' : '球場' }}
          <span v-if="currentIndex >= 0"> {{ currentIndex + 1 }}/{{ venues.length }}</span>
        </span>
        <div class="flex items-center gap-2">
          <button
            class="w-8 h-8 rounded-full flex items-center justify-center text-[16px]"
            :class="darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-500'"
            @click.stop="onSelectVenue(null)"
          >
            ×
          </button>
        </div>
      </div>

        <div class="max-h-[260px] overflow-hidden">
          <MobileVenueCard
            :venue="selectedVenue"
            :language="language"
            :t="t"
            :darkMode="darkMode"
            :isSaved="savedVenues.includes(selectedVenue.id)"
            :onToggleSave="() => toggleSave(selectedVenue!.id)"
            :onViewDetails="() => (showDetailPage = true)"
          />
        </div>
        <div class="flex items-center justify-between px-4 pt-3 pb-1 text-[12px] font-[700] uppercase tracking-widest opacity-60">
          <span></span>
          <div class="flex items-center gap-2">
            <button
              class="w-8 h-8 rounded-full flex items-center justify-center text-[16px]"
              :class="darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'"
              @click.stop="goPrevVenue"
            >
              ‹
            </button>
            <button
              class="w-8 h-8 rounded-full flex items-center justify-center text-[16px]"
              :class="darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'"
              @click.stop="goNextVenue"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    v-else
    class="h-[calc(100vh-64px)] flex flex-col"
  >
    <div
      class="px-4 pt-4 pb-3 space-y-3 border-b"
      :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
    >
      <div class="flex items-center gap-2">
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">🔍</span>
          <input
            type="text"
            :value="searchQuery"
            :placeholder="t('search')"
            class="w-full pl-9 pr-4 py-3 border rounded-[12px] focus:ring-2 focus:ring-[#007a67] focus:outline-none transition-all"
            :class="darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
            @input="e => setSearchQuery((e.target as HTMLInputElement).value)"
          />
        </div>
        <div
          class="pointer-events-auto flex rounded-[999px] p-0.5 border text-[10px] font-[700]"
          :class="darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white/90 border-gray-200 text-gray-700'"
        >
          <button
            class="px-2 py-1 rounded-[999px]"
            :class="props.mode === 'map' ? 'bg-[#007a67] text-white shadow-sm' : 'opacity-60'"
            @click="props.setMode('map')"
          >
            Map
          </button>
          <button
            class="px-2 py-1 rounded-[999px]"
            :class="props.mode === 'list' ? 'bg-[#007a67] text-white shadow-sm' : 'opacity-60'"
            @click="props.setMode('list')"
          >
            List
          </button>
        </div>
      </div>
      <div class="flex gap-2">
        <div class="flex-1 relative">
          <input
            list="station-list-mobile-list"
            :value="mtrFilter"
            :placeholder="t('mtrStation')"
            class="w-full px-3 py-2 border rounded-[8px] text-sm font-bold focus:ring-2 focus:ring-[#007a67] focus:outline-none transition-all"
            :class="darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
            @input="e => setMtrFilter((e.target as HTMLInputElement).value)"
          />
          <datalist id="station-list-mobile-list">
            <option
              v-for="station in availableStations"
              :key="station"
              :value="station"
            />
          </datalist>
        </div>
        <select
          :value="distanceFilter"
          class="flex-[0.8] px-3 py-2 border rounded-[8px] text-sm font-bold appearance-none transition-all"
          :class="darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
          @change="e => setDistanceFilter((e.target as HTMLSelectElement).value)"
        >
          <option value="">{{ t('allDistances') }}</option>
          <option value="5">{{ t('lessThan5') }}</option>
          <option value="10">{{ t('lessThan10') }}</option>
        </select>
      </div>
    </div>

    <div
      class="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4 custom-scrollbar"
      :class="darkMode ? 'bg-gray-900' : 'bg-gray-50'"
    >
      <div
        v-if="venues.length === 0"
        class="text-center py-16 space-y-3"
      >
        <div class="text-5xl opacity-20">🏸</div>
        <p
          class="text-base font-bold"
          :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
        >
          {{ t('noVenues') }}
        </p>
      </div>

      <CourtCard
        v-for="venue in venues"
        v-else
        :key="venue.id"
        :venue="venue"
        :onClick="() => {
          onSelectVenue(venue);
          showDetailPage = true;
        }"
        :language="language"
        :t="t"
        :darkMode="darkMode"
        :isSaved="savedVenues.includes(venue.id)"
        :onToggleSave="() => toggleSave(venue.id)"
      />
    </div>
  </div>
</template>


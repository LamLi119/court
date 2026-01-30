<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import type { Venue, Language } from '../../types';
import { getStationDisplayName } from '../utils/mtrStations';
import CourtCard from './CourtCard.vue';
import MapView from './MapView.vue';

const showFilterPanel = ref(false);
const mtrSearchQuery = ref('');
const draftMtrFilter = ref<string[]>([]);
const mapViewRef = ref<{ clearPins?: () => void; syncPins?: () => void } | null>(null);

watch(
  () => showFilterPanel.value,
  (open) => {
    if (open) {
      draftMtrFilter.value = [...props.mtrFilter];
      mtrSearchQuery.value = '';
    }
  }
);

const toggleMtrStation = (station: string) => {
  if (draftMtrFilter.value.includes(station)) {
    draftMtrFilter.value = draftMtrFilter.value.filter(s => s !== station);
  } else {
    draftMtrFilter.value = [...draftMtrFilter.value, station];
  }
};

const filteredStations = computed(() => {
  const query = mtrSearchQuery.value.toLowerCase().trim();
  if (!query) return props.availableStations;
  return props.availableStations.filter(station => {
    const displayName = getStationDisplayName(station, props.language).toLowerCase();
    return displayName.includes(query) || station.toLowerCase().includes(query);
  });
});

const props = defineProps<{
  venues: Venue[];
  selectedVenue: Venue | null;
  onSelectVenue: (v: Venue | null) => void;
  onViewDetail: (v: Venue) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  mtrFilter: string[];
  setMtrFilter: (arr: string[]) => void;
  distanceFilter: string;
  setDistanceFilter: (s: string) => void;
  language: Language;
  t: (key: string) => string;
  darkMode: boolean;
  savedVenues: number[];
  toggleSave: (id: number) => void;
  isAdmin: boolean;
  onAddVenue: () => void;
  onEditVenue: (id: number, v: any) => void;
  onDeleteVenue: (id: number) => void;
  availableStations: string[];
  onClearFilters?: () => void;
}>();

const leftListVenues = computed(() =>
  props.selectedVenue ? [props.selectedVenue] : props.venues
);
</script>

<template>
  <div class="flex h-[calc(100vh-64px)] overflow-hidden">
    <div
      class="w-[400px] xl:w-[450px] flex-shrink-0 border-r transition-colors flex flex-col"
      :class="darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'"
    >
      <div
        class="p-6 space-y-4 shadow-sm z-10"
        :class="darkMode ? 'bg-gray-800' : 'bg-white'"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-[900] uppercase tracking-wider opacity-70"
            :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
          </span>
          <button
            v-if="onClearFilters && (mtrFilter.length > 0 || distanceFilter)"
            type="button"
            class="text-[11px] font-bold opacity-70 hover:opacity-100 transition-opacity rounded-[999px] px-3 py-1.5"
            :class="darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'"
            @click="onClearFilters()"
          >
            {{ t('clearFilters') }}
          </button>
        </div>
        <div class="relative flex items-center gap-2">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-[#007a67] z-10">🔍</span>
          <input
            type="text"
            :value="searchQuery"
            :placeholder="t('search')"
            class="flex-1 pl-10 pr-12 py-3 border rounded-[12px] focus:ring-2 focus:ring-[#007a67] focus:outline-none transition-all"
            :class="darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
            @input="e => setSearchQuery((e.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            class="absolute right-2 p-2 rounded-[8px] transition-all"
            :class="showFilterPanel ? 'bg-[#007a67] text-white' : (darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200')"
            @click="showFilterPanel = !showFilterPanel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
        <!-- Filter chips row -->
        <div class="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-[999px] px-3 py-2 text-[12px] font-bold transition-all"
            :class="distanceFilter === '5' ? 'bg-[#007a67] text-white shadow-sm' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')"
            @click="setDistanceFilter(distanceFilter === '5' ? '' : '5')"
          >
            {{ t('mtrUnder5Min') }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-[999px] px-3 py-2 text-[12px] font-bold transition-all"
            :class="distanceFilter === '10' ? 'bg-[#007a67] text-white shadow-sm' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')"
            @click="setDistanceFilter(distanceFilter === '10' ? '' : '10')"
          >
            {{ t('mtrUnder10Min') }}
          </button>
          <template v-for="station in mtrFilter" :key="station">
            <span
              class="inline-flex items-center gap-1.5 rounded-[999px] pl-3 pr-1.5 py-2 text-[12px] font-bold bg-[#007a67] text-white shadow-sm"
            >
              {{ getStationDisplayName(station, language) }}
              <button
                type="button"
                class="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 text-[14px] leading-none"
                @click="setMtrFilter(mtrFilter.filter(s => s !== station))"
              >
                ×
              </button>
            </span>
          </template>
        </div>
        <!-- Filter Panel -->
        <div
          v-if="showFilterPanel"
          class="mt-4 p-4 rounded-[12px] border space-y-3 animate-in slide-in-from-top duration-200"
          :class="darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-[13px] font-bold" :class="darkMode ? 'text-gray-300' : 'text-gray-700'">
              {{ t('mtrStation') }}
            </h3>
            <button
              type="button"
              class="text-[11px] font-bold px-3 py-1 rounded-[999px] border border-transparent hover:border-gray-400 transition-colors"
              :class="darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'"
              @click="async () => { await mapViewRef?.clearPins?.(); setMtrFilter([...draftMtrFilter]); showFilterPanel = false; mtrSearchQuery = ''; await nextTick(); mapViewRef?.syncPins?.(); }"
            >
              {{ language === 'en' ? 'Go search' : '開始搜尋' }}
            </button>
          </div>
          <div class="relative">
            <span class="absolute left-2 top-1/2 -translate-y-1/2 opacity-50 text-xs">🔍</span>
            <input
              type="text"
              v-model="mtrSearchQuery"
              :placeholder="language === 'en' ? 'Search stations...' : '搜尋車站...'"
              class="w-full pl-7 pr-3 py-2 text-[12px] border rounded-[8px] focus:ring-2 focus:ring-[#007a67] focus:outline-none"
              :class="darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'"
            />
          </div>
          <div class="max-h-[200px] overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
            <button
              v-for="station in filteredStations"
              :key="station"
              type="button"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-left text-[12px] font-bold transition-all"
              :class="draftMtrFilter.includes(station) 
                ? (darkMode ? 'bg-[#007a67] text-white' : 'bg-[#007a67] text-white')
                : (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100')"
              @click="toggleMtrStation(station)"
            >
              <div class="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                :class="draftMtrFilter.includes(station) 
                  ? 'bg-[#007a67] border-[#007a67]' 
                  : (darkMode ? 'border-gray-500' : 'border-gray-300')"
              >
                <svg v-if="draftMtrFilter.includes(station)" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="flex-1">{{ getStationDisplayName(station, language) }}</span>
            </button>
          </div>
          <div class="flex gap-2 pt-2 border-t" :class="darkMode ? 'border-gray-600' : 'border-gray-200'">
            <button
              type="button"
              class="flex-1 px-3 py-2 text-[12px] font-bold rounded-[8px] transition-opacity"
              :class="darkMode ? 'text-gray-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-600 bg-gray-200 hover:bg-gray-300'"
              @click="draftMtrFilter = []; setMtrFilter([]); mtrSearchQuery = ''"
            >
              {{ t('allStations') }}
            </button>
            <button
              v-if="onClearFilters"
              type="button"
              class="flex-1 px-3 py-2 text-[12px] font-bold rounded-[8px] transition-opacity"
              :class="darkMode ? 'text-gray-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-600 bg-gray-200 hover:bg-gray-300'"
              @click="onClearFilters(); showFilterPanel = false; mtrSearchQuery = ''"
            >
              {{ t('clearFilters') }}
            </button>
          </div>
        </div>
        <button
          v-if="isAdmin"
          class="w-full px-4 py-3 bg-[#007a67] text-white rounded-[8px] font-bold shadow-lg"
          @click="onAddVenue"
        >
          ✨ {{ t('addVenue') }}
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <button
          v-if="selectedVenue"
          type="button"
          class="w-full mb-2 py-2 text-sm font-bold rounded-[8px] transition-colors"
          :class="darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'"
          @click="onSelectVenue(null)"
        >
          ← {{ language === 'en' ? 'Show all courts' : '顯示全部場地' }}
        </button>
        <div
          v-if="leftListVenues.length === 0"
          class="text-center py-20 space-y-4"
        >
          <div class="text-6xl opacity-20">🏸</div>
          <p
            class="text-lg font-bold"
            :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
            {{ t('noVenues') }}
          </p>
        </div>
        <template v-else>
          <CourtCard
            v-for="venue in leftListVenues"
            :key="venue.id"
            :venue="venue"
            :onClick="() => onSelectVenue(venue)"
            :onViewDetail="() => onViewDetail(venue)"
            :language="language"
            :t="t"
            :darkMode="darkMode"
            :isSaved="savedVenues.includes(venue.id)"
            :onToggleSave="() => toggleSave(venue.id)"
          />
        </template>
      </div>
    </div>

    <div class="flex-1 relative">
      <MapView
        ref="mapViewRef"
        :venues="props.venues"
        :selectedVenue="selectedVenue"
        :onSelectVenue="(v: Venue) => onSelectVenue(v)"
        :language="language"
        :darkMode="darkMode"
        :isMobile="false"
      />
    </div>
  </div>
</template>


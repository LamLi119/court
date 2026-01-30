<script setup lang="ts">
import { computed } from 'vue';
import type { Venue, Language } from '../../types';
import CourtCard from './CourtCard.vue';
import MapView from './MapView.vue';

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
        <h2
          class="text-[14px] font-[900] uppercase tracking-wider opacity-70"
          :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
        >
          {{ t('multiVenueMapView') }}
        </h2>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">🔍</span>
          <input
            type="text"
            :value="searchQuery"
            :placeholder="t('search')"
            class="w-full pl-10 pr-4 py-3 border rounded-[12px] focus:ring-2 focus:ring-[#007a67] focus:outline-none transition-all"
            :class="darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
            @input="e => setSearchQuery((e.target as HTMLInputElement).value)"
          />
        </div>
        <div class="flex gap-2 items-center">
          <select
            multiple
            :value="mtrFilter"
            class="flex-1 min-h-[42px] px-3 py-2 border rounded-[8px] text-sm font-bold appearance-none transition-all"
            :class="darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
            @change="e => setMtrFilter(Array.from((e.target as HTMLSelectElement).selectedOptions).map(o => o.value))"
          >
            <option
              v-for="station in availableStations"
              :key="station"
              :value="station"
            >
              {{ station }}
            </option>
          </select>
          <button
            type="button"
            class="flex-shrink-0 px-2 py-1.5 text-[11px] font-bold rounded-[6px] opacity-70 hover:opacity-100 transition-opacity"
            :class="darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200'"
            @click="setMtrFilter([])"
          >
            {{ t('allStations') }}
          </button>
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
        :venues="venues"
        :selectedVenue="selectedVenue"
        :onSelectVenue="(v: Venue) => onSelectVenue(v)"
        :language="language"
        :darkMode="darkMode"
      />
    </div>
  </div>
</template>


<script setup lang="ts">
import type { Venue, Language } from '../../types';
import { getStationDisplayName } from '../utils/mtrStations';

const props = defineProps<{
  venue: Venue;
  language: Language;
  t: (key: string) => string;
  darkMode: boolean;
  isSaved: boolean;
  onToggleSave: () => void;
  onViewDetails: () => void;
}>();
</script>

<template>
  <button
    type="button"
    class="w-full text-left"
    @click="onViewDetails"
  >
    <div
      class="flex items-center gap-4 px-4 py-3 shadow-sm transition-all active:scale-[0.98]"
      :class="darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'"
    >
      <div class="w-20 h-20 rounded-[16px] overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
        <img
          :src="venue.org_icon || venue.images[0] || '/placeholder.svg'"
          :alt="venue.name"
          class="w-full h-full object-cover"
        />
      </div>

      <div class="flex-1 min-w-0">
        <h3
          class="text-[18px] font-[900] leading-tight truncate mb-1"
          :class="darkMode ? 'text-white' : 'text-gray-900'"
        >
          {{ venue.name }}
        </h3>
        <p
          class="text-[13px] font-[400] truncate"
          :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
        >
          🚇 {{ getStationDisplayName(venue.mtrStation, language) }}
        </p>
        <div class="flex items-center gap-2 mt-1 text-[12px]">
          <span :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
            🚶 {{ venue.walkingDistance }} {{ t('min') }}
          </span>
        </div>
        <div class="flex items-baseline gap-1 mt-2">
          <span class="text-[18px] font-[900] text-[#007a67]">
            ${{ venue.startingPrice }}
          </span>
          <span class="text-[11px] font-[700] opacity-60 uppercase">
            /{{ language === 'en' ? 'hr' : '小時' }}
          </span>
        </div>
      </div>

      <div class="self-start">
        <button
          type="button"
          class="p-2 rounded-full shadow-sm transition-all active:scale-90"
          :class="isSaved ? 'bg-red-500 text-white' : (darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-500')"
          @click.stop="onToggleSave"
        >
          {{ isSaved ? '❤️' : '🤍' }}
        </button>
      </div>
    </div>
  </button>
</template>
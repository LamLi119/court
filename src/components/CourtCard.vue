<script setup lang="ts">
import { ref } from 'vue';
import type { Venue, Language } from '../../types';

const props = defineProps<{
  venue: Venue;
  onClick: () => void;
  language: Language;
  t: (key: string) => string;
  darkMode: boolean;
  isSaved: boolean;
  onToggleSave: () => void;
  isMobile?: boolean;
}>();

const isExpanded = ref(false);

const toggleExpand = (e: MouseEvent) => {
  e.stopPropagation();
  isExpanded.value = !isExpanded.value;
};
</script>

<template>
  <div v-if="isMobile">
    <div
      class="border rounded-[16px] overflow-hidden mb-4 transition-all duration-300 shadow-sm"
      :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
    >
      <div
        class="flex items-center p-4 cursor-pointer gap-4"
        @click="onClick"
      >
        <div class="w-16 h-16 rounded-[16px] overflow-hidden flex-shrink-0">
          <img
            :src="venue.images[0] || '/placeholder.svg'"
            class="w-full h-full object-cover"
            alt=""
          />
        </div>
        <div class="flex-1 min-w-0">
          <h3
            class="font-[900] text-[24px] leading-tight truncate"
            :class="darkMode ? 'text-white' : 'text-gray-900'"
          >
            {{ venue.name }}
          </h3>
          <p
            class="text-[14px] font-[400] opacity-70"
            :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
            🚇 {{ venue.mtrStation }}
          </p>
        </div>
        <button
          class="p-2 rounded-full transition-transform"
          :class="[isExpanded ? 'rotate-180' : '', darkMode ? 'bg-gray-700' : 'bg-gray-50']"
          @click.stop="toggleExpand"
        >
          ▼
        </button>
      </div>

      <div
        v-if="isExpanded"
        class="px-4 pb-4 animate-in slide-in-from-top duration-200"
      >
        <div
          class="flex items-center gap-3 text-[12px] font-[400] mb-3"
          :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
        >
          <span>🚶 {{ venue.walkingDistance }} {{ t('min') }}</span>
          <span>⬆️ {{ venue.ceilingHeight }}m</span>
          <span class="ml-auto font-[900] text-[#007a67] text-[16px]">
            ${{ venue.startingPrice }}/hr
          </span>
        </div>
        <div class="flex gap-2">
          <button
            class="flex-1 py-2.5 rounded-[8px] font-bold text-xs flex items-center justify-center gap-2 transition-all"
            :class="isSaved ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'"
            @click.stop="onToggleSave"
          >
            {{ isSaved ? '❤️ Saved' : '🤍 Save' }}
          </button>
          <button
            class="flex-[2] py-2.5 bg-[#007a67] text-white rounded-[8px] font-[900] text-xs shadow-md"
            @click="onClick"
          >
            {{ t('viewDetails') }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    v-else
    class="group cursor-pointer rounded-[16px] overflow-hidden border transition-all duration-300 hover:shadow-2xl"
    :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
    @click="onClick"
  >
      <div class="relative h-44 overflow-hidden">
      <img
        :src="venue.images[0]"
        :alt="venue.name"
        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
      <div class="absolute top-2 right-2">
        <button
          class="p-2.5 rounded-full shadow-lg transition-all active:scale-90 rounded-[999px]"
          :class="isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-500'"
          @click.stop="onToggleSave"
        >
          {{ isSaved ? '❤️' : '🤍' }}
        </button>
      </div>
    </div>

    <div class="p-4">
      <h3
        class="font-[900] text-[24px] leading-tight truncate mb-2"
        :class="darkMode ? 'text-white' : 'text-gray-900'"
      >
        {{ venue.name }}
      </h3>
      <div
        class="flex items-center gap-3 text-[14px] font-[400] mb-4"
        :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
      >
        <span>🚇 {{ venue.mtrStation }}</span>
        <span>🚶 {{ venue.walkingDistance }} {{ t('min') }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-[24px] font-[900] text-[#007a67]">
          ${{ venue.startingPrice }}
        </span>
        <button
          class="px-4 py-2 bg-[#007a67] text-white rounded-[8px] font-bold text-sm shadow-md group-hover:brightness-110 rounded-[8px]"
          @click.stop="onClick"
        >
          {{ t('viewDetails') }}
        </button>
      </div>
    </div>
  </div>
</template>


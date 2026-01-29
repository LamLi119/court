<script setup lang="ts">
import type { Venue, Language } from '../../types';
import ImageCarousel from './ImageCarousel.vue';
import courtIconUrl from '../assets/green-G.svg';

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
</script>

<template>
  <div
    class="min-h-screen pb-20 animate-in fade-in duration-300"
    :class="darkMode ? 'bg-gray-900' : 'bg-white'"
  >
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
        <img :src="courtIconUrl" alt="" class="w-5 h-5 flex-shrink-0" />
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
          :class="isSaved() ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'"
          @click="toggleSave(venue.id)"
        >
          {{ isSaved() ? '❤️' : '🤍' }}
        </button>
      </div>
    </div>

    <div class="container mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
          <ImageCarousel :images="venue.images" />
          <div class="space-y-6">
            <h2
              class="text-[24px] md:text-[32px] font-[900] tracking-tight flex items-center gap-3"
              :class="darkMode ? 'text-white' : 'text-gray-900'"
            >
              <img :src="courtIconUrl" alt="" class="w-7 h-7 flex-shrink-0" />
              <span>{{ venue.name }}</span>
            </h2>
            <div
              class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] font-[400]"
              :class="darkMode ? 'text-gray-400' : 'text-gray-600'"
            >
              <span>🚇 {{ venue.mtrStation }} ({{ venue.mtrExit }})</span>
              <span>
                {{ venue.walkingDistance }} {{ t('min') }} {{ t('walk') }}
              </span>
              <span>
                {{ venue.ceilingHeight }}m {{ t('ceilingHeight') }}
              </span>
            </div>
            <div
              v-if="venue.description"
              class="text-[14px] font-[400] leading-relaxed"
              :class="darkMode ? 'text-gray-300' : 'text-gray-600'"
            >
              {{ venue.description }}
            </div>
            <div
              class="p-6 rounded-[16px] border"
              :class="darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'"
            >
              <h3 class="font-bold mb-2 opacity-60 text-xs uppercase tracking-wider">
                Location
              </h3>
              <p class="text-[16px] mb-4">
                {{ venue.address }}
              </p>
              <button
                class="px-4 py-2 rounded-[8px] bg-[#007a67] text-white font-bold"
                @click="openGoogleMaps"
              >
                📍 Open in Google Maps
              </button>
            </div>
            <div class="space-y-4">
              <h2
                class="text-[24px] font-[900]"
                :class="darkMode ? 'text-white' : 'text-gray-900'"
              >
                {{ t('pricing') }}
              </h2>
              <div
                v-if="venue.pricing.type === 'text'"
                class="p-6 rounded-[16px] border"
                :class="darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'"
              >
                {{ venue.pricing.content }}
              </div>
              <div
                v-else
                class="rounded-[16px] overflow-hidden border dark:border-gray-700"
              >
                <img
                  :src="venue.pricing.imageUrl"
                  class="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-1">
          <div
            class="sticky top-24 p-8 rounded-[16px] shadow-2xl border"
            :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'"
          >
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
            <button
              v-if="venue.socialLink"
              class="w-full mt-3 py-3 rounded-[8px] font-[700] text-[14px] border"
              :class="darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'"
              @click="window.open(venue.socialLink, '_blank')"
            >
              {{ language === 'en' ? 'View on social' : '查看社群頁面' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


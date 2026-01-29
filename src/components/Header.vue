<script setup lang="ts">
import type { Language, AppTab } from '../../types';
import logoUrl from '../assets/green-G.svg';

const props = defineProps<{
  language: Language;
  setLanguage: (l: Language) => void;
  isAdmin: boolean;
  onAdminClick: () => void;
  onLogout?: () => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  t: (key: string) => string;
  currentTab: AppTab;
  setTab: (t: AppTab) => void;
  viewMode?: 'map' | 'list';
  setViewMode?: (mode: 'map' | 'list') => void;
}>();

const openFindEvents = () => {
  window.open('https://www.theground.io', '_blank');
};
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-[60] backdrop-blur-md border-b shadow-sm',
      darkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
    ]"
  >
    <div class="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-4 md:gap-8">
        <div
          class="flex items-center gap-2.5 cursor-pointer group"
          @click="setTab('explore')"
        >
          <div
            class="w-10 h-10 transition-transform duration-300 group-hover:rotate-12 group-active:scale-90 flex items-center justify-center"
          >
            <img :src="logoUrl" alt="TheGround.io" class="w-10 h-10" />
          </div>
          <h1 class="hidden sm:block text-[20px] font-[900] tracking-tighter text-[#007a67]">
            TheGround.io
          </h1>
        </div>

        <nav class="flex items-center gap-3 md:gap-6">
          <button
            class="hidden md:block text-[14px] font-[700] transition-all"
            :class="currentTab === 'explore' ? 'text-[#007a67]' : 'text-gray-400 hover:text-gray-600'"
            @click="setTab('explore')"
          >
            EXPLORE
          </button>
          <button
            class="hidden md:block text-[14px] font-[700] transition-all"
            :class="currentTab === 'saved' ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'"
            @click="setTab('saved')"
          >
            SAVED
          </button>
          <button
            class="text-[11px] md:text-[14px] font-[900] tracking-widest transition-all"
            :class="currentTab === 'admin' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'"
            @click="setTab('admin')"
          >
            ADMIN
          </button>
        </nav>
      </div>

      <div class="flex items-center gap-2 md:gap-4">
        <button
          class="p-2 rounded-[8px] transition-all"
          :class="darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-700'"
          @click="setDarkMode(!darkMode)"
        >
          {{ darkMode ? '☀️' : '🌙' }}
        </button>

        <button
          class="hidden md:inline-flex px-4 py-2 rounded-[8px] font-[900] text-[14px] bg-[#007a67] text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
          @click="openFindEvents"
        >
          Find events
        </button>

        <div
          class="flex rounded-[8px] p-1 border"
          :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'"
        >
          <button
            class="px-2 md:px-3 py-1 text-[10px] md:text-[11px] font-[900] rounded-[6px]"
            :class="language === 'en' ? 'bg-[#007a67] text-white shadow' : 'text-gray-400'"
            @click="setLanguage('en')"
          >
            EN
          </button>
          <button
            class="px-2 md:px-3 py-1 text-[10px] md:text-[11px] font-[900] rounded-[6px]"
            :class="language === 'zh' ? 'bg-[#007a67] text-white shadow' : 'text-gray-400'"
            @click="setLanguage('zh')"
          >
            中文
          </button>
        </div>
      </div>
    </div>
  </header>
</template>


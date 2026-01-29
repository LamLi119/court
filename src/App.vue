<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { Venue, Language, AppTab } from '../types';
import { translate } from './utils/translations';
import { db } from '../db';
import Header from './components/Header.vue';
import AdminLogin from './components/AdminLogin.vue';
import DesktopView from './components/DesktopView.vue';
import MobileView from './components/MobileView.vue';
import MobileNav from './components/MobileNav.vue';
import VenueDetail from './components/VenueDetail.vue';
import VenueForm from './components/VenueForm.vue';

const language = ref<Language>('en');
const currentTab = ref<AppTab>('explore');
const isAdmin = ref(false);
const adminPassword = ref('');
const showAdminLogin = ref(false);
const showVenueForm = ref(false);
const editingVenue = ref<Venue | null>(null);
const venueToDelete = ref<Venue | null>(null);
const isLoading = ref(true);
const mobileViewMode = ref<'map' | 'list'>('map');

const venues = ref<Venue[]>([]);
const savedVenues = ref<number[]>([]);

const selectedVenue = ref<Venue | null>(null);
const searchQuery = ref('');
const mtrFilter = ref('');
const distanceFilter = ref('');
const darkMode = ref(localStorage.getItem('pickleball_darkmode') === 'true');
const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

const loadData = async () => {
  try {
    isLoading.value = true;
    const data = await db.getVenues();
    venues.value = data || [];

    // 套用已儲存的 admin 排序（如果有）
    if (adminOrder.value.length) {
      applyAdminOrder();
    } else {
      adminOrder.value = venues.value.map(v => v.id);
      saveAdminOrder();
    }
  } catch (err) {
    console.error('Error fetching venues from DB:', err);
  } finally {
    isLoading.value = false;
  }
};

const handleResize = () => {
  isMobile.value = window.innerWidth < 1024;
};

onMounted(() => {
  loadData();
  window.addEventListener('resize', handleResize);

  try {
    const saved = localStorage.getItem('pickleball_saved_ids');
    savedVenues.value = saved ? JSON.parse(saved) : [];
  } catch {
    savedVenues.value = [];
  }

  if (darkMode.value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const availableStations = computed(() => {
  const stations = venues.value
    .map(v => v.mtrStation)
    .filter((station): station is string => !!station);
  return Array.from(new Set(stations)).sort();
});

watch(savedVenues, (val) => {
  try {
    localStorage.setItem('pickleball_saved_ids', JSON.stringify(val));
  } catch (e) {
    console.warn('Could not save IDs to localStorage', e);
  }
}, { deep: true });

watch(darkMode, (value) => {
  localStorage.setItem('pickleball_darkmode', value.toString());
  if (value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});

const t = (key: string) => translate(language.value, key);

const handleAdminLogin = () => {
  if (adminPassword.value === 'admin') {
    isAdmin.value = true;
    showAdminLogin.value = false;
    adminPassword.value = '';
    currentTab.value = 'admin';
  } else {
    alert('Incorrect password (Hint: admin)');
  }
};

const filteredVenues = computed(() => {
  let source = venues.value;
  if (currentTab.value === 'saved') {
    source = venues.value.filter(v => savedVenues.value.includes(v.id));
  }

  return source.filter(venue => {
    const query = searchQuery.value.toLowerCase();
    const nameMatch = venue.name.toLowerCase().includes(query) ||
      venue.mtrStation.toLowerCase().includes(query) ||
      venue.address.toLowerCase().includes(query);
    const mtrMatch = !mtrFilter.value || venue.mtrStation.toLowerCase().includes(mtrFilter.value.toLowerCase());
    const distanceMatch = !distanceFilter.value || venue.walkingDistance <= parseInt(distanceFilter.value);
    return nameMatch && mtrMatch && distanceMatch;
  });
});

const toggleSaveVenue = (venueId: number) => {
  savedVenues.value = savedVenues.value.includes(venueId)
    ? savedVenues.value.filter(id => id !== venueId)
    : [...savedVenues.value, venueId];
};

const confirmDeleteAction = async () => {
  if (!venueToDelete.value) return;
  try {
    await db.deleteVenue(venueToDelete.value.id);
    venues.value = venues.value.filter(v => v.id !== venueToDelete.value!.id);
    savedVenues.value = savedVenues.value.filter(id => id !== venueToDelete.value!.id);
  } catch (err) {
    alert('Failed to delete venue.');
  } finally {
    venueToDelete.value = null;
    showVenueForm.value = false;
    editingVenue.value = null;
    selectedVenue.value = null;
  }
};

const handleSaveVenue = async (venueData: any) => {
  const saved = await db.upsertVenue(venueData);
  if (editingVenue.value) {
    venues.value = venues.value.map(old => old.id === saved.id ? saved : old);
  } else {
    venues.value = [...venues.value, saved];
  }
  showVenueForm.value = false;
  editingVenue.value = null;
  selectedVenue.value = null;
};

const draggedVenueId = ref<number | null>(null);
const adminOrder = ref<number[]>([]);

const saveAdminOrder = () => {
  try {
    localStorage.setItem('pickleball_admin_order', JSON.stringify(adminOrder.value));
  } catch {
    // ignore
  }
};

const applyAdminOrder = () => {
  if (!adminOrder.value.length) return;
  const idToVenue = new Map(venues.value.map(v => [v.id, v]));
  const ordered: Venue[] = [];
  adminOrder.value.forEach(id => {
    const v = idToVenue.get(id);
    if (v) {
      ordered.push(v);
      idToVenue.delete(id);
    }
  });
  // append any new venues not in order yet
  idToVenue.forEach(v => ordered.push(v));
  venues.value = ordered;
};

onMounted(() => {
  try {
    const raw = localStorage.getItem('pickleball_admin_order');
    adminOrder.value = raw ? JSON.parse(raw) : [];
  } catch {
    adminOrder.value = [];
  }
});

const handleDragStart = (id: number) => {
  draggedVenueId.value = id;
};

const handleDrop = (targetId: number) => {
  if (draggedVenueId.value === null || draggedVenueId.value === targetId) return;
  const currentOrder = adminOrder.value.length ? [...adminOrder.value] : venues.value.map(v => v.id);
  const fromIndex = currentOrder.indexOf(draggedVenueId.value);
  const toIndex = currentOrder.indexOf(targetId);
  if (fromIndex === -1 || toIndex === -1) return;

  const [moved] = currentOrder.splice(fromIndex, 1);
  currentOrder.splice(toIndex, 0, moved);
  adminOrder.value = currentOrder;
  saveAdminOrder();
  applyAdminOrder();

  draggedVenueId.value = null;
};
</script>

<template>
  <div :class="['min-h-screen pb-safe transition-colors', darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900']">
    <Header
      :language="language"
      :setLanguage="(l: Language) => { language = l; }"
      :isAdmin="isAdmin"
      :onAdminClick="() => { if (isAdmin) currentTab = 'admin'; else showAdminLogin = true; }"
      :darkMode="darkMode"
      :setDarkMode="(d: boolean) => { darkMode = d; }"
      :t="t"
      :currentTab="currentTab"
      :setTab="(tab: AppTab) => {
        if (tab === 'admin' && !isAdmin) showAdminLogin = true;
        else currentTab = tab;
        selectedVenue = null;
      }"
      :viewMode="mobileViewMode"
      :setViewMode="(mode: 'map' | 'list') => { mobileViewMode = mode; }"
    />

    <main class="h-full">
      <div
        v-if="currentTab === 'admin' && isAdmin && !selectedVenue"
        class="container mx-auto p-4 md:p-8 pb-32 md:pb-8 space-y-8 animate-in fade-in duration-500"
      >
        <div class="flex justify-between items-center">
          <h2 class="text-3xl md:text-4xl font-black tracking-tight">Manage Courts</h2>
          <div class="flex gap-2">
            <button
              class="px-4 py-3 md:px-6 md:py-3 bg-[#007a67] text-white rounded-lg font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-xs md:text-base"
              @click="() => { editingVenue = null; showVenueForm = true; }"
            >
              + ADD NEW
            </button>
            <button
              class="px-4 py-3 md:px-6 md:py-3 bg-red-500 text-white rounded-lg font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-xs md:text-base"
              @click="() => { isAdmin = false; currentTab = 'explore'; }"
            >
              LOGOUT
            </button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="v in venues"
            :key="v.id"
            class="p-4 border rounded-3xl shadow-md flex items-center justify-between group transition-all hover:shadow-xl"
            :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'"
            draggable="true"
            @dragstart="handleDragStart(v.id)"
            @dragover.prevent
            @drop="handleDrop(v.id)"
          >
            <div class="flex items-center gap-4 min-w-0">
              <div class="w-16 h-16 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                <img :src="v.images[0] || 'https://via.placeholder.com/150'" class="w-full h-full object-cover" alt="" />
              </div>
              <div class="min-w-0">
                <p class="font-black truncate">{{ v.name }}</p>
                <p class="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                  ${{ v.startingPrice }}/HR
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                class="p-3 bg-blue-500/10 text-blue-500 rounded-xl"
                @click="() => { editingVenue = v; showVenueForm = true; }"
              >
                ✏️
              </button>
              <button
                class="p-3 bg-red-500/10 text-red-500 rounded-xl"
                @click.stop="() => { venueToDelete = v; }"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div
          v-if="isLoading"
          class="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4"
        >
          <div class="spinner"></div>
          <p class="font-black text-sm tracking-widest opacity-50 uppercase">
            Syncing Courts...
          </p>
        </div>

        <MobileView
          v-else-if="isMobile"
          :mode="mobileViewMode"
          :setMode="(m: 'map' | 'list') => { mobileViewMode = m; }"
          :venues="filteredVenues"
          :selectedVenue="selectedVenue"
          :onSelectVenue="(v: Venue | null) => { selectedVenue = v; }"
          :searchQuery="searchQuery"
          :setSearchQuery="(s: string) => { searchQuery = s; }"
          :mtrFilter="mtrFilter"
          :setMtrFilter="(s: string) => { mtrFilter = s; }"
          :distanceFilter="distanceFilter"
          :setDistanceFilter="(s: string) => { distanceFilter = s; }"
          :language="language"
          :t="t"
          :darkMode="darkMode"
          :savedVenues="savedVenues"
          :toggleSave="toggleSaveVenue"
          :isAdmin="isAdmin"
          :onEditVenue="(id: number, v: any) => { editingVenue = v; showVenueForm = true; }"
          :availableStations="availableStations"
        />

        <DesktopView
          v-else
          :venues="filteredVenues"
          :selectedVenue="selectedVenue"
          :onSelectVenue="(v: Venue | null) => { selectedVenue = v; }"
          :searchQuery="searchQuery"
          :setSearchQuery="(s: string) => { searchQuery = s; }"
          :mtrFilter="mtrFilter"
          :setMtrFilter="(s: string) => { mtrFilter = s; }"
          :distanceFilter="distanceFilter"
          :setDistanceFilter="(s: string) => { distanceFilter = s; }"
          :language="language"
          :t="t"
          :darkMode="darkMode"
          :savedVenues="savedVenues"
          :toggleSave="toggleSaveVenue"
          :isAdmin="isAdmin"
          :onAddVenue="() => { editingVenue = null; showVenueForm = true; }"
          :onEditVenue="(id: number, v: any) => { editingVenue = v; showVenueForm = true; }"
          :onDeleteVenue="(id: number) => {
            const target = venues.find(v => v.id === id);
            if (target) venueToDelete = target;
          }"
          :availableStations="availableStations"
        />
      </div>
    </main>

    <AdminLogin
      v-if="showAdminLogin"
      :password="adminPassword"
      :setPassword="(val: string) => { adminPassword = val; }"
      :onLogin="handleAdminLogin"
      :onClose="() => { showAdminLogin = false; }"
      :language="language"
      :t="t"
      :darkMode="darkMode"
    />

    <VenueForm
      v-if="showVenueForm"
      :venue="editingVenue"
      :onSave="handleSaveVenue"
      :onCancel="() => { showVenueForm = false; editingVenue = null; }"
      :onDelete="(id: number) => {
        const target = venues.find(v => v.id === id);
        if (target) venueToDelete = target;
      }"
      :language="language"
      :t="t"
      :darkMode="darkMode"
    />

    <div
      v-if="venueToDelete"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      class="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center p-4 backdrop-blur-md"
    >
      <div
        class="w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-bounce-in"
        :class="darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'"
      >
        <div class="text-center space-y-4">
          <div class="text-6xl mb-2">⚠️</div>
          <h3
            id="delete-dialog-title"
            class="text-2xl font-black"
          >
            {{ language === 'en' ? 'Delete Court?' : '刪除場地？' }}
          </h3>
          <p
            class="text-sm font-bold px-2"
            :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
            {{
              language === 'en'
                ? `Are you sure you want to delete "${venueToDelete!.name}"?`
                : `確定要刪除「${venueToDelete!.name}」嗎？`
            }}
          </p>
          <div class="flex flex-col gap-3 pt-6">
            <button
              class="w-full py-4 bg-red-500 text-white rounded-lg font-black"
              @click="confirmDeleteAction"
            >
              {{ language === 'en' ? 'YES, DELETE IT' : '確定刪除' }}
            </button>
            <button
              class="w-full py-4 rounded-lg font-black"
              :class="darkMode ? 'bg-gray-700' : 'bg-gray-200'"
              @click="() => { venueToDelete = null; }"
            >
              {{ language === 'en' ? 'NO, CANCEL' : '取消' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <MobileNav
      v-if="isMobile"
      :currentTab="currentTab"
      :setTab="(t: AppTab) => { currentTab = t; }"
      :t="t"
      :darkMode="darkMode"
      :isAdmin="isAdmin"
    />
  </div>
</template>


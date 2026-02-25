<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Venue, Language, AppTab } from '../types';
import { translate } from './utils/translations';
import { getStationCanonicalEn } from './utils/mtrStations';
import { slugify } from './utils/slugify';
import { resetSeoToDefault } from './utils/seo';
import { useVenueSlug } from './router';
import { db } from '../db';
import Header from './components/Header.vue';
import AdminLogin from './components/AdminLogin.vue';
import DesktopView from './components/DesktopView.vue';
import MobileView from './components/MobileView.vue';
import MobileNav from './components/MobileNav.vue';
import VenueDetail from './components/VenueDetail.vue';
import VenueForm from './components/VenueForm.vue';

const route = useRoute();
const router = useRouter();

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
const sports = ref<{ id: number; name: string; slug: string }[]>([]);
const savedVenues = ref<number[]>([]);
const adminSportFilter = ref<string>('all'); // 'all' | sport slug
const showAddSportInput = ref(false);
const newSportName = ref('');
const newSportNameZh = ref('');
const addSportError = ref<string | null>(null);
const isAddingSport = ref(false);

const sportDisplayName = (s: { name: string; name_zh?: string | null }) =>
  language.value === 'zh' && s.name_zh ? s.name_zh : s.name;

const selectedVenue = ref<Venue | null>(null);
const showDesktopDetail = ref(false);
const searchQuery = ref('');
const mtrFilter = ref<string[]>([]);
const distanceFilter = ref('');
const sportFilter = ref(''); // SEO: /search/:sport category page
const darkMode = ref(localStorage.getItem('pickleball_darkmode') === 'true');
const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

const VENUES_CACHE_KEY = 'pickleball_venues_cache';
const VENUES_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

function setVenuesCache(data: Venue[], ts: number): void {
  try {
    sessionStorage.setItem(VENUES_CACHE_KEY, JSON.stringify({ data, ts }));
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      try {
        sessionStorage.removeItem(VENUES_CACHE_KEY);
      } catch {
        // ignore
      }
    }
    // Skip cache when quota exceeded or any other error; app works without cache
  }
}

const loadData = async () => {
  try {
    // Show cached data immediately for faster repeat loads
    const cachedRaw = sessionStorage.getItem(VENUES_CACHE_KEY);
    if (cachedRaw) {
      try {
        const { data: cached, ts } = JSON.parse(cachedRaw);
        if (Array.isArray(cached) && typeof ts === 'number' && Date.now() - ts < VENUES_CACHE_TTL_MS) {
          venues.value = cached;
          adminOrder.value = cached.map((v: Venue) => v.id);
          saveAdminOrder();
          isLoading.value = false;
          // Revalidate in background
          const [fresh, sportsList] = await Promise.all([db.getVenues(), db.getSports()]);
          if (fresh?.length !== undefined) {
            venues.value = fresh;
            adminOrder.value = fresh.map(v => v.id);
            saveAdminOrder();
            setVenuesCache(fresh, Date.now());
          }
          if (sportsList?.length !== undefined) sports.value = sportsList;
          return;
        }
      } catch {
        // ignore invalid cache
      }
    }

    isLoading.value = true;
    const [data, sportsList] = await Promise.all([db.getVenues(), db.getSports()]);
    venues.value = data || [];
    sports.value = sportsList || [];
    adminOrder.value = venues.value.map(v => v.id);
    saveAdminOrder();
    setVenuesCache(venues.value, Date.now());
  } catch (err) {
    console.error('Error fetching venues from DB:', err);
  } finally {
    isLoading.value = false;
  }
};

const invalidateVenuesCache = () => {
  sessionStorage.removeItem(VENUES_CACHE_KEY);
};

const handleResize = () => {
  isMobile.value = window.innerWidth < 1024;
};

const ADMIN_PATH = '/admin';

function isAdminPath(): boolean {
  return route.path === ADMIN_PATH || route.path.endsWith('/admin');
}

function syncAdminUrl(show: boolean) {
  if (show) router.push(ADMIN_PATH);
  else router.push('/');
}

function resolveVenueBySlug(slug: string): Venue | null {
  const s = (slug || '').toLowerCase().trim();
  if (!s) return null;
  return venues.value.find((v) => slugify(v.name) === s) ?? null;
}

watch(
  () => ({ name: route.name, slug: route.params.slug, sport: route.params.sport }),
  (params, prev) => {
    if (route.name === 'venue' && typeof route.params.slug === 'string') {
      const venue = resolveVenueBySlug(route.params.slug);
      selectedVenue.value = venue;
      showDesktopDetail.value = !!venue;
      if (!venue && venues.value.length > 0) router.replace('/');
    } else if (route.name === 'search' && typeof route.params.sport === 'string') {
      sportFilter.value = route.params.sport;
      selectedVenue.value = null;
      showDesktopDetail.value = false;
      applySearchPageSeo(route.params.sport);
    } else if (route.name === 'home' || route.name === 'admin') {
      if (route.name === 'home') {
        sportFilter.value = '';
        if (prev?.name === 'venue') resetSeoToDefault();
        selectedVenue.value = null;
        showDesktopDetail.value = false;
      }
    }
  },
  { immediate: true }
);

watch(
  () => venues.value.length,
  () => {
    if (route.name === 'venue' && typeof route.params.slug === 'string' && !selectedVenue.value) {
      const venue = resolveVenueBySlug(route.params.slug);
      if (venue) {
        selectedVenue.value = venue;
        showDesktopDetail.value = true;
      }
    }
  }
);

onMounted(() => {
  if (isAdminPath()) showAdminLogin.value = true;
  const onPopState = () => { showAdminLogin.value = isAdminPath(); };
  window.addEventListener('popstate', onPopState);
  window.addEventListener('resize', handleResize);
  (window as any).__adminPopState = onPopState;

  loadData();

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
  const onPopState = (window as any).__adminPopState;
  if (onPopState) window.removeEventListener('popstate', onPopState);
});

// All unique MTR stations from DB (trimmed, deduped, sorted)
const availableStations = computed(() => {
  const stations = venues.value
    .map(v => (v.mtrStation || '').trim())
    .filter((s): s is string => s.length > 0);
  return Array.from(new Set(stations)).sort((a, b) => a.localeCompare(b));
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

const clearFilters = () => {
  searchQuery.value = '';
  mtrFilter.value = [];
  distanceFilter.value = '';
};

const handleAdminLogin = () => {
  if (adminPassword.value === 'abc321A!') {
    isAdmin.value = true;
    showAdminLogin.value = false;
    adminPassword.value = '';
    currentTab.value = 'admin';
  } else {
    alert('Incorrect password');
  }
};

const filteredVenues = computed(() => {
  let source = venues.value;
  if (currentTab.value === 'saved') {
    source = venues.value.filter(v => savedVenues.value.includes(v.id));
  }

  const mtrCanonicalSet =
    mtrFilter.value.length > 0
      ? new Set(mtrFilter.value.map((s) => getStationCanonicalEn(s)).filter(Boolean))
      : null;

  const sport = (sportFilter.value || '').toLowerCase().trim();

  return source.filter(venue => {
    const query = (searchQuery.value || '').toLowerCase();
    const name = ((venue as any).name ?? '').toString().toLowerCase();
    const station = ((venue as any).mtrStation ?? '').toString().toLowerCase();
    const address = ((venue as any).address ?? '').toString().toLowerCase();
    const nameMatch = name.includes(query) || station.includes(query) || address.includes(query);
    const venueStation = (((venue as any).mtrStation ?? '') as string).toString().trim();
    const venueStationKey = getStationCanonicalEn(venueStation);
    const mtrMatch = !mtrCanonicalSet || (venueStationKey && mtrCanonicalSet.has(venueStationKey));
    const wdRaw = (venue as any).walkingDistance;
    const wd = typeof wdRaw === 'number' ? wdRaw : parseFloat((wdRaw ?? '').toString());
    const distanceLimit = distanceFilter.value ? parseInt(distanceFilter.value) : NaN;
    const distanceMatch = !distanceFilter.value || (Number.isFinite(wd) && wd <= distanceLimit);
    let sportMatch = true;
    if (sport) {
      const types = (venue as Venue).sport_types;
      const hasSportType = Array.isArray(types) && types.some((t: string) => String(t).toLowerCase() === sport);
      const desc = ((venue as any).description ?? '').toString().toLowerCase();
      sportMatch = hasSportType || name.includes(sport) || desc.includes(sport);
    }
    return nameMatch && mtrMatch && distanceMatch && sportMatch;
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
    invalidateVenuesCache();
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
  invalidateVenuesCache();
  showVenueForm.value = false;
  editingVenue.value = null;
  selectedVenue.value = null;
};

const draggedVenueId = ref<number | null>(null);
const adminOrder = ref<number[]>([]);
const isSortEditing = ref(false);
const draftAdminOrder = ref<number[]>([]);

const adminVenues = computed(() => {
  if (adminSportFilter.value === 'all') return venues.value;
  const slug = adminSportFilter.value;
  return venues.value
    .filter((v) => {
      const types = v.sport_types;
      const data = v.sport_data;
      if (Array.isArray(data)) return data.some((d: any) => (d.slug || '').toLowerCase() === slug);
      if (Array.isArray(types)) return types.some((t: string) => String(t).toLowerCase().replace(/\s+/g, '-') === slug);
      return false;
    })
    .sort((a, b) => {
      const ao = a.sport_orders?.[slug] ?? a.sport_data?.find((d: any) => (d.slug || '').toLowerCase() === slug)?.sort_order ?? 9999;
      const bo = b.sport_orders?.[slug] ?? b.sport_data?.find((d: any) => (d.slug || '').toLowerCase() === slug)?.sort_order ?? 9999;
      return ao - bo;
    });
});

const getBaseAdminOrder = (): number[] => {
  if (adminSportFilter.value === 'all') return adminOrder.value.length ? [...adminOrder.value] : venues.value.map(v => v.id);
  return adminVenues.value.map(v => v.id);
};

const displayIndexById = computed(() => {
  const order = isSortEditing.value ? draftAdminOrder.value : getBaseAdminOrder();
  const map = new Map<number, number>();
  order.forEach((id, idx) => map.set(id, idx));
  return map;
});

const isDraftDirty = computed(() => {
  if (!isSortEditing.value) return false;
  const base = getBaseAdminOrder();
  const draft = draftAdminOrder.value;
  if (base.length !== draft.length) return true;
  for (let i = 0; i < base.length; i++) {
    if (base[i] !== draft[i]) return true;
  }
  return false;
});

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
  if (!isSortEditing.value) return;
  draggedVenueId.value = id;
};

const reorderDraft = (newOrder: number[]) => {
  draftAdminOrder.value = newOrder;
};

const handleDrop = async (targetId: number) => {
  if (!isSortEditing.value) return;
  if (draggedVenueId.value === null || draggedVenueId.value === targetId) return;
  const currentOrder = draftAdminOrder.value.length ? [...draftAdminOrder.value] : getBaseAdminOrder();
  const fromIndex = currentOrder.indexOf(draggedVenueId.value);
  const toIndex = currentOrder.indexOf(targetId);
  if (fromIndex === -1 || toIndex === -1) return;

  const [moved] = currentOrder.splice(fromIndex, 1);
  currentOrder.splice(toIndex, 0, moved);
  reorderDraft(currentOrder);
  draggedVenueId.value = null;
};

const handleMoveUp = async (id: number) => {
  if (!isSortEditing.value) return;
  const currentOrder = draftAdminOrder.value.length ? [...draftAdminOrder.value] : getBaseAdminOrder();
  const idx = currentOrder.indexOf(id);
  if (idx <= 0) return;
  const next = [...currentOrder];
  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
  reorderDraft(next);
};

const handleMoveDown = async (id: number) => {
  if (!isSortEditing.value) return;
  const currentOrder = draftAdminOrder.value.length ? [...draftAdminOrder.value] : getBaseAdminOrder();
  const idx = currentOrder.indexOf(id);
  if (idx === -1 || idx >= currentOrder.length - 1) return;
  const next = [...currentOrder];
  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
  reorderDraft(next);
};

const startSortEdit = () => {
  isSortEditing.value = true;
  draftAdminOrder.value = getBaseAdminOrder();
  draggedVenueId.value = null;
};

const cancelSortEdit = () => {
  isSortEditing.value = false;
  draftAdminOrder.value = [];
  draggedVenueId.value = null;
};

const saveSortEdit = async () => {
  if (!isSortEditing.value) return;
  const next = draftAdminOrder.value.length ? [...draftAdminOrder.value] : getBaseAdminOrder();
  const sportSlug = adminSportFilter.value;
  const sportId = sportSlug === 'all' ? undefined : sports.value.find((s) => s.slug === sportSlug)?.id;
  if (sportSlug === 'all') {
    adminOrder.value = next;
    saveAdminOrder();
    applyAdminOrder();
  }
  try {
    await db.updateVenueOrder(next, sportId);
  } catch (err) {
    console.error('Failed to persist order:', err);
  } finally {
    cancelSortEdit();
  }
  if (sportSlug !== 'all') await loadData();
};

const handleAddSport = async () => {
  const name_en = newSportName.value.trim();
  if (!name_en) return;
  addSportError.value = null;
  isAddingSport.value = true;
  try {
    const created = await db.createSport({ name_en, name_zh: newSportNameZh.value.trim() || undefined });
    sports.value = [...sports.value, created];
    newSportName.value = '';
    newSportNameZh.value = '';
    showAddSportInput.value = false;
    adminSportFilter.value = created.slug;
  } catch (err: any) {
    addSportError.value = err?.message || 'Failed to add sport.';
  } finally {
    isAddingSport.value = false;
  }
};

const cancelAddSport = () => {
  showAddSportInput.value = false;
  newSportName.value = '';
  newSportNameZh.value = '';
  addSportError.value = null;
};
</script>

<template>
  <div :class="['min-h-screen pb-safe transition-colors', darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900']">
    <Header
      :language="language"
      :setLanguage="(l: Language) => { language = l; }"
      :isAdmin="isAdmin"
      :onAdminClick="() => { if (isAdmin) currentTab = 'admin'; else { showAdminLogin = true; syncAdminUrl(true); } }"
      :darkMode="darkMode"
      :setDarkMode="(d: boolean) => { darkMode = d; }"
      :t="t"
      :currentTab="currentTab"
      :setTab="(tab: AppTab) => {
        if (tab === 'admin' && !isAdmin) showAdminLogin = true;
        else currentTab = tab;
        if (tab === 'explore') { router.push('/'); resetSeoToDefault(); selectedVenue = null; showDesktopDetail = false; }
        else { selectedVenue = null; showDesktopDetail = false; }
      }"
      :viewMode="mobileViewMode"
      :setViewMode="(mode: 'map' | 'list') => { mobileViewMode = mode; }"
    />

    <main class="h-full">
      <div
        v-if="currentTab === 'admin' && isAdmin && !selectedVenue"
        class="container mx-auto p-4 md:p-8 pb-32 md:pb-8 space-y-8 animate-in fade-in duration-500"
      >
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div class="flex flex-col gap-2">
            <h2 class="text-3xl md:text-4xl font-black tracking-tight">Manage Courts</h2>
            <div class="flex flex-wrap gap-2 items-center">
              <span class="text-xs font-bold uppercase tracking-wider opacity-60">Sport:</span>
              <button
                type="button"
                class="px-3 py-2 rounded-lg font-bold text-sm transition-all"
                :class="adminSportFilter === 'all' ? 'bg-[#007a67] text-white' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')"
                @click="adminSportFilter = 'all'"
              >
                All
              </button>
              <button
                v-for="s in sports"
                :key="s.id"
                type="button"
                class="px-3 py-2 rounded-lg font-bold text-sm transition-all"
                :class="adminSportFilter === s.slug ? 'bg-[#007a67] text-white' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')"
                @click="adminSportFilter = s.slug"
              >
                {{ sportDisplayName(s) }}
              </button>
              <template v-if="showAddSportInput">
                <input
                  v-model="newSportName"
                  type="text"
                  class="px-3 py-2 rounded-lg text-sm font-bold border-2 border-[#007a67] focus:outline-none min-w-[100px]"
                  :class="darkMode ? 'bg-gray-800 text-white border-[#007a67]' : 'bg-white text-gray-900'"
                  placeholder="English name"
                  @keydown.enter="handleAddSport"
                  @keydown.escape="cancelAddSport"
                />
                <input
                  v-model="newSportNameZh"
                  type="text"
                  class="px-3 py-2 rounded-lg text-sm font-bold border-2 border-[#007a67] focus:outline-none min-w-[100px]"
                  :class="darkMode ? 'bg-gray-800 text-white border-[#007a67]' : 'bg-white text-gray-900'"
                  placeholder="中文名稱"
                  @keydown.enter="handleAddSport"
                  @keydown.escape="cancelAddSport"
                />
                <button
                  type="button"
                  class="px-3 py-2 rounded-lg text-sm font-bold bg-[#007a67] text-white"
                  :disabled="!newSportName.trim() || isAddingSport"
                  @click="handleAddSport"
                >
                  {{ isAddingSport ? '…' : 'Add' }}
                </button>
                <button
                  type="button"
                  class="px-3 py-2 rounded-lg text-sm font-bold"
                  :class="darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'"
                  @click="cancelAddSport"
                >
                  Cancel
                </button>
              </template>
              <button
                v-else
                type="button"
                class="px-3 py-2 rounded-lg text-sm font-bold border-2 border-dashed"
                :class="darkMode ? 'border-gray-500 text-gray-400 hover:border-[#007a67] hover:text-[#007a67]' : 'border-gray-400 text-gray-500 hover:border-[#007a67] hover:text-[#007a67]'"
                @click="showAddSportInput = true; addSportError = null;"
              >
                + Add sport
              </button>
            </div>
            <p v-if="addSportError" class="text-red-500 text-xs font-bold mt-1">{{ addSportError }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-if="!isSortEditing"
              class="px-4 py-3 md:px-6 md:py-3 bg-gray-500/10 text-gray-700 rounded-lg font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-xs md:text-base"
              :class="darkMode ? 'text-gray-200 bg-gray-700/40' : ''"
              @click="startSortEdit"
            >
              EDIT SORT
            </button>
            <button
              v-else
              class="px-4 py-3 md:px-6 md:py-3 rounded-lg font-black shadow-xl active:scale-95 transition-all text-xs md:text-base"
              :class="isDraftDirty ? 'bg-[#007a67] text-white hover:scale-105' : (darkMode ? 'bg-gray-700 text-gray-400 opacity-60 cursor-not-allowed' : 'bg-gray-200 text-gray-400 opacity-60 cursor-not-allowed')"
              :disabled="!isDraftDirty"
              @click="saveSortEdit"
            >
              SAVE SORT
            </button>
            <button
              v-if="isSortEditing"
              class="px-4 py-3 md:px-6 md:py-3 bg-gray-500/10 text-gray-700 rounded-lg font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-xs md:text-base"
              :class="darkMode ? 'text-gray-200 bg-gray-700/40' : ''"
              @click="cancelSortEdit"
            >
              CANCEL
            </button>
            <button
              v-if="!isSortEditing"
              class="px-4 py-3 md:px-6 md:py-3 bg-[#007a67] text-white rounded-lg font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-xs md:text-base"
              @click="() => { editingVenue = null; showVenueForm = true; }"
            >
              + ADD NEW
            </button>
            <button
              v-if="!isSortEditing"
              class="px-4 py-3 md:px-6 md:py-3 bg-red-500 text-white rounded-lg font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-xs md:text-base"
              @click="() => { isAdmin = false; currentTab = 'explore'; }"
            >
              LOGOUT
            </button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="(v, index) in adminVenues"
            :key="v.id"
            class="p-4 border rounded-3xl shadow-md flex items-center justify-between group transition-all hover:shadow-xl gap-2"
            :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'"
            :draggable="isSortEditing"
            @dragstart="handleDragStart(v.id)"
            @dragover.prevent
            @drop="handleDrop(v.id)"
          >
            <div class="flex items-center gap-2 flex-shrink-0">
              <div class="flex flex-col items-center gap-0.5">
                <button
                  type="button"
                  class="p-2 rounded-lg transition-colors touch-manipulation"
                  :class="!isSortEditing ? 'opacity-30 cursor-not-allowed' : (displayIndexById.get(v.id) === 0 ? 'opacity-30 cursor-not-allowed' : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'))"
                  :disabled="!isSortEditing || displayIndexById.get(v.id) === 0"
                  :aria-label="language === 'en' ? 'Move up' : '上移'"
                  @click.stop="handleMoveUp(v.id)"
                >
                  ▲
                </button>
                <span
                  class="text-sm font-black tabular-nums min-w-[1.25rem] text-center"
                  :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
                >
                  {{ (displayIndexById.get(v.id) ?? index) + 1 }}
                </span>
                <button
                  type="button"
                  class="p-2 rounded-lg transition-colors touch-manipulation"
                  :class="!isSortEditing ? 'opacity-30 cursor-not-allowed' : ((displayIndexById.get(v.id) ?? index) === adminVenues.length - 1 ? 'opacity-30 cursor-not-allowed' : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'))"
                  :disabled="!isSortEditing || (displayIndexById.get(v.id) ?? index) === adminVenues.length - 1"
                  :aria-label="language === 'en' ? 'Move down' : '下移'"
                  @click.stop="handleMoveDown(v.id)"
                >
                  ▼
                </button>
              </div>
            </div>
            <div class="flex items-center gap-4 min-w-0 flex-1">
              <div class="w-16 h-16 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                <img :src="v.org_icon || v.images[0] || '/placeholder.svg'" class="w-full h-full object-cover" alt="" />
              </div>
              <div class="min-w-0">
                <p class="font-black truncate">{{ v.name }}</p>
                <p class="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                  ${{ v.startingPrice }}/HR
                </p>
              </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
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
          class="flex-1 p-4 md:p-6 animate-in fade-in duration-300"
          aria-busy="true"
          aria-label="Loading courts"
        >
          <div class="max-w-4xl mx-auto space-y-4">
            <div
              v-for="i in 6"
              :key="i"
              class="rounded-2xl overflow-hidden border shadow-sm flex gap-4 p-4 items-center"
              :class="darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'"
            >
              <div
                class="w-16 h-16 md:w-20 md:h-20 rounded-xl flex-shrink-0 animate-pulse"
                :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"
              />
              <div class="flex-1 min-w-0 space-y-2">
                <div
                  class="h-5 w-3/4 rounded animate-pulse"
                  :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"
                />
                <div
                  class="h-4 w-1/2 rounded animate-pulse"
                  :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"
                />
                <div
                  class="h-4 w-1/4 rounded animate-pulse"
                  :class="darkMode ? 'bg-gray-700' : 'bg-gray-300'"
                />
              </div>
            </div>
          </div>
          <p class="text-center font-black text-sm tracking-widest opacity-50 uppercase mt-6">
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
          :setMtrFilter="(arr: string[]) => { mtrFilter = arr; }"
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
          :onClearFilters="clearFilters"
          :onOpenDetail="() => { if (selectedVenue) router.push('/venues/' + useVenueSlug(selectedVenue)); }"
          :onBackFromDetail="() => { resetSeoToDefault(); router.push('/'); }"
          :force-show-detail="route.name === 'venue' && !!selectedVenue"
        />

        <VenueDetail
          v-else-if="showDesktopDetail && selectedVenue"
          :venue="selectedVenue"
          :onBack="() => { resetSeoToDefault(); selectedVenue = null; showDesktopDetail = false; router.push('/'); }"
          :language="language"
          :t="t"
          :darkMode="darkMode"
          :savedVenues="savedVenues"
          :toggleSave="toggleSaveVenue"
          :isAdmin="isAdmin"
          :onEdit="() => { editingVenue = selectedVenue; showVenueForm = true; }"
        />

        <DesktopView
          v-else
          :venues="filteredVenues"
          :selectedVenue="selectedVenue"
          :onSelectVenue="(v: Venue | null) => { selectedVenue = v; }"
          :onViewDetail="(v: Venue) => { selectedVenue = v; showDesktopDetail = true; router.push('/venues/' + useVenueSlug(v)); }"
          :searchQuery="searchQuery"
          :setSearchQuery="(s: string) => { searchQuery = s; }"
          :mtrFilter="mtrFilter"
          :setMtrFilter="(arr: string[]) => { mtrFilter = arr; }"
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
          :onClearFilters="clearFilters"
          :currentTab="currentTab"
          :setTab="(t: AppTab) => { currentTab = t; }"
        />
      </div>
    </main>

    <AdminLogin
      v-if="showAdminLogin"
      :password="adminPassword"
      :setPassword="(val: string) => { adminPassword = val; }"
      :onLogin="handleAdminLogin"
      :onClose="() => { showAdminLogin = false; syncAdminUrl(false); }"
      :language="language"
      :t="t"
      :darkMode="darkMode"
    />

    <VenueForm
      v-if="showVenueForm"
      :venue="editingVenue"
      :sports="sports"
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

    <!-- <MobileNav
      v-if="isMobile"
      :currentTab="currentTab"
      :setTab="(t: AppTab) => { currentTab = t; }"
      :t="t"
      :darkMode="darkMode"
      :isAdmin="isAdmin"
      :onAdminClick="() => { if (isAdmin) currentTab = 'admin'; else { showAdminLogin = true; syncAdminUrl(true); } }"
    /> -->
  </div>
</template>


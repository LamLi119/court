<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { Venue, Language } from '../../types';

declare const google: any;

const props = defineProps<{
  venue: Venue | null;
  onSave: (v: any) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: number) => void;
  language: Language;
  t: (key: string) => string;
  darkMode: boolean;
}>();

const formData = reactive<any>(
  props.venue || {
    name: '',
    description: '',
    mtrStation: '',
    mtrExit: '',
    walkingDistance: 0,
    address: '',
    ceilingHeight: 0,
    startingPrice: 0,
    pricing: { type: 'text', content: '', imageUrl: '' },
    images: [],
    amenities: [],
    whatsapp: '',
    socialLink: '',
    coordinates: { lat: 22.3193, lng: 114.1694 }
  }
);

const placesApiError = ref(false);
const isUploading = ref(false);
const isSaving = ref(false);
const saveError = ref<string | null>(null);

const fileInputRef = ref<HTMLInputElement | null>(null);
const pricingImageRef = ref<HTMLInputElement | null>(null);
const addressInputRef = ref<HTMLInputElement | null>(null);
const autocompleteRef = ref<any>(null);

// Init Places autocomplete if available
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!addressInputRef.value) return;

    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      console.warn('Places API not available. Autocomplete disabled.');
      placesApiError.value = true;
      return;
    }

    try {
      autocompleteRef.value = new google.maps.places.Autocomplete(addressInputRef.value, {
        componentRestrictions: { country: 'hk' },
        fields: ['geometry', 'formatted_address'],
        types: ['establishment', 'geocode']
      });

      autocompleteRef.value.addListener('place_changed', () => {
        const place = autocompleteRef.value.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        const latLng = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };

        formData.address = place.formatted_address;
        formData.coordinates = latLng;
      });
    } catch (err) {
      console.error('Failed to initialize Autocomplete:', err);
      placesApiError.value = true;
    }
  }, 0);
}

const handleImageUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files || []) as File[];
  if (files.length === 0) return;

  isUploading.value = true;
  saveError.value = null;

  try {
    const uploadPromises = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file as Blob);
        })
    );

    const results = await Promise.all(uploadPromises);
    formData.images = [...formData.images, ...results].slice(0, 12);
  } catch (err) {
    console.error('Upload failed', err);
    saveError.value = 'Failed to upload photos.';
  } finally {
    isUploading.value = false;
    if (fileInputRef.value) fileInputRef.value.value = '';
  }
};

const handlePricingImageUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  isUploading.value = true;
  saveError.value = null;

  try {
    const result = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file as Blob);
    });

    formData.pricing = { ...formData.pricing, imageUrl: result, type: 'image' };
  } catch (err) {
    console.error('Pricing upload failed', err);
    saveError.value = 'Failed to upload pricing image.';
  } finally {
    isUploading.value = false;
    if (pricingImageRef.value) pricingImageRef.value.value = '';
  }
};

const handleSubmit = async (e?: Event) => {
  if (e) e.preventDefault();
  if (isUploading.value || isSaving.value) return;
  isSaving.value = true;
  saveError.value = null;
  try {
    await props.onSave(formData);
  } catch (err: any) {
    saveError.value = err?.message || 'An unexpected error occurred while saving.';
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = () => {
  if (!props.venue || !props.onDelete) return;
  props.onDelete(props.venue.id);
};

const labelClass =
  'block mb-1 text-[12px] font-[900] uppercase tracking-wider ' +
  (props.darkMode ? 'text-gray-400' : 'text-gray-500');
const inputClass =
  'w-full px-4 py-3 border rounded-[12px] focus:ring-2 focus:ring-[#007a67] focus:outline-none transition-all ' +
  (props.darkMode
    ? 'bg-gray-700 border-gray-600 text-white'
    : 'bg-white border-gray-200 text-gray-900');
</script>

<template>
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="venue-form-title"
    class="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-0 md:p-4"
  >
    <div
      class="w-full max-w-4xl h-full md:h-[90vh] flex flex-col shadow-2xl md:rounded-[16px] animate-in zoom-in duration-300 overflow-hidden"
      :class="darkMode ? 'bg-gray-800' : 'bg-white'"
    >
      <div class="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-inherit">
        <h2
          id="venue-form-title"
          class="text-[24px] font-[900]"
        >
          Court Management
        </h2>
        <button
          class="text-3xl font-light hover:opacity-50 transition-opacity"
          aria-label="Close form"
          @click="onCancel"
        >
          ×
        </button>
      </div>

      <form
        class="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"
        @submit.prevent="handleSubmit"
      >
        <div
          v-if="saveError"
          class="animate-in slide-in-from-top-4 duration-300 p-4 bg-red-500 rounded-[12px] flex items-start gap-3 shadow-lg shadow-red-500/20"
        >
          <span class="text-2xl">⚠️</span>
          <div class="flex-1">
            <h4 class="text-white font-[900] text-[12px] uppercase tracking-widest mb-1">
              Save Failed
            </h4>
            <p class="text-white text-[12px] font-[700] leading-relaxed">
              {{ saveError }}
            </p>
          </div>
          <button
            class="text-white/60 hover:text-white font-[900] text-xl"
            @click.prevent="saveError = null"
          >
            ×
          </button>
        </div>

        <div class="relative">
          <label
            :class="labelClass"
          >
            {{ language === 'en' ? 'Full Address *' : '詳細地址 *' }}
          </label>
          <input
            ref="addressInputRef"
            v-model="formData.address"
            type="text"
            :class="inputClass"
            required
            placeholder="Start typing building or street name..."
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label :class="labelClass">Court Name *</label>
            <input
              v-model="formData.name"
              type="text"
              :class="inputClass"
              required
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label :class="labelClass">MTR Station</label>
              <input
                v-model="formData.mtrStation"
                type="text"
                :class="inputClass"
              />
            </div>
            <div>
              <label :class="labelClass">MTR Exit</label>
              <input
                v-model="formData.mtrExit"
                type="text"
                :class="inputClass"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label :class="labelClass">Walking (min)</label>
            <input
              v-model.number="formData.walkingDistance"
              type="number"
              :class="inputClass"
            />
          </div>
          <div>
            <label :class="labelClass">Starting Price *</label>
            <input
              v-model.number="formData.startingPrice"
              type="number"
              :class="inputClass"
              required
            />
          </div>
          <div>
            <label :class="labelClass">Ceiling (m)</label>
            <input
              v-model.number="formData.ceilingHeight"
              type="number"
              step="0.1"
              :class="inputClass"
            />
          </div>
        </div>

        <div>
          <label :class="labelClass">Description</label>
          <textarea
            v-model="formData.description"
            class="h-24"
            :class="inputClass"
            placeholder="Describe the court highlights..."
          />
        </div>

        <div>
          <label :class="labelClass">WhatsApp Number *</label>
          <input
            v-model="formData.whatsapp"
            type="text"
            :class="inputClass"
            required
          />
        </div>

        <div>
          <label :class="labelClass">Social Media Link</label>
          <input
            v-model="formData.socialLink"
            type="url"
            :class="inputClass"
            placeholder="https://instagram.com/..."
          />
        </div>

        <div class="space-y-4">
          <label :class="labelClass">Photos (Max 12)</label>
          <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div
              v-for="(img, i) in formData.images"
              :key="i"
              class="relative aspect-square rounded-[12px] overflow-hidden border dark:border-gray-600"
            >
              <img
                :src="img"
                class="w-full h-full object-cover"
                alt=""
              />
              <button
                type="button"
                class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                @click="formData.images = formData.images.filter((_: string, idx: number) => idx !== i)"
              >
                ×
              </button>
            </div>

            <div
              v-if="isUploading"
              class="aspect-square rounded-[12px] border-2 border-dashed border-[#007a67] flex items-center justify-center bg-[#007a67]/5"
            >
              <div class="w-6 h-6 border-2 border-[#007a67]/20 border-l-[#007a67] rounded-full animate-spin"></div>
            </div>

            <button
              v-if="formData.images.length < 12 && !isUploading"
              type="button"
              class="aspect-square rounded-[12px] border-2 border-dashed flex items-center justify-center text-gray-400 hover:border-[#007a67] hover:text-[#007a67] transition-all bg-gray-50 dark:bg-gray-700/30"
              @click="fileInputRef?.click()"
            >
              <span class="text-2xl">+</span>
            </button>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            class="hidden"
            multiple
            accept="image/*"
            @change="handleImageUpload"
          />
        </div>

        <div class="space-y-4">
          <label :class="labelClass">Pricing Info</label>
          <div class="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-[8px] text-[10px] font-[900]">
            <button
              type="button"
              class="px-3 py-1 rounded-[6px]"
              :class="formData.pricing.type === 'text' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'opacity-40'"
              @click="formData.pricing.type = 'text'"
            >
              TEXT
            </button>
            <button
              type="button"
              class="px-3 py-1 rounded-[6px]"
              :class="formData.pricing.type === 'image' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'opacity-40'"
              @click="formData.pricing.type = 'image'"
            >
              IMAGE
            </button>
          </div>
          <textarea
            v-if="formData.pricing.type === 'text'"
            v-model="formData.pricing.content"
            class="h-24"
            :class="inputClass"
          />
          <div
            v-else
            class="relative h-40 border-2 border-dashed rounded-[12px] flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 overflow-hidden"
          >
            <template v-if="formData.pricing.imageUrl">
              <img
                :src="formData.pricing.imageUrl"
                class="h-full w-full object-contain"
                alt=""
              />
              <button
                type="button"
                class="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
                @click="formData.pricing.imageUrl = ''"
              >
                ×
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="text-xs font-bold text-gray-400"
                @click="pricingImageRef?.click()"
              >
                Upload Pricing Image
              </button>
            </template>
            <input
              ref="pricingImageRef"
              type="file"
              class="hidden"
              accept="image/*"
              @change="handlePricingImageUpload"
            />
          </div>
        </div>
      </form>

      <div class="p-6 border-t dark:border-gray-700 flex gap-4 bg-white dark:bg-gray-800 md:rounded-b-[16px]">
        <button
          type="submit"
          class="flex-1 px-6 py-4 rounded-[8px] font-[900] text-lg shadow-xl active:scale-95 transition-all uppercase flex items-center justify-center gap-3"
          :class="isUploading || isSaving ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-[#007a67] text-white hover:brightness-105'"
          :disabled="isUploading || isSaving"
          @click="handleSubmit"
        >
          <div
            v-if="isUploading || isSaving"
            class="w-5 h-5 border-3 border-white/20 border-l-white rounded-full animate-spin"
          ></div>
          {{ isSaving ? 'Saving...' : 'Save Court' }}
        </button>
        <button
          v-if="venue && !isSaving"
          type="button"
          class="px-6 py-4 bg-red-500 text-white rounded-[8px] font-[900] active:scale-95 transition-all"
          @click="handleDelete"
        >
          DELETE
        </button>
      </div>
    </div>
  </div>
</template>


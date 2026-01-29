<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  images: string[];
}>();

const index = ref(0);
</script>

<template>
  <div
    v-if="!images || images.length === 0"
    class="w-full h-48 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400 italic"
  >
    No images available
  </div>
  <div
    v-else
    class="relative group"
  >
    <div
      class="relative h-[300px] md:h-[450px] rounded-2xl overflow-hidden shadow-xl bg-gray-100 dark:bg-gray-800"
    >
      <img
        :src="images[index]"
        class="w-full h-full object-cover transition-opacity duration-300"
        :alt="`Court photo ${index + 1}`"
      />

      <template v-if="images.length > 1">
        <button
          class="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur flex items-center justify-center shadow-lg transition-all"
          @click="index = index === 0 ? images.length - 1 : index - 1"
        >
          ←
        </button>
        <button
          class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur flex items-center justify-center shadow-lg transition-all"
          @click="index = index === images.length - 1 ? 0 : index + 1"
        >
          →
        </button>
        <div
          class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 bg-black/20 rounded-full backdrop-blur"
        >
          <div
            v-for="(dot, i) in images"
            :key="i"
            class="w-1.5 h-1.5 rounded-full transition-all"
            :class="i === index ? 'bg-[#007a67] w-3' : 'bg-white/60'"
          />
        </div>
      </template>
    </div>
  </div>
</template>


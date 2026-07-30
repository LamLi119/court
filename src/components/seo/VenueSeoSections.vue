<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import type { Venue, Language } from "../../../types";
import FaqSection from "./FaqSection.vue";
import {
  buildVenueDistrictSummary,
  buildVenueFaqItems,
  buildVenueNearbyAlternatives,
  buildVenueSeoSections,
} from "../../utils/venueContent";

const props = withDefaults(
  defineProps<{
    venue: Venue;
    allVenues?: Venue[];
    language: Language;
    darkMode: boolean;
    t: (key: string) => string;
    canSeeSpecialOffer?: boolean;
    sanitizeDescription?: (html: string | undefined) => string;
    /** When false, hide under-footer SEO cards but keep the FAQ "?" button. */
    showSeoBlocks?: boolean;
  }>(),
  { showSeoBlocks: true },
);

const allVenues = computed(() => props.allVenues ?? []);
const sections = computed(() => buildVenueSeoSections(props.venue, props.language, allVenues.value));
const districtSummary = computed(() => buildVenueDistrictSummary(props.venue, allVenues.value, props.language));
const nearbyVenues = computed(() => buildVenueNearbyAlternatives(props.venue, allVenues.value, props.language, 4));
const faqItems = computed(() => buildVenueFaqItems(props.venue, allVenues.value, props.language));
const contentSections = computed(() => sections.value.filter((section) => {
  if (districtSummary.value && section.heading === districtSummary.value.heading) return false;
  const nearbyHeading = `Nearby alternatives to ${props.venue.name}`;
  if (section.heading === nearbyHeading) return false;
  return true;
}));
const primarySportSlug = computed(() => {
  const sportDataSlug = Array.isArray(props.venue.sport_data)
    ? String(props.venue.sport_data[0]?.slug || "").trim()
    : "";
  if (sportDataSlug) return sportDataSlug;
  const sportType = Array.isArray(props.venue.sport_types)
    ? String(props.venue.sport_types[0] || "").trim()
    : "";
  return sportType.toLowerCase().replace(/\s+/g, "-");
});
const districtPageHref = computed(() => {
  const districtSlug = districtSummary.value?.districtSlug;
  if (!districtSlug) return "";
  if (primarySportSlug.value) return "/search/" + primarySportSlug.value + "/" + districtSlug;
  return "/explore";
});
const hasOperatorBlurb = computed(() => !!props.venue.description?.trim());

const faqOpen = ref(false);
const faqPanelId = "venue-faq-panel";

function removeFaqJsonLd() {
  if (typeof document === "undefined") return;
  document.querySelectorAll("script[data-seo-faq]").forEach((el) => el.remove());
}

function injectFaqJsonLd() {
  if (typeof document === "undefined") return;
  removeFaqJsonLd();
  if (!faqItems.value.length) return;
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.value.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.setAttribute("data-seo-faq", "1");
  el.textContent = JSON.stringify(ld);
  document.head.appendChild(el);
}

function openFaqPanel() {
  faqOpen.value = true;
}

function closeFaqPanel() {
  faqOpen.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") closeFaqPanel();
}

watch(faqOpen, (isOpen) => {
  if (typeof document === "undefined") return;
  if (isOpen) {
    document.addEventListener("keydown", onKeydown);
    document.body.style.overflow = "hidden";
  } else {
    document.removeEventListener("keydown", onKeydown);
    document.body.style.overflow = "";
  }
});

onMounted(injectFaqJsonLd);
watch(faqItems, injectFaqJsonLd, { deep: true });

onUnmounted(() => {
  if (typeof document === "undefined") return;
  document.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
  removeFaqJsonLd();
});
</script>

<template>
  <section v-if="showSeoBlocks" class="space-y-8 pt-2" :aria-label="t('venueOverview')">
    <div
      v-for="(sec, idx) in contentSections"
      :key="idx"
      class="rounded-2xl border p-5 md:p-6"
      :class="darkMode ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-white'"
    >
      <h2
        class="text-xl md:text-2xl font-black tracking-tight mb-3"
        :class="darkMode ? 'text-white' : 'text-gray-900'"
      >
        {{ sec.heading }}
      </h2>
      <p
        v-for="(para, pIdx) in sec.paragraphs"
        :key="pIdx"
        class="text-sm md:text-base leading-relaxed"
        :class="[darkMode ? 'text-gray-300' : 'text-gray-700', pIdx > 0 ? 'mt-3' : '']"
      >
        {{ para }}
      </p>
    </div>

    <section
      v-if="districtSummary"
      class="rounded-2xl border p-5 md:p-6"
      :class="darkMode ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-white'"
    >
      <h2 class="text-xl md:text-2xl font-black tracking-tight mb-3" :class="darkMode ? 'text-white' : 'text-gray-900'">
        {{ districtSummary.heading }}
      </h2>
      <p
        v-for="(para, idx) in districtSummary.paragraphs"
        :key="idx"
        class="text-sm md:text-base leading-relaxed"
        :class="[darkMode ? 'text-gray-300' : 'text-gray-700', idx > 0 ? 'mt-3' : '']"
      >
        {{ para }}
      </p>
      <a
        v-if="districtPageHref"
        :href="districtPageHref"
        class="inline-flex mt-4 text-sm font-bold text-[#007a67] hover:underline"
      >
        Browse more venues in this district
      </a>
    </section>

    <section
      v-if="nearbyVenues.length"
      class="rounded-2xl border p-5 md:p-6"
      :class="darkMode ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-white'"
    >
      <h2 class="text-xl md:text-2xl font-black tracking-tight mb-4" :class="darkMode ? 'text-white' : 'text-gray-900'">
        {{ "Nearby alternatives to " + venue.name }}
      </h2>
      <div class="grid gap-3 md:grid-cols-2">
        <a
          v-for="item in nearbyVenues"
          :key="item.slug"
          :href="'/venues/' + item.slug"
          class="rounded-xl border p-4 transition-colors"
          :class="darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'"
        >
          <h3 class="font-black" :class="darkMode ? 'text-white' : 'text-gray-900'">{{ item.name }}</h3>
          <p class="mt-2 text-sm" :class="darkMode ? 'text-gray-400' : 'text-gray-600'">
            {{ item.district || "Hong Kong" }}
            <span v-if="item.mtr"> | {{ item.mtr }}</span>
            <span v-if="item.walkMinutes != null"> | {{ item.walkMinutes }} min walk</span>
          </p>
          <p class="mt-1 text-sm font-semibold text-[#007a67]">
            {{ item.startingPrice != null ? "HK$" + item.startingPrice + "/hr from" : "Confirm pricing with venue" }}
          </p>
        </a>
      </div>
    </section>

    <section
      v-if="hasOperatorBlurb && sanitizeDescription"
      class="rounded-2xl border p-5 md:p-6"
      :class="darkMode ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-white'"
    >
      <h2 class="text-xl md:text-2xl font-black tracking-tight mb-3" :class="darkMode ? 'text-white' : 'text-gray-900'">
        In the operator's words
      </h2>
      <div
        class="description-html text-sm md:text-base leading-relaxed"
        :class="darkMode ? 'text-gray-300' : 'text-gray-700'"
        v-html="sanitizeDescription(venue.description)"
      />
    </section>
  </section>

  <Teleport to="body">
    <button
      v-if="faqItems.length"
      type="button"
      class="fixed bottom-24 left-4 lg:bottom-6 z-[45] w-11 h-11 rounded-full border shadow-lg text-lg font-black flex items-center justify-center transition-colors"
      :class="darkMode
        ? 'bg-gray-900/95 border-gray-700 text-gray-100 hover:bg-gray-800'
        : 'bg-white/95 border-gray-200 text-gray-700 hover:bg-white'"
      :aria-expanded="faqOpen"
      :aria-controls="faqPanelId"
      :aria-label="language === 'zh' ? 'Venue FAQ' : 'Venue FAQ'"
      @click="openFaqPanel"
    >
      ?
    </button>

    <div
      v-if="faqOpen"
      class="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="faqPanelId + '-title'"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/50"
        aria-label="Close"
        @click="closeFaqPanel"
      />
      <div
        :id="faqPanelId"
        class="relative w-full sm:max-w-2xl max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl border shadow-2xl overflow-hidden"
        :class="darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div
          class="flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0"
          :class="darkMode ? 'border-gray-800' : 'border-gray-100'"
        >
          <h2
            :id="faqPanelId + '-title'"
            class="text-base md:text-lg font-black tracking-tight min-w-0 truncate"
            :class="darkMode ? 'text-white' : 'text-gray-900'"
          >
            {{ t("faqHeading") }}
          </h2>
          <button
            type="button"
            class="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
            :class="darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'"
            aria-label="Close"
            @click="closeFaqPanel"
          >
            ×
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          <FaqSection
            :items="faqItems"
            :language="language"
            :t="t"
            :dark-mode="darkMode"
            :inject-schema="false"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

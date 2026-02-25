import { createRouter, createWebHistory } from 'vue-router';
import type { App } from 'vue';
import { slugify } from '../utils/slugify';

export const routes = [
  { path: '/', name: 'home', meta: { title: 'Courts Finder' } },
  { path: '/venues/:slug', name: 'venue', meta: { title: 'Venue' } },
  { path: '/search/:sport', name: 'search', meta: { title: 'Search' } },
  { path: '/admin', name: 'admin', meta: { title: 'Admin' } },
];

const router = createRouter({
  history: createWebHistory(typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/'),
  routes,
});

export function useVenueSlug(venue: { name: string }): string {
  return slugify(venue.name);
}

export function installRouter(app: App): void {
  app.use(router);
}

export default router;

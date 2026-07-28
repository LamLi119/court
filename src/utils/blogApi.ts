import type { BlogPost, BlogPostSummary } from '../../types';
import { courtApiUrl } from './courtApiUrl';

async function blogFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(courtApiUrl(path), {
    ...options,
    credentials: options?.credentials ?? 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
}

export async function getBlogPosts(): Promise<BlogPostSummary[]> {
  const res = await blogFetch('/api/blog');
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const res = await blogFetch(`/api/blog/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

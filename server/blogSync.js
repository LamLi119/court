/**
 * Orchestrate Notion → MySQL blog sync.
 * Skips pages whose Notion id already exists with the same notion_last_edited
 * unless force=true.
 */
import {
  createNotionClient,
  fetchAllBlocks,
  fetchPublishedNotionPages,
} from './notionBlog.js';
import { blocksToHtml, copyCoverToGcs } from './notionBlocksToHtml.js';
import {
  deleteBlogPostsNotIn,
  getAllPublishedSlugs,
  getBlogPostsSyncIndex,
  isNotionLastEditedUnchanged,
  upsertBlogPost,
} from './blogRepo.js';
import { submitIndexNowUrls } from '../lib/indexnow.js';

function blogPublicUrl(slug, baseUrl) {
  const base = (baseUrl || process.env.SITEMAP_BASE_URL || 'https://courts.theground.io').replace(/\/$/, '');
  return `${base}/blog/${slug}`;
}

/**
 * @param {import('mysql2/promise').Pool} db
 * @param {{ force?: boolean }} [opts]
 */
export async function syncBlogFromNotion(db, opts = {}) {
  const force = Boolean(opts.force);
  const pages = await fetchPublishedNotionPages();
  const notion = createNotionClient();
  const keptIds = [];
  const copiedSlugs = [];
  const changedUrls = [];
  let synced = 0;
  let skipped = 0;
  const baseUrl = process.env.SITEMAP_BASE_URL || 'https://courts.theground.io';

  const existingSlugs = new Set(await getAllPublishedSlugs(db));
  const existingById = await getBlogPostsSyncIndex(db);

  for (const page of pages) {
    keptIds.push(page.id);
    const existing = existingById.get(String(page.id));
    const unchanged =
      !force &&
      existing &&
      isNotionLastEditedUnchanged(existing.notion_last_edited, page.notionLastEdited);

    if (unchanged) {
      skipped += 1;
      continue;
    }

    const blocks = await fetchAllBlocks(notion, page.id);
    const cover_url = await copyCoverToGcs(page.coverSourceUrl, page.id);
    const coverVersion = page.notionLastEdited
      ? new Date(page.notionLastEdited).getTime()
      : Date.now();
    const body_html = await blocksToHtml(blocks, page.id, undefined, {
      coverUrl: cover_url,
      coverSourceUrl: page.coverSourceUrl,
    });

    await upsertBlogPost(db, {
      id: page.id,
      slug: page.slug,
      title: page.title,
      summary: page.summary,
      cover_url: cover_url ? `${cover_url}${cover_url.includes('?') ? '&' : '?'}v=${coverVersion}` : null,
      body_html,
      status: 'Published',
      published_at: page.publishedAt || page.notionLastEdited,
      notion_last_edited: page.notionLastEdited,
    });

    synced += 1;
    copiedSlugs.push(page.slug);
    changedUrls.push(blogPublicUrl(page.slug, baseUrl));
    if (!existingSlugs.has(page.slug)) {
      changedUrls.push(`${baseUrl.replace(/\/$/, '')}/blog`);
    }
  }

  const removed = await deleteBlogPostsNotIn(db, keptIds);

  if (changedUrls.length) {
    submitIndexNowUrls(changedUrls).catch(() => {});
  }

  return {
    synced,
    skipped,
    removed,
    forced: force,
    slugs: pages.map((p) => p.slug),
    copiedSlugs,
  };
}

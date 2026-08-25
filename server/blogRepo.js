/**
 * MySQL persistence for synced blog posts.
 */

function toMysqlDatetime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export async function listPublishedBlogPosts(db) {
  const [rows] = await db.execute(
    `SELECT id, slug, title, summary, cover_url, published_at, synced_at, updated_at
     FROM blog_posts
     WHERE status = 'Published'
     ORDER BY published_at DESC, synced_at DESC`
  );
  return rows || [];
}

export async function getBlogPostBySlug(db, slug) {
  const [rows] = await db.execute(
    `SELECT id, slug, title, summary, cover_url, body_html, published_at, synced_at, updated_at
     FROM blog_posts
     WHERE slug = ? AND status = 'Published'
     LIMIT 1`,
    [slug]
  );
  return rows?.[0] || null;
}

export async function upsertBlogPost(db, post) {
  const now = toMysqlDatetime(new Date());
  await db.execute(
    `INSERT INTO blog_posts (
      id, slug, title, summary, cover_url, body_html, status,
      published_at, notion_last_edited, synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      slug = VALUES(slug),
      title = VALUES(title),
      summary = VALUES(summary),
      cover_url = VALUES(cover_url),
      body_html = VALUES(body_html),
      status = VALUES(status),
      published_at = VALUES(published_at),
      notion_last_edited = VALUES(notion_last_edited),
      synced_at = VALUES(synced_at)`,
    [
      post.id,
      post.slug,
      post.title,
      post.summary || null,
      post.cover_url || null,
      post.body_html || '',
      post.status || 'Published',
      toMysqlDatetime(post.published_at),
      toMysqlDatetime(post.notion_last_edited),
      now,
    ]
  );
}

export async function deleteBlogPostsNotIn(db, ids) {
  const keep = Array.isArray(ids) ? ids.filter(Boolean) : [];
  if (keep.length === 0) {
    const [result] = await db.execute(`DELETE FROM blog_posts`);
    return result?.affectedRows || 0;
  }
  const placeholders = keep.map(() => '?').join(', ');
  const [result] = await db.execute(
    `DELETE FROM blog_posts WHERE id NOT IN (${placeholders})`,
    keep
  );
  return result?.affectedRows || 0;
}

export async function getAllPublishedSlugs(db) {
  const [rows] = await db.execute(
    `SELECT slug FROM blog_posts WHERE status = 'Published'`
  );
  return (rows || []).map((r) => r.slug).filter(Boolean);
}

/** Existing rows keyed by Notion page id for skip-if-unchanged sync. */
export async function getBlogPostsSyncIndex(db) {
  const [rows] = await db.execute(
    `SELECT id, slug, notion_last_edited FROM blog_posts`
  );
  const map = new Map();
  for (const row of rows || []) {
    if (!row?.id) continue;
    map.set(String(row.id), {
      id: String(row.id),
      slug: row.slug || '',
      notion_last_edited: row.notion_last_edited || null,
    });
  }
  return map;
}

/** Compare Notion last_edited_time to stored MySQL datetime (second precision). */
export function isNotionLastEditedUnchanged(stored, notionLastEdited) {
  if (!stored || !notionLastEdited) return false;
  const a = new Date(stored).getTime();
  const b = new Date(notionLastEdited).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.floor(a / 1000) === Math.floor(b / 1000);
}

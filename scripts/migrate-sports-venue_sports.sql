
-- Relational sports model: different sort order per sport per venue.
-- Run once on your MySQL database (e.g. Google Cloud SQL).

-- 1. Sports lookup table (name = English, name_zh = Chinese for language switch)
CREATE TABLE IF NOT EXISTS sports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_zh VARCHAR(100) DEFAULT NULL,
  slug VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_sports_slug (slug)
);

-- If table already exists without name_zh, add it:
-- ALTER TABLE sports ADD COLUMN name_zh VARCHAR(100) DEFAULT NULL AFTER name;

-- 2. Junction: venue + sport + sort_order for that sport
CREATE TABLE IF NOT EXISTS venue_sports (
  venue_id INT NOT NULL,
  sport_id INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (venue_id, sport_id),
  KEY idx_venue_sports_sport (sport_id),
  CONSTRAINT fk_venue_sports_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE,
  CONSTRAINT fk_venue_sports_sport FOREIGN KEY (sport_id) REFERENCES sports (id) ON DELETE CASCADE
);

-- 3. Seed default sports (idempotent: ignore if exists)
INSERT IGNORE INTO sports (name, name_zh, slug) VALUES
  ('Pickleball', '匹克球', 'pickleball'),
  ('Baseball', '棒球', 'baseball'),
  ('Tennis', '網球', 'tennis'),
  ('Badminton', '羽毛球', 'badminton'),
  ('Basketball', '籃球', 'basketball');

-- 4. Optional: soft delete (run only if you want hidden courts)
-- ALTER TABLE venues ADD COLUMN hidden TINYINT(1) NOT NULL DEFAULT 0;

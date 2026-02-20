-- Fix "Data too long for column 'orgIcon'" by enlarging the column.
-- Run this once on your MySQL database (e.g. Google Cloud SQL).
-- orgIcon stores ImgBB URLs; 2048 chars is enough for any normal URL.

ALTER TABLE venues
  MODIFY COLUMN `orgIcon` VARCHAR(2048) NULL;

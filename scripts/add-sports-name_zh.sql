-- Run this if you already have a sports table without name_zh (e.g. from an earlier migration).
ALTER TABLE sports ADD COLUMN name_zh VARCHAR(100) DEFAULT NULL AFTER name;

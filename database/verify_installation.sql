-- ELITE CONVENTION HALL | PHASE 3 READ-ONLY VERIFICATION
USE `elite_convention_hall`;
SELECT VERSION() AS mysql_version;
SELECT COUNT(*) AS applied_migrations FROM schema_migrations;
SELECT version, description, applied_at FROM schema_migrations ORDER BY version;
SELECT COUNT(*) AS application_tables FROM information_schema.TABLES
  WHERE TABLE_SCHEMA='elite_convention_hall' AND TABLE_TYPE='BASE TABLE';
SELECT display_mode FROM inquiry_count_settings WHERE id=1;
SELECT COUNT(*) AS real_inquiry_records FROM inquiries;
SELECT COUNT(*) AS manual_count_dates FROM manual_inquiry_counts;
-- Option A inspection: test against existing manual records; absent rows cannot be auto-filled.
SELECT event_date, display_count FROM manual_inquiry_counts ORDER BY event_date LIMIT 20;
-- Real counts for calendar data; replace dates with a selected month.
SELECT event_date, COUNT(*) AS real_count FROM inquiries
WHERE event_date BETWEEN '2026-10-01' AND '2026-10-31'
GROUP BY event_date ORDER BY event_date;
-- Manual counts: only dates explicitly entered are returned, including 0.
SELECT event_date, display_count AS manual_count FROM manual_inquiry_counts
WHERE event_date BETWEEN '2026-10-01' AND '2026-10-31'
ORDER BY event_date;
-- Check singleton tables were initialized.
SELECT (SELECT COUNT(*) FROM website_settings) AS website_settings_rows,
       (SELECT COUNT(*) FROM hero_content) AS hero_rows,
       (SELECT COUNT(*) FROM about_content) AS about_rows,
       (SELECT COUNT(*) FROM contact_information) AS contact_rows,
       (SELECT COUNT(*) FROM footer_settings) AS footer_rows,
       (SELECT COUNT(*) FROM inquiry_count_settings) AS calendar_settings_rows;

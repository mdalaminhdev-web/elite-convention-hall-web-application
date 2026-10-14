-- ELITE CONVENTION HALL | WEBSITE AND ADMIN CMS ONLY
-- INITIAL DATABASE SETUP FOR MYSQL WORKBENCH (MySQL >= 8.0.16)
-- Generated from the approved 40-page Website PRD and Option A count behavior.
-- Run once on a NEW database. Never use this as an upgrade script for an existing deployment.

-- ELITE CONVENTION HALL | WEBSITE + ADMIN CMS ONLY
-- Migration: 000_database.sql | Database and migration ledger
-- MySQL >= 8.0.16 | InnoDB | utf8mb4
-- Initial installation: execute migration files in numeric order.

CREATE DATABASE IF NOT EXISTS `elite_convention_hall`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE `elite_convention_hall`;

CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `version` VARCHAR(12) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `applied_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT IGNORE INTO `schema_migrations` (`version`,`description`) VALUES
 ('000','Bootstrap database and migration ledger');


-- ELITE CONVENTION HALL | WEBSITE + ADMIN CMS ONLY
-- Migration: 001_admin_security.sql | Admin accounts and durable session storage
-- MySQL >= 8.0.16 | InnoDB | utf8mb4
-- Initial installation: execute migration files in numeric order.

USE `elite_convention_hall`;

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(254) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `last_login_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_email` (`email`),
  KEY `idx_admin_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Compatible with express-mysql-session when configured with:
-- createDatabaseTable: false, schema.tableName: 'admin_sessions'.
-- expires stores Unix epoch seconds as the session store expects.
CREATE TABLE IF NOT EXISTS `admin_sessions` (
  `session_id` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` INT UNSIGNED NOT NULL,
  `data` MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_session_expires` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO `schema_migrations` (`version`,`description`) VALUES
 ('001','Admin accounts and sessions');


-- ELITE CONVENTION HALL | WEBSITE + ADMIN CMS ONLY
-- Migration: 002_media_and_site.sql | Media records and global brand settings
-- MySQL >= 8.0.16 | InnoDB | utf8mb4
-- Initial installation: execute migration files in numeric order.

USE `elite_convention_hall`;

CREATE TABLE IF NOT EXISTS `media_assets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `storage_driver` ENUM('LOCAL','OBJECT') NOT NULL DEFAULT 'LOCAL',
  `storage_key` VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `size_bytes` BIGINT UNSIGNED NOT NULL,
  `width_px` INT UNSIGNED NULL,
  `height_px` INT UNSIGNED NULL,
  `default_alt_text` VARCHAR(500) NULL,
  `uploaded_by` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_media_storage_key` (`storage_key`),
  KEY `idx_media_uploaded_by` (`uploaded_by`),
  CONSTRAINT `fk_media_admin` FOREIGN KEY (`uploaded_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_media_size` CHECK (`size_bytes` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `website_settings` (
  `id` TINYINT UNSIGNED NOT NULL,
  `brand_name` VARCHAR(160) NOT NULL DEFAULT 'Elite Convention Hall',
  `logo_media_id` BIGINT UNSIGNED NULL,
  `favicon_media_id` BIGINT UNSIGNED NULL,
  `default_meta_title` VARCHAR(255) NULL,
  `default_meta_description` VARCHAR(500) NULL,
  `updated_by` BIGINT UNSIGNED NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_website_settings_single` CHECK (`id` = 1),
  CONSTRAINT `fk_website_logo` FOREIGN KEY (`logo_media_id`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_website_favicon` FOREIGN KEY (`favicon_media_id`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_website_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO `website_settings` (`id`, `brand_name`) VALUES (1, 'Elite Convention Hall');
INSERT IGNORE INTO `schema_migrations` (`version`,`description`) VALUES
 ('002','Media assets and global settings');


-- ELITE CONVENTION HALL | WEBSITE + ADMIN CMS ONLY
-- Migration: 003_hero_about.sql | Hero and About content
-- MySQL >= 8.0.16 | InnoDB | utf8mb4
-- Initial installation: execute migration files in numeric order.

USE `elite_convention_hall`;

CREATE TABLE IF NOT EXISTS `hero_content` (
  `id` TINYINT UNSIGNED NOT NULL,
  `tagline` VARCHAR(200) NULL,
  `main_heading` VARCHAR(300) NULL,
  `supporting_description` TEXT NULL,
  `cta_text` VARCHAR(120) NULL,
  `cta_destination` VARCHAR(512) NULL,
  `cta_supporting_note` VARCHAR(500) NULL,
  `background_media_id` BIGINT UNSIGNED NULL,
  `updated_by` BIGINT UNSIGNED NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_hero_single` CHECK (`id` = 1),
  CONSTRAINT `fk_hero_background` FOREIGN KEY (`background_media_id`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_hero_editor` FOREIGN KEY (`updated_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `about_content` (
  `id` TINYINT UNSIGNED NOT NULL,
  `section_heading` VARCHAR(255) NULL,
  `introduction` TEXT NULL,
  `brand_story` TEXT NULL,
  `service_approach` TEXT NULL,
  `experience_strengths` TEXT NULL,
  `brand_values` TEXT NULL,
  `updated_by` BIGINT UNSIGNED NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_about_single` CHECK (`id` = 1),
  CONSTRAINT `fk_about_editor` FOREIGN KEY (`updated_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `about_highlights` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(160) NOT NULL,
  `description` VARCHAR(500) NULL,
  `icon_key` VARCHAR(80) NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_visible` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_about_highlights_order` (`is_visible`,`sort_order`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `about_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `media_id` BIGINT UNSIGNED NOT NULL,
  `caption` VARCHAR(500) NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_visible` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`id`),
  KEY `idx_about_images_order` (`is_visible`,`sort_order`,`id`),
  KEY `idx_about_images_media` (`media_id`),
  CONSTRAINT `fk_about_images_media` FOREIGN KEY (`media_id`) REFERENCES `media_assets` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed only literal copy supplied by the Website PRD. No invented venue facts.
INSERT IGNORE INTO `hero_content`
 (`id`,`tagline`,`main_heading`,`cta_text`,`cta_destination`,`cta_supporting_note`) VALUES
 (1,'Celebrate Your Special Moments With Us',
  'A Perfect Venue for Your Unforgettable Events',
  'Check Venue Availability','#query-calendar',
  'Select your preferred event date and submit your inquiry. Our team will confirm availability with you.');
INSERT IGNORE INTO `about_content` (`id`,`section_heading`) VALUES
 (1,'About Elite Convention Hall');
INSERT IGNORE INTO `schema_migrations` (`version`,`description`) VALUES
 ('003','Hero and About content');


-- ELITE CONVENTION HALL | WEBSITE + ADMIN CMS ONLY
-- Migration: 004_gallery.sql | Three-level gallery
-- MySQL >= 8.0.16 | InnoDB | utf8mb4
-- Initial installation: execute migration files in numeric order.

USE `elite_convention_hall`;

CREATE TABLE IF NOT EXISTS `gallery_albums` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(200) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `cover_media_id` BIGINT UNSIGNED NULL,
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_published` BOOLEAN NOT NULL DEFAULT FALSE,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gallery_album_slug` (`slug`),
  KEY `idx_gallery_public` (`is_published`,`is_featured`,`sort_order`,`id`),
  KEY `idx_album_cover` (`cover_media_id`),
  CONSTRAINT `fk_album_cover` FOREIGN KEY (`cover_media_id`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `gallery_photos` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `album_id` BIGINT UNSIGNED NOT NULL,
  `media_id` BIGINT UNSIGNED NOT NULL,
  `caption` VARCHAR(500) NULL,
  `alt_text` VARCHAR(500) NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_published` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_gallery_photo_public` (`album_id`,`is_published`,`sort_order`,`id`),
  KEY `idx_gallery_photo_media` (`media_id`),
  CONSTRAINT `fk_photo_album` FOREIGN KEY (`album_id`) REFERENCES `gallery_albums` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_photo_media` FOREIGN KEY (`media_id`) REFERENCES `media_assets` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO `schema_migrations` (`version`,`description`) VALUES
 ('004','Gallery albums and photos');


-- ELITE CONVENTION HALL | WEBSITE + ADMIN CMS ONLY
-- Migration: 005_facilities_vendors.sql | Facilities, amenities and approved vendors
-- MySQL >= 8.0.16 | InnoDB | utf8mb4
-- Initial installation: execute migration files in numeric order.

USE `elite_convention_hall`;

CREATE TABLE IF NOT EXISTS `facilities` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `capacity` INT UNSIGNED NULL,
  `capacity_note` VARCHAR(255) NULL,
  `image_media_id` BIGINT UNSIGNED NULL,
  `icon_key` VARCHAR(80) NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_published` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_facilities_public` (`is_published`,`sort_order`,`id`),
  KEY `idx_facility_image` (`image_media_id`),
  CONSTRAINT `fk_facility_image` FOREIGN KEY (`image_media_id`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_facility_capacity` CHECK (`capacity` IS NULL OR `capacity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `facility_features` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `facility_id` BIGINT UNSIGNED NOT NULL,
  `feature_type` ENUM('AMENITY','SERVICE') NOT NULL DEFAULT 'AMENITY',
  `feature_name` VARCHAR(160) NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_facility_feature_sort` (`facility_id`,`feature_type`,`sort_order`),
  CONSTRAINT `fk_facility_feature` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `vendor_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(160) NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_visible` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vendor_category_slug` (`slug`),
  KEY `idx_vendor_category_sort` (`is_visible`,`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `vendors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `short_description` VARCHAR(500) NULL,
  `details` TEXT NULL,
  `logo_media_id` BIGINT UNSIGNED NULL,
  `phone` VARCHAR(32) NULL,
  `email` VARCHAR(254) NULL,
  `website_url` VARCHAR(2048) NULL,
  `social_url` VARCHAR(2048) NULL,
  `promotion_details` TEXT NULL,
  `show_promotion` BOOLEAN NOT NULL DEFAULT FALSE,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_published` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_vendors_public` (`is_published`,`sort_order`,`id`),
  KEY `idx_vendor_category` (`category_id`),
  KEY `idx_vendor_logo` (`logo_media_id`),
  CONSTRAINT `fk_vendor_category` FOREIGN KEY (`category_id`) REFERENCES `vendor_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_vendor_logo` FOREIGN KEY (`logo_media_id`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO `schema_migrations` (`version`,`description`) VALUES
 ('005','Facilities and vendors');


-- ELITE CONVENTION HALL | WEBSITE + ADMIN CMS ONLY
-- Migration: 006_reviews_faq.sql | Testimonials and categorized FAQs
-- MySQL >= 8.0.16 | InnoDB | utf8mb4
-- Initial installation: execute migration files in numeric order.

USE `elite_convention_hall`;

CREATE TABLE IF NOT EXISTS `client_reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_name` VARCHAR(160) NOT NULL,
  `testimonial` TEXT NOT NULL,
  `event_type` VARCHAR(120) NULL,
  `rating` TINYINT UNSIGNED NULL,
  `client_photo_media_id` BIGINT UNSIGNED NULL,
  `approved_source_note` VARCHAR(500) NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_published` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_review_public` (`is_published`,`sort_order`,`id`),
  KEY `idx_review_photo` (`client_photo_media_id`),
  CONSTRAINT `fk_review_image` FOREIGN KEY (`client_photo_media_id`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_review_rating` CHECK (`rating` IS NULL OR `rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `faq_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(160) NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_visible` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_faq_category_slug` (`slug`),
  KEY `idx_faq_category_public` (`is_visible`,`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `faqs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED NULL,
  `question` VARCHAR(500) NOT NULL,
  `answer` TEXT NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_published` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_faq_public` (`is_published`,`sort_order`,`id`),
  KEY `idx_faq_category` (`category_id`),
  CONSTRAINT `fk_faq_category` FOREIGN KEY (`category_id`) REFERENCES `faq_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO `schema_migrations` (`version`,`description`) VALUES
 ('006','Client reviews and FAQs');


-- ELITE CONVENTION HALL | WEBSITE + ADMIN CMS ONLY
-- Migration: 007_contact_footer.sql | Contact details, social links and footer
-- MySQL >= 8.0.16 | InnoDB | utf8mb4
-- Initial installation: execute migration files in numeric order.

USE `elite_convention_hall`;

CREATE TABLE IF NOT EXISTS `contact_information` (
  `id` TINYINT UNSIGNED NOT NULL,
  `phone` VARCHAR(32) NULL,
  `whatsapp` VARCHAR(32) NULL,
  `email` VARCHAR(254) NULL,
  `venue_address` TEXT NULL,
  `map_url` VARCHAR(2048) NULL,
  `contact_hours` VARCHAR(500) NULL,
  `updated_by` BIGINT UNSIGNED NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_contact_single` CHECK (`id` = 1),
  CONSTRAINT `fk_contact_admin` FOREIGN KEY (`updated_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `social_links` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `platform` VARCHAR(80) NOT NULL,
  `url` VARCHAR(2048) NOT NULL,
  `placement` ENUM('CONTACT','FOOTER','BOTH') NOT NULL DEFAULT 'BOTH',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_visible` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`id`),
  KEY `idx_social_public` (`is_visible`,`sort_order`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `footer_settings` (
  `id` TINYINT UNSIGNED NOT NULL,
  `logo_media_id` BIGINT UNSIGNED NULL,
  `brand_description` TEXT NULL,
  `copyright_text` VARCHAR(500) NULL,
  `updated_by` BIGINT UNSIGNED NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_footer_single` CHECK (`id` = 1),
  CONSTRAINT `fk_footer_logo` FOREIGN KEY (`logo_media_id`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_footer_admin` FOREIGN KEY (`updated_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `footer_links` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `link_group` ENUM('QUICK','POLICY','OTHER') NOT NULL DEFAULT 'QUICK',
  `label` VARCHAR(160) NOT NULL,
  `destination` VARCHAR(2048) NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_visible` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`id`),
  KEY `idx_footer_links_public` (`is_visible`,`link_group`,`sort_order`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO `contact_information` (`id`) VALUES (1);
INSERT IGNORE INTO `footer_settings` (`id`) VALUES (1);
INSERT IGNORE INTO `schema_migrations` (`version`,`description`) VALUES
 ('007','Contact, social links and footer');


-- ELITE CONVENTION HALL | WEBSITE + ADMIN CMS ONLY
-- Migration: 008_inquiries.sql | Actual visitor inquiries: source of real counts
-- MySQL >= 8.0.16 | InnoDB | utf8mb4
-- Initial installation: execute migration files in numeric order.

USE `elite_convention_hall`;

CREATE TABLE IF NOT EXISTS `inquiries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `submission_key` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `phone_number` VARCHAR(32) NOT NULL,
  `email` VARCHAR(254) NULL,
  `event_date` DATE NOT NULL,
  `preferred_shift` ENUM('DAY','NIGHT') NOT NULL,
  `event_type` VARCHAR(120) NULL,
  `guest_count` INT UNSIGNED NULL,
  `company_organization` VARCHAR(200) NULL,
  `additional_details` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inquiry_submission_key` (`submission_key`),
  KEY `idx_inquiry_event_date` (`event_date`),
  KEY `idx_inquiry_created_at` (`created_at`),
  KEY `idx_inquiry_date_shift` (`event_date`,`preferred_shift`),
  CONSTRAINT `chk_inquiry_guests` CHECK (`guest_count` IS NULL OR `guest_count` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- This table holds genuine website submissions only. Manual count controls must NEVER write here.
-- Some fields are nullable pending final required/optional field decisions.
-- Backend validation is still required; a nullable database field is not a frontend business rule.
INSERT IGNORE INTO `schema_migrations` (`version`,`description`) VALUES
 ('008','Real website inquiries');


-- ELITE CONVENTION HALL | WEBSITE + ADMIN CMS ONLY
-- Migration: 009_inquiry_count_management.sql | Real/manual/hidden calendar and approved Option A behavior
-- MySQL >= 8.0.16 | InnoDB | utf8mb4
-- Initial installation: execute migration files in numeric order.

USE `elite_convention_hall`;

CREATE TABLE IF NOT EXISTS `manual_inquiry_counts` (
  `event_date` DATE NOT NULL,
  `display_count` INT UNSIGNED NOT NULL,
  `updated_by` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`event_date`),
  KEY `idx_manual_count_updated_by` (`updated_by`),
  CONSTRAINT `fk_manual_count_editor` FOREIGN KEY (`updated_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `inquiry_count_settings` (
  `id` TINYINT UNSIGNED NOT NULL,
  `display_mode` ENUM('REAL','MANUAL','HIDDEN') NOT NULL DEFAULT 'HIDDEN',
  `updated_by` BIGINT UNSIGNED NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_inquiry_mode_single` CHECK (`id` = 1),
  CONSTRAINT `fk_inquiry_mode_editor` FOREIGN KEY (`updated_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Initial HIDDEN mode is a conservative technical default until Admin publishes counts.
-- IMPORTANT: INSERT IGNORE MUST NOT reset an Admin's existing choice on rerun.
INSERT IGNORE INTO `inquiry_count_settings` (`id`,`display_mode`) VALUES (1,'HIDDEN');

-- APPROVED OPTION A:
-- MANUAL mode: NO ROW for event_date => omit the count from the API response.
-- MANUAL mode: row exists with display_count=0 => return 0 (not NULL / not hidden).
-- Never use COALESCE(display_count,0) to fill dates with missing manual records.
-- REAL mode is calculated ONLY from inquiries; manual mode does not touch inquiries.
-- Mode is a single ENUM field so REAL and MANUAL can never both be active.
INSERT IGNORE INTO `schema_migrations` (`version`,`description`) VALUES
 ('009','Manual and real inquiry count configuration');


-- ELITE CONVENTION HALL | WEBSITE + ADMIN CMS ONLY
-- Migration: 010_admin_audit.sql | Admin action audit log
-- MySQL >= 8.0.16 | InnoDB | utf8mb4
-- Initial installation: execute migration files in numeric order.

USE `elite_convention_hall`;

CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(100) NOT NULL,
  `entity_key` VARCHAR(160) NULL,
  `previous_state` JSON NULL,
  `new_state` JSON NULL,
  `context` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_audit_actor_date` (`admin_user_id`,`created_at`),
  KEY `idx_audit_entity_date` (`entity_type`,`entity_key`,`created_at`),
  KEY `idx_audit_date` (`created_at`),
  CONSTRAINT `fk_audit_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Application rule: never record password hashes, raw session tokens,
-- or unnecessary customer personal data in JSON audit snapshots.
INSERT IGNORE INTO `schema_migrations` (`version`,`description`) VALUES
 ('010','Website CMS administrative audit log');

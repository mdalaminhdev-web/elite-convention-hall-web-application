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

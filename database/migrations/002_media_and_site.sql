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

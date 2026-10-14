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

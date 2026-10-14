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

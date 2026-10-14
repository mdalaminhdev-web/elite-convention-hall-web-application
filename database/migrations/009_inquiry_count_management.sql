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

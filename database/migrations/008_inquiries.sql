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

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

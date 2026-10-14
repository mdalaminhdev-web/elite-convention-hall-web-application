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

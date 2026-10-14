# Database Design & Data Dictionary — Phase 3

**Approved source:** Elite Convention Hall Website PRD (40 pages), website and Website Admin CMS only.  
**Approved manual-mode rule:** Missing date has **no count**; an explicitly stored zero displays **0**.

## Architecture

A single MySQL database (`elite_convention_hall`) supplies one Express backend and two React/Vite frontends (public and Admin). Only the backend can access MySQL. Public APIs are restricted to published content and a validated inquiry submission endpoint. CMS changes and private inquiry data require authenticated authorization.

- Engine: InnoDB. Encoding: utf8mb4 (MySQL 8+ collation).
- Identifiers: primary keys are BIGINT UNSIGNED except single-row settings and date-keyed manual counts.
- Relationships: 23 foreign keys; deletion semantics are declared in migrations.
- Application timestamps: DATETIME(3); backend uses UTC and displays local times where appropriate.
- Event selection: DATE for `event_date`, never derived from a UTC datetime timestamp.
- Uploaded media: metadata/storage keys in MySQL, binary files in secure file storage.
- Admin sessions: MySQL-backed session-store-compatible `admin_sessions` table.
- No client account registration; no internal employees, CRM, bookings, payments or payroll.

## Calendar modes and exact required behavior

| Mode | Public calendar behavior | MySQL source |
|---|---|---|
| `REAL` | Real count by event_date; dates with zero genuine inquiries may display **0** | `inquiries` |
| `MANUAL` | Show only explicitly entered dates; a row with value **0** must display **0**; missing row means blank | `manual_inquiry_counts` |
| `HIDDEN` | No numeric inquiry counts displayed | `inquiry_count_settings` |

The mode is held in one singleton row in `inquiry_count_settings` to prevent Real and Manual both being enabled. The initial mode is `HIDDEN` as a conservative deployment default; a website Admin must choose the intended public mode.

**Public API implementation contract:**

- `REAL`: aggregate genuine inquiries by selected `event_date`; for dates in the displayed month not returned by SQL grouping, render 0 if displaying counts for all dates.
- `MANUAL`: return only the rows existing in `manual_inquiry_counts` for the month; do not fill missing dates with 0. Frontend must use key presence or `count !== undefined`, NOT `if (count)`.
- `HIDDEN`: omit count values for every date.
- `created_at` indicates when someone submitted; it must not replace `event_date` for calendar counts.
- The count is never an indication of confirmed booking, blocked date or venue availability.

### Sample read queries

```sql
-- Read current mode
SELECT display_mode FROM inquiry_count_settings WHERE id = 1;

-- REAL: one row per date having actual inquiries
SELECT event_date, COUNT(*) AS inquiry_count
FROM inquiries
WHERE event_date >= '2026-10-01' AND event_date < '2026-11-01'
GROUP BY event_date ORDER BY event_date;

-- MANUAL: return only explicitly-entered dates (including 0), never COALESCE missing rows
SELECT event_date, display_count AS inquiry_count
FROM manual_inquiry_counts
WHERE event_date >= '2026-10-01' AND event_date < '2026-11-01'
ORDER BY event_date;
```

## Data Dictionary

The following are initial technical column definitions, not additional business features. Nullable fields that need form validation decisions are documented in README.

### Core security and settings

**`admin_users`** (8 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `full_name` | `VARCHAR(150) NOT NULL` |
| `email` | `VARCHAR(254) NOT NULL` |
| `password_hash` | `VARCHAR(255) NOT NULL` |
| `is_active` | `BOOLEAN NOT NULL DEFAULT TRUE` |
| `last_login_at` | `DATETIME(3) NULL` |
| `created_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

**`admin_sessions`** (3 columns)

| Column | SQL definition |
|---|---|
| `session_id` | `VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL` |
| `expires` | `INT UNSIGNED NOT NULL` |
| `data` | `MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL` |

**`admin_audit_logs`** (9 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `admin_user_id` | `BIGINT UNSIGNED NULL` |
| `action` | `VARCHAR(100) NOT NULL` |
| `entity_type` | `VARCHAR(100) NOT NULL` |
| `entity_key` | `VARCHAR(160) NULL` |
| `previous_state` | `JSON NULL` |
| `new_state` | `JSON NULL` |
| `context` | `JSON NULL` |
| `created_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` |

**`media_assets`** (11 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `storage_driver` | `ENUM('LOCAL','OBJECT') NOT NULL DEFAULT 'LOCAL'` |
| `storage_key` | `VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL` |
| `original_filename` | `VARCHAR(255) NOT NULL` |
| `mime_type` | `VARCHAR(100) NOT NULL` |
| `size_bytes` | `BIGINT UNSIGNED NOT NULL` |
| `width_px` | `INT UNSIGNED NULL` |
| `height_px` | `INT UNSIGNED NULL` |
| `default_alt_text` | `VARCHAR(500) NULL` |
| `uploaded_by` | `BIGINT UNSIGNED NULL` |
| `created_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` |

**`website_settings`** (8 columns)

| Column | SQL definition |
|---|---|
| `id` | `TINYINT UNSIGNED NOT NULL` |
| `brand_name` | `VARCHAR(160) NOT NULL DEFAULT 'Elite Convention Hall'` |
| `logo_media_id` | `BIGINT UNSIGNED NULL` |
| `favicon_media_id` | `BIGINT UNSIGNED NULL` |
| `default_meta_title` | `VARCHAR(255) NULL` |
| `default_meta_description` | `VARCHAR(500) NULL` |
| `updated_by` | `BIGINT UNSIGNED NULL` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

### Hero and About

**`hero_content`** (10 columns)

| Column | SQL definition |
|---|---|
| `id` | `TINYINT UNSIGNED NOT NULL` |
| `tagline` | `VARCHAR(200) NULL` |
| `main_heading` | `VARCHAR(300) NULL` |
| `supporting_description` | `TEXT NULL` |
| `cta_text` | `VARCHAR(120) NULL` |
| `cta_destination` | `VARCHAR(512) NULL` |
| `cta_supporting_note` | `VARCHAR(500) NULL` |
| `background_media_id` | `BIGINT UNSIGNED NULL` |
| `updated_by` | `BIGINT UNSIGNED NULL` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

**`about_content`** (9 columns)

| Column | SQL definition |
|---|---|
| `id` | `TINYINT UNSIGNED NOT NULL` |
| `section_heading` | `VARCHAR(255) NULL` |
| `introduction` | `TEXT NULL` |
| `brand_story` | `TEXT NULL` |
| `service_approach` | `TEXT NULL` |
| `experience_strengths` | `TEXT NULL` |
| `brand_values` | `TEXT NULL` |
| `updated_by` | `BIGINT UNSIGNED NULL` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

**`about_highlights`** (8 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `title` | `VARCHAR(160) NOT NULL` |
| `description` | `VARCHAR(500) NULL` |
| `icon_key` | `VARCHAR(80) NULL` |
| `sort_order` | `INT UNSIGNED NOT NULL DEFAULT 0` |
| `is_visible` | `BOOLEAN NOT NULL DEFAULT TRUE` |
| `created_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

**`about_images`** (5 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `media_id` | `BIGINT UNSIGNED NOT NULL` |
| `caption` | `VARCHAR(500) NULL` |
| `sort_order` | `INT UNSIGNED NOT NULL DEFAULT 0` |
| `is_visible` | `BOOLEAN NOT NULL DEFAULT TRUE` |

### Gallery

**`gallery_albums`** (10 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `slug` | `VARCHAR(200) NOT NULL` |
| `title` | `VARCHAR(255) NOT NULL` |
| `description` | `TEXT NULL` |
| `cover_media_id` | `BIGINT UNSIGNED NULL` |
| `is_featured` | `BOOLEAN NOT NULL DEFAULT FALSE` |
| `is_published` | `BOOLEAN NOT NULL DEFAULT FALSE` |
| `sort_order` | `INT UNSIGNED NOT NULL DEFAULT 0` |
| `created_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

**`gallery_photos`** (8 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `album_id` | `BIGINT UNSIGNED NOT NULL` |
| `media_id` | `BIGINT UNSIGNED NOT NULL` |
| `caption` | `VARCHAR(500) NULL` |
| `alt_text` | `VARCHAR(500) NULL` |
| `sort_order` | `INT UNSIGNED NOT NULL DEFAULT 0` |
| `is_published` | `BOOLEAN NOT NULL DEFAULT TRUE` |
| `created_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` |

### Facilities and vendors

**`facilities`** (11 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `name` | `VARCHAR(200) NOT NULL` |
| `description` | `TEXT NULL` |
| `capacity` | `INT UNSIGNED NULL` |
| `capacity_note` | `VARCHAR(255) NULL` |
| `image_media_id` | `BIGINT UNSIGNED NULL` |
| `icon_key` | `VARCHAR(80) NULL` |
| `sort_order` | `INT UNSIGNED NOT NULL DEFAULT 0` |
| `is_published` | `BOOLEAN NOT NULL DEFAULT FALSE` |
| `created_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

**`facility_features`** (5 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `facility_id` | `BIGINT UNSIGNED NOT NULL` |
| `feature_type` | `ENUM('AMENITY','SERVICE') NOT NULL DEFAULT 'AMENITY'` |
| `feature_name` | `VARCHAR(160) NOT NULL` |
| `sort_order` | `INT UNSIGNED NOT NULL DEFAULT 0` |

**`vendor_categories`** (5 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `name` | `VARCHAR(160) NOT NULL` |
| `slug` | `VARCHAR(180) NOT NULL` |
| `sort_order` | `INT UNSIGNED NOT NULL DEFAULT 0` |
| `is_visible` | `BOOLEAN NOT NULL DEFAULT TRUE` |

**`vendors`** (16 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `category_id` | `BIGINT UNSIGNED NOT NULL` |
| `name` | `VARCHAR(200) NOT NULL` |
| `short_description` | `VARCHAR(500) NULL` |
| `details` | `TEXT NULL` |
| `logo_media_id` | `BIGINT UNSIGNED NULL` |
| `phone` | `VARCHAR(32) NULL` |
| `email` | `VARCHAR(254) NULL` |
| `website_url` | `VARCHAR(2048) NULL` |
| `social_url` | `VARCHAR(2048) NULL` |
| `promotion_details` | `TEXT NULL` |
| `show_promotion` | `BOOLEAN NOT NULL DEFAULT FALSE` |
| `sort_order` | `INT UNSIGNED NOT NULL DEFAULT 0` |
| `is_published` | `BOOLEAN NOT NULL DEFAULT FALSE` |
| `created_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

### Reviews and FAQs

**`client_reviews`** (11 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `client_name` | `VARCHAR(160) NOT NULL` |
| `testimonial` | `TEXT NOT NULL` |
| `event_type` | `VARCHAR(120) NULL` |
| `rating` | `TINYINT UNSIGNED NULL` |
| `client_photo_media_id` | `BIGINT UNSIGNED NULL` |
| `approved_source_note` | `VARCHAR(500) NULL` |
| `sort_order` | `INT UNSIGNED NOT NULL DEFAULT 0` |
| `is_published` | `BOOLEAN NOT NULL DEFAULT FALSE` |
| `created_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

**`faq_categories`** (5 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `name` | `VARCHAR(160) NOT NULL` |
| `slug` | `VARCHAR(180) NOT NULL` |
| `sort_order` | `INT UNSIGNED NOT NULL DEFAULT 0` |
| `is_visible` | `BOOLEAN NOT NULL DEFAULT TRUE` |

**`faqs`** (8 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `category_id` | `BIGINT UNSIGNED NULL` |
| `question` | `VARCHAR(500) NOT NULL` |
| `answer` | `TEXT NOT NULL` |
| `sort_order` | `INT UNSIGNED NOT NULL DEFAULT 0` |
| `is_published` | `BOOLEAN NOT NULL DEFAULT FALSE` |
| `created_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

### Contact and footer

**`contact_information`** (9 columns)

| Column | SQL definition |
|---|---|
| `id` | `TINYINT UNSIGNED NOT NULL` |
| `phone` | `VARCHAR(32) NULL` |
| `whatsapp` | `VARCHAR(32) NULL` |
| `email` | `VARCHAR(254) NULL` |
| `venue_address` | `TEXT NULL` |
| `map_url` | `VARCHAR(2048) NULL` |
| `contact_hours` | `VARCHAR(500) NULL` |
| `updated_by` | `BIGINT UNSIGNED NULL` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

**`social_links`** (6 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `platform` | `VARCHAR(80) NOT NULL` |
| `url` | `VARCHAR(2048) NOT NULL` |
| `placement` | `ENUM('CONTACT','FOOTER','BOTH') NOT NULL DEFAULT 'BOTH'` |
| `sort_order` | `INT UNSIGNED NOT NULL DEFAULT 0` |
| `is_visible` | `BOOLEAN NOT NULL DEFAULT TRUE` |

**`footer_settings`** (6 columns)

| Column | SQL definition |
|---|---|
| `id` | `TINYINT UNSIGNED NOT NULL` |
| `logo_media_id` | `BIGINT UNSIGNED NULL` |
| `brand_description` | `TEXT NULL` |
| `copyright_text` | `VARCHAR(500) NULL` |
| `updated_by` | `BIGINT UNSIGNED NULL` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

**`footer_links`** (6 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `link_group` | `ENUM('QUICK','POLICY','OTHER') NOT NULL DEFAULT 'QUICK'` |
| `label` | `VARCHAR(160) NOT NULL` |
| `destination` | `VARCHAR(2048) NOT NULL` |
| `sort_order` | `INT UNSIGNED NOT NULL DEFAULT 0` |
| `is_visible` | `BOOLEAN NOT NULL DEFAULT TRUE` |

### Calendar and inquiries

**`inquiries`** (12 columns)

| Column | SQL definition |
|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` |
| `submission_key` | `CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL` |
| `full_name` | `VARCHAR(150) NOT NULL` |
| `phone_number` | `VARCHAR(32) NOT NULL` |
| `email` | `VARCHAR(254) NULL` |
| `event_date` | `DATE NOT NULL` |
| `preferred_shift` | `ENUM('DAY','NIGHT') NOT NULL` |
| `event_type` | `VARCHAR(120) NULL` |
| `guest_count` | `INT UNSIGNED NULL` |
| `company_organization` | `VARCHAR(200) NULL` |
| `additional_details` | `TEXT NULL` |
| `created_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` |

**`manual_inquiry_counts`** (5 columns)

| Column | SQL definition |
|---|---|
| `event_date` | `DATE NOT NULL` |
| `display_count` | `INT UNSIGNED NOT NULL` |
| `updated_by` | `BIGINT UNSIGNED NULL` |
| `created_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

**`inquiry_count_settings`** (4 columns)

| Column | SQL definition |
|---|---|
| `id` | `TINYINT UNSIGNED NOT NULL` |
| `display_mode` | `ENUM('REAL','MANUAL','HIDDEN') NOT NULL DEFAULT 'HIDDEN'` |
| `updated_by` | `BIGINT UNSIGNED NULL` |
| `updated_at` | `DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)` |

## Referential integrity and deletion

- `gallery_photos.album_id` has `ON DELETE CASCADE`, so album deletion removes photo association rows. Media files remain in storage until a separately authorized orphan cleanup process handles them.
- Image references are either `RESTRICT` (preserve still-referenced media) or `SET NULL` when images can safely become absent.
- Most admin actor foreign keys use `SET NULL` so records survive account deletion; operationally prefer disabling admin accounts rather than deleting them.
- Published content is retrieved only when its publish/visibility flags are enabled; the public API must enforce visibility, not merely the frontend.
- No automatic physical deletion of personally identifiable customer inquiry data is established by the PRD. Retention/privacy rules require a separate explicit policy decision.

## Security and deployment requirements

- Create initial Admin accounts via application-controlled provisioning with a correctly hashed password; no default username/password is seeded.
- Keep MySQL behind the backend. Use distinct database credentials for migrations and the runtime app.
- Put live secrets in protected environment configuration, not the repository.
- CSRF, secure cookies, rate limiting, upload validation and audit policy belong to the application layer.
- Never write unapproved fake vendors, testimonials, or inquiries to production.
- Backup before schema upgrades and test restore before calling a production environment ready.

## Not yet production-verifed

Initial creation scripts were checked for structural integrity, relationship target references, and migration ordering. They have NOT been executed on a live MySQL server here. Before moving past Phase 3, execute the full setup on a disposable/test MySQL database and run `verify_installation.sql`.

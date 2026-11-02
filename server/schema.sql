-- Safe Trip CI - schéma MySQL / MariaDB (cPanel > phpMyAdmin > Importer)
-- Sélectionner d'abord votre base dans phpMyAdmin, puis importer ce fichier, puis data.sql.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS residences (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL DEFAULT '',
  price VARCHAR(50) NOT NULL DEFAULT '',
  original_price VARCHAR(50) NULL,
  beds INT NOT NULL DEFAULT 0,
  baths INT NOT NULL DEFAULT 0,
  sqft INT NULL,
  image_url VARCHAR(500) NOT NULL DEFAULT '',
  images LONGTEXT NULL,          -- tableau JSON de chemins /uploads/...
  tags LONGTEXT NULL,            -- tableau JSON
  blocked_dates LONGTEXT NULL,   -- tableau JSON de dates YYYY-MM-DD
  created_at BIGINT NOT NULL,
  updated_at BIGINT NULL,
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS testimonials (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL DEFAULT '',
  text TEXT NOT NULL,
  rating TINYINT NOT NULL DEFAULT 5,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reservation_clicks (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  residence_id CHAR(36) NULL,
  residence_title VARCHAR(255) NULL,
  residence_location VARCHAR(255) NULL,
  source ENUM('modal','details') NOT NULL,
  booking_date DATE NULL,
  nights INT NULL,
  status ENUM('nouveau','contacte','confirme','annule') NOT NULL DEFAULT 'nouveau',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_residence (residence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_visits (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  attempted_at DATETIME NOT NULL,
  KEY idx_ip (ip, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

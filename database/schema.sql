-- Database schema for ecommerce backend
-- Includes products, sales, payments, sale_items and idempotency handling

-- Ejecutar manualmente: CREATE DATABASE ecommerce; o CREATE DATABASE ecommerce_test;
-- y seleccionarla antes de correr este script.
-- ======================
-- PRODUCTS
-- ======================
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ======================
-- SALES
-- ======================
CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status ENUM('PENDING','CONFIRMED','FAILED','CANCELLED') NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ======================
-- SALE ITEMS
-- ======================
CREATE TABLE sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price_at_purchase DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_sale_items_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id),

  CONSTRAINT fk_sale_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ======================
-- PAYMENTS
-- ======================
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  status ENUM('PENDING','SUCCESS','FAILED','REVERSED') NOT NULL,
  external_id VARCHAR(255) NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'CLP',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_payments_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);


-- ======================
-- IDEMPOTENCY KEYS
-- ======================
CREATE TABLE idempotency_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  sale_id INT,
  status ENUM('PENDING','COMPLETED','FAILED') NOT NULL,
  response LONGTEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_idempotency_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- ======================
-- SEED DATA
-- ======================
INSERT INTO products (name, price, stock, category)
VALUES 
('Teclado Mecánico', 35000, 10, 'Periféricos'),
('Mouse Gamer', 20000, 5, 'Periféricos'),
('Monitor 24"', 120000, 2, 'Pantallas'),
('Notebook Básico', 350000, 1, 'Computación');
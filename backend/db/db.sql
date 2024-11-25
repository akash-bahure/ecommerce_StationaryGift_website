-- CREATE DATABASE ecommerce;


USE ecommerce;






-- admin tables--

CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);



-- Insert an admin user (replace '123' with your desired password)
INSERT INTO admins (username, password) VALUES ('admin', '$2b$10$7qyk.BjkUfru8UqUfoaReOpIO38TSv4qPDSAdUTNg9H3CIGmN4cm2'); 
-- '123' hashed with bcrypt (10 salt rounds)



--product table created--

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique product ID
    name VARCHAR(255) NOT NULL,          -- Name of the product
    price DECIMAL(10, 2) NOT NULL,       -- Price of the product (decimal type to handle currency)
    stock INT NOT NULL,                  -- Stock quantity available for the product
    description TEXT,                    -- Detailed description of the product
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Timestamp of when the product was added
 );  


 ALTER TABLE products
ADD COLUMN image_url varchar(200);


ALTER TABLE products
ADD COLUMN seller_id INT;


ALTER TABLE products
ADD CONSTRAINT fk_seller_id
FOREIGN KEY (seller_id) REFERENCES sellers(id);



select *from products;





-- seller table created--

CREATE TABLE sellers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
   
);
ALTER TABLE sellers
ADD COLUMN username VARCHAR(255) NOT NULL;

ALTER TABLE sellers
drop COLUMN created_at;
select *from sellers;



-- user table created--


CREATE TABLE users (
    Name VARCHAR(255) not null,
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);


ALTER TABLE users
ADD COLUMN street VARCHAR(255),
ADD COLUMN city VARCHAR(255),
ADD COLUMN state VARCHAR(255),
ADD COLUMN postal_code VARCHAR(20);





-- Orders table created--


CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY, -- Unique identifier for each order
    user_id INT NOT NULL,                    -- Foreign key referencing users table
    product_id INT NOT NULL,                 -- Foreign key referencing products table
    quantity INT NOT NULL DEFAULT 1,         -- Quantity of the product
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When the order was placed
    total_price DECIMAL(10, 2) NOT NULL,     -- Total price of the order
    order_status ENUM('Pending', 'Processing', 'Completed', 'Cancelled') DEFAULT 'Pending', -- Order status

    -- Foreign key constraints
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

alter table orders add column prduct_name varchar(200);
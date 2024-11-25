const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require("multer");
const path = require('path');
const fs = require('fs');







// Middleware
const corsOptions = {

    origin: 'http://127.0.0.1:5500', // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow Authorization header

};

// JWT Secret key
const JWT_SECRET = 'your-secret-key';  // Use a secure key in production
// app.use(bodyParser.json());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable CORS for preflight requests



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'ecommerce'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

// Import Routes
const userRoutes = require('./routes/user'); // Correct import
// const adminRoutes = require('./routes/admin');   // Correct import
// const customerRoutes = require('./routes/customer'); // Correct import

// // Use Routes
app.use('/user', userRoutes); // Ensure sellerRoutes is a middleware
// app.use('/admin', adminRoutes);
// // app.use('/customer', customerRoutes);




// Seller Registration API
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    db.query('SELECT * FROM sellers WHERE email = ?', [email], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database query error' });
        }

        if (result.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash the password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) { 
                return res.status(500).json({ error: 'Password hashing failed' });
            }

            // Insert new seller into the database
            const query = 'INSERT INTO sellers (username, email, password) VALUES (?, ?, ?)';
            db.query(query, [username, email, hashedPassword], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to register seller' });
                }

                // Create a JWT token
                const token = jwt.sign({ id: result.insertId, email: email }, 'your_jwt_secret', { expiresIn: '7d' });

                // Respond with success
                res.status(201).json({ message: 'Seller registered successfully', token: token });
            });
        });
    });
});

  /// Seller Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
  
    // Query the database for the seller
    db.query('SELECT * FROM sellers WHERE email = ?', [email], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database query error' });
      }
  
      if (result.length === 0) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }
  
      const seller = result[0];
  
      // Compare the provided password with the stored hashed password
      bcrypt.compare(password, seller.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ error: 'Password comparison error' });
        }
  
        if (!isMatch) {
          return res.status(400).json({ error: 'Invalid email or password' });
        }
  
        // Create a JWT token
        const token = jwt.sign(
          { id: seller.id, email: seller.email }, // Payload
          JWT_SECRET, // Secret key
          { expiresIn: '7d' } // Token expiration time (7 days)
        );
  
        // Send the token and sellerId in the response
        res.json({
          message: 'Login successful',
          token: token,
          sellerId: seller.id, // Include sellerId
        });
      });
    });
  });
  
  



// Dummy user data (for demonstration purposes)
const dummyUsers = {
    admin: {
        username: 'admin',
        password: '123' // Normally, passwords should be hashed
    }
};

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Endpoint for login
app.post('/admin', (req, res) => {
    const { username, password } = req.body;

    // Check if user exists in the dummy users object
    const user = dummyUsers[username];

    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials: User not found' });
    }

    // Check if password matches
    if (user.password !== password) {
        return res.status(401).json({ success: false, message: 'Invalid credentials: Incorrect password' });
    }

    // Successful login
    res.json({ success: true, message: 'Login successful' });
});





app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set the uploads directory path
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Static serving of the uploads directory
app.use('/uploads', express.static(uploadDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save files in the uploads directory
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        cb(null, `${timestamp}_${originalName}`);
    },
});

const upload = multer({ storage: storage });

// Middleware for parsing JSON bodies
app.use(express.json());

// Add new product with image upload
app.post('/addProduct', upload.single('image'), (req, res) => {
    const { name, price, stock, description,sellerId } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Get image URL


    if (!sellerId) {
        return res.status(400).json({ message: "Seller ID is required" });
    }

    const query = 'INSERT INTO products (name, price, stock, description,seller_id, image_url) VALUES (?, ?, ?,?, ?, ?)';
    db.query(query, [name, price, stock, description,sellerId, imageUrl], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error adding product');
        } else {
            res.json({ message: 'Product added successfully' });
        }
    });
});

// Delete product
app.delete('/deleteProduct/:id', (req, res) => {
    const productId = req.params.id;
    const query = 'DELETE FROM products WHERE id = ?';
    db.query(query, [productId], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error deleting product');
        } else {
            res.json({ message: 'Product deleted successfully' });
        }
    });
});

// Fetch products
app.get('/getProducts', (req, res) => {
    const query = 'SELECT * FROM products';
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ message: 'Error fetching products' });
        }
        res.json(result); // Return products in JSON format
    });
});

// Fetch a product by ID
app.get('/getProduct/:id', (req, res) => {
    const productId = req.params.id;
    db.query('SELECT * FROM products WHERE id = ?', [productId], (err, result) => {
        if (err) return res.status(500).json({ message: "Error fetching product" });
        res.json(result[0]); // Return the product
    });
});

// Update product (with optional image upload)
app.put('/updateProduct', upload.single('image'), (req, res) => {
    const { id, name, price, stock, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const query = 'UPDATE products SET name = ?, price = ?, stock = ?, description = ?, image_url = ? WHERE id = ?';
    db.query(query, [name, price, stock, description, imageUrl, id], (err, result) => {
        if (err) return res.status(500).json({ message: "Error updating product" });
        res.json({ message: "Product updated successfully" });
    });
});





/// User Registration API
app.post("/user-register", (req, res) => {
    const { name, email, password, street, city, state, postal_code } = req.body;

    // Validate that all fields are provided
    if (!name || !email || !password || !street || !city || !state || !postal_code) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email already exists
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database query error" });
        }

        if (result.length > 0) {
            return res.status(400).json({ error: "Email already exists" });
        }

        // Hash the password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: "Password hashing failed" });
            }

            // Insert new user into the database
            const query = `
                INSERT INTO users (name, email, password, street, city, state, postal_code) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(query, [name, email, hashedPassword, street, city, state, postal_code], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: "Failed to register user" });
                }

                // Create a JWT token
                const token = jwt.sign(
                    { id: result.insertId, email: email },
                    "your_jwt_secret",
                    { expiresIn: "1h" }
                );

                // Respond with success
                res.status(201).json({
                    message: "User registered successfully",
                    token: token,
                });
            });
        });
    });
});


  // User login route
app.post('/user-login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database query error' });
        }

        if (result.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = result[0];

        // Compare password with the stored hashed password
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: 'Password comparison error' });
            }

            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            // Create JWT token
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
                expiresIn: '1h', // Token expiration time (1 hour)
            });

            // Send the token and the user ID in the response
            res.json({
                message: 'Login successful',
                token,
                userId: user.id // Return the user ID as well
            });
        });
    });
});


  // API to place an order
// API to place an order
app.post("/placeOrder", (req, res) => {
    const { productId, userId, name, price } = req.body;

    // Corrected SQL query
    const query = `
        INSERT INTO orders (product_id, user_id, prduct_name, total_price, order_date)
        VALUES (?, ?, ?, ?, NOW())
    `;

    // Execute query
    db.query(query, [productId, userId, name, price], (err, result) => {
        if (err) {
            console.error("Error placing order:", err);
            res.status(500).json({ error: "Failed to place order." });
        } else {
            res.json({ message: "Order placed successfully." });
        }
    });
});

  


//   // API to fetch user orders
app.get("/getOrders/:userId", (req, res) => {
    const { userId } = req.params;
  
    const query = `
      SELECT prduct_name AS prductName, total_price, order_date AS orderDate
      FROM orders
      WHERE user_id = ?
      ORDER BY order_date DESC
    `;
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ error: "Failed to fetch orders." });
      } else {
        res.json(results);
      }
    });
  });
  

// // Order Cancellation API (Backend)
// app.put("/cancelOrder/:userId/:orderId", (req, res) => {
//     const { userId, orderId } = req.params;

//     // Check if the order exists and belongs to the user
//     const query = "SELECT * FROM orders WHERE order_id = ? AND user_id = ?";
//     db.query(query, [orderId, userId], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: "Database query error" });
//         }

//         if (result.length === 0) {
//             return res.status(400).json({ error: "Order not found or doesn't belong to this user" });
//         }

//         // Update the order status to "Cancelled"
//         const updateQuery = "UPDATE orders SET status = 'Cancelled' WHERE order_id = ?";
//         db.query(updateQuery, [orderId], (err, result) => {
//             if (err) {
//                 return res.status(500).json({ error: "Failed to cancel the order" });
//             }

//             res.status(200).json({ success: true, message: "Order cancelled successfully" });
//         });
//     });
// });





// Route for fetching sellers
app.get('/api/sellers', (req, res) => {
    const query = 'SELECT id, username, email FROM sellers';
    // console.log('Executing query:', query);  // Log the query to check it's correct
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Error fetching sellers' });
        }
        
        // console.log('Query results:', results);  // Log the results for debugging            
        
        if (results.length === 0) {
            console.log('No students found in the database.');
            return res.status(404).json({ error: 'No students data found' });
        }

        res.json(results); // Send back the students as JSON
    });
});

// Route for fetching users
app.get('/api/users', (req, res) => {
    const query = 'SELECT id,name, email,street,city,state FROM users';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Error fetching teachers' });
        }
        res.json(results); // Send back the teachers as JSON
    });
});



// Route to delete a student by ID
app.delete('/api/sellers/:id', (req, res) => {
    const studentId = req.params.id;
    const query = 'DELETE FROM sellers WHERE id = ?';

    db.query(query, [studentId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Error deleting student' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json({ message: 'Student deleted successfully' });
    });
});



// Route to delete a teacher by ID
app.delete('/api/users/:id', (req, res) => {
    const teacherId = req.params.id;
    const query = 'DELETE FROM users WHERE id = ?';

    db.query(query, [teacherId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Error deleting teacher' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        res.status(200).json({ message: 'Teacher deleted successfully' });
    });
});


// Route for fetching sellers
app.get('/api/products', (req, res) => {
    const query = 'SELECT id, name, description,price FROM products';
    // console.log('Executing query:', query);  // Log the query to check it's correct
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Error fetching sellers' });
        }
        
        // console.log('Query results:', results);  // Log the results for debugging            
        
        if (results.length === 0) {
            console.log('No product found in the database.');
            return res.status(404).json({ error: 'No products data found' });
        }

        res.json(results); // Send back the students as JSON
    });
});



// Route to delete a teacher by ID
app.delete('/api/products/:id', (req, res) => {
    const teacherId = req.params.id;
    const query = 'DELETE FROM products WHERE id = ?';

    db.query(query, [teacherId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Error deleting teacher' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'products not found' });
        }

        res.status(200).json({ message: 'products deleted successfully' });
    });
});


// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`); 
});

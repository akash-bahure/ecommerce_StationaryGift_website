const express = require('express');
const router = express.Router();
const db = require('../app').db;


// Add new address
router.post('/add-address', async (req, res) => {
  const { customerId, streetAddress, city, state, postalCode, country, addressType } = req.body;

  try {
    // SQL query to insert a new address into the database
    const [result] = await db.execute(
      `INSERT INTO customer_addresses (customer_id, street_address, city, state, postal_code, country, address_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customerId, streetAddress, city, state, postalCode, country, addressType]
    );

    res.status(200).json({ message: 'Address added successfully', addressId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error adding address', details: err });
  }
});





// Get all addresses for a customer
router.get('/get-addresses/:customerId', async (req, res) => {
    const { customerId } = req.params;
  
    try {
      // SQL query to get all addresses for the customer
      const [rows] = await db.execute(
        'SELECT * FROM customer_addresses WHERE customer_id = ?',
        [customerId]
      );
  
      if (rows.length === 0) {
        return res.status(404).json({ message: 'No addresses found' });
      }
  
      res.status(200).json({ addresses: rows });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching addresses', details: err });
    }
  });

  


  // Update an address
router.put('/update-address/:addressId', async (req, res) => {
    const { addressId } = req.params;
    const { streetAddress, city, state, postalCode, country, addressType } = req.body;
  
    try {
      // SQL query to update an existing address
      const [result] = await db.execute(
        `UPDATE customer_addresses 
         SET street_address = ?, city = ?, state = ?, postal_code = ?, country = ?, address_type = ? 
         WHERE id = ?`,
        [streetAddress, city, state, postalCode, country, addressType, addressId]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Address not found' });
      }
  
      res.status(200).json({ message: 'Address updated successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Error updating address', details: err });
    }
  });

  


  // Delete an address
router.delete('/delete-address/:addressId', async (req, res) => {
    const { addressId } = req.params;
  
    try {
      // SQL query to delete the address
      const [result] = await db.execute(
        'DELETE FROM customer_addresses WHERE id = ?',
        [addressId]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Address not found' });
      }
  
      res.status(200).json({ message: 'Address deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting address', details: err });
    }
  });
  


module.exports = router;

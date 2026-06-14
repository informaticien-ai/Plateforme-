const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');

// Get Featured Vendors
router.get('/featured', async (req, res) => {
    const pool = req.pool;
    try {
        const connection = await pool.getConnection();
        const [vendors] = await connection.query(`
            SELECT v.id, v.shopName as name, v.shopDescription as description, v.shopCategory as category, 
                   v.shopLogo as image, COUNT(p.id) as productCount,
                   COALESCE(AVG(r.rating), 0) as rating
            FROM vendors v
            LEFT JOIN products p ON v.id = p.vendorId
            LEFT JOIN reviews r ON v.id = r.vendorId
            GROUP BY v.id
            LIMIT 6
        `);
        connection.release();
        res.json({ vendors });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Register Vendor
router.post('/register', auth, [
    body('shopName').notEmpty(),
    body('email').isEmail(),
    body('phone').notEmpty(),
    body('shopCategory').notEmpty(),
    body('bankName').notEmpty(),
    body('accountNumber').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { shopName, shopDescription, shopCategory, bankName, accountNumber, paymentMethod } = req.body;
    const pool = req.pool;
    const userId = req.userId;

    try {
        const connection = await pool.getConnection();
        
        // Create vendor
        const [result] = await connection.query(
            `INSERT INTO vendors (userId, shopName, shopDescription, shopCategory, bankName, accountNumber, status, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [userId, shopName, shopDescription, shopCategory, bankName, accountNumber, 'pending']
        );

        connection.release();

        res.status(201).json({
            vendorId: result.insertId,
            message: 'Vendor registration successful'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Vendor Dashboard
router.get('/dashboard', auth, async (req, res) => {
    const pool = req.pool;
    const userId = req.userId;

    try {
        const connection = await pool.getConnection();
        
        // Get vendor info
        const [vendors] = await connection.query(
            'SELECT * FROM vendors WHERE userId = ?',
            [userId]
        );
        
        if (vendors.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Vendor not found' });
        }

        const vendorId = vendors[0].id;

        // Get sales data
        const [sales] = await connection.query(
            'SELECT COUNT(*) as totalOrders, SUM(totalAmount) as revenue FROM orders WHERE vendorId = ? AND status = "completed"',
            [vendorId]
        );

        // Get products count
        const [products] = await connection.query(
            'SELECT COUNT(*) as activeProducts FROM products WHERE vendorId = ? AND isActive = true',
            [vendorId]
        );

        connection.release();

        res.json({
            shop: vendors[0],
            sales: sales[0],
            products: products[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Vendor Info
router.get('/me', auth, async (req, res) => {
    const pool = req.pool;
    const userId = req.userId;

    try {
        const connection = await pool.getConnection();
        const [vendors] = await connection.query(
            'SELECT * FROM vendors WHERE userId = ?',
            [userId]
        );
        connection.release();

        if (vendors.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        res.json({ shop: vendors[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Recent Orders
router.get('/orders/recent', auth, async (req, res) => {
    const pool = req.pool;
    const userId = req.userId;

    try {
        const connection = await pool.getConnection();
        
        const [vendor] = await connection.query(
            'SELECT id FROM vendors WHERE userId = ?',
            [userId]
        );
        
        if (vendor.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Vendor not found' });
        }

        const [orders] = await connection.query(
            `SELECT o.id, o.clientName, p.name as productName, o.totalAmount as amount, o.status
             FROM orders o
             JOIN products p ON o.productId = p.id
             WHERE p.vendorId = ?
             ORDER BY o.createdAt DESC
             LIMIT 5`,
            [vendor[0].id]
        );

        connection.release();
        res.json({ orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
